package middleware

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

var secretKey = []byte("YOUR_SECRET_KEY")

// AuthMiddleware проверяет наличие и валидность токена
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Получение токена из заголовка Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header is missing", http.StatusUnauthorized)
			return
		}

		// Проверка формата токена
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			http.Error(w, "Invalid token format", http.StatusUnauthorized)
			return
		}

		// Парсинг и валидация токена
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Проверка алгоритма подписи
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, http.ErrNoCookie
			}
			return secretKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Извлечение claims (пользовательских данных)
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			// Пример: извлечение user_id из токена
			userID, ok := claims["user_id"].(float64)
			if !ok {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}
			// Сохраняем user_id в заголовке запроса
			r.Header.Set("X-User-ID", strconv.Itoa(int(userID)))
		} else {
			http.Error(w, "Failed to parse token claims", http.StatusUnauthorized)
			return
		}

		// Передача управления следующему обработчику
		next.ServeHTTP(w, r)
	})
}
