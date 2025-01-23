package routes

import (
	"blog-platform/handlers"
	"blog-platform/middleware"
	"net/http"

	"github.com/gorilla/mux"
)

// InitRoutes initializes all application routes
func InitRoutes() *mux.Router {
	router := mux.NewRouter()
	initAuthRoutes(router)
	initCommentRoutes(router)
	initUserRoutes(router)
	initPostRoutes(router)
	initNotificationRoutes(router)
	initMyBlogsRoute(router) // Добавляем маршрут для /posts/myblogs

	return router
}

// initAuthRoutes sets up user authentication routes
func initAuthRoutes(router *mux.Router) {
	router.HandleFunc("/register", handlers.Register).Methods("POST")
	router.HandleFunc("/login", handlers.Login).Methods("POST")

}

// initCommentRoutes sets up comment-related routes
func initCommentRoutes(router *mux.Router) {
	router.HandleFunc("/posts/{post_id:[0-9]+}/comments", handlers.CreateComment).Methods("POST") // Create a comment
	router.HandleFunc("/posts/{post_id:[0-9]+}/comments", handlers.GetComments).Methods("GET")    // Get comments
	router.HandleFunc("/posts/{post_id:[0-9]+}/comments/{id:[0-9]+}", handlers.DeleteComment).Methods("DELETE")
	router.HandleFunc("/comments/{id:[0-9]+}/like", handlers.LikeComment).Methods("POST")       // Like a comment
	router.HandleFunc("/comments/{id:[0-9]+}/like", handlers.GetLikes).Methods("GET")           // Get likes
	router.HandleFunc("/comments/{id:[0-9]+}/replies", handlers.ReplyToComment).Methods("POST") // Reply to a comment
	router.HandleFunc("/comments/{id:[0-9]+}/replies", handlers.GetReplies).Methods("GET")
	router.HandleFunc("/comments/{comment_id}/replies/{id}", handlers.DeleteReply).Methods("DELETE")
	router.HandleFunc("/replies/{id:[0-9]+}/like", handlers.LikeReply).Methods("POST")     // Like reply
	router.HandleFunc("/replies/{id:[0-9]+}/likes", handlers.GetReplyLikes).Methods("GET") // Get reply like count

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

// Добавляем функцию для маршрута /posts/myblogs
func initMyBlogsRoute(router *mux.Router) {
	router.Handle("/posts/myblogs", middleware.AuthMiddleware(http.HandlerFunc(handlers.GetMyBlogs))).Methods("GET")
}

func initPostRoutes(router *mux.Router) {
	// Публичные маршруты (не требуют токена)
	router.HandleFunc("/posts", handlers.GetPosts).Methods("GET")
	router.HandleFunc("/posts/{id:[0-9]+}", handlers.GetPost).Methods("GET")
	router.HandleFunc("/search", handlers.SearchPosts).Methods("GET")

	// Подмаршруты для защищенных запросов, используют middleware
	authRouter := router.PathPrefix("/posts").Subrouter()
	authRouter.Use(middleware.AuthMiddleware)                                         // Применяем middleware проверки токена
	authRouter.HandleFunc("/{id:[0-9]+}", handlers.UpdatePost).Methods("PUT")         // Обновить пост
	authRouter.HandleFunc("/{id:[0-9]+}", handlers.DeletePost).Methods("DELETE")      // Удалить пост
	authRouter.HandleFunc("/{id:[0-9]+}/save", handlers.SavePost).Methods("POST")     // Сохранить пост
	authRouter.HandleFunc("/saved-blogs", handlers.GetSavedPosts).Methods("GET")      // Получить сохраненные посты
	authRouter.HandleFunc("/{id:[0-9]+}/save", handlers.UnsavePost).Methods("DELETE") // Route for UnsavePost
	authRouter.HandleFunc("/{id:[0-9]+}/save-status", handlers.SaveStatus).Methods("POST")
	authRouter.HandleFunc("/{id:[0-9]+}/save-status", handlers.GetSaveStatus).Methods("GET")
	authRouter.HandleFunc("/create", handlers.CreatePostWithContent).Methods("POST")  // Создать пост
	authRouter.HandleFunc("/{id:[0-9]+}/like", handlers.LikePost).Methods("POST")     // Лайк поста
	authRouter.HandleFunc("/{id:[0-9]+}/likes", handlers.GetPostLikes).Methods("GET") // Получение лайков поста
	authRouter.HandleFunc("/{id:[0-9]+}/like", handlers.UnlikePost).Methods("DELETE") // Remove like from a post
}
