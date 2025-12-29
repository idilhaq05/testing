// handlers/otp_service.go
package handlers

import (
	"crypto/rand"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/smtp"
	"strconv"
	"strings"
	"time"

	"backend/config"
	"backend/models"

	"github.com/badoux/checkmail"
	"golang.org/x/crypto/bcrypt"
)

const (
	otplength    = 6
	maxAttempts  = 5
	otpExpirySec = 120
)

// RequestPasswordResetOTP mengirim OTP ke email
func RequestPasswordResetOTP(email string) error {
	if err := checkmail.ValidateFormat(email); err != nil {
		return fmt.Errorf("format email tidak valid")
	}

	models.OTPMutex.Lock()
	defer models.OTPMutex.Unlock()

	now := time.Now()
	data, exists := models.OTPStore[email]

	if exists && now.After(data.ExpiresAt) {
		delete(models.OTPStore, email)
		exists = false
		data = models.OTPData{}
	}

	if exists && data.Attempts >= maxAttempts {
		return fmt.Errorf("batas permintaan OTP tercapai (maks %d kali)", maxAttempts)
	}

	otp, err := generateOTP()
	if err != nil {
		return fmt.Errorf("gagal membuat OTP")
	}

	newData := models.OTPData{
		Code:      otp,
		ExpiresAt: now.Add(otpExpirySec * time.Second),
		Attempts:  data.Attempts + 1,
	}
	models.OTPStore[email] = newData

	if err := sendOTPEmail(email, otp); err != nil {
		if exists {
			tmp := models.OTPStore[email]
			tmp.Attempts--
			models.OTPStore[email] = tmp
		} else {
			delete(models.OTPStore, email)
		}
		return fmt.Errorf("gagal mengirim email: %w", err)
	}

	return nil
}

// VerifyPasswordResetOTP memverifikasi OTP
func VerifyPasswordResetOTP(email, userOTP string) error {
	userOTP = strings.TrimSpace(userOTP)
	if len(userOTP) != otplength || !isNumeric(userOTP) {
		return fmt.Errorf("OTP harus terdiri dari %d digit angka", otplength)
	}

	models.OTPMutex.Lock()
	defer models.OTPMutex.Unlock()

	data, exists := models.OTPStore[email]
	if !exists {
		return fmt.Errorf("tidak ada permintaan reset password untuk email ini")
	}

	now := time.Now()
	if now.After(data.ExpiresAt) {
		delete(models.OTPStore, email)
		return fmt.Errorf("OTP telah kadaluarsa")
	}

	if data.Code != userOTP {
		return fmt.Errorf("OTP salah")
	}

	delete(models.OTPStore, email)
	return nil
}

// --- Helper (internal) ---

func generateOTP() (string, error) {
	bytes := make([]byte, otplength)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	otp := make([]byte, otplength)
	for i := 0; i < otplength; i++ {
		otp[i] = byte(48 + (bytes[i] % 10))
	}
	return string(otp), nil
}

func sendOTPEmail(toEmail, otp string) error {
	cfg := config.Load()

	host := cfg.SMTPHost
	port := cfg.SMTPPort
	user := cfg.SMTPUser
	pass := cfg.SMTPPass

	// Buat koneksi TCP
	conn, err := net.DialTimeout("tcp", host+":"+port, 10*time.Second)
	if err != nil {
		return fmt.Errorf("gagal koneksi ke SMTP: %w", err)
	}
	defer conn.Close()

	// Upgrade ke TLS (STARTTLS)
	tlsConfig := &tls.Config{
		ServerName: host,
	}
	hostWithPort := host + ":" + port
	if port == "465" {
		// Jika pakai port 465, langsung TLS (tidak perlu STARTTLS)
		conn, err = tls.DialWithDialer(&net.Dialer{Timeout: 10 * time.Second}, "tcp", hostWithPort, tlsConfig)
		if err != nil {
			return fmt.Errorf("gagal koneksi TLS: %w", err)
		}
		defer conn.Close()
	}

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("gagal buat client SMTP: %w", err)
	}
	defer client.Quit()

	// Jika port 587, lakukan STARTTLS
	if port == "587" {
		if ok, _ := client.Extension("STARTTLS"); ok {
			if err = client.StartTLS(tlsConfig); err != nil {
				return fmt.Errorf("gagal STARTTLS: %w", err)
			}
		}
	}

	// Autentikasi
	if err = client.Auth(smtp.PlainAuth("", user, pass, host)); err != nil {
		return fmt.Errorf("gagal autentikasi: %w", err)
	}

	// Kirim email
	if err = client.Mail(user); err != nil {
		return fmt.Errorf("gagal set pengirim: %w", err)
	}
	if err = client.Rcpt(toEmail); err != nil {
		return fmt.Errorf("gagal set penerima: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("gagal mulai data: %w", err)
	}

	subject := "Kode OTP Reset Password"
	// Buat body dalam HTML
	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    .otp-code {
      font-size: 35px;
      font-weight: bold;
      color: #0b0e13ff;
      letter-spacing: 3px;
      padding: 10px;
      display: inline-block;
      margin: 10px 0;
    }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
    }
  </style>
</head>
<body>
  <p>Halo,</p>

  <p>Berikut adalah kode OTP Anda untuk mereset password:</p>

  <p>
    <span class="otp-code">%s</span>
  </p>

  <p>Kode ini berlaku selama <strong>2 Menit</strong>.</p>

  <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>

  <hr>
  <small>Email ini dikirim secara otomatis. Mohon jangan membalas.</small>
</body>
</html>
`, otp)

	// Header email: gunakan text/html
	msg := "From: " + cfg.SMTPUser + "\r\n" +
		"To: " + toEmail + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=utf-8\r\n\r\n" +
		htmlBody

	_, err = w.Write([]byte(msg))
	if err != nil {
		w.Close()
		return fmt.Errorf("gagal tulis body: %w", err)
	}
	w.Close()

	return nil

}

func isNumeric(s string) bool {
	_, err := strconv.Atoi(s)
	return err == nil
}

func ResetPasswordHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
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
		Email    string `json:"email"`
		Password string `json:"password"` // ← SESUAI DENGAN FRONTEND
	}
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Email dan password wajib diisi", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 6 {
		http.Error(w, "Password minimal 6 karakter", http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Gagal memproses password", http.StatusInternalServerError)
		return
	}

	// Update di database
	_, err = config.DB.Exec(r.Context(),
		"UPDATE users SET password = $1 WHERE email = $2",
		string(hashedPassword), req.Email)
	if err != nil {
		http.Error(w, "Gagal memperbarui password", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Password berhasil diperbarui",
	})
}
