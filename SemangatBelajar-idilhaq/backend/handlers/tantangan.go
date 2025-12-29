package handlers

import (
	"backend/config"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
)

type Tantangan struct {
	ID               int    `json:"id"`
	Judul            string `json:"judul"`
	Deskripsi        string `json:"deskripsi"`
	Poin             int    `json:"poin"`
	TingkatKesulitan string `json:"tingkat_kesulitan"`
}

func GetTantanganHarian(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	now := time.Now().Format("2006-01-02")
	seed := int64(0)
	for _, c := range now {
		seed += int64(c)
	}
	rnd := rand.New(rand.NewSource(seed))

	rows, err := config.DB.Query(context.Background(), "SELECT id FROM tantangan")
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Gagal mengambil tantangan")
		return
	}
	defer rows.Close()

	var ids []int
	for rows.Next() {
		var id int
		rows.Scan(&id)
		ids = append(ids, id)
	}

	rnd.Shuffle(len(ids), func(i, j int) { ids[i], ids[j] = ids[j], ids[i] })
	if len(ids) > 5 {
		ids = ids[:5]
	}

	tantanganList := make([]Tantangan, 0)
	for _, id := range ids {
		var t Tantangan
		err := config.DB.QueryRow(context.Background(),
			"SELECT id, judul, deskripsi, poin, tingkat_kesulitan FROM tantangan WHERE id=$1", id).
			Scan(&t.ID, &t.Judul, &t.Deskripsi, &t.Poin, &t.TingkatKesulitan)
		if err == nil {
			tantanganList = append(tantanganList, t)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tantanganList)
}

