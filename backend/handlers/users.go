package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Register handles user registration
func Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Username string `json:"username"`
	}

	// Decode input JSON
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := database.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	// Generate a unique username if not provided
	if input.Username == "" {
		input.Username = generateUniqueUsername(input.Email)
	} else {
		// Ensure username is unique
		if err := database.DB.Where("username = ?", input.Username).First(&existingUser).Error; err == nil {
			http.Error(w, "Username already taken", http.StatusConflict)
			return
		}
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	// Save user to the database
	user := models.User{
		Email:    input.Email,
		Password: string(hashedPassword),
		Username: input.Username,
		IsActive: true,
	}
	if err := database.DB.Create(&user).Error; err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintln(w, `{"message": "User registered successfully"}`)
}

func generateUniqueUsername(email string) string {
	base := strings.Split(email, "@")[0] // Используем часть email до @
	var username string
	var count int
	for {
		if count == 0 {
			username = base
		} else {
			username = fmt.Sprintf("%s%d", base, count)
		}
		var existingUser models.User
		if err := database.DB.Where("username = ?", username).First(&existingUser).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				break
			}
		}
		count++
	}
	return username
}

// ForgotPassword handles the password reset request
func ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Find user by email
	var user models.User
	if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Generate a reset token
	token := fmt.Sprintf("%x", time.Now().UnixNano())
	user.ResetToken = token
	user.ResetTokenExpires = time.Now().Add(1 * time.Hour)
	if err := database.DB.Save(&user).Error; err != nil {
		http.Error(w, "Failed to generate reset token", http.StatusInternalServerError)
		return
	}

	// Send reset link (replace with actual email sending)
	resetLink := fmt.Sprintf("http://localhost:8080/reset-password?token=%s", token)
	fmt.Printf("Reset link: %s\n", resetLink)

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, `{"message": "Password reset link sent"}`)
}

// ResetPassword handles setting a new password
func ResetPassword(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Find user by reset token
	var user models.User
	if err := database.DB.Where("reset_token = ? AND reset_token_expires > ?", input.Token, time.Now()).First(&user).Error; err != nil {
		http.Error(w, "Invalid or expired token", http.StatusBadRequest)
		return
	}

	// Update password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}
	user.Password = string(hashedPassword)
	user.ResetToken = ""
	user.ResetTokenExpires = time.Time{}

	if err := database.DB.Save(&user).Error; err != nil {
		http.Error(w, "Failed to reset password", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, `{"message": "Password successfully reset"}`)
}

// GetProfile retrieves the profile information of a user
func GetProfile(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из URL
	userID := mux.Vars(r)["id"]

	// Находим пользователя в базе данных
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Возвращаем профиль пользователя
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// UpdateProfile updates the profile information of a user
func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	// Получаем ID пользователя из URL
	userID := mux.Vars(r)["id"]

	// Ищем пользователя в базе данных
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Обновляем данные профиля из запроса
	var updatedData struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Bio       string `json:"bio"`
		Website   string `json:"website"`
	}
	if err := json.NewDecoder(r.Body).Decode(&updatedData); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Применяем изменения
	user.FirstName = updatedData.FirstName
	user.LastName = updatedData.LastName
	user.Bio = updatedData.Bio
	user.Website = updatedData.Website

	// Сохраняем изменения в базе данных
	if err := database.DB.Save(&user).Error; err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	// Возвращаем обновленный профиль
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
