package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

func GetComments(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID := vars["post_id"]

	var comments []models.Comment

	// Загружаем автора и неназначенные (не удаленные) ответы
	if err := database.DB.
		Preload("Replies", func(db *gorm.DB) *gorm.DB {
			return db.Where("deleted = ? OR deleted IS NULL", false)
		}).
		Preload("Author").
		Where("post_id = ? AND (deleted = false OR deleted IS NULL)", postID).
		Find(&comments).Error; err != nil {
		http.Error(w, fmt.Sprintf("Error fetching comments for post %s: %v", postID, err), http.StatusInternalServerError)
		return
	}

	// Преобразуем данные в нужный формат
	var response []map[string]interface{}
	for _, comment := range comments {
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
			"replies":    comment.Replies,
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

	comment := models.Comment{
		Content:  input.Content,
		PostID:   uint(postID),
		AuthorID: uint(userID),
	}

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

	// Удаляем все ответы (replies), которые ссылаются на этот комментарий
	if err := database.DB.Where("parent_id = ?", commentID).Delete(&models.Reply{}).Error; err != nil {
		http.Error(w, "Failed to delete replies", http.StatusInternalServerError)
		return
	}

	// Удаляем сам комментарий после удаления ответов
	if err := database.DB.Where("id = ?", commentID).Delete(&models.Comment{}).Error; err != nil {
		http.Error(w, "Failed to delete comment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Comment and its replies deleted successfully"})
}

// LikeComment - Add a like to a comment
func LikeComment(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Comment ID format", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}

	var comment models.Comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}
	commentAuthorID := comment.AuthorID

	like := models.Like{
		UserID:    uint(userID),
		CommentID: uintPtr(uint(commentID)),
	}

	var existingLike models.Like
	if err := database.DB.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&existingLike).Error; err == nil {
		http.Error(w, "User has already liked this comment", http.StatusConflict)
		return
	}

	if err := database.DB.Create(&like).Error; err != nil {
		http.Error(w, "Failed to like comment", http.StatusInternalServerError)
		return
	}

	notification := models.Notification{
		UserID:    commentAuthorID,
		Type:      "like_comment",
		CommentID: uintPtr(uint(commentID)),
		Message:   fmt.Sprintf("User %d liked your comment", userID),
	}
	if err := database.DB.Create(&notification).Error; err != nil {
		log.Printf("Failed to create notification: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Comment liked successfully"})
}

// UnlikeComment - Remove a like from a comment
func UnlikeComment(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Comment ID format", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}

	var existingLike models.Like
	if err := database.DB.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&existingLike).Error; err != nil {
		http.Error(w, "Like not found", http.StatusNotFound)
		return
	}

	// Delete the like from the database
	if err := database.DB.Delete(&existingLike).Error; err != nil {
		http.Error(w, "Failed to unlike comment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Comment unliked successfully"})
}

// Helper function to return uint pointer
func uintPtr(i uint) *uint {
	return &i
}

