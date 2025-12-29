// handlers/otp.go
package handlers

import (
	"encoding/json"
	"io"
	"net/http"
)

func RequestOTPHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w) // ← ini merujuk ke enableCORS di laporan.go (satu package)
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
		Email string `json:"email"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		http.Error(w, "Email wajib diisi", http.StatusBadRequest)
		return
	}

	if err := RequestPasswordResetOTP(req.Email); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "OTP berhasil dikirim",
	})
}

func VerifyOTPHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w) // ← aman, karena satu package
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
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.OTP == "" {
		http.Error(w, "Email dan OTP wajib diisi", http.StatusBadRequest)
		return
	}

	if err := VerifyPasswordResetOTP(req.Email, req.OTP); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "OTP valid. Silakan lanjutkan reset password.",
	})
}
