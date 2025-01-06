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

func CreatePostWithContent(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var input struct {
		Title       string                `json:"title"`
		Description string                `json:"description"`
		Tags        []string              `json:"tags"`
		Tables      []models.TableContent `json:"tableDate"`
		Images      []models.ImageContent `json:"imageUrl"`
		Maps        []models.MapContent   `json:"mapUrl"`
		Videos      []models.VideoContent `json:"videoUrl"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid input")
		return
	}

	// Конвертируем userID в uint
	userIDUint, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Проверяем, существует ли пользователь
	var user models.User
	if err := database.DB.First(&user, uint(userIDUint)).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	post := models.Post{
		Title:       input.Title,
		Description: input.Description,
		Slug:        generateSlug(input.Title),
		AuthorID:    uint(userIDUint),
	}

	if err := database.DB.Create(&post).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create post")
		return
	}

	saveContent(&post, input.Images, input.Maps, input.Videos, input.Tables)

	if err := saveTags(&post, input.Tags); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to save tags")
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func saveContent(post *models.Post, images []models.ImageContent, maps []models.MapContent, videos []models.VideoContent, tables []models.TableContent) {
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

func extractTagNames(tags []models.Tag) []string {
	var tagNames []string
	for _, tag := range tags {
		tagNames = append(tagNames, tag.Name)
	}
	return tagNames
}

func formatTableData(tables []models.TableContent) []map[string]interface{} {
	var formattedTables []map[string]interface{}

	for _, table := range tables {
		var parsedTable map[string]interface{}
		if err := json.Unmarshal([]byte(table.Data), &parsedTable); err != nil {
			log.Printf("Failed to parse table content: %v", err)
			continue
		}
		formattedTables = append(formattedTables, parsedTable)
	}

	return formattedTables
}

func GetPosts(w http.ResponseWriter, r *http.Request) {
	log.Println("GetPosts called")

	var posts []models.Post
	// Загрузка постов вместе со связанными данными
	if err := database.DB.Preload("Tags").
		Preload("Author").
		Preload("Images").    // Загрузка связанных изображений
		Preload("Videos").    // Загрузка связанных видео
		Preload("Maps").      // Загрузка связанных карт
		Preload("TableData"). // Загрузка связанных таблиц
		Find(&posts).Error; err != nil {
		log.Printf("Database error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}

	// Форматирование и отправка данных клиенту
	var formattedPosts []map[string]interface{}
	for _, post := range posts {
		formattedPost := map[string]interface{}{
			"id":          post.ID,
			"title":       post.Title,
			"description": post.Description,
			"date":        post.Date,
			"tags":        extractTagNames(post.Tags),
			"imageUrl": func() []string {
				var images []string
				for _, img := range post.Images {
					images = append(images, img.URL)
				}
				return images
			}(),
			"mapUrl": func() []map[string]float64 {
				var maps []map[string]float64
				for _, m := range post.Maps {
					maps = append(maps, map[string]float64{
						"latitude":  m.Latitude,
						"longitude": m.Longitude,
					})
				}
				return maps
			}(),
			"videoUrl": func() []string {
				var videos []string
				for _, v := range post.Videos {
					videos = append(videos, v.URL)
				}
				return videos
			}(),
			"tableData": formatTableData(post.TableData),
			"author": map[string]string{
				"name":     post.Author.Username,
				"imageUrl": post.Author.Avatar,
			},
		}
		formattedPosts = append(formattedPosts, formattedPost)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(formattedPosts)
}

func GetPost(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid ID format")
		return
	}

	var post models.Post
	// Загрузка поста вместе со связанными данными
	if err := database.DB.Preload("Tags").
		Preload("Author").
		Preload("Images").    // Загрузка связанных изображений
		Preload("Videos").    // Загрузка связанных видео
		Preload("Maps").      // Загрузка связанных карт
		Preload("TableData"). // Загрузка связанных таблиц
		First(&post, id).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "Post not found")
		return
	}

	// Форматирование и отправка данных клиенту
	formattedPost := map[string]interface{}{
		"id":          post.ID,
		"title":       post.Title,
		"description": post.Description,
		"date":        post.Date,
		"tags":        extractTagNames(post.Tags),
		"imageUrl": func() []string {
			var images []string
			for _, img := range post.Images {
				images = append(images, img.URL)
			}
			return images
		}(),
		"mapUrl": func() []map[string]float64 {
			var maps []map[string]float64
			for _, m := range post.Maps {
				maps = append(maps, map[string]float64{
					"latitude":  m.Latitude,
					"longitude": m.Longitude,
				})
			}
			return maps
		}(),
		"videoUrl": func() []string {
			var videos []string
			for _, v := range post.Videos {
				videos = append(videos, v.URL)
			}
			return videos
		}(),
		"tableData": formatTableData(post.TableData),
		"author": map[string]string{
			"name":     post.Author.Username,
			"imageUrl": post.Author.Avatar,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(formattedPost)
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
		Title       string                `json:"title"`
		Description string                `json:"description"`
		Tags        []string              `json:"tags"`
		Tables      []models.TableContent `json:"tableDate"`
		Images      []models.ImageContent `json:"imageUrl"`
		Maps        []models.MapContent   `json:"mapUrl"`
		Videos      []models.VideoContent `json:"videoUrl"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid input")
		return
	}

	post.Title = input.Title
	post.Description = input.Description

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

// LikePost - Add a like to a post
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

	// Проверка на дублирующий лайк
	var existingLike models.Like
	if err := database.DB.Where("user_id = ? AND post_id = ?", userID, postID).First(&existingLike).Error; err == nil {
		http.Error(w, "User has already liked this post", http.StatusConflict)
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

// GetPostLikes - Retrieve the number of likes for a post
func GetPostLikes(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid Post ID format", http.StatusBadRequest)
		return
	}

	var likeCount int64
	if err := database.DB.Model(&models.Like{}).Where("post_id = ?", postID).Count(&likeCount).Error; err != nil {
		http.Error(w, "Failed to fetch like count", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int64{"likes": likeCount})
}

// SearchPosts - Поиск постов
func SearchPosts(w http.ResponseWriter, r *http.Request) {
	// Получение параметров из строки запроса
	search := r.URL.Query().Get("search") // Для текстового поиска
	tag := r.URL.Query().Get("tag")       // Для фильтрации по тегу

	var posts []models.Post

	// Создаем базовый запрос с предзагрузкой зависимостей
	query := database.DB.Preload("Tags").
		Preload("Author").
		Preload("TableData").
		Preload("Images").
		Preload("Maps").
		Preload("Videos")

	// Фильтрация по ключевому слову (title или description)
	if search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Фильтрация по тегу
	if tag != "" {
		query = query.Joins("JOIN post_tags ON posts.id = post_tags.post_id").
			Joins("JOIN tags ON post_tags.tag_id = tags.id").
			Where("tags.name = ?", tag)
	}

	// Выполняем запрос
	if err := query.Find(&posts).Error; err != nil {
		http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}
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
