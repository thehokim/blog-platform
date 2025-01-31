package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

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

	fmt.Println("Fetching notifications for userID:", userID)

	var notifications []models.Notification
	err = database.DB.
		Where("user_id = ? OR post_id IN (SELECT id FROM posts WHERE author_id = ?) OR comment_id IN (SELECT id FROM comments WHERE author_id = ?)", userID, userID, userID).
		Order("created_at DESC").
		Find(&notifications).Error

	if err != nil {
		fmt.Println("Error fetching notifications:", err)
		http.Error(w, "Failed to fetch notifications", http.StatusInternalServerError)
		return
	}

	fmt.Println("Found notifications:", len(notifications))

	if len(notifications) == 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}

	var enrichedNotifications []map[string]interface{}
	for _, notif := range notifications {
		enrichedNotif := map[string]interface{}{
			"id":         notif.ID,
			"user_id":    notif.UserID,
			"type":       notif.Type,
			"post_id":    notif.PostID,
			"comment_id": notif.CommentID,
			"reply_id":   notif.ReplyID,
			"message":    notif.Message,
			"is_read":    notif.IsRead,
			"created_at": notif.CreatedAt,
			"updated_at": notif.UpdatedAt,
		}

		// Проверяем comment_id и загружаем комментарий
		if notif.CommentID != nil {
			fmt.Println("Loading comment for notification ID:", notif.ID, "CommentID:", *notif.CommentID)
			var comment models.Comment
			if err := database.DB.Preload("Author").First(&comment, *notif.CommentID).Error; err == nil {
				enrichedNotif["comment_content"] = comment.Content
				enrichedNotif["author"] = map[string]interface{}{
					"name":     comment.Author.Username,
					"imageUrl": comment.Author.Avatar,
				}
			} else {
				fmt.Println("Comment not found for ID:", *notif.CommentID)
			}
		}

		// Проверяем reply_id и загружаем реплай
		if notif.ReplyID != nil {
			fmt.Println("Loading reply for notification ID:", notif.ID, "ReplyID:", *notif.ReplyID)
			var reply models.Reply
			if err := database.DB.Preload("Author").First(&reply, *notif.ReplyID).Error; err == nil {
				enrichedNotif["reply_content"] = reply.Content
				enrichedNotif["author"] = map[string]interface{}{
					"name":     reply.Author.Username,
					"imageUrl": reply.Author.Avatar,
				}
			} else {
				fmt.Println("Reply not found for ID:", *notif.ReplyID)
			}
		}

		enrichedNotifications = append(enrichedNotifications, enrichedNotif)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(enrichedNotifications)
}

// formatMessage формирует правильное сообщение
func formatMessage(notifType, authorName string) string {
	if authorName == "" {
		authorName = "Unknown User"
	}

	switch notifType {
	case "like_post":
		return "User " + authorName + " liked your post"
	case "comment":
		return "User " + authorName + " commented on your post"
	case "like_comment":
		return "User " + authorName + " liked your comment"
	case "reply":
		return "User " + authorName + " replied to your comment"
	case "like_reply":
		return "User " + authorName + " liked your reply"
	default:
		return "New notification from " + authorName
	}
}

func CreateNotification(userID, authorID uint, notifType string, postID, commentID, replyID *uint) error {
	var author models.User
	err := database.DB.First(&author, authorID).Error
	if err != nil {
		return err
	}

	message := formatMessage(notifType, author.Username)

	// Логируем перед созданием уведомления
	fmt.Println("Creating notification: userID:", userID, "authorID:", authorID, "type:", notifType,
		"postID:", postID, "commentID:", commentID, "replyID:", replyID)

	notification := models.Notification{
		UserID:    userID,
		Type:      notifType,
		PostID:    postID,
		CommentID: commentID,
		ReplyID:   replyID,
		Message:   message,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	err = database.DB.Create(&notification).Error
	if err != nil {
		fmt.Println("Error creating notification:", err)
	}
	return err
}

// NotifyLikePost отправляет уведомление о лайке поста
func NotifyLikePost(userID, postID, likerID uint) {
	if userID == likerID {
		return
	}
	CreateNotification(userID, likerID, "like_post", &postID, nil, nil)
}

func NotifyComment(userID, postID, commenterID, commentID uint) {
	if userID == commenterID {
		return
	}

	// Логирование
	fmt.Println("NotifyComment called with:", userID, postID, commenterID, commentID)

	CreateNotification(userID, commenterID, "comment", &postID, &commentID, nil)
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
