package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"unicode"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

func generateSlug(title string) string {
	slug := strings.ToLower(strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '-' {
			return r
		}
		if unicode.IsSpace(r) {
			return '-'
		}
		return -1
	}, title))

	var post models.Post
	baseSlug := slug
	counter := 1
	for {
		if err := database.DB.Where("slug = ?", slug).First(&post).Error; err == gorm.ErrRecordNotFound {
			break
		}
		slug = baseSlug + "-" + strconv.Itoa(counter)
		counter++
	}

	return slug
}

func respondWithError(w http.ResponseWriter, statusCode int, message string) {
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// CreatePostWithContent - Создание поста с содержимым
func CreatePostWithContent(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ID      uint                  `json:"id"`
		Title   string                `json:"title"`
		Content string                `json:"content"`
		Tags    []string              `json:"tags"`
		Texts   []models.TextContent  `json:"texts"`
		Images  []models.ImageContent `json:"images"`
		Maps    []models.MapContent   `json:"maps"`
		Videos  []models.VideoContent `json:"videos"`
		Tables  []models.TableContent `json:"tables"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid input")
		return
	}

	var user models.User
	if err := database.DB.First(&user, input.ID).Error; err != nil {
		respondWithError(w, http.StatusBadRequest, "User not found")
		return
	}

	post := models.Post{
		Title:    input.Title,
		Content:  input.Content,
		Slug:     generateSlug(input.Title),
		AuthorID: input.ID,
	}

	if err := database.DB.Create(&post).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create post")
		return
	}

	saveContent(&post, input.Texts, input.Images, input.Maps, input.Videos, input.Tables)

	if err := saveTags(&post, input.Tags); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to save tags")
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func saveContent(post *models.Post, texts []models.TextContent, images []models.ImageContent, maps []models.MapContent, videos []models.VideoContent, tables []models.TableContent) {
	for _, text := range texts {
		text.PostID = post.ID
		if err := database.DB.Create(&text).Error; err != nil {
			continue
		}
	}
	for _, image := range images {
		image.PostID = post.ID
		if err := database.DB.Create(&image).Error; err != nil {
			continue
		}
	}
	for _, mapContent := range maps {
		mapContent.PostID = post.ID
		if err := database.DB.Create(&mapContent).Error; err != nil {
			continue
		}
	}
	for _, video := range videos {
		video.PostID = post.ID
		if err := database.DB.Create(&video).Error; err != nil {
			continue
		}
	}
	for _, table := range tables {
		table.PostID = post.ID
		if err := database.DB.Create(&table).Error; err != nil {
			continue
		}
	}
}

func saveTags(post *models.Post, tagNames []string) error {
	var existingTags []models.Tag
	database.DB.Where("name IN ?", tagNames).Find(&existingTags)

	existingTagMap := make(map[string]models.Tag)
	for _, tag := range existingTags {
		existingTagMap[tag.Name] = tag
	}

	var newTags []models.Tag
	for _, tagName := range tagNames {
		if _, exists := existingTagMap[tagName]; !exists {
			newTags = append(newTags, models.Tag{Name: tagName})
		}
	}

	if len(newTags) > 0 {
		if err := database.DB.Create(&newTags).Error; err != nil {
			return err
		}
	}

	allTags := append(existingTags, newTags...)
	return database.DB.Model(post).Association("Tags").Replace(allTags)
}

// GetPosts - Получение всех постов
func GetPosts(w http.ResponseWriter, r *http.Request) {
	log.Println("GetPosts called")
	var posts []models.Post
	if err := database.DB.Preload("Tags").
		Preload("Texts").
		Preload("Images").
		Preload("Maps").
		Preload("Videos").
		Preload("Tables").
		Find(&posts).Error; err != nil {
		log.Printf("Database error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}
	log.Printf("Fetched %d posts", len(posts))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

// GetPost - Получение поста по ID
func GetPost(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid ID format")
		return
	}

	var post models.Post
	if err := database.DB.Preload("Tags").
		Preload("Texts").
		Preload("Images").
		Preload("Maps").
		Preload("Videos").
		Preload("Tables").
		First(&post, id).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "Post not found")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

// UpdatePost - Обновление поста
func UpdatePost(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid ID format")
		return
	}

	var post models.Post
	if err := database.DB.Preload("Tags").First(&post, id).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "Post not found")
		return
	}

	var input struct {
		Title   string                `json:"title"`
		Content string                `json:"content"`
		Tags    []string              `json:"tags"`
		Texts   []models.TextContent  `json:"texts"`
		Images  []models.ImageContent `json:"images"`
		Maps    []models.MapContent   `json:"maps"`
		Videos  []models.VideoContent `json:"videos"`
		Tables  []models.TableContent `json:"tables"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid input")
		return
	}

	post.Title = input.Title
	post.Content = input.Content

	if err := saveTags(&post, input.Tags); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to update tags")
		return
	}

	if err := database.DB.Save(&post).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to update post")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

// DeletePost - Удаление поста
func DeletePost(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid ID format")
		return
	}

	if err := database.DB.Delete(&models.Post{}, id).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to delete post")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// LikePost - Лайк поста
func LikePost(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Post ID format", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}

	like := models.Like{
		UserID: uint(userID),
		PostID: uintPtr(uint(postID)),
	}

	if err := database.DB.Create(&like).Error; err != nil {
		http.Error(w, "Failed to like post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Post liked successfully"})
}

// SearchPosts - Поиск постов
func SearchPosts(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	var posts []models.Post
	if err := database.DB.Where("title LIKE ? OR content LIKE ?", "%"+query+"%", "%"+query+"%").
		Find(&posts).Error; err != nil {
		http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

// SavePost - Сохранение поста
func SavePost(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Post ID", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	savedPost := models.SavedPost{
		UserID: uint(userID),
		PostID: uint(postID),
	}

	if err := database.DB.Create(&savedPost).Error; err != nil {
		http.Error(w, "Failed to save post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Post saved successfully"})
}

// UnsavePost - Удаление из сохраненных постов
func UnsavePost(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Post ID", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	if err := database.DB.Where("user_id = ? AND post_id = ?", userID, postID).
		Delete(&models.SavedPost{}).Error; err != nil {
		http.Error(w, "Failed to unsave post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Post unsaved successfully"})
}
