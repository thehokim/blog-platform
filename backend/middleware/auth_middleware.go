package middleware

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

var secretKey = []byte("YOUR_SECRET_KEY")

// AuthMiddleware checks the presence and validity of the token
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header is missing", http.StatusUnauthorized)
			return
		}

		// Extract the token from the Authorization header
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			http.Error(w, "Invalid token format", http.StatusUnauthorized)
			return
		}

		// Parse the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return secretKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Extract claims from the token
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["user_id"] == nil {
			log.Println("Failed to extract user_id from token claims")
			http.Error(w, "Failed to parse token claims", http.StatusUnauthorized)
			return
		}

		// Save user information from the token into the request header
		userID := fmt.Sprintf("%v", claims["user_id"])
		username := fmt.Sprintf("%v", claims["username"])
		avatar := fmt.Sprintf("%v", claims["avatar"])

		// Log extracted user information
		log.Println("Extracted user_id:", userID)
		log.Println("Extracted username:", username)
		log.Println("Extracted avatar:", avatar)

		// Set user information in request header
		r.Header.Set("X-User-ID", userID)
		r.Header.Set("X-Username", username)
		r.Header.Set("X-Avatar", avatar)

		// Proceed with the next handler
		next.ServeHTTP(w, r)
	})
}
