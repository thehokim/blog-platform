package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

// Helper function for responding with JSON
func respondWithJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

// Helper function to return uint pointer
func uintPtr(i uint) *uint {
	return &i
}

func GetComments(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID := vars["post_id"]

	var comments []models.Comment

	// Загружаем автора и неназначенные (не удаленные) ответы
	if err := database.DB.
		Preload("Replies", func(db *gorm.DB) *gorm.DB {
			return db.Where("deleted = ? OR deleted IS NULL", false)
		}).
		Preload("Replies.Author"). // Загружаем автора реплая
		Preload("Author").
		Where("post_id = ? AND (deleted = false OR deleted IS NULL)", postID).
		Find(&comments).Error; err != nil {
		http.Error(w, fmt.Sprintf("Error fetching comments for post %s: %v", postID, err), http.StatusInternalServerError)
		return
	}

	// Преобразуем данные в нужный формат
	var response []map[string]interface{}
	for _, comment := range comments {
		var replies []map[string]interface{}
		for _, reply := range comment.Replies {
			replies = append(replies, map[string]interface{}{
				"id":         reply.ID,
				"content":    reply.Content,
				"post_id":    reply.PostID,
				"author_id":  reply.AuthorID,
				"parent_id":  reply.ParentID,
				"likes":      reply.Likes,
				"edited":     reply.Edited,
				"deleted":    reply.Deleted,
				"created_at": reply.CreatedAt,
				"updated_at": reply.UpdatedAt,
				"author": map[string]interface{}{
					"name":     reply.Author.Username,
					"imageUrl": reply.Author.Avatar,
				},
			})
		}

		response = append(response, map[string]interface{}{
			"id":         comment.ID,
			"content":    comment.Content,
			"post_id":    comment.PostID,
			"author_id":  comment.AuthorID,
			"parent_id":  comment.ParentID,
			"likes":      comment.Likes,
			"edited":     comment.Edited,
			"deleted":    comment.Deleted,
			"created_at": comment.CreatedAt,
			"updated_at": comment.UpdatedAt,
			"replies":    replies, // Теперь реплай содержит только нужные поля
			"author": map[string]interface{}{
				"name":     comment.Author.Username,
				"imageUrl": comment.Author.Avatar,
			},
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func CreateComment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID, err := strconv.Atoi(vars["post_id"])
	if err != nil {
		http.Error(w, "Invalid Post ID", http.StatusBadRequest)
		return
	}

	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	var input struct {
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Создаём комментарий
	comment := models.Comment{
		Content:  input.Content,
		PostID:   uint(postID),
		AuthorID: uint(userID),
	}

	// Сохраняем в базе
	if err := database.DB.Create(&comment).Error; err != nil {
		http.Error(w, "Failed to create comment", http.StatusInternalServerError)
		return
	}

	// Загружаем данные автора для ответа
	var author models.User
	if err := database.DB.First(&author, userID).Error; err != nil {
		http.Error(w, "Failed to retrieve author details", http.StatusInternalServerError)
		return
	}

	// Получаем владельца поста и отправляем уведомление
	var post models.Post
	if err := database.DB.Where("id = ?", comment.PostID).First(&post).Error; err == nil {
		if post.AuthorID != comment.AuthorID {
			fmt.Println("Calling NotifyComment with:", post.AuthorID, comment.PostID, comment.AuthorID, comment.ID)
			NotifyComment(post.AuthorID, comment.PostID, comment.AuthorID, comment.ID)
		}
	}

	// Формируем JSON-ответ
	response := map[string]interface{}{
		"id":         comment.ID,
		"content":    comment.Content,
		"post_id":    comment.PostID,
		"author_id":  comment.AuthorID,
		"parent_id":  comment.ParentID,
		"likes":      comment.Likes,
		"edited":     comment.Edited,
		"deleted":    comment.Deleted,
		"created_at": comment.CreatedAt,
		"updated_at": comment.UpdatedAt,
		"replies":    nil,
		"author": map[string]interface{}{
			"name":     author.Username,
			"imageUrl": author.Avatar,
		},
	}

	// Отправляем ответ
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// UpdateComment - Update an existing comment
func UpdateComment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	commentID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	// Retrieve the comment from the database
	var comment models.Comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	// Check if the user is the author of the comment
	if comment.AuthorID != uint(userID) {
		http.Error(w, "You are not authorized to update this comment", http.StatusForbidden)
		return
	}

	// Decode request body
	var input struct {
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Update comment fields
	comment.Content = input.Content
	comment.Edited = true
	comment.UpdatedAt = time.Now() // Ensure you update the timestamp

	if err := database.DB.Save(&comment).Error; err != nil {
		http.Error(w, "Failed to update comment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(comment)
}

func DeleteComment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	commentID, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	postID, err := strconv.ParseUint(vars["post_id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid Post ID", http.StatusBadRequest)
		return
	}

	var comment models.Comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	if comment.PostID != uint(postID) {
		http.Error(w, "Comment does not belong to the specified post", http.StatusBadRequest)
		return
	}

	// ✅ Удаляем все связанные записи перед удалением комментария
	tx := database.DB.Begin()

	// Удаляем все лайки комментария
	if err := tx.Where("comment_id = ?", commentID).Delete(&models.Like{}).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to delete likes", http.StatusInternalServerError)
		return
	}

	// Удаляем все уведомления о комментарии
	if err := tx.Where("comment_id = ?", commentID).Delete(&models.Notification{}).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to delete notifications", http.StatusInternalServerError)
		return
	}

	// Удаляем все ответы на комментарийs
	if err := tx.Where("parent_id = ?", commentID).Delete(&models.Reply{}).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to delete replies", http.StatusInternalServerError)
		return
	}

	// Удаляем сам комментарий
	if err := tx.Where("id = ?", commentID).Delete(&models.Comment{}).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to delete comment", http.StatusInternalServerError)
		return
	}

	tx.Commit()

	// ✅ Ответ пользователю
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Comment and its related data deleted successfully"})
}

func LikeComment(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid Comment ID format")
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid User ID format")
		return
	}

	// Проверяем, существует ли комментарий
	var comment models.Comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "Comment not found")
		return
	}

	// Проверяем, лайкнул ли пользователь уже этот комментарий
	var existingLike models.Like
	if err := database.DB.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&existingLike).Error; err == nil {
		respondWithError(w, http.StatusConflict, "User has already liked this comment")
		return
	}

	// Добавляем лайк
	like := models.Like{
		UserID:    uint(userID),
		CommentID: uintPtr(uint(commentID)),
		CreatedAt: time.Now(),
	}
	fmt.Println("🔹 Creating like:", like)
	if err := database.DB.Create(&like).Error; err != nil {
		fmt.Println("❌ Failed to like comment:", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to like comment")
		return
	}
	fmt.Println("✅ Like saved successfully")

	if comment.AuthorID != uint(userID) {
		fmt.Println("🔹 Sending notification for comment like to user:", comment.AuthorID, "from user:", userID)
		NotifyLikeComment(comment.AuthorID, uint(commentID), uint(userID))
	} else {
		fmt.Println("⚠️ User liked their own comment, skipping notification.")
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Comment liked successfully"})
}

func UnlikeComment(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid Comment ID format")
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid User ID format")
		return
	}

	// Check if the like exists before deletion
	var like models.Like
	if err := database.DB.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&like).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondWithError(w, http.StatusNotFound, "Like not found")
		} else {
			respondWithError(w, http.StatusInternalServerError, "Database error")
		}
		return
	}

	// Delete the like
	if err := database.DB.Delete(&like).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to unlike comment")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Comment unliked successfully"})
}

