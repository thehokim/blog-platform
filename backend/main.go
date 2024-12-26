package main

import (
	"blog-platform/database"
	"blog-platform/routes"
	"log"
	"net/http"
)

func main() {
	// Initialize the database
	database.InitDatabase()

	// Create a new router
	router := routes.InitRoutes()

	// Start the server on port 3000
	log.Println("Server is running on port 8080")
	if err := http.ListenAndServe(":8080", router); err != nil {
		log.Fatalf("Failed to start the server: %v", err)
	}
}
