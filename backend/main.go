package main

import (
	"blog-platform/database"
	"blog-platform/routes"
	"log"
	"net/http"

	"github.com/rs/cors"
)

func main() {
	// Initialize the database
	database.InitDatabase()

	// Create a new router
	router := routes.InitRoutes()

	// Serve static files for avatars
	fs := http.FileServer(http.Dir("./uploads"))
	router.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", fs))

	// Configure CORS to allow localhost, Ngrok URL, and blog-cmspace.uz
	corsHandler := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"https://blog.cmspace.uz",
			"https://www.blog.cmspace.uz",
		},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},  // Allowed HTTP methods
		AllowedHeaders: []string{"Content-Type", "Authorization"}, // Allowed headers
		AllowCredentials: true, // Allow cookies/auth credentials
	}).Handler(router)

	// Start the server on port 8080
	log.Println("Server is running on port 8080")
	if err := http.ListenAndServe("0.0.0.0:8080", corsHandler); err != nil {
		log.Fatalf("Failed to start the server: %v", err)
	}
}
