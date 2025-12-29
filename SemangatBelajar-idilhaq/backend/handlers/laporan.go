package handlers

import (
	"backend/config"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Laporan struct {
	ID        int    `json:"id,omitempty"`
	UserID    int    `json:"user_id,omitempty"`
	Judul     string `json:"judul"`
	Deskripsi string `json:"deskripsi"`
	FotoURL   string `json:"foto_url"`
	VideoURL  string `json:"video_url"`
	Lokasi    string `json:"lokasi"`
	Status    string `json:"status,omitempty"`
	CreatedAt string `json:"created_at,omitempty"`
}

func BuatLaporan(w http.ResponseWriter, r *http.Request) {
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

	var laporan Laporan
	if err := json.NewDecoder(r.Body).Decode(&laporan); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}

	_, err := config.DB.Exec(context.Background(),
		"INSERT INTO laporan (user_id, judul, deskripsi, foto_url, video_url, lokasi) VALUES ($1, $2, $3, $4, $5, $6)",
		userID, laporan.Judul, laporan.Deskripsi, laporan.FotoURL, laporan.VideoURL, laporan.Lokasi)
	if err != nil {
		log.Println("BuatLaporan error:", err)
		writeJSONError(w, http.StatusInternalServerError, "Gagal simpan laporan")
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Laporan berhasil dikirim"})
}

func GetAllLaporan(w http.ResponseWriter, r *http.Request) {
	log.Println("GetAllLaporan dipanggil")
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

	if !ok || !token.Valid || claims["role"] != "admin" {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	rows, err := config.DB.Query(context.Background(), "SELECT id, user_id, judul, deskripsi, foto_url, video_url, lokasi, status, created_at FROM laporan ORDER BY created_at DESC")
	if err != nil {
		log.Println("GetAllLaporan error:", err)
		writeJSONError(w, http.StatusInternalServerError, "Gagal mengambil laporan")
		return
	}
	defer rows.Close()

	laporanList := make([]Laporan, 0)
	for rows.Next() {
		var l Laporan
		var createdAt time.Time
		err := rows.Scan(&l.ID, &l.UserID, &l.Judul, &l.Deskripsi, &l.FotoURL, &l.VideoURL, &l.Lokasi, &l.Status, &createdAt)
		if err != nil {
			log.Println("Scan error:", err)
			continue
		}
		l.CreatedAt = createdAt.Format(time.RFC3339)
		laporanList = append(laporanList, l)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(laporanList)
}

func UpdateStatusLaporan(w http.ResponseWriter, r *http.Request) {
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
	if !ok || !token.Valid || claims["role"] != "admin" {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req struct {
		ID     int    `json:"id"`
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}

	_, err := config.DB.Exec(context.Background(), "UPDATE laporan SET status=$1 WHERE id=$2", req.Status, req.ID)
	if err != nil {
		log.Println("UpdateStatusLaporan error:", err)
		writeJSONError(w, http.StatusInternalServerError, "Gagal update status")
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "Status laporan diperbarui"})
}

func DeleteLaporan(w http.ResponseWriter, r *http.Request) {
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
	if !ok || !token.Valid || claims["role"] != "admin" {
		writeJSONError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req struct {
		ID int `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Request tidak valid")
		return
	}

	_, err := config.DB.Exec(context.Background(), "DELETE FROM laporan WHERE id=$1", req.ID)
	if err != nil {
		log.Println("DeleteLaporan error:", err)
		writeJSONError(w, http.StatusInternalServerError, "Gagal hapus laporan")
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "Laporan berhasil dihapus"})
}

func GetUserLaporan(w http.ResponseWriter, r *http.Request) {
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

	rows, err := config.DB.Query(context.Background(),
		"SELECT id, user_id, judul, deskripsi, foto_url, video_url, lokasi, status, created_at FROM laporan WHERE user_id=$1 ORDER BY created_at DESC", userID)
	if err != nil {
		log.Println("GetUserLaporan error:", err)
		writeJSONError(w, http.StatusInternalServerError, "Gagal mengambil laporan")
		return
	}
	defer rows.Close()

	laporanList := make([]Laporan, 0)
	for rows.Next() {
		var l Laporan
		var createdAt time.Time
		err := rows.Scan(&l.ID, &l.UserID, &l.Judul, &l.Deskripsi, &l.FotoURL, &l.VideoURL, &l.Lokasi, &l.Status, &createdAt)
		if err != nil {
			log.Println("Scan error:", err)
			continue
		}
		l.CreatedAt = createdAt.Format(time.RFC3339)
		laporanList = append(laporanList, l)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(laporanList)
}

func UploadFotoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Gagal membaca file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Pastikan folder uploads sudah ada
	uploadDir := "tmp/uploads"
	os.MkdirAll(uploadDir, os.ModePerm)

	// Buat nama file unik
	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), header.Filename)
	filepath := filepath.Join(uploadDir, filename)

	out, err := os.Create(filepath)
	if err != nil {
		http.Error(w, "Gagal menyimpan file", http.StatusInternalServerError)
		return
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if err != nil {
		http.Error(w, "Gagal menyimpan file", http.StatusInternalServerError)
		return
	}

	// URL file yang bisa diakses frontend
	url := "/tmp/uploads/" + filename

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"url": url})
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}
