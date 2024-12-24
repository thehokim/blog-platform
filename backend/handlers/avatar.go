package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

func GetAvatar(w http.ResponseWriter, r *http.Request) {
	userID := mux.Vars(r)["id"] // Получить идентификатор пользователя из URL

	// Поиск пользователя в базе данных
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Проверяем, есть ли аватар
	if user.Avatar == "" {
		http.Error(w, "Avatar not found", http.StatusNotFound)
		return
	}

	// Возвращаем путь к аватару
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"avatar": user.Avatar})
}

func UploadAvatar(w http.ResponseWriter, r *http.Request) {
	userID := mux.Vars(r)["id"] // Получить идентификатор пользователя из URL

	// Получить файл из запроса
	file, _, err := r.FormFile("avatar")
	if err != nil {
		http.Error(w, "File upload failed", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Сохраняем файл
	filePath := fmt.Sprintf("uploads/avatars/%s.png", userID)
	out, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "File saving failed", http.StatusInternalServerError)
		return
	}
	defer out.Close()
	_, err = io.Copy(out, file)
	if err != nil {
		http.Error(w, "File saving failed", http.StatusInternalServerError)
		return
	}

	// Обновляем информацию о пользователе
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	user.Avatar = filePath
	database.DB.Save(&user)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Avatar uploaded successfully", "avatar": filePath})
}
