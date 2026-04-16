package database

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func InitDB() error {
	dbUrl := os.Getenv("DB_URL")
	if dbUrl == "" {
		return fmt.Errorf("DB_URL is not set in the environment")
	}

	config, err := pgxpool.ParseConfig(dbUrl)
	if err != nil {
		return fmt.Errorf("unable to parse DB config: %v", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %v", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		return fmt.Errorf("database ping failed: %v", err)
	}

	Pool = pool
	log.Println("Successfully connected to the database.")
	return nil
}

func CloseDB() {
	if Pool != nil {
		Pool.Close()
	}
}