func SelesaikanTantangan(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		return
	}
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	token, _ := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := int(claims["user_id"].(float64))

	var req struct {
		TantanganID int `json:"tantangan_id"`
		Poin        int `json:"poin"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}

	var count int
	err := config.DB.QueryRow(context.Background(),
		"SELECT COUNT(*) FROM tantangan_user WHERE user_id=$1 AND tantangan_id=$2", userID, req.TantanganID).Scan(&count)
	if err == nil && count == 0 {
		config.DB.Exec(context.Background(),
			"INSERT INTO tantangan_user (user_id, tantangan_id, status, waktu_selesai) VALUES ($1, $2, 'selesai', NOW())",
			userID, req.TantanganID)
		config.DB.Exec(context.Background(),
			"UPDATE users SET poin = poin + $1 WHERE id = $2", req.Poin, userID)
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Tantangan selesai, poin bertambah!"})
}

func GetTantanganSelesaiHariIni(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		return
	}
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	token, _ := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := int(claims["user_id"].(float64))

	today := time.Now().UTC().Format("2006-01-02")
	rows, err := config.DB.Query(context.Background(),
		`SELECT tantangan_id FROM tantangan_user WHERE user_id=$1 AND status='selesai' AND waktu_selesai >= $2::date AND waktu_selesai < ($2::date + INTERVAL '1 day')`, userID, today)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Gagal mengambil data")
		return
	}
	defer rows.Close()

	var ids []int
	for rows.Next() {
		var id int
		rows.Scan(&id)
		ids = append(ids, id)
	}
	if ids == nil {
		ids = []int{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ids)
}

func GetUserPoin(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		return
	}
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	token, _ := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := int(claims["user_id"].(float64))

	var poin int
	err := config.DB.QueryRow(context.Background(), "SELECT poin FROM users WHERE id=$1", userID).Scan(&poin)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Gagal mengambil poin")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"poin": poin})
}

func GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	rows, err := config.DB.Query(context.Background(),
		"SELECT email, username, poin FROM users ORDER BY poin DESC LIMIT 5")
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Gagal mengambil leaderboard")
		return
	}
	defer rows.Close()

	var leaders []map[string]interface{}
	for rows.Next() {
		var email, username string
		var poin int
		if err := rows.Scan(&email, &username, &poin); err != nil {
			continue
		}

		if username == "" {
			parts := strings.Split(email, "@")
			if len(parts) > 0 {
				username = parts[0]
			}
		}

		leaders = append(leaders, map[string]interface{}{
			"email":    email,
			"username": username,
			"poin":     poin,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(leaders)
}

func SelesaiTantanganHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Auth: ambil user_id dari JWT
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	token, _ := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	uidFloat, ok := claims["user_id"].(float64)
	if !ok {
		http.Error(w, "Invalid token claims", http.StatusUnauthorized)
		return
	}
	userID := int(uidFloat)

	// Parse multipart form (maks 10MB)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Gagal memproses form: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Ambil tantangan_id
	tantanganIDStr := r.FormValue("tantangan_id")
	if tantanganIDStr == "" {
		http.Error(w, "Field tantangan_id wajib", http.StatusBadRequest)
		return
	}
	tantanganID, err := strconv.Atoi(tantanganIDStr)
	if err != nil {
		http.Error(w, "tantangan_id tidak valid", http.StatusBadRequest)
		return
	}

	// Ambil file foto
	file, header, err := r.FormFile("foto")
	if err != nil {
		http.Error(w, "Foto wajib diunggah", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validasi sederhana tipe file berdasarkan ekstensi
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		ext = ".jpg"
	}
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if !allowed[ext] {
		http.Error(w, "Tipe file tidak diperbolehkan", http.StatusBadRequest)
		return
	}

	// Simpan file ke tmp/uploads dengan nama unik
	saveDir := "tmp/uploads"
	if err := os.MkdirAll(saveDir, 0755); err != nil {
		http.Error(w, "Gagal membuat folder penyimpanan", http.StatusInternalServerError)
		return
	}
	filename := fmt.Sprintf("user%d_%d_%d%s", userID, time.Now().UnixNano(), rand.Intn(10000), ext)
	dstPath := filepath.Join(saveDir, filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Gagal menyimpan file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Gagal menulis file", http.StatusInternalServerError)
		return
	}

	// Simpan path relatif ke DB (tanpa leading "tmp/") sehingga frontend bisa akses /tmp/<db_path>
	dbPath := filepath.ToSlash(filepath.Join("uploads", filename))

	// Masukkan record ke tabel tantangan_user dengan status 'pending'
	_, err = config.DB.Exec(context.Background(),
		"INSERT INTO tantangan_user (user_id, tantangan_id, status, foto_path, waktu_selesai) VALUES ($1, $2, $3, $4, $5)",
		userID, tantanganID, "pending", dbPath, nil)
	if err != nil {
		http.Error(w, "Gagal menyimpan data tantangan: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Upload berhasil, menunggu persetujuan admin"})
}

func GetPendingTantanganUser(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    if r.Method != http.MethodGet {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    rows, err := config.DB.Query(context.Background(),
        `SELECT tu.id, tu.user_id, u.username, tu.tantangan_id, t.judul, tu.status, tu.foto_path
         FROM tantangan_user tu
         JOIN users u ON tu.user_id = u.id
         JOIN tantangan t ON tu.tantangan_id = t.id
         WHERE tu.status = 'pending'
         ORDER BY tu.id DESC`)
    if err != nil {
        http.Error(w, "Gagal mengambil data", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var result []map[string]interface{}
    for rows.Next() {
        var id, user_id, tantangan_id int
        var username, judul, status, foto_path string
        if err := rows.Scan(&id, &user_id, &username, &tantangan_id, &judul, &status, &foto_path); err != nil {
            continue
        }
        result = append(result, map[string]interface{}{
            "id":           id,
            "user_id":      user_id,
            "username":     username,
            "tantangan_id": tantangan_id,
            "judul":        judul,
            "status":       status,
            "foto_path":    foto_path,
        })
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(result)
}

// Approve tantangan user (admin)
func ApproveTantangan(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    authHeader := r.Header.Get("Authorization")
    if !strings.HasPrefix(authHeader, "Bearer ") {
        writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
        return
    }
    tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
    token, _ := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
        return jwtKey, nil
    })
    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok || !token.Valid {
        writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
        return
    }
    // Cek role (harus admin)
    if roleVal, exists := claims["role"]; !exists || roleVal != "admin" {
        writeJSONError(w, http.StatusForbidden, "Forbidden")
        return
    }

    var req struct {
        TantanganUserID int `json:"tantangan_user_id"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSONError(w, http.StatusBadRequest, "Request tidak valid")
        return
    }

    // Ambil user_id dan tantangan_id dari record
    var userID, tantanganID int
    err := config.DB.QueryRow(context.Background(), "SELECT user_id, tantangan_id FROM tantangan_user WHERE id=$1", req.TantanganUserID).Scan(&userID, &tantanganID)
    if err != nil {
        writeJSONError(w, http.StatusNotFound, "Tantangan user tidak ditemukan")
        return
    }

    // Ambil poin tantangan
    var poin int
    if err := config.DB.QueryRow(context.Background(), "SELECT poin FROM tantangan WHERE id=$1", tantanganID).Scan(&poin); err != nil {
        poin = 0
    }

    // Update status dan waktu_selesai
    if _, err := config.DB.Exec(context.Background(), "UPDATE tantangan_user SET status='selesai', waktu_selesai=NOW() WHERE id=$1", req.TantanganUserID); err != nil {
        writeJSONError(w, http.StatusInternalServerError, "Gagal update status tantangan")
        return
    }

    // Tambahkan poin ke user
    if _, err := config.DB.Exec(context.Background(), "UPDATE users SET poin = poin + $1 WHERE id=$2", poin, userID); err != nil {
        writeJSONError(w, http.StatusInternalServerError, "Gagal menambahkan poin user")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"message": "Tantangan berhasil diapprove"})
}

