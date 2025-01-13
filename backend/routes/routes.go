package routes

import (
	"blog-platform/handlers"
	"blog-platform/middleware"

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

}

// initCommentRoutes sets up comment-related routes
func initCommentRoutes(router *mux.Router) {
	router.HandleFunc("/posts/{id:[0-9]+}/comments", handlers.GetComments).Methods("GET")    // Get comments for a post
	router.HandleFunc("/posts/{id:[0-9]+}/comments", handlers.CreateComment).Methods("POST") // Create a comment for a post
	router.HandleFunc("/comments/{id:[0-9]+}/like", handlers.LikeComment).Methods("POST")    // Like a comment
	router.HandleFunc("/comments/{id:[0-9]+}/like", handlers.GetLikes).Methods("GET")
}

// initUserRoutes sets up user-related routes
func initUserRoutes(router *mux.Router) {
	router.HandleFunc("/users/{id:[0-9]+}", handlers.GetProfile).Methods("GET")    // Get user profile
	router.HandleFunc("/users/{id:[0-9]+}", handlers.UpdateProfile).Methods("PUT") // Update user profile
}

func initNotificationRoutes(router *mux.Router) {
	router.HandleFunc("/notifications", handlers.GetNotifications).Methods("GET") // Получение уведомлений
	router.HandleFunc("/notifications/{id}/reaction", handlers.ReactToNotification).Methods("POST")
	router.HandleFunc("/notifications/{id}/reactions", handlers.GetReactionsForNotification).Methods("GET")
}

func initPostRoutes(router *mux.Router) {
	// Публичные маршруты (не требуют токена)
	router.HandleFunc("/posts", handlers.GetPosts).Methods("GET")
	router.HandleFunc("/posts/{id:[0-9]+}", handlers.GetPost).Methods("GET")
	router.HandleFunc("/search", handlers.SearchPosts).Methods("GET")

	// Подмаршруты для защищенных запросов, используют middleware
	authRouter := router.PathPrefix("/posts").Subrouter()
	authRouter.Use(middleware.AuthMiddleware)                                                // Применяем middleware проверки токена
	authRouter.HandleFunc("/{id:[0-9]+}", handlers.UpdatePost).Methods("PUT")                // Обновить пост
	authRouter.HandleFunc("/{id:[0-9]+}", handlers.DeletePost).Methods("DELETE")             // Удалить пост
	authRouter.HandleFunc("/{id:[0-9]+}/save", handlers.SavePost).Methods("POST")            // Сохранить пост
	authRouter.HandleFunc("/{id:[0-9]+}/saved-blogs", handlers.GetSavedPosts).Methods("GET") // Получить сохраненные посты
	authRouter.HandleFunc("/unsave-post/{id:[0-9]+}", handlers.UnsavePost).Methods("DELETE") // Route for UnsavePost
	authRouter.HandleFunc("/{id:[0-9]+}/save-status", handlers.SaveStatus).Methods("POST")
	authRouter.HandleFunc("/create", handlers.CreatePostWithContent).Methods("POST")  // Создать пост
	authRouter.HandleFunc("/{id:[0-9]+}/like", handlers.LikePost).Methods("POST")     // Лайк поста
	authRouter.HandleFunc("/{id:[0-9]+}/likes", handlers.GetPostLikes).Methods("GET") // Получение лайков поста
	authRouter.HandleFunc("/{id:[0-9]+}/like", handlers.UnlikePost).Methods("DELETE") // Remove like from a post
}
