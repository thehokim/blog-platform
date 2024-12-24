package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"encoding/json"
	"net/http"
	"strconv"
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
