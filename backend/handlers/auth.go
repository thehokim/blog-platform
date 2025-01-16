package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"blog-platform/utils"
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

// Login authenticates the user and generates a JWT token
func Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	// Декодируем JSON-запрос
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid input")
		return
	}

	// Проверяем, передан ли username
	if input.Username == "" {
		respondWithError(w, http.StatusBadRequest, "Username is required")
		return
	}

	// Проверяем, передан ли пароль
	if input.Password == "" {
		respondWithError(w, http.StatusBadRequest, "Password is required")
		return
	}

	// Ищем пользователя по username
	var user models.User
	if err := database.DB.Where("username = ?", input.Username).First(&user).Error; err != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	// Проверяем пароль
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	// Генерируем JWT-токен
	token, err := utils.GenerateJWT(user.ID, user.Username, user.Avatar)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create token")
		return
	}

	// Отправляем успешный JSON-ответ
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":   user.ID,
			"name": user.Username,
		},
	})
}
