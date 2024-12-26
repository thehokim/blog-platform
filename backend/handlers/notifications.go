package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// GetNotifications returns a list of notifications for a user
func GetNotifications(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Convert userID to integer for validation
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}

	var notifications []models.Notification
	// Fetch notifications for the user, ordered by the most recent
	if err := database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&notifications).Error; err != nil {
		http.Error(w, "Failed to fetch notifications", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifications)
}

// ReactToNotification - Add a reaction to a notification
func ReactToNotification(w http.ResponseWriter, r *http.Request) {
	notificationID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Notification ID format", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}

	var input struct {
		Type string `json:"type"` // Тип реакции: "like", "dislike", "emoji"
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Проверяем, существует ли указанное уведомление
	var notification models.Notification
	if err := database.DB.First(&notification, notificationID).Error; err != nil {
		http.Error(w, "Notification not found", http.StatusNotFound)
		return
	}

	// Создаем новую реакцию
	reaction := models.Reaction{
		UserID:         uint(userID),
		NotificationID: uintPtr(uint(notificationID)),
		Type:           input.Type,
	}

	if err := database.DB.Create(&reaction).Error; err != nil {
		http.Error(w, "Failed to create reaction", http.StatusInternalServerError)
		return
	}

	// Создаем уведомление для пользователя, на чье уведомление отреагировали
	newNotification := models.Notification{
		UserID:         notification.UserID,
		Type:           "reaction_to_notification",
		Message:        fmt.Sprintf("User %d reacted to your notification", userID),
		NotificationID: uintPtr(uint(notificationID)),
	}
	if err := database.DB.Create(&newNotification).Error; err != nil {
		log.Printf("Failed to create notification: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Reaction added successfully"})
}

// GetReactionsForNotification - Retrieve all reactions for a notification
func GetReactionsForNotification(w http.ResponseWriter, r *http.Request) {
	notificationID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Notification ID format", http.StatusBadRequest)
		return
	}

	var reactions []models.Reaction
	if err := database.DB.Where("notification_id = ?", notificationID).Find(&reactions).Error; err != nil {
		http.Error(w, "Failed to fetch reactions", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reactions)
}
