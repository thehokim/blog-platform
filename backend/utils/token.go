package utils

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
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

// Функция для извлечения userID из JWT
func ParseTokenAndGetUserID(tokenString string) (int, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return secretKey, nil
	})

	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		if userID, ok := claims["user_id"].(float64); ok {
			return int(userID), nil
		}
	}

	return 0, errors.New("invalid token claims")
}

// Функция для получения userID из запроса
func GetUserIDFromRequest(r *http.Request) (int, error) {
	token := r.Header.Get("Authorization")
	if token == "" {
		return 0, errors.New("missing token")
	}

	// Проверяем формат "Bearer <token>"
	parts := strings.Split(token, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return 0, errors.New("invalid token format")
	}

	return ParseTokenAndGetUserID(parts[1])
}
