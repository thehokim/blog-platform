package utils

import (
	"crypto/rand"
	"encoding/hex"
)

// GenerateRandomToken generates a secure random token for verification
func GenerateRandomToken() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "" // Fallback to an empty string if token generation fails
	}
	return hex.EncodeToString(bytes)
}
