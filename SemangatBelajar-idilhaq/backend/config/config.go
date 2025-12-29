// config/config.go
package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	SMTPHost    string
	SMTPPort    string
	SMTPUser    string
	SMTPPass    string
	MaxAttempts int
	OTPExpiry   time.Duration
	OTPLength   int
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Tidak ada file .env atau gagal memproses file .env")
	}

	return &Config{
		SMTPHost:    getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:    getEnv("SMTP_PORT", "465"),
		SMTPUser:    getEnv("SMTP_USER", ""),
		SMTPPass:    getEnv("SMTP_PASSWORD", ""),
		MaxAttempts: 5,
		OTPExpiry:   60 * time.Second,
		OTPLength:   6,
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
