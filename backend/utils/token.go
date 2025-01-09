package utils

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Secret key for signing JWT tokens
var secretKey = []byte("YOUR_SECRET_KEY")

// GenerateRandomToken generates a secure random token for verification
func GenerateRandomToken() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "" // Fallback to an empty string if token generation fails
	}
	return hex.EncodeToString(bytes)
}

// generateJWT generates a JWT token including user information (ID, username, avatar)
func GenerateJWT(userID uint, username string, avatar string) (string, error) {
	// Create JWT token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"avatar":   avatar,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	})

	// Sign the token with the secret key
	signedToken, err := token.SignedString(secretKey)
	if err != nil {
		return "", err
	}
	return signedToken, nil
}
