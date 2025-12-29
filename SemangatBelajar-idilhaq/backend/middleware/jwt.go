package middleware

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("your_secret_key")

func JWTAuth(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if !strings.HasPrefix(authHeader, "Bearer ") {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
        _, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
            return jwtKey, nil
        })
        if err != nil {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        next.ServeHTTP(w, r)
    })
}