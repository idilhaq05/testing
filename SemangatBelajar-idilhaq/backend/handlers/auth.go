package handlers

import (
	"backend/config"
	"backend/models"
	"context"
	"crypto/rand"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/smtp"
	"strconv"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// === KONFIGURASI & STRUKTUR ===
var jwtKey = []byte("3fa85f64-5717-4562-b3fc-2c963f66afa6")

type Credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type PendingUser struct {
	Username  string
	Email     string
	Password  string
	OTP       string
	ExpiresAt time.Time
}

// === VARIABEL GLOBAL ===
var (
	pendingRegistrations      = make(map[string]PendingUser)
	pendingRegistrationsMutex = sync.Mutex{}
)

// === INIT ===
func init() {
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		for range ticker.C {
			now := time.Now()
			pendingRegistrationsMutex.Lock()
			for email, user := range pendingRegistrations {
				if now.After(user.ExpiresAt) {
					delete(pendingRegistrations, email)
				}
			}
			pendingRegistrationsMutex.Unlock()
		}
	}()
}

// === HELPER ===
func generateOTPEmail() (string, error) {
	const length = 6
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	otp := make([]byte, length)
	for i := range bytes {
		otp[i] = '0' + (bytes[i] % 10)
	}
	return string(otp), nil
}

func isNumericEmail(s string) bool {
	_, err := strconv.Atoi(s)
	return err == nil
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"message": message})
}