func GetCommentLikes(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid Comment ID format")
		return
	}

	// Get total like count
	var likeCount int64
	if err := database.DB.Model(&models.Like{}).Where("comment_id = ?", commentID).Count(&likeCount).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to retrieve like count")
		return
	}

	// Check if user has liked the comment
	userIDStr := r.URL.Query().Get("user_id")
	var isLiked bool
	if userIDStr != "" {
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid User ID format")
			return
		}

		var like models.Like
		if err := database.DB.Where("comment_id = ? AND user_id = ?", commentID, userID).First(&like).Error; err == nil {
			isLiked = true
		}
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"comment_id": commentID,
		"like_count": likeCount,
		"is_liked":   isLiked,
	})
}

func ReplyToComment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	commentID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	var input struct {
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Получаем родительский комментарий
	var parentComment models.Comment
	if err := database.DB.First(&parentComment, commentID).Error; err != nil {
		http.Error(w, "Parent comment not found", http.StatusBadRequest)
		return
	}

	// Создаём реплай
	reply := models.Reply{
		Content:  input.Content,
		PostID:   parentComment.PostID,
		AuthorID: uint(userID),
		ParentID: uint(commentID),
		Edited:   false,
		Deleted:  false,
	}

	if err := database.DB.Create(&reply).Error; err == nil {
		NotifyReply(parentComment.AuthorID, uint(commentID), uint(userID), reply.ID)
	} else {
		fmt.Println("❌ Ошибка при создании реплая:", err)
	}

	// Загружаем данные автора реплая
	var author models.User
	if err := database.DB.First(&author, userID).Error; err != nil {
		http.Error(w, "Failed to retrieve author details", http.StatusInternalServerError)
		return
	}

	if parentComment.AuthorID != uint(userID) {
		var existingNotification models.Notification
		err := database.DB.Where("user_id = ? AND comment_id = ? AND type = ?", parentComment.AuthorID, commentID, "reply").
			First(&existingNotification).Error

		if err == gorm.ErrRecordNotFound {
			// Передаем commentID и replyID
			NotifyReply(parentComment.AuthorID, uint(commentID), uint(reply.ID), uint(userID))
		} else {
			fmt.Println("❌ Уведомление о реплае уже существует:", existingNotification.ID)
		}
	}

	// Формируем JSON-ответ
	response := map[string]interface{}{
		"id":         reply.ID,
		"content":    reply.Content,
		"post_id":    reply.PostID,
		"author_id":  reply.AuthorID,
		"parent_id":  reply.ParentID,
		"likes":      reply.Likes,
		"edited":     reply.Edited,
		"deleted":    reply.Deleted,
		"created_at": reply.CreatedAt,
		"updated_at": reply.UpdatedAt,
		"author": map[string]interface{}{
			"name":     author.Username,
			"imageUrl": author.Avatar,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func UpdateReply(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	commentID, err := strconv.Atoi(vars["comment_id"])
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	replyID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid Reply ID", http.StatusBadRequest)
		return
	}

	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	// Retrieve the reply from the database to ensure it belongs to the given comment
	var reply models.Reply
	if err := database.DB.Where("parent_id = ? AND id = ?", commentID, replyID).First(&reply).Error; err != nil {
		http.Error(w, "Reply not found", http.StatusNotFound)
		return
	}

	// Ensure only the author can update their reply
	if reply.AuthorID != uint(userID) {
		http.Error(w, "You are not authorized to update this reply", http.StatusForbidden)
		return
	}

	// Decode the request body to get the updated content
	var input struct {
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Update reply fields
	reply.Content = input.Content
	reply.Edited = true
	reply.UpdatedAt = time.Now()

	if err := database.DB.Save(&reply).Error; err != nil {
		http.Error(w, "Failed to update reply", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(reply)
}

func GetReplies(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	commentIDStr := vars["id"] // Это ID комментария, а не реплая!
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	var replies []models.Reply

	// Загружаем все ответы к комментарию
	if err := database.DB.Where("parent_id = ?", commentID).
		Preload("Author").Find(&replies).Error; err != nil {
		http.Error(w, "Replies not found", http.StatusNotFound)
		return
	}

	// Формируем JSON-ответ
	var response []map[string]interface{}
	for _, reply := range replies {
		response = append(response, map[string]interface{}{
			"id":         reply.ID,
			"content":    reply.Content,
			"post_id":    reply.PostID,
			"author_id":  reply.AuthorID,
			"parent_id":  reply.ParentID,
			"likes":      reply.Likes,
			"edited":     reply.Edited,
			"deleted":    reply.Deleted,
			"created_at": reply.CreatedAt,
			"updated_at": reply.UpdatedAt,
			"author": map[string]interface{}{
				"name":     reply.Author.Username,
				"imageUrl": reply.Author.Avatar,
			},
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func DeleteReply(w http.ResponseWriter, r *http.Request) {
	// Get the reply ID from the URL
	vars := mux.Vars(r)
	replyIDStr := vars["id"]
	replyID, err := strconv.Atoi(replyIDStr)
	if err != nil {
		http.Error(w, "Invalid Reply ID", http.StatusBadRequest)
		return
	}

	// Log the reply ID to make sure we are deleting the correct one
	log.Printf("Attempting to delete reply ID: %d", replyID)

	// Fetch the reply from the database
	var reply models.Reply
	if err := database.DB.First(&reply, replyID).Error; err != nil {
		http.Error(w, "Reply not found", http.StatusNotFound)
		return
	}

	// Check if the reply is owned by the user
	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Convert userID to uint to match reply.AuthorID type
	if reply.AuthorID != uint(userID) {
		http.Error(w, "You are not authorized to delete this reply", http.StatusForbidden)
		return
	}

	// Mark the reply as deleted (optional, you could actually delete the row too)
	reply.Deleted = true
	if err := database.DB.Save(&reply).Error; err != nil {
		http.Error(w, "Failed to delete reply", http.StatusInternalServerError)
		return
	}

	// Respond with a success message
	w.WriteHeader(http.StatusNoContent)
}

func LikeReply(w http.ResponseWriter, r *http.Request) {
	replyID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid Reply ID format")
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid User ID format")
		return
	}

	// Проверяем, существует ли реплай
	var reply models.Reply
	if err := database.DB.First(&reply, replyID).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "Reply not found")
		return
	}

	// Begin Transaction
	tx := database.DB.Begin()

	// Проверяем, лайкнул ли пользователь уже этот реплай
	var existingLike models.Like
	result := tx.Where("user_id = ? AND reply_id = ?", userID, replyID).First(&existingLike)

	if result.RowsAffected > 0 {
		tx.Rollback()
		respondWithError(w, http.StatusConflict, "User has already liked this reply")
		return
	}

	// Добавляем лайк
	like := models.Like{UserID: uint(userID), ReplyID: uintPtr(uint(replyID))}
	if err := tx.Create(&like).Error; err != nil {
		tx.Rollback()
		respondWithError(w, http.StatusInternalServerError, "Failed to like reply")
		return
	}

	// Увеличиваем счётчик лайков
	if err := tx.Model(&models.Reply{}).Where("id = ?", replyID).Update("likes", gorm.Expr("likes + 1")).Error; err != nil {
		tx.Rollback()
		respondWithError(w, http.StatusInternalServerError, "Failed to update like count")
		return
	}

	tx.Commit()

	if reply.AuthorID != uint(userID) {
		fmt.Println("🔹 Sending notification for reply like to user:", reply.AuthorID, "from user:", userID)
		NotifyLikeReply(reply.AuthorID, uint(replyID), uint(userID))
	} else {
		fmt.Println("⚠️ User liked their own reply, skipping notification.")
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Reply liked successfully"})
}

// Unlike a reply
func UnlikeReply(w http.ResponseWriter, r *http.Request) {
	replyID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid Reply ID format")
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid User ID format")
		return
	}

	// Check if the like exists
	var like models.Like
	if err := database.DB.Where("user_id = ? AND reply_id = ?", userID, replyID).First(&like).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondWithError(w, http.StatusNotFound, "Like not found")
		} else {
			respondWithError(w, http.StatusInternalServerError, "Database error")
		}
		return
	}

	// Delete the like
	if err := database.DB.Delete(&like).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to unlike reply")
		return
	}

	// Decrement like counter
	if err := database.DB.Model(&models.Reply{}).
		Where("id = ?", replyID).
		Update("likes", gorm.Expr("likes - 1")).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to update like count")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Reply unliked successfully"})
}

func GetReplyLikes(w http.ResponseWriter, r *http.Request) {
	replyID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid Reply ID format")
		return
	}

	// Get total like count
	var likeCount int64
	if err := database.DB.Model(&models.Like{}).Where("reply_id = ?", replyID).Count(&likeCount).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to retrieve like count")
		return
	}

	// Check if user has liked the reply
	userIDStr := r.URL.Query().Get("user_id")
	var isReplyLiked bool
	if userIDStr != "" {
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid User ID format")
			return
		}

		var like models.Like
		if err := database.DB.Where("reply_id = ? AND user_id = ?", replyID, userID).First(&like).Error; err == nil {
			isReplyLiked = true
		}
	}

	// Return JSON response with correct field names
	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"reply_id":     replyID,
		"isReplyLiked": isReplyLiked, // Updated field name
		"likes":        likeCount,    // Updated field name to match Postman output
	})
}
