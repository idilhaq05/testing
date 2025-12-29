
package handlers

import (
    "backend/config"
    "context"
    "encoding/json"
    "net/http"
    "strings"
    "github.com/golang-jwt/jwt/v5"
)

// Handler untuk update user (username & role)
func UpdateUser(w http.ResponseWriter, r *http.Request) {
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
		ID       int    `json:"id"`
		Username string `json:"username"`
		Role     string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Request tidak valid", http.StatusBadRequest)
		return
	}
	// Validasi role hanya boleh "admin" atau "user"
	if req.Role != "admin" && req.Role != "user" {
		http.Error(w, "Role tidak valid", http.StatusBadRequest)
		return
	}
	// Update ke database
	_, err := config.DB.Exec(context.Background(), "UPDATE users SET username=$1, role=$2 WHERE id=$3", req.Username, req.Role, req.ID)
	if err != nil {
		http.Error(w, "Gagal update user", http.StatusInternalServerError)
		return
	}
		json.NewEncoder(w).Encode(map[string]string{"message": "User berhasil diupdate"})
	}


func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != "GET" {
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
	if !ok || !token.Valid || claims["role"] != "admin" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	rows, err := config.DB.Query(context.Background(), "SELECT id, email, username, role, poin FROM users")
	if err != nil {
		http.Error(w, "Gagal mengambil data user", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var users []map[string]interface{}
	for rows.Next() {
		var id, poin int
		var email, username, role string
		rows.Scan(&id, &email, &username, &role, &poin)
		users = append(users, map[string]interface{}{
			"id": id, "email": email, "username": username, "role": role, "poin": poin,
		})
	}
	json.NewEncoder(w).Encode(users)
}

func GetUserProfile(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != "GET" {
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
	userID, ok := claims["user_id"].(float64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	row := config.DB.QueryRow(context.Background(), "SELECT email, username FROM users WHERE id=$1", int(userID))
	var email, username string
	err := row.Scan(&email, &username)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{
		"email":    email,
		"username": username,
	})
}
