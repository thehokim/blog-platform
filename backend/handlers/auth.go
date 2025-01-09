package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"blog-platform/utils" // Import the utils package for JWT and other helpers
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

// Login authenticates the user and generates a JWT token
func Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Find user by email
	var user models.User
	if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Check password validity
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Generate JWT token with user data
	token, err := utils.GenerateJWT(user.ID, user.Username, user.Avatar) // JWT creation moved to utils
	if err != nil {
		http.Error(w, "Failed to create token", http.StatusInternalServerError)
		return
	}

	// Save the token (optional)
	if err := database.DB.Model(&user).Update("verification_token", token).Error; err != nil {
		http.Error(w, "Failed to save token", http.StatusInternalServerError)
		return
	}

	// Send the token and user ID in the response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":   user.ID,
			"name": user.Username, // или user.Name, если в вашей модели так называется поле
		},
	})
}
