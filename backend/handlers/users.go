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
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
)

func Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Проверка, существует ли уже такой username
	var existingUser models.User
	if err := database.DB.Where("username = ?", input.Username).First(&existingUser).Error; err == nil {
		http.Error(w, "Username is already taken", http.StatusConflict)
		return
	}

	// Хэшируем пароль перед сохранением
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	// Создаем нового пользователя
	user := models.User{
		Username: input.Username,
		Password: string(hashedPassword),
		IsActive: true,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	// Генерируем JWT токен
	token, err := utils.GenerateJWT(user.ID, user.Username, "")
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"token": token, "message": "User registered successfully"})
}

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

func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := mux.Vars(r)["id"]

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	var user models.User
	id, err := strconv.Atoi(userID)
	if err != nil || id <= 0 {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	if err := database.DB.First(&user, id).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	updates := make(map[string]interface{})

	// Обновление имени и био
	if firstName := r.FormValue("first_name"); firstName != "" {
		updates["first_name"] = firstName
	}
	if lastName := r.FormValue("last_name"); lastName != "" {
		updates["last_name"] = lastName
	}
	if bio := r.FormValue("bio"); bio != "" {
		updates["bio"] = bio
	}
	if website := r.FormValue("website"); website != "" {
		updates["website"] = website
	}

	if newUsername := r.FormValue("username"); newUsername != "" {
		var existingUser models.User
		if err := database.DB.Where("username = ?", newUsername).First(&existingUser).Error; err == nil && existingUser.ID != user.ID {
			http.Error(w, "Username is already taken", http.StatusConflict)
			return
		}
		updates["username"] = newUsername
	}

	if file, handler, err := r.FormFile("avatar"); err == nil {
		defer file.Close()

		avatarPath := fmt.Sprintf("./uploads/avatars/%d_%s", time.Now().UnixNano(), handler.Filename)
		out, err := os.Create(avatarPath)
		if err != nil {
			http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
			return
		}

		updates["avatar"] = avatarPath[1:] // Убираем `.` перед путем
	}

	// Применяем обновления
	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