// GetCommentLikes - Retrieve the number of likes for a comment and check if a user has liked it
func GetCommentLikes(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Comment ID format", http.StatusBadRequest)
		return
	}

	userIDStr := r.URL.Query().Get("user_id")
	var userID int
	var isLiked bool

	if userIDStr != "" {
		userID, err = strconv.Atoi(userIDStr)
		if err != nil {
			http.Error(w, "Invalid User ID format", http.StatusBadRequest)
			return
		}

		// Check if the user has already liked the comment
		if err := database.DB.Model(&models.Like{}).Where("comment_id = ? AND user_id = ?", commentID, userID).First(&models.Like{}).Error; err == nil {
			isLiked = true
		} else {
			isLiked = false
		}
	}

	var likeCount int64
	// Count the number of likes for the comment
	if err := database.DB.Model(&models.Like{}).Where("comment_id = ?", commentID).Count(&likeCount).Error; err != nil {
		http.Error(w, "Failed to fetch like count", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"likes":   likeCount,
		"isLiked": isLiked,
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

	reply := models.Reply{
		Content:  input.Content,
		PostID:   parentComment.PostID,
		AuthorID: uint(userID),
		ParentID: uint(commentID),
		Edited:   false,
		Deleted:  false,
	}

	if err := database.DB.Create(&reply).Error; err != nil {
		http.Error(w, "Failed to create reply", http.StatusInternalServerError)
		return
	}

	// Загружаем данные автора для ответа
	var author models.User
	if err := database.DB.First(&author, userID).Error; err != nil {
		http.Error(w, "Failed to retrieve author details", http.StatusInternalServerError)
		return
	}

	// Формируем ответ с информацией об авторе
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
	replyIDStr := vars["id"]
	replyID, err := strconv.Atoi(replyIDStr)
	if err != nil {
		http.Error(w, "Invalid Reply ID", http.StatusBadRequest)
		return
	}

	var reply models.Reply

	// Загружаем данные ответа с информацией об авторе
	if err := database.DB.Preload("Author").First(&reply, replyID).Error; err != nil {
		http.Error(w, "Reply not found", http.StatusNotFound)
		return
	}

	var likeCount int64
	// Подсчет количества лайков для ответа
	if err := database.DB.Model(&models.Like{}).Where("reply_id = ?", replyID).Count(&likeCount).Error; err != nil {
		http.Error(w, "Failed to fetch like count", http.StatusInternalServerError)
		return
	}

	// Формируем ответ с автором и лайками
	response := map[string]interface{}{
		"id":         reply.ID,
		"content":    reply.Content,
		"post_id":    reply.PostID,
		"author_id":  reply.AuthorID,
		"parent_id":  reply.ParentID,
		"likes":      likeCount,
		"edited":     reply.Edited,
		"deleted":    reply.Deleted,
		"created_at": reply.CreatedAt,
		"updated_at": reply.UpdatedAt,
		"author": map[string]interface{}{
			"name":     reply.Author.Username,
			"imageUrl": reply.Author.Avatar,
		},
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
	vars := mux.Vars(r)
	replyID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Неверный ID ответа", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		http.Error(w, "Неверный формат ID пользователя", http.StatusBadRequest)
		return
	}

	// Проверяем, ставил ли пользователь лайк ранее
	var existingLike models.Like
	if err := database.DB.Where("reply_id = ? AND user_id = ?", replyID, userID).First(&existingLike).Error; err == nil {
		// Если лайк уже есть, удаляем его (переключение)
		if err := database.DB.Delete(&existingLike).Error; err != nil {
			http.Error(w, "Ошибка при удалении лайка", http.StatusInternalServerError)
			return
		}

		// Уменьшаем счётчик лайков
		if err := database.DB.Model(&models.Reply{}).
			Where("id = ?", replyID).
			Update("likes", gorm.Expr("likes - 1")).Error; err != nil {
			http.Error(w, "Ошибка при обновлении счётчика лайков", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Лайк удалён"})
		return
	}

	// Если лайка нет — добавляем
	like := models.Like{
		UserID:  uint(userID),
		ReplyID: uintPtr(uint(replyID)),
	}
	if err := database.DB.Create(&like).Error; err != nil {
		http.Error(w, "Ошибка при добавлении лайка", http.StatusInternalServerError)
		return
	}

	// Увеличиваем счётчик лайков
	if err := database.DB.Model(&models.Reply{}).
		Where("id = ?", replyID).
		Update("likes", gorm.Expr("likes + 1")).Error; err != nil {
		http.Error(w, "Ошибка при обновлении счётчика лайков", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Лайк добавлен"})
}

// GetReplyLikes - Retrieve the number of likes for a reply and check if a user has liked it
func GetReplyLikes(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	replyID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid Reply ID format", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}

	var likeCount int64
	// Подсчёт лайков для конкретного ReplyID
	if err := database.DB.Model(&models.Like{}).
		Where("reply_id = ?", replyID).
		Count(&likeCount).Error; err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch like count: %v", err), http.StatusInternalServerError)
		return
	}

	var isLiked bool
	if err := database.DB.Model(&models.Like{}).
		Select("COUNT(1) > 0").
		Where("reply_id = ? AND user_id = ?", replyID, userID).
		Scan(&isLiked).Error; err != nil {
		http.Error(w, "Failed to check like status", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"likes":        likeCount,
		"isReplyLiked": isLiked,
	})
}

// UnlikeReply - Remove a like from a reply
func UnlikeReply(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	replyID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid Reply ID", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}

	// Проверяем, существует ли лайк
	var existingLike models.Like
	if err := database.DB.Where("reply_id = ? AND user_id = ?", replyID, userID).First(&existingLike).Error; err != nil {
		http.Error(w, "Like not found", http.StatusNotFound)
		return
	}

	// Удаляем лайк из базы
	if err := database.DB.Delete(&existingLike).Error; err != nil {
		http.Error(w, "Failed to remove like", http.StatusInternalServerError)
		return
	}

	// Обновляем счётчик лайков
	if err := database.DB.Model(&models.Reply{}).
		Where("id = ?", replyID).
		Update("likes", gorm.Expr("likes - 1")).Error; err != nil {
		http.Error(w, "Failed to update like count", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Reply unliked successfully"})
}
