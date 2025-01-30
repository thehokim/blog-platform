package handlers

import (
	"blog-platform/database"
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

// Notification структура модели
type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	Type      string    `gorm:"not null" json:"type"` // like_post, comment, like_comment, reply, like_reply
	PostID    *uint     `json:"post_id,omitempty"`
	CommentID *uint     `json:"comment_id,omitempty"`
	ReplyID   *uint     `json:"reply_id,omitempty"`
	Message   string    `gorm:"not null" json:"message"`
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// User структура для хранения данных об авторе
type User struct {
	ID       uint   `json:"id"`
	Username string `json:"name"`
	Avatar   string `json:"imageUrl"`
}

// GetNotifications получает уведомления с данными об авторе
func GetNotifications(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("userId")
	if userIDStr == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}

	var notifications []Notification
	err = database.DB.
		Where("user_id = ? OR post_id IN (SELECT id FROM posts WHERE author_id = ?) OR comment_id IN (SELECT id FROM comments WHERE user_id = ?)", userID, userID, userID).
		Order("created_at DESC").
		Find(&notifications).Error

	if err != nil {
		http.Error(w, "Failed to fetch notifications", http.StatusInternalServerError)
		return
	}

	var enrichedNotifications []map[string]interface{}

	for _, notif := range notifications {
		var author User
		err := database.DB.Raw(`SELECT id, username, avatar FROM users WHERE id = ?`, notif.UserID).Scan(&author).Error
		if err != nil {
			continue
		}

		message := formatMessage(notif.Type, author.ID)

		enrichedNotification := map[string]interface{}{
			"id":         notif.ID,
			"user_id":    notif.UserID,
			"type":       notif.Type,
			"post_id":    notif.PostID,
			"comment_id": notif.CommentID,
			"reply_id":   notif.ReplyID,
			"message":    message,
			"is_read":    notif.IsRead,
			"created_at": notif.CreatedAt,
			"updated_at": notif.UpdatedAt,
			"author": map[string]interface{}{
				"id":       author.ID,
				"name":     author.Username,
				"imageUrl": author.Avatar,
			},
		}

		enrichedNotifications = append(enrichedNotifications, enrichedNotification)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(enrichedNotifications)
}

// formatMessage формирует сообщение с ID автора
func formatMessage(notifType string, authorID uint) string {
	authorStr := strconv.Itoa(int(authorID))

	switch notifType {
	case "like_post":
		return "User " + authorStr + " liked your post"
	case "comment":
		return "User " + authorStr + " commented on your post"
	case "like_comment":
		return "User " + authorStr + " liked your comment"
	case "reply":
		return "User " + authorStr + " replied to your comment"
	case "like_reply":
		return "User " + authorStr + " liked your reply"
	default:
		return "New notification from user " + authorStr
	}
}

// CreateNotification добавляет новое уведомление
func CreateNotification(userID, authorID uint, notifType string, postID, commentID, replyID *uint) error {
	message := formatMessage(notifType, authorID)

	notification := Notification{
		UserID:    userID,
		Type:      notifType,
		PostID:    postID,
		CommentID: commentID,
		ReplyID:   replyID,
		Message:   message,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	return database.DB.Create(&notification).Error
}

// NotifyLikePost отправляет уведомление о лайке поста
func NotifyLikePost(userID, postID, likerID uint) {
	if userID == likerID {
		return
	}
	CreateNotification(userID, likerID, "like_post", &postID, nil, nil)
}

// NotifyComment отправляет уведомление о новом комментарии
func NotifyComment(userID, postID, commenterID uint) {
	if userID == commenterID {
		return
	}
	CreateNotification(userID, commenterID, "comment", &postID, nil, nil)
}

// NotifyLikeComment отправляет уведомление о лайке комментария
func NotifyLikeComment(userID, commentID, likerID uint) {
	if userID == likerID {
		return
	}
	CreateNotification(userID, likerID, "like_comment", nil, &commentID, nil)
}

// NotifyReply отправляет уведомление о новом реплае
func NotifyReply(userID, commentID, replierID uint) {
	if userID == replierID {
		return
	}
	CreateNotification(userID, replierID, "reply", nil, &commentID, nil)
}

// NotifyLikeReply отправляет уведомление о лайке реплая
func NotifyLikeReply(userID, replyID, likerID uint) {
	if userID == likerID {
		return
	}
	CreateNotification(userID, likerID, "like_reply", nil, nil, &replyID)
}
