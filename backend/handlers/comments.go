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

	// Fetch comments for the specific post, excluding deleted comments, and preload non-deleted replies
	if err := database.DB.Preload("Replies", func(db *gorm.DB) *gorm.DB {
		return db.Where("deleted = ? OR deleted IS NULL", false) // Загружаем только не удалённые ответы
	}).Where("post_id = ? AND (deleted = false OR deleted IS NULL)", postID).Find(&comments).Error; err != nil {
		http.Error(w, fmt.Sprintf("Error fetching comments for post %s: %v", postID, err), http.StatusInternalServerError)
		return
	}

	// Respond with the fetched comments as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

// CreateComment - Create a new comment
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(comment)
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

	// Fetch the parent comment from the database to get the associated PostID
	var parentComment models.Comment
	if err := database.DB.First(&parentComment, commentID).Error; err != nil {
		http.Error(w, "Parent comment not found", http.StatusBadRequest)
		return
	}

	reply := models.Reply{
		Content:  input.Content,
		PostID:   parentComment.PostID, // Link the reply to the parent comment's PostID
		AuthorID: uint(userID),
		ParentID: uint(commentID), // Linking to parent comment
		Edited:   false,
		Deleted:  false,
	}

	if err := database.DB.Create(&reply).Error; err != nil {
		http.Error(w, "Failed to create reply", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reply)
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

	var likeCount int64
	// Count likes for the specific reply
	if err := database.DB.Model(&models.Like{}).Where("reply_id = ?", replyID).Count(&likeCount).Error; err != nil {
		http.Error(w, "Failed to fetch like count", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int64{
		"likes": likeCount,
	})
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

// LikeReply - Increment the like count for a reply
func LikeReply(w http.ResponseWriter, r *http.Request) {
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

	// Проверяем, ставил ли пользователь лайк ранее
	var existingLike models.Like
	if err := database.DB.Where("reply_id = ? AND user_id = ?", replyID, userID).First(&existingLike).Error; err == nil {
		http.Error(w, "User has already liked this reply", http.StatusConflict)
		return
	}

	// Добавляем лайк в таблицу лайков
	like := models.Like{
		UserID:  uint(userID),
		ReplyID: uintPtr(uint(replyID)),
	}
	if err := database.DB.Create(&like).Error; err != nil {
		http.Error(w, "Failed to register like", http.StatusInternalServerError)
		return
	}

	// Обновляем счётчик лайков с защитой от конкурентных изменений
	if err := database.DB.Model(&models.Reply{}).
		Where("id = ?", replyID).
		Update("likes", gorm.Expr("likes + 1")).Error; err != nil {
		http.Error(w, "Failed to update like count", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Reply liked successfully"})
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
		"likes":   likeCount,
		"isLiked": isLiked,
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
