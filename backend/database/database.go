package database

import (
	"blog-platform/models"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDatabase() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found. Using environment variables directly.")
	}

	// Get connection string from environment
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("DB_DSN not set in environment variables")
	}
	// Mask sensitive information in DSN for logging
	safeDSN := dsn
	if idx := len(safeDSN) - len(os.Getenv("DB_PASSWORD")); idx > 0 {
		safeDSN = safeDSN[:idx] + "****" + safeDSN[idx+len(os.Getenv("DB_PASSWORD")):]
	}
	log.Printf("Using DB_DSN: %s", safeDSN)

	// Connect to database
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Ping database to ensure it's reachable
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Failed to get database instance: %v", err)
	}
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("Database ping failed: %v", err)
	}

	// Perform migrations
	if err := DB.AutoMigrate(
		&models.User{},
		&models.Post{},
		&models.Tag{},
		&models.Comment{},
		&models.Like{},
		&models.Notification{},
		&models.SavedPost{},
	); err != nil {
		log.Fatalf("Migration failed: %v", err)
	} else {
		log.Println("Migrations applied successfully for all models.")
	}

	log.Println("Database successfully connected and migrated!")
}

// Gracefully close database
func CloseDatabase() {
	sqlDB, err := DB.DB()
	if err != nil {
		log.Printf("Failed to get database instance for closing: %v", err)
		return
	}
	if err := sqlDB.Close(); err != nil {
		log.Printf("Failed to close database connection: %v", err)
	} else {
		log.Println("Database connection closed.")
	}
}