// Reject tantangan user (admin)
func RejectTantangan(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    authHeader := r.Header.Get("Authorization")
    if !strings.HasPrefix(authHeader, "Bearer ") {
        writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
        return
    }
    tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
    token, _ := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
        return jwtKey, nil
    })
    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok || !token.Valid {
        writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
        return
    }
    if roleVal, exists := claims["role"]; !exists || roleVal != "admin" {
        writeJSONError(w, http.StatusForbidden, "Forbidden")
        return
    }

    var req struct {
        TantanganUserID int `json:"tantangan_user_id"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSONError(w, http.StatusBadRequest, "Request tidak valid")
        return
    }

    // Set status rejected
    if _, err := config.DB.Exec(context.Background(), "UPDATE tantangan_user SET status='rejected' WHERE id=$1", req.TantanganUserID); err != nil {
        writeJSONError(w, http.StatusInternalServerError, "Gagal update status tantangan")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"message": "Tantangan berhasil direject"})
}

func GetUserTantanganSubmissions(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    if r.Method != http.MethodGet {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    authHeader := r.Header.Get("Authorization")
    if !strings.HasPrefix(authHeader, "Bearer ") {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
    token, _ := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
        return jwtKey, nil
    })
    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok || !token.Valid {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    uidFloat, ok := claims["user_id"].(float64)
    if !ok {
        http.Error(w, "Invalid token claims", http.StatusUnauthorized)
        return
    }
    userID := int(uidFloat)

    // Query dengan context
    rows, err := config.DB.Query(context.Background(),
        "SELECT tantangan_id, status, foto_path FROM tantangan_user WHERE user_id = $1", userID)
    if err != nil {
        http.Error(w, "DB error", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    type Submission struct {
        TantanganID int    `json:"tantangan_id"`
        Status      string `json:"status"`
        FotoPath    string `json:"foto_path"`
    }

    var submissions []Submission
    for rows.Next() {
        var s Submission
        if err := rows.Scan(&s.TantanganID, &s.Status, &s.FotoPath); err == nil {
            submissions = append(submissions, s)
        }
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(submissions)
}
