package routes

import (
	"blog-platform/handlers"

	"github.com/gorilla/mux"
)

// InitRoutes initializes all application routes
func InitRoutes() *mux.Router {
	router := mux.NewRouter()

	// Initialize specific route groups
	initAuthRoutes(router)
	initCommentRoutes(router)
	initUserRoutes(router)
	initPostRoutes(router)
	initNotificationRoutes(router)

	return router
}

// initAuthRoutes sets up user authentication routes
func initAuthRoutes(router *mux.Router) {
	router.HandleFunc("/register", handlers.Register).Methods("POST")
	router.HandleFunc("/login", handlers.Login).Methods("POST")
	router.HandleFunc("/forgot-password", handlers.ForgotPassword).Methods("POST")
	router.HandleFunc("/reset-password", handlers.ResetPassword).Methods("POST")
}

// initCommentRoutes sets up comment-related routes
func initCommentRoutes(router *mux.Router) {
	router.HandleFunc("/posts/{id:[0-9]+}/comments", handlers.GetComments).Methods("GET")    // Get comments for a post
	router.HandleFunc("/posts/{id:[0-9]+}/comments", handlers.CreateComment).Methods("POST") // Create a comment for a post
	router.HandleFunc("/comments/{id:[0-9]+}/like", handlers.LikeComment).Methods("POST")    // Like a comment
}

// initUserRoutes sets up user-related routes
func initUserRoutes(router *mux.Router) {
	router.HandleFunc("/users/{id:[0-9]+}", handlers.GetProfile).Methods("GET")           // Get user profile
	router.HandleFunc("/users/{id:[0-9]+}", handlers.UpdateProfile).Methods("PUT")        // Update user profile
	router.HandleFunc("/users/{id:[0-9]+}/avatar", handlers.UploadAvatar).Methods("POST") // Upload avatar
	router.HandleFunc("/users/{id:[0-9]+}/avatar", handlers.GetAvatar).Methods("GET")     // Get user avatar
}
func initNotificationRoutes(router *mux.Router) {
	router.HandleFunc("/notifications", handlers.GetNotifications).Methods("GET") // Получение уведомлений
}

func initPostRoutes(router *mux.Router) {
	router.HandleFunc("/posts", handlers.GetPosts).Methods("GET")
	router.HandleFunc("/posts/{id:[0-9]+}", handlers.GetPost).Methods("GET")
	router.HandleFunc("/posts/{id:[0-9]+}", handlers.UpdatePost).Methods("PUT")
	router.HandleFunc("/posts/{id:[0-9]+}", handlers.DeletePost).Methods("DELETE")
	router.HandleFunc("/posts/{id:[0-9]+}/like", handlers.LikePost).Methods("POST")
	router.HandleFunc("/search", handlers.SearchPosts).Methods("GET")
	router.HandleFunc("/posts/{id:[0-9]+}/save", handlers.SavePost).Methods("POST")    // Сохранить пост
	router.HandleFunc("/posts/create", handlers.CreatePostWithContent).Methods("POST") // Новый маршрут
}
