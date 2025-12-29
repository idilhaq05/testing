package main

import (
	"log"
	"net/http"
	"os"

	"backend/config"
	"backend/handlers"
	"backend/middleware"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Tidak ada file .env atau gagal memproses file .env")
	}

	if os.Getenv("DATABASE_URL") == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	config.ConnectDB()
	defer config.DB.Close()

	// Hapus SEMUA http.HandleFunc di sini!
	// Gunakan hanya mux.HandleFunc di bawah ini
	mux := http.NewServeMux()
	mux.HandleFunc("/api/register", handlers.Register)
	mux.HandleFunc("/api/login", handlers.Login)
	mux.HandleFunc("/api/laporan", handlers.BuatLaporan)
	mux.HandleFunc("/api/laporan/all", handlers.GetAllLaporan)
	mux.HandleFunc("/api/laporan/update", handlers.UpdateStatusLaporan)
	mux.HandleFunc("/api/laporan/delete", handlers.DeleteLaporan)
	mux.HandleFunc("/api/laporan/user", handlers.GetUserLaporan)
	mux.HandleFunc("/api/tantangan/hari-ini", handlers.GetTantanganHarian)
	mux.HandleFunc("/api/tantangan/selesai-hari-ini", handlers.GetTantanganSelesaiHariIni)
	mux.HandleFunc("/api/tantangan/selesai", handlers.SelesaiTantanganHandler)
	mux.HandleFunc("/api/tantangan/pending", handlers.GetPendingTantanganUser)
	mux.HandleFunc("/api/tantangan/approve", handlers.ApproveTantangan)
	mux.HandleFunc("/api/tantangan/reject", handlers.RejectTantangan)
	mux.HandleFunc("/api/user/poin", handlers.GetUserPoin)
	mux.HandleFunc("/api/user/profile", handlers.GetUserProfile)
	mux.HandleFunc("/api/leaderboard", handlers.GetLeaderboard)
	mux.HandleFunc("/api/forum", handlers.ForumHandler)
	mux.HandleFunc("/api/forum/", handlers.TambahKomentarForum)
	mux.HandleFunc("/api/artikel", handlers.ProxyArtikelLingkungan)
	mux.HandleFunc("/api/user/all", handlers.GetAllUsers)
	mux.HandleFunc("/api/forum/delete", handlers.DeleteForum)
	mux.HandleFunc("/api/user/delete", handlers.DeleteUser)
	mux.HandleFunc("/api/user/update", handlers.UpdateUser)
	mux.HandleFunc("/api/request-otp", handlers.RequestOTPHandler)
	mux.HandleFunc("/api/verify-otp", handlers.VerifyOTPHandler)
	mux.HandleFunc("/api/reset-password", handlers.ResetPasswordHandler)
	mux.HandleFunc("/api/send-email-verification", handlers.SendEmailVerificationHandler)
	mux.HandleFunc("/api/verify-email-otp", handlers.VerifyEmailOTPHandler)
	mux.HandleFunc("/api/tantangan/user-submissions", handlers.GetUserTantanganSubmissions)
	mux.HandleFunc("/api/upload", handlers.UploadFotoHandler)
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))
	mux.Handle("/tmp/", http.StripPrefix("/tmp/", http.FileServer(http.Dir("tmp"))))

	handler := middleware.EnableCORS(mux)

	log.Println("Server running at :8081")
	log.Fatal(http.ListenAndServe(":8081", handler))
}
