package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"fmt"
	"net/http"
)

// VerifyEmail handles the verification of a user's email
func VerifyEmail(w http.ResponseWriter, r *http.Request) {
	// Получаем токен из URL
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Verification token is missing", http.StatusBadRequest)
		return
	}

	// Ищем пользователя по токену
	var user models.User
	if err := database.DB.Where("verification_token = ?", token).First(&user).Error; err != nil {
		http.Error(w, "Invalid token or user not found", http.StatusBadRequest)
		return
	}

	// Проверяем, активирован ли пользователь уже
	if user.IsActive {
		http.Error(w, "User is already verified", http.StatusBadRequest)
		return
	}

	// Активируем пользователя и очищаем токен
	user.IsActive = true
	user.VerificationToken = ""
	if err := database.DB.Save(&user).Error; err != nil {
		http.Error(w, "Failed to verify user", http.StatusInternalServerError)
		return
	}

	// Успешное подтверждение
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, `{"message": "Email successfully verified"}`)
}
