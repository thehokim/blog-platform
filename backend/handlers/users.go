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
	"strings"
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
		respondWithError(w, http.StatusBadRequest, "Invalid input: "+err.Error())
		return
	}

	if input.Username == "" {
		respondWithError(w, http.StatusBadRequest, "Username is required")
		return
	}

	if input.Password == "" {
		respondWithError(w, http.StatusBadRequest, "Password is required")
		return
	}

	var existingUser models.User
	if err := database.DB.Where("username = ?", input.Username).First(&existingUser).Error; err == nil {
		respondWithError(w, http.StatusConflict, "Username is already taken")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error hashing password: "+err.Error())
		return
	}

	user := models.User{
		Username: input.Username,
		Password: string(hashedPassword),
		IsActive: true,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error creating user: "+err.Error())
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Username, "")
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error generating token: "+err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token":   token,
		"message": "User registered successfully",
	})
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

	// Проверяем уникальность username
	if newUsername := r.FormValue("username"); newUsername != "" {
		var existingUser models.User
		if err := database.DB.Where("username = ?", newUsername).First(&existingUser).Error; err == nil && existingUser.ID != user.ID {
			http.Error(w, "Username is already taken", http.StatusConflict)
			return
		}
		updates["username"] = newUsername
	}

	// Проверяем, был ли загружен аватар
	file, handler, err := r.FormFile("avatar")
	if err == nil {
		defer file.Close()

		// Проверяем, существует ли директория
		avatarDir := "./uploads/avatars"
		if _, err := os.Stat(avatarDir); os.IsNotExist(err) {
			fmt.Println("🛠 Создание директории:", avatarDir)
			if err := os.MkdirAll(avatarDir, os.ModePerm); err != nil {
				fmt.Println("❌ Ошибка при создании директории:", err)
				http.Error(w, "Failed to create avatar directory", http.StatusInternalServerError)
				return
			}
		}

		// Генерируем безопасное имя файла
		safeFilename := strings.ReplaceAll(handler.Filename, " ", "_")
		avatarPath := fmt.Sprintf("%s/%d_%s", avatarDir, time.Now().UnixNano(), safeFilename)

		// Создаем файл на диске
		out, err := os.Create(avatarPath)
		if err != nil {
			fmt.Println("❌ Ошибка при создании файла:", err)
			http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		// Записываем файл
		if _, err := io.Copy(out, file); err != nil {
			fmt.Println("❌ Ошибка при записи файла:", err)
			http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
			return
		}

		fmt.Println("✅ Аватар сохранен:", avatarPath)
		updates["avatar"] = avatarPath[1:] // Убираем точку из пути
	} else {
		fmt.Println("⚠️ Файл не загружен:", err)
	}

	// Применяем обновления
	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
