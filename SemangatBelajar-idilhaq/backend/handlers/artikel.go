package handlers

import (
	"io"
	"net/http"
)

func ProxyArtikelLingkungan(w http.ResponseWriter, r *http.Request) {
    enableCORS(w)
    if r.Method == "OPTIONS" {
        return
    }
    apiKey := "5e160a57bd1a4c62b50741405c6fb0bf"
    url := "https://newsapi.org/v2/everything?q=lingkungan%20OR%20environment&language=id&sortBy=publishedAt&pageSize=20&apiKey=" + apiKey

    resp, err := http.Get(url)
    if err != nil {
        http.Error(w, "Gagal mengambil artikel", http.StatusInternalServerError)
        return
    }
    defer resp.Body.Close()

    w.Header().Set("Content-Type", "application/json")
    io.Copy(w, resp.Body)
}