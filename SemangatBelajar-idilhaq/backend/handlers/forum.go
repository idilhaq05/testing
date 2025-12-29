package handlers

import (
	"backend/config"
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"log"

	"github.com/dgrijalva/jwt-go"
)

type ForumPost struct {
	ID        int            `json:"id"`
	User      string         `json:"user"`
	Judul     string         `json:"judul"`
	Isi       string         `json:"isi"`
	CreatedAt string         `json:"created_at"`
	Comments  []ForumComment `json:"comments"`
}

type ForumComment struct {
	ID        int    `json:"id"`
	User      string `json:"user"`
	Isi       string `json:"isi"`
	CreatedAt string `json:"created_at"`
}

func GetAllForum(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	rows, err := config.DB.Query(context.Background(),
		`SELECT f.id, u.username, f.judul, f.isi, f.created_at
         FROM forum f
         JOIN users u ON f.user_id = u.id
         ORDER BY f.created_at DESC`)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Gagal mengambil forum")
		return
	}
	defer rows.Close()

	var forums []ForumPost
	for rows.Next() {
		var f ForumPost
		var createdAt time.Time
		rows.Scan(&f.ID, &f.User, &f.Judul, &f.Isi, &createdAt)
		f.CreatedAt = createdAt.Format(time.RFC3339)

		commentRows, _ := config.DB.Query(context.Background(),
			`SELECT fc.id, u.username, fc.isi, fc.created_at
             FROM forum_comment fc
             JOIN users u ON fc.user_id = u.id
             WHERE fc.forum_id=$1
             ORDER BY fc.created_at DESC`, f.ID)
		var comments []ForumComment
		for commentRows.Next() {
			var c ForumComment
			var cAt time.Time
			commentRows.Scan(&c.ID, &c.User, &c.Isi, &cAt)
			c.CreatedAt = cAt.Format(time.RFC3339)
			comments = append(comments, c)
		}
		commentRows.Close()
		if comments == nil {
			comments = []ForumComment{}
		}
		f.Comments = comments

		forums = append(forums, f)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(forums)
}

func BuatForum(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
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
		Judul string `json:"judul"`
		Isi   string `json:"isi"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	_, err := config.DB.Exec(context.Background(),
		"INSERT INTO forum (user_id, judul, isi) VALUES ($1, $2, $3)",
		userID, req.Judul, req.Isi)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Gagal membuat forum")
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Forum berhasil dibuat"})
}

func TambahKomentarForum(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	// Split path parts early to use for both GET (single forum) and POST (add comment)
	parts := strings.Split(r.URL.Path, "/")

	// Handle GET /api/forum/{id} -> return single forum with comments
	if r.Method == "GET" {
		if len(parts) < 4 {
			writeJSONError(w, http.StatusBadRequest, "forum_id tidak valid")
			return
		}
		forumID, err := strconv.Atoi(parts[3])
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "forum_id tidak valid")
			return
		}

		var f ForumPost
		var createdAt time.Time
		err = config.DB.QueryRow(context.Background(),
			`SELECT f.id, u.username, f.judul, f.isi, f.created_at
			 FROM forum f
			 JOIN users u ON f.user_id = u.id
			 WHERE f.id=$1`, forumID).Scan(&f.ID, &f.User, &f.Judul, &f.Isi, &createdAt)
		if err != nil {
			writeJSONError(w, http.StatusNotFound, "forum_id tidak ditemukan")
			return
		}
		f.CreatedAt = createdAt.Format(time.RFC3339)

		commentRows, _ := config.DB.Query(context.Background(),
			`SELECT fc.id, u.username, fc.isi, fc.created_at
			 FROM forum_comment fc
			 JOIN users u ON fc.user_id = u.id
			 WHERE fc.forum_id=$1
			 ORDER BY fc.created_at DESC`, f.ID)
		var comments []ForumComment
		for commentRows.Next() {
			var c ForumComment
			var cAt time.Time
			commentRows.Scan(&c.ID, &c.User, &c.Isi, &cAt)
			c.CreatedAt = cAt.Format(time.RFC3339)
			comments = append(comments, c)
		}
		commentRows.Close()
		if comments == nil {
			comments = []ForumComment{}
		}
		f.Comments = comments

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(f)
		return
	}

	// For POST (add comment) continue with auth and validation
	if r.Method == "POST" {
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

		if len(parts) < 5 {
			writeJSONError(w, http.StatusBadRequest, "forum_id tidak valid")
			return
		}
		forumID, err := strconv.Atoi(parts[3])
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "forum_id tidak valid")
			return
		}

		// Validasi apakah forum_id ada di database
		var exists bool
		err = config.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM forum WHERE id=$1)", forumID).Scan(&exists)
		if err != nil || !exists {
			writeJSONError(w, http.StatusNotFound, "forum_id tidak ditemukan")
			return
		}

		// Logging tambahan untuk debugging
		log.Printf("Memeriksa forum_id: %d", forumID)
		log.Printf("Hasil validasi forum_id: %v", exists)

		var req struct {
			Isi string `json:"isi"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, http.StatusBadRequest, "Request tidak valid")
			return
		}
		if strings.TrimSpace(req.Isi) == "" {
			writeJSONError(w, http.StatusBadRequest, "Isi komentar tidak boleh kosong")
			return
		}
		_, err = config.DB.Exec(context.Background(),
			"INSERT INTO forum_comment (forum_id, user_id, isi) VALUES ($1, $2, $3)",
			forumID, userID, req.Isi)
		if err != nil {
			writeJSONError(w, http.StatusInternalServerError, "Gagal menambah komentar")
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Komentar berhasil ditambahkan"})
		return
	}

	// Other methods not allowed
	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func ForumHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		GetAllForum(w, r)
	} else if r.Method == "POST" {
		BuatForum(w, r)
	} else if r.Method == "OPTIONS" {
		enableCORS(w)
		return
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		ID int `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Request tidak valid", http.StatusBadRequest)
		return
	}
	// Hapus semua komentar yang dibuat user
	_, _ = config.DB.Exec(context.Background(), "DELETE FROM forum_comment WHERE user_id=$1", req.ID)
	// Hapus semua komentar di forum yang dibuat user
	_, _ = config.DB.Exec(context.Background(), "DELETE FROM forum_comment WHERE forum_id IN (SELECT id FROM forum WHERE user_id=$1)", req.ID)
	// Hapus semua forum yang dibuat user
	_, _ = config.DB.Exec(context.Background(), "DELETE FROM forum WHERE user_id=$1", req.ID)
	// Hapus semua laporan milik user
	_, _ = config.DB.Exec(context.Background(), "DELETE FROM laporan WHERE user_id=$1", req.ID)
	// Hapus semua data tantangan_user milik user
	_, _ = config.DB.Exec(context.Background(), "DELETE FROM tantangan_user WHERE user_id=$1", req.ID)
	// Hapus user
	_, err := config.DB.Exec(context.Background(), "DELETE FROM users WHERE id=$1", req.ID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Gagal menghapus user: " + err.Error()})
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "User berhasil dihapus"})
}

func DeleteForum(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		ID int `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Request tidak valid", http.StatusBadRequest)
		return
	}
	_, _ = config.DB.Exec(context.Background(), "DELETE FROM forum_comment WHERE forum_id=$1", req.ID)
	_, err := config.DB.Exec(context.Background(), "DELETE FROM forum WHERE id=$1", req.ID)
	if err != nil {
		http.Error(w, "Gagal menghapus forum", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "Forum berhasil dihapus"})
}
