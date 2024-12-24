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

// GetComments - Retrieve all comments for a post
func GetComments(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Post ID format", http.StatusBadRequest)
		return
	}

	var comments []models.Comment
	if err := database.DB.Where("post_id = ?", postID).Find(&comments).Error; err != nil {
		http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
		return
	}

	// Fetch the post to get the author's ID
	var post models.Post
	if err := database.DB.First(&post, postID).Error; err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Create a notification for the post's author
	notification := models.Notification{
		UserID:  post.AuthorID,
		Type:    "view_comments",
		PostID:  uintPtr(uint(postID)),
		Message: fmt.Sprintf("Comments on your post with ID %d were viewed", postID),
	}
	if err := database.DB.Create(&notification).Error; err != nil {
		log.Printf("Failed to create notification: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

// CreateComment - Create a new comment for a post
func CreateComment(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Post ID format", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}

	var comment models.Comment
	if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
		log.Printf("Failed to parse request body: %v", err)
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Log the parsed comment details
	log.Printf("Creating comment: %+v", comment)

	comment.PostID = uint(postID)
	comment.AuthorID = uint(userID)

	// Attempt to create the comment in the database
	if err := database.DB.Create(&comment).Error; err != nil {
		log.Printf("Failed to create comment: %v", err)
		http.Error(w, "Failed to create comment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(comment)
}

// GetLikes - Retrieve the number of likes for a post
func GetLikes(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Post ID format", http.StatusBadRequest)
		return
	}

	var likeCount int64
	if err := database.DB.Model(&models.Like{}).Where("post_id = ?", postID).Count(&likeCount).Error; err != nil {
		http.Error(w, "Failed to fetch like count", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int64{"likes": likeCount})
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

	// Fetch the comment and its author for notification
	var comment models.Comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}
	commentAuthorID := comment.AuthorID

	// Prepare a like object
	like := models.Like{
		UserID:    uint(userID),
		CommentID: uintPtr(uint(commentID)),
	}

	// Check if the user has already liked this comment
	var existingLike models.Like
	if err := database.DB.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&existingLike).Error; err == nil {
		http.Error(w, "User has already liked this comment", http.StatusConflict)
		return
	}

	// Save the like to the database
	if err := database.DB.Create(&like).Error; err != nil {
		http.Error(w, "Failed to like comment", http.StatusInternalServerError)
		return
	}

	// Create a notification for the comment's author
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

// Helper function for uint pointer
func uintPtr(i uint) *uint {
	return &i
}
