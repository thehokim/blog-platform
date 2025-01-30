package handlers

import (
	"blog-platform/database"
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

// Notification структура модели (ОСТАВЛЯЕМ ТОЛЬКО ЭТУ ВЕРСИЮ)
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

func GetNotifications(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
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

	// Загружаем все уведомления, относящиеся к пользователю:
	err = database.DB.
		Where("user_id = ? OR post_id IN (SELECT id FROM posts WHERE author_id = ?) OR comment_id IN (SELECT id FROM comments WHERE user_id = ?)", userID, userID, userID).
		Order("created_at DESC").
		Find(&notifications).Error

	if err != nil {
		http.Error(w, "Failed to fetch notifications", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifications)
}

// CreateNotification добавляет новое уведомление
func CreateNotification(userID uint, notifType string, postID, commentID, replyID *uint, message string) error {
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
func NotifyLikePost(userID uint, postID uint, likerID uint) {
	if userID == likerID {
		return
	}

	message := "Ваш пост получил новый лайк"
	CreateNotification(userID, "like_post", &postID, nil, nil, message)
}

// NotifyComment отправляет уведомление о новом комментарии
func NotifyComment(userID uint, postID uint, commenterID uint) {
	if userID == commenterID {
		return
	}

	message := "Ваш пост получил новый комментарий"
	CreateNotification(userID, "comment", &postID, nil, nil, message)
}

// NotifyLikeComment отправляет уведомление о лайке комментария
func NotifyLikeComment(userID uint, commentID uint, likerID uint) {
	if userID == likerID {
		return
	}

	message := "Ваш комментарий получил новый лайк"
	CreateNotification(userID, "like_comment", nil, &commentID, nil, message)
}

// NotifyReply отправляет уведомление о новом реплае (ответе на комментарий)
func NotifyReply(userID uint, commentID uint, replierID uint) {
	if userID == replierID {
		return
	}

	message := "На ваш комментарий оставили ответ"
	CreateNotification(userID, "reply", nil, &commentID, nil, message)
}

// NotifyLikeReply отправляет уведомление о лайке реплая
func NotifyLikeReply(userID uint, replyID uint, likerID uint) {
	if userID == likerID {
		return
	}

	message := "Ваш ответ получил новый лайк"
	CreateNotification(userID, "like_reply", nil, nil, &replyID, message)
}
