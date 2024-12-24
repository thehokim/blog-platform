package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// GetSMTPConfig загружает SMTP-конфигурацию из переменных окружения
func GetSMTPConfig() map[string]string {
	// Загружаем файл .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Возвращаем конфигурацию SMTP
	return map[string]string{
		"SMTP_EMAIL":    os.Getenv("SMTP_EMAIL"),
		"SMTP_PASSWORD": os.Getenv("SMTP_PASSWORD"),
		"SMTP_SERVER":   os.Getenv("SMTP_SERVER"),
		"SMTP_PORT":     os.Getenv("SMTP_PORT"),
	}
}
