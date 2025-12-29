package config

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func ConnectDB() {
	var err error
	DB, err = pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		panic("failed to connect database: " + err.Error())
	}
	fmt.Println("Database connected")
}
