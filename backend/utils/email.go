package utils

import (
	"blog-platform/config"
	"fmt"
	"net/smtp"
)

// SendEmail отправляет письмо через SMTP
func SendEmail(to string, subject string, body string) error {
	smtpConfig := config.GetSMTPConfig()
	from := smtpConfig["SMTP_EMAIL"]
	password := smtpConfig["SMTP_PASSWORD"]
	smtpHost := smtpConfig["SMTP_SERVER"]
	smtpPort := smtpConfig["SMTP_PORT"]

	// Проверка конфигурации SMTP
	if from == "" || password == "" || smtpHost == "" || smtpPort == "" {
		return fmt.Errorf("SMTP configuration is incomplete")
	}

	// Формат письма
	message := []byte(fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s", from, to, subject, body))

	// Настройка аутентификации
	auth := smtp.PlainAuth("", from, password, smtpHost)

	// Логирование для проверки
	fmt.Println("Attempting to send email...")
	fmt.Printf("From: %s, To: %s, SMTP Host: %s:%s\n", from, to, smtpHost, smtpPort)

	// Отправка письма
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, message)
	if err != nil {
		fmt.Printf("Failed to send email: %v\n", err)
		return fmt.Errorf("failed to send email: %v", err)
	}

	fmt.Println("Email sent successfully!")
	return nil
}