// === EMAIL FUNCTION ===
func sendEmailVerification(toEmail, otp string) error {
	cfg := config.Load()

	subject := "Verifikasi Email ECOSTEPS"
	htmlBody := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
	<meta charset="utf-8">
	<style>
	  .otp-code { font-size: 32px; font-weight: bold; color: #1e293b; letter-spacing: 3px; }
	</style>
	</head>
	<body>
	  <p>Halo,</p>
	  <p>Kode verifikasi akun Anda adalah:</p>
	  <p class="otp-code">%s</p>
	  <p>Kode ini berlaku selama <strong>5 Menit</strong>.</p>
	</body>
	</html>
	`, otp)

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n"+
		"MIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\n\r\n%s",
		cfg.SMTPUser, toEmail, subject, htmlBody)

	addr := fmt.Sprintf("%s:%s", cfg.SMTPHost, cfg.SMTPPort)
	log.Printf("[SMTP] Connecting to %s", addr)

	// --- MODE 1: IMPLICIT TLS (Port 465) ---
	if cfg.SMTPPort == "465" {
		tlsconfig := &tls.Config{
			InsecureSkipVerify: false,
			ServerName:         cfg.SMTPHost,
		}

		conn, err := tls.Dial("tcp", addr, tlsconfig)
		if err != nil {
			return fmt.Errorf("TLS dial failed: %w", err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, cfg.SMTPHost)
		if err != nil {
			return fmt.Errorf("create SMTP client failed: %w", err)
		}
		defer client.Quit()

		auth := smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPHost)
		if err = client.Auth(auth); err != nil {
			return fmt.Errorf("auth failed: %w", err)
		}

		if err = client.Mail(cfg.SMTPUser); err != nil {
			return fmt.Errorf("MAIL FROM failed: %w", err)
		}
		if err = client.Rcpt(toEmail); err != nil {
			return fmt.Errorf("RCPT TO failed: %w", err)
		}

		w, err := client.Data()
		if err != nil {
			return fmt.Errorf("DATA failed: %w", err)
		}
		_, _ = w.Write([]byte(msg))
		_ = w.Close()

		log.Printf("[SMTP] Email sent via port 465 to %s", toEmail)
		return nil
	}

	// --- MODE 2: STARTTLS (Port 587 atau lainnya) ---
	host, _, _ := net.SplitHostPort(addr)
	auth := smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPass, host)

	err := smtp.SendMail(addr, auth, cfg.SMTPUser, []string{toEmail}, []byte(msg))
	if err != nil {
		return fmt.Errorf("SendMail failed: %w", err)
	}

	log.Printf("[SMTP] Email sent via port %s (STARTTLS) to %s", cfg.SMTPPort, toEmail)
	return nil
}

// === HANDLER ===

func Register(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Gagal membaca body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Email == "" || req.Password == "" {
		http.Error(w, "Semua field wajib diisi", http.StatusBadRequest)
		return
	}
	if len(req.Password) < 6 {
		http.Error(w, "Password minimal 6 karakter", http.StatusBadRequest)
		return
	}

	// Cek duplikat di DB
	var exists bool
	err = config.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Gagal memproses permintaan")
		return
	}
	if exists {
		writeJSONError(w, http.StatusBadRequest, "Email sudah terdaftar")
		return
	}

	otp, _ := generateOTPEmail()
	pendingRegistrationsMutex.Lock()
	pendingRegistrations[req.Email] = PendingUser{
		Username:  req.Username,
		Email:     req.Email,
		Password:  req.Password,
		OTP:       otp,
		ExpiresAt: time.Now().Add(360 * time.Second),
	}
	pendingRegistrationsMutex.Unlock()

	if err := sendEmailVerification(req.Email, otp); err != nil {
		http.Error(w, "Gagal mengirim email verifikasi", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Kode verifikasi dikirim ke email Anda",
	})
}

func Login(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	var user models.User
	err := config.DB.QueryRow(context.Background(),
		"SELECT id, password, role FROM users WHERE email=$1", creds.Email).
		Scan(&user.ID, &user.Password, &user.Role)

	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password)); err != nil {
		writeJSONError(w, http.StatusUnauthorized, "Password salah")
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, _ := token.SignedString(jwtKey)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token": tokenString,
		"role":  user.Role,
	})
}

func AdminHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tokenString := authHeader[len("Bearer "):]
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid || claims["role"] != "admin" {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Welcome, admin"})
}

func SendEmailVerificationHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct{ Email string }
	body, _ := io.ReadAll(r.Body)
	defer r.Body.Close()
	if err := json.Unmarshal(body, &req); err != nil || req.Email == "" {
		http.Error(w, "Email tidak valid", http.StatusBadRequest)
		return
	}

	otp, err := generateOTPEmail()
	if err != nil {
		http.Error(w, "Gagal membuat OTP", http.StatusInternalServerError)
		return
	}

	if err := sendEmailVerification(req.Email, otp); err != nil {
		http.Error(w, "Gagal mengirim email", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Kode OTP telah dikirim"})
}

func VerifyEmailOTPHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}
	body, _ := io.ReadAll(r.Body)
	defer r.Body.Close()
	json.Unmarshal(body, &req)

	if req.Email == "" || req.OTP == "" {
		http.Error(w, "Email dan OTP wajib diisi", http.StatusBadRequest)
		return
	}

	pendingRegistrationsMutex.Lock()
	user, exists := pendingRegistrations[req.Email]
	if !exists || time.Now().After(user.ExpiresAt) {
		delete(pendingRegistrations, req.Email)
		pendingRegistrationsMutex.Unlock()
		http.Error(w, "Kode verifikasi tidak valid / kadaluarsa", http.StatusBadRequest)
		return
	}

	if user.OTP != req.OTP {
		pendingRegistrationsMutex.Unlock()
		http.Error(w, "Kode OTP salah", http.StatusBadRequest)
		return
	}

	hashedPass, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	_, err := config.DB.Exec(
		context.Background(),
		"INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)",
		user.Username, user.Email, string(hashedPass), "user",
	)
	if err != nil {
		pendingRegistrationsMutex.Unlock()
		http.Error(w, "Gagal menyimpan user ke database", http.StatusInternalServerError)
		return
	}

	delete(pendingRegistrations, req.Email)
	pendingRegistrationsMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Verifikasi berhasil"})
}
