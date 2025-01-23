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

func GetComments(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID := vars["post_id"]

	var comments []models.Comment

	// Fetch comments for the specific post and preload the replies
	if err := database.DB.Preload("Replies").Where("post_id = ?", postID).Find(&comments).Error; err != nil {
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

func DeleteComment(w http.ResponseWriter, r *http.Request) {
	// Extracting the parameters from the URL path
	vars := mux.Vars(r)
	commentID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	postID, err := strconv.Atoi(vars["post_id"])
	if err != nil {
		http.Error(w, "Invalid Post ID", http.StatusBadRequest)
		return
	}

	// Convert postID to uint
	postIDUint := uint(postID)

	// Retrieve the comment from the database
	var comment models.Comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	// Validate if the comment belongs to the given postID (optional)
	if comment.PostID != postIDUint {
		http.Error(w, "Comment does not belong to the specified post", http.StatusBadRequest)
		return
	}

	// Mark the comment as deleted (soft delete)
	comment.Deleted = true
	if err := database.DB.Save(&comment).Error; err != nil {
		http.Error(w, "Failed to delete comment", http.StatusInternalServerError)
		return
	}

	// Send a success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := map[string]string{
		"message": "Comment deleted successfully",
	}
	json.NewEncoder(w).Encode(response)
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

// Helper function to return uint pointer
func uintPtr(i uint) *uint {
	return &i
}

// GetLikes - Retrieve the number of likes for a comment
func GetLikes(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Comment ID format", http.StatusBadRequest)
		return
	}

	var likeCount int64
	if err := database.DB.Model(&models.Like{}).Where("comment_id = ?", commentID).Count(&likeCount).Error; err != nil {
		http.Error(w, "Failed to fetch like count", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int64{"likes": likeCount})
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

func GetReplies(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	commentIDStr := vars["id"]
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	// Fetch replies for the given comment ID
	var replies []models.Reply
	if err := database.DB.Where("parent_id = ?", commentID).Find(&replies).Error; err != nil {
		http.Error(w, "Failed to fetch replies", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(replies)
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

	// Retrieve the reply from the database
	var reply models.Reply // Changed from models.Comment to models.Reply
	if err := database.DB.First(&reply, replyID).Error; err != nil {
		http.Error(w, "Reply not found", http.StatusNotFound)
		return
	}

	// Increment the like count
	reply.Likes++
	if err := database.DB.Save(&reply).Error; err != nil {
		http.Error(w, "Failed to like reply", http.StatusInternalServerError)
		return
	}

	// Respond with the updated like count
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := map[string]int{
		"likes": reply.Likes,
	}
	json.NewEncoder(w).Encode(response)
}

// GetReplyLikes - Get the like count for a reply
func GetReplyLikes(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	replyID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid Reply ID", http.StatusBadRequest)
		return
	}

	// Retrieve the reply from the database
	var reply models.Reply // Changed from models.Comment to models.Reply
	if err := database.DB.First(&reply, replyID).Error; err != nil {
		http.Error(w, "Reply not found", http.StatusNotFound)
		return
	}

	// Respond with the like count
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := map[string]int{
		"likes": reply.Likes,
	}
	json.NewEncoder(w).Encode(response)
}
