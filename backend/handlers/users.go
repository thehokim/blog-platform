package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"blog-platform/utils"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Ensure that the directory for avatars exists
func ensureAvatarDirectoryExists() error {
	dir := "uploads/avatars"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		if err := os.MkdirAll(dir, os.ModePerm); err != nil {
			return fmt.Errorf("failed to create directory: %w", err)
		}
	}
	return nil
}

// Register handles user registration
func Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Username string `json:"username"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var existingUser models.User
	if err := database.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	if input.Username == "" {
		input.Username = generateUniqueUsername(input.Email)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

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

	token, err := utils.GenerateJWT(user.ID, user.Username, "")
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"token": token, "message": "User registered successfully"})
}

// GetProfile retrieves the profile information of a user
func GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := mux.Vars(r)["id"]

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// Обновление профиля пользователя
func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := mux.Vars(r)["id"]

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	firstName := r.FormValue("first_name")
	lastName := r.FormValue("last_name")
	bio := r.FormValue("bio")
	website := r.FormValue("website")

	if firstName == "" || lastName == "" || bio == "" || website == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Проверяем файл аватара
	file, handler, err := r.FormFile("avatar")
	var avatarPath string
	if err == nil {
		defer file.Close()

		// Убедимся, что директория для аватаров существует
		if err := ensureAvatarDirectoryExists(); err != nil {
			http.Error(w, "Failed to create directory for avatar", http.StatusInternalServerError)
			fmt.Println("Error creating directory:", err)
			return
		}

		// Сохраняем аватар в директорию
		avatarPath = fmt.Sprintf("uploads/avatars/%d_%s", time.Now().UnixNano(), handler.Filename)
		out, err := os.Create(avatarPath)
		if err != nil {
			http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
			fmt.Println("Error saving avatar:", err)
			return
		}
		defer out.Close()
		if _, err := io.Copy(out, file); err != nil {
			http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
			return
		}
	}

	// Обновляем данные пользователя в базе
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	user.FirstName = firstName
	user.LastName = lastName
	user.Bio = bio
	user.Website = website
	if avatarPath != "" {
		user.Avatar = avatarPath
	}

	if err := database.DB.Save(&user).Error; err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// Helper function to generate unique usernames based on email
func generateUniqueUsername(email string) string {
	base := strings.Split(email, "@")[0]
	username := base
	var count int
	for {
		var existingUser models.User
		if err := database.DB.Where("username = ?", username).First(&existingUser).Error; err == gorm.ErrRecordNotFound {
			break
		}
		count++
		username = fmt.Sprintf("%s%d", base, count)
	}
	return username
}
