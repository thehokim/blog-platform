package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"blog-platform/utils"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func ensureAvatarDirectoryExists() error {
	dir := "./uploads/avatars"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return os.MkdirAll(dir, os.ModePerm)
	}
	return nil
}

// Register handles user registration
func Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Username string `json:"username"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var existingUser models.User
	if err := database.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	if input.Username == "" {
		input.Username = generateUniqueUsername(input.Email)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	user := models.User{
		Email:    input.Email,
		Password: string(hashedPassword),
		Username: input.Username,
		IsActive: true,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Username, "")
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"token": token, "message": "User registered successfully"})
}

// GetProfile retrieves the profile information of a user
func GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := mux.Vars(r)["id"]

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := mux.Vars(r)["id"]

	// Parse the form data (allowing up to 10 MB for file uploads)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	// Fetch the user from the database
	var user models.User
	id, err := strconv.Atoi(userID)
	if err != nil || id <= 0 {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	if err := database.DB.First(&user, id).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Prepare data for updates
	updates := make(map[string]interface{})

	// Update first_name if provided
	if firstName := r.FormValue("first_name"); firstName != "" {
		updates["first_name"] = firstName
	}

	// Update last_name if provided
	if lastName := r.FormValue("last_name"); lastName != "" {
		updates["last_name"] = lastName
	}

	// Update bio if provided
	if bio := r.FormValue("bio"); bio != "" {
		updates["bio"] = bio
	}

	// Update website if provided
	if website := r.FormValue("website"); website != "" {
		updates["website"] = website
	}

	// Update email if provided (with uniqueness check)
	if email := r.FormValue("email"); email != "" {
		var existingUser models.User
		if err := database.DB.Where("email = ?", email).First(&existingUser).Error; err == nil && existingUser.ID != user.ID {
			http.Error(w, "Email is already in use", http.StatusConflict)
			return
		}
		updates["email"] = email
	}

	// Update avatar if a file is uploaded
	if file, handler, err := r.FormFile("avatar"); err == nil {
		defer file.Close()

		// Ensure avatar directory exists
		if err := ensureAvatarDirectoryExists(); err != nil {
			http.Error(w, "Failed to create directory for avatar", http.StatusInternalServerError)
			return
		}

		// Generate a unique avatar file name
		avatarPath := fmt.Sprintf("./uploads/avatars/%d_%s", time.Now().UnixNano(), handler.Filename)
		out, err := os.Create(avatarPath)
		if err != nil {
			http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		// Save the avatar file
		if _, err := io.Copy(out, file); err != nil {
			http.Error(w, "Failed to save avatar", http.StatusInternalServerError)
			return
		}

		// Store the avatar path in updates
		updates["avatar"] = avatarPath[1:] // Remove leading dot for URL compatibility
	}

	// Update username if email is updated
	if email, ok := updates["email"].(string); ok {
		username := generateUniqueUsername(email)
		updates["username"] = username
	}

	// Apply the updates to the user
	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	// Respond with the updated user data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// Helper function to generate unique usernames based on email
func generateUniqueUsername(email string) string {
	base := strings.Split(email, "@")[0]
	username := base
	var count int
	for {
		var existingUser models.User
		if err := database.DB.Where("username = ?", username).First(&existingUser).Error; err == gorm.ErrRecordNotFound {
			break
		}
		count++
		username = fmt.Sprintf("%s%d", base, count)
	}
	return username
}
