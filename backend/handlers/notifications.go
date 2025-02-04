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
		Where("user_id = ? OR type IN ('like_comment', 'like_reply', 'like_post', 'reply', 'comment')", userID).
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

		// ✅ Mark notifications as read after fetching them
		err = database.DB.Model(&models.Notification{}).
			Where("user_id = ? AND is_read = false", userID).
			Update("is_read", true).Error

		if err != nil {
			fmt.Println("❌ Error updating notifications to read:", err)
		}

		// ✅ Fetch Post Title if `like_post` or `comment`
		if (notif.Type == "like_post" || notif.Type == "comment") && notif.PostID != nil {
			var post models.Post
			if err := database.DB.First(&post, *notif.PostID).Error; err == nil {
				enrichedNotif["post_title"] = post.Title // ✅ Add post title
			} else {
				fmt.Println("❌ Error fetching post title:", err)
			}
		}

		// ✅ Fetch the actor (user who liked or commented)
		if notif.ActorID != 0 {
			var actor models.User
			if err := database.DB.First(&actor, notif.ActorID).Error; err == nil {
				enrichedNotif["author"] = map[string]interface{}{
					"name":     actor.Username,
					"imageUrl": actor.Avatar,
				}
			} else {
				fmt.Println("❌ Error fetching actor details:", err)
			}
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

		if notif.Type == "like_post" {
			var liker models.User
			if err := database.DB.First(&liker, notif.ActorID).Error; err == nil { // ✅ Now using ActorID
				enrichedNotif["author"] = map[string]interface{}{
					"name":     liker.Username, // ✅ Now using the actual liker
					"imageUrl": liker.Avatar,   // ✅ Now using the actual liker
				}
			} else {
				fmt.Println("❌ Error fetching liker details:", err)
			}
		}

		if notif.Type == "like_comment" && notif.CommentID != nil {
			fmt.Println("🔹 Loading comment for like_comment notification:", *notif.CommentID)

			var comment models.Comment
			err := database.DB.Preload("Author").First(&comment, *notif.CommentID).Error
			if err == nil {
				fmt.Println("✅ Comment found:", comment.Content, "by", comment.Author.Username)

				enrichedNotif["comment_content"] = comment.Content // ✅ Correctly add the comment content

				// ✅ Fetch the actual user who LIKED the comment (not the original commenter)
				var liker models.User
				if err := database.DB.First(&liker, notif.ActorID).Error; err == nil {
					enrichedNotif["author"] = map[string]interface{}{
						"name":     liker.Username, // ✅ Correct! Now using the liker
						"imageUrl": liker.Avatar,   // ✅ Correct! Now using the liker
					}
				} else {
					fmt.Println("❌ Error fetching liker details:", err)
				}
			} else {
				fmt.Println("❌ Error loading comment for like_comment notification:", err)
			}
		}

		if notif.Type == "like_reply" && notif.ReplyID != nil {
			fmt.Println("🔹 Loading reply for like_reply notification:", *notif.ReplyID)

			var reply models.Reply
			if err := database.DB.Preload("Author").First(&reply, *notif.ReplyID).Error; err == nil {
				fmt.Println("✅ Reply found:", reply.Content, "by", reply.Author.Username)

				// ✅ Set the correct reply content
				enrichedNotif["reply_content"] = reply.Content

				// ❌ Previously, this set the **original author** (WRONG)
				// enrichedNotif["reply_author"] = map[string]interface{}{
				//     "name":     reply.Author.Username,
				//     "imageUrl": reply.Author.Avatar,
				// }

				// ✅ Fix: Set the **correct liker** (actor)
				var liker models.User
				if err := database.DB.First(&liker, notif.ActorID).Error; err == nil {
					enrichedNotif["author"] = map[string]interface{}{
						"name":     liker.Username, // ✅ Liker's name
						"imageUrl": liker.Avatar,   // ✅ Liker's avatar
					}
				} else {
					fmt.Println("❌ Error fetching liker details:", err)
				}
			} else {
				fmt.Println("❌ Error loading reply for notification:", err)
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

	var liker models.User
	if err := database.DB.First(&liker, likerID).Error; err != nil {
		fmt.Println("❌ Error fetching liker details:", err)
		return err
	}

	message := formatMessage(notifType, liker.Username)

	notification := models.Notification{
		UserID:    userID,  // The user receiving the notification
		ActorID:   likerID, // ✅ Ensure this is the **liker**
		Type:      notifType,
		PostID:    postID,
		CommentID: commentID,
		ReplyID:   replyID,
		Message:   message,
		IsRead:    false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	fmt.Println("🔹 Inserting notification into database:", notification)

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
		fmt.Println("⚠️ Self-comment detected, no notification sent.")
		return
	}

	fmt.Println("🔹 Sending comment notification to User:", userID, "PostID:", postID, "CommenterID:", commenterID, "CommentID:", commentID)

	// Проверяем, существует ли уже уведомление
	var existingNotification models.Notification
	err := database.DB.Where("user_id = ? AND post_id = ? AND type = ?", userID, postID, "comment").
		First(&existingNotification).Error

	if err == nil {
		fmt.Println("❌ Уведомление о комментарии уже существует:", existingNotification.ID)
		return
	}

	// Создаём уведомление
	CreateNotification(userID, commenterID, "comment", &postID, &commentID, nil)
}

func NotifyLikeComment(userID, commentID, likerID uint) {
	if userID == likerID {
		fmt.Println("⚠️ Self-like detected, no notification sent.")
		return
	}

	fmt.Println("🔹 Creating `like_comment` notification for User:", userID, "CommentID:", commentID, "LikerID:", likerID)

	// Проверяем, существует ли уже уведомление
	var existingNotification models.Notification
	err := database.DB.Where("user_id = ? AND comment_id = ? AND type = ?", userID, commentID, "like_comment").
		First(&existingNotification).Error

	if err == nil {
		fmt.Println("❌ Уведомление о лайке комментария уже существует:", existingNotification.ID)
		return
	}

	// Создаём уведомление
	err = CreateNotification(userID, likerID, "like_comment", nil, &commentID, nil)
	if err != nil {
		fmt.Println("❌ Error creating `like_comment` notification:", err)
	} else {
		fmt.Println("✅ `like_comment` Notification created successfully for Comment ID:", commentID)
	}
}

func NotifyReply(userID, commentID, replierID, replyID uint) {
	if userID == replierID {
		fmt.Println("⚠️ Self-reply detected, no notification sent.")
		return
	}

	fmt.Println("🔹 Отправка уведомления о реплае:", userID, commentID, replierID, replyID)

	// Проверяем, существует ли уже уведомление
	var existingNotification models.Notification
	err := database.DB.Where("user_id = ? AND comment_id = ? AND type = ?", userID, commentID, "reply").
		First(&existingNotification).Error

	if err == nil {
		fmt.Println("❌ Уведомление о реплае уже существует:", existingNotification.ID)
		return
	}

	CreateNotification(userID, replierID, "reply", nil, &commentID, &replyID)
}

func NotifyLikeReply(userID, replyID, likerID uint) {
	if userID == likerID {
		fmt.Println("⚠️ Self-like detected, no notification sent.")
		return
	}

	fmt.Println("🔹 Creating like_reply notification for UserID:", userID, "ReplyID:", replyID, "LikerID:", likerID)

	// Проверяем, существует ли уже уведомление
	var existingNotification models.Notification
	err := database.DB.Where("user_id = ? AND reply_id = ? AND type = ?", userID, replyID, "like_reply").
		First(&existingNotification).Error

	if err == nil {
		fmt.Println("❌ Уведомление о лайке реплая уже существует:", existingNotification.ID)
		return
	}

	CreateNotification(userID, likerID, "like_reply", nil, nil, &replyID)
}

// ✅ API: Get unread notifications count
func GetUnreadNotificationsCount(w http.ResponseWriter, r *http.Request) {
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

	// ✅ Count unread notifications
	var count int64
	err = database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = false", userID).
		Count(&count).Error

	if err != nil {
		fmt.Println("❌ Error fetching unread notifications count:", err)
		http.Error(w, "Failed to fetch unread notifications count", http.StatusInternalServerError)
		return
	}

	// ✅ Return count as JSON response
	respondWithJSON(w, http.StatusOK, map[string]int64{"count": count})
}
