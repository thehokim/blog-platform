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
		Where("user_id = ? OR type IN ('like_comment', 'like_reply') OR post_id IN (SELECT id FROM posts WHERE author_id = ?) OR comment_id IN (SELECT id FROM comments WHERE author_id = ?) OR reply_id IN (SELECT id FROM replies WHERE author_id = ?)", userID, userID, userID, userID).
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
				fmt.Println("❌ Reply not found for ID:", *notif.ReplyID)
			}
		}

		// Загружаем автора лайка поста
		if notif.Type == "like_post" && notif.PostID != nil {
			var liker models.User
			if err := database.DB.First(&liker, notif.UserID).Error; err == nil {
				enrichedNotif["author"] = map[string]interface{}{
					"name":     liker.Username,
					"imageUrl": liker.Avatar,
				}
			} else {
				fmt.Println("❌ Ошибка при поиске автора лайка:", err)
			}
		}

		// Загружаем автора комментария, если тип like_comment
		if notif.Type == "like_comment" && notif.CommentID != nil {
			fmt.Println("🔹 Loading comment for like_comment notification:", *notif.CommentID)

			var comment models.Comment
			err := database.DB.Preload("Author").First(&comment, *notif.CommentID).Error
			if err == nil {
				fmt.Println("✅ Comment found:", comment.Content, "by", comment.Author.Username)

				enrichedNotif["comment_content"] = comment.Content
				enrichedNotif["author"] = map[string]interface{}{
					"name":     comment.Author.Username,
					"imageUrl": comment.Author.Avatar,
				}
			} else {
				fmt.Println("❌ Ошибка при загрузке комментария для уведомления:", err)
			}
		}
		if notif.Type == "like_reply" && notif.ReplyID != nil {
			fmt.Println("🔹 Loading reply for like_reply notification:", *notif.ReplyID)

			var reply models.Reply
			if err := database.DB.Preload("Author").First(&reply, *notif.ReplyID).Error; err == nil {
				fmt.Println("✅ Reply found:", reply.Content, "by", reply.Author.Username)

				// Set the correct reply content
				enrichedNotif["reply_content"] = reply.Content

				// Set the correct original author (not the liker)
				enrichedNotif["reply_author"] = map[string]interface{}{
					"name":     reply.Author.Username,
					"imageUrl": reply.Author.Avatar,
				}
			} else {
				fmt.Println("❌ Ошибка при загрузке реплая для уведомления:", err)
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

func CreateNotification(userID, likerID uint, notifType string, postID, commentID, replyID *uint) error {
	fmt.Println("🔹 Attempting to create notification:", userID, likerID, notifType, postID, commentID, replyID)

	// Get liker details (to store correct author in notifications)
	var liker models.User
	if err := database.DB.First(&liker, likerID).Error; err != nil {
		fmt.Println("❌ Ошибка при поиске автора лайка:", err)
		return err
	}

	// Use the formatMessage function
	message := formatMessage(notifType, liker.Username)

	notification := models.Notification{
		UserID:    userID, // User who receives the notification
		Type:      notifType,
		PostID:    postID,
		CommentID: commentID,
		ReplyID:   replyID,
		Message:   message, // Use formatted message
		IsRead:    false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err := database.DB.Create(&notification).Error
	if err != nil {
		fmt.Println("❌ Error inserting notification into DB:", err)
	} else {
		fmt.Println("✅ Notification successfully stored in DB:", notification)
	}
	return err
}

// NotifyLikePost отправляет уведомление о лайке поста
func NotifyLikePost(userID, postID, likerID uint) {
	if userID == likerID {
		return
	}

	// Получаем пользователя, который лайкнул пост
	var liker models.User
	if err := database.DB.Where("id = ?", likerID).First(&liker).Error; err != nil {
		fmt.Println("❌ Ошибка при поиске пользователя:", err)
		return
	}

	// Создаем уведомление с данными автора
	CreateNotification(userID, likerID, "like_post", &postID, nil, nil)

	fmt.Println("✅ Уведомление о лайке создано от:", liker.Username)
}

func NotifyComment(userID, postID, commenterID, commentID uint) {
	if userID == commenterID {
		return
	}

	// Логирование
	fmt.Println("NotifyComment called with:", userID, postID, commenterID, commentID)

	CreateNotification(userID, commenterID, "comment", &postID, &commentID, nil)
}

func NotifyLikeComment(userID, commentID, likerID uint) {
	if userID == likerID {
		fmt.Println("⚠️ Self-like detected, no notification sent.")
		return
	}

	fmt.Println("🔹 Creating like_comment notification for UserID:", userID, "CommentID:", commentID, "LikerID:", likerID)

	err := CreateNotification(userID, likerID, "like_comment", nil, &commentID, nil)
	if err != nil {
		fmt.Println("❌ Error creating notification:", err)
	} else {
		fmt.Println("✅ Notification created successfully for Comment ID:", commentID)
	}
}

func NotifyReply(userID, commentID, replierID, replyID uint) {
	if userID == replierID {
		return
	}

	// Найти родительский комментарий, чтобы получить post_id
	var parentComment models.Comment
	err := database.DB.Where("id = ?", commentID).First(&parentComment).Error
	if err != nil {
		fmt.Println("❌ Ошибка при поиске родительского комментария:", err)
		return
	}

	postID := parentComment.PostID // Получаем post_id

	// Проверяем, существует ли уже уведомление
	var existingNotification models.Notification
	err = database.DB.Where("user_id = ? AND comment_id = ? AND type = ?", userID, commentID, "reply").
		First(&existingNotification).Error

	if err == nil {
		fmt.Println("❌ Уведомление о реплае уже существует:", existingNotification.ID)
		return
	}

	fmt.Println("🔹 Отправка нового уведомления о реплае:", userID, commentID, replierID, replyID, "post_id:", postID)
	CreateNotification(userID, replierID, "reply", &postID, &commentID, &replyID)
}

func NotifyLikeReply(userID, replyID, likerID uint) {
	if userID == likerID {
		fmt.Println("⚠️ Self-like detected, no notification sent.")
		return
	}

	fmt.Println("🔹 Creating like_reply notification for UserID:", userID, "ReplyID:", replyID, "LikerID:", likerID)

	// Get the actual user who liked the reply
	var liker models.User
	if err := database.DB.First(&liker, likerID).Error; err != nil {
		fmt.Println("❌ Ошибка при поиске лайкера:", err)
		return
	}

	// Get reply details
	var reply models.Reply
	if err := database.DB.Preload("Author").First(&reply, replyID).Error; err == nil {
		CreateNotification(userID, likerID, "like_reply", nil, nil, &replyID)

		fmt.Println("✅ like_reply notification created successfully for Reply ID:", replyID)
	} else {
		fmt.Println("❌ Ошибка при загрузке реплая для уведомления:", err)
	}
}
