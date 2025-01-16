package handlers

import (
	"blog-platform/database"
	"blog-platform/models"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

// GenerateSlug - Генерация уникального slug для поста
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

// RespondWithError - Удобная обработка ошибок
func respondWithError(w http.ResponseWriter, statusCode int, message string) {
	log.Printf("Error: %s (status: %d)", message, statusCode)
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func CreatePostWithContent(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Парсим form-data
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		respondWithError(w, http.StatusBadRequest, "Failed to parse form-data")
		return
	}

	title := r.FormValue("title")
	description := r.FormValue("description")
	tags := r.Form["tags"]

	// Создаем директорию для изображений
	if _, err := os.Stat("uploads/images"); os.IsNotExist(err) {
		if err := os.MkdirAll("uploads/images", os.ModePerm); err != nil {
			respondWithError(w, http.StatusInternalServerError, "Failed to create directory for images")
			return
		}
	}

	// Сохраняем изображения
	var images []models.ImageContent
	if imageFiles, ok := r.MultipartForm.File["images"]; ok {
		for _, fileHeader := range imageFiles {
			file, err := fileHeader.Open()
			if err != nil {
				log.Println("Failed to open image file:", err)
				continue
			}
			defer file.Close()

			filePath := fmt.Sprintf("/uploads/images/%d_%s", time.Now().Unix(), fileHeader.Filename)
			out, err := os.Create(filePath)
			if err != nil {
				log.Println("Failed to create image file:", err)
				continue
			}
			defer out.Close()

			if _, err = io.Copy(out, file); err != nil {
				log.Println("Failed to save image file:", err)
				continue
			}

			images = append(images, models.ImageContent{
				URL:     filePath,
				AltText: fileHeader.Filename,
			})
		}
	}

	// Парсим JSON для maps
	var maps []models.MapContent
	if mapData := r.FormValue("maps"); mapData != "" {
		if err := json.Unmarshal([]byte(mapData), &maps); err != nil {
			log.Println("Failed to parse maps:", err)
		}
	}

	// Парсим JSON для videos
	var videos []models.VideoContent
	if videoData := r.FormValue("videos"); videoData != "" {
		if err := json.Unmarshal([]byte(videoData), &videos); err != nil {
			log.Println("Failed to parse videos:", err)
		}
	}

	// Извлечение таблиц
	var tables []models.TableContent
	tableData := r.FormValue("tables")
	if tableData != "" && tableData != "null" { // Проверка на "null"
		if err := json.Unmarshal([]byte(tableData), &tables); err != nil {
			log.Println("Failed to parse tables:", err)
		} else {
			log.Println("Parsed tables:", tables)
		}
	}

	// Устанавливаем пустой JSON по умолчанию для таблиц с отсутствующими данными
	for i, table := range tables {
		if table.Data == "" {
			tables[i].Data = "{}" // Устанавливаем пустой JSON по умолчанию
		}
	}

	// Проверяем пользователя
	userIDUint, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var user models.User
	if err := database.DB.First(&user, uint(userIDUint)).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	// Создаем пост
	post := models.Post{
		Title:       title,
		Description: description,
		Slug:        generateSlug(title),
		AuthorID:    uint(userIDUint),
	}

	if err := database.DB.Create(&post).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create post")
		return
	}

	// Сохраняем данные
	saveContent(&post, images, maps, videos, tables)
	if err := saveTags(&post, tags); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to save tags")
		return
	}

	// Возвращаем ответ
	response := map[string]interface{}{
		"id":          post.ID,
		"title":       post.Title,
		"description": post.Description,
		"tags":        tags,
		"images":      images,
		"maps":        maps,
		"videos":      videos,
		"tables":      tables,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func saveContent(post *models.Post, images []models.ImageContent, maps []models.MapContent, videos []models.VideoContent, tables []models.TableContent) {
	for _, image := range images {
		image.PostID = post.ID
		if err := database.DB.Create(&image).Error; err != nil {
			log.Println("Failed to save image:", err)
			continue
		}
	}
	for _, mapContent := range maps {
		mapContent.PostID = post.ID
		if err := database.DB.Create(&mapContent).Error; err != nil {
			log.Println("Failed to save map:", err)
			continue
		}
	}
	for _, video := range videos {
		video.PostID = post.ID
		if err := database.DB.Create(&video).Error; err != nil {
			log.Println("Failed to save video:", err)
			continue
		}
	}
	for _, table := range tables {
		table.PostID = post.ID
		if err := database.DB.Create(&table).Error; err != nil {
			log.Println("Failed to save table:", err)
		} else {
			log.Println("Table saved successfully:", table)
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
			log.Printf("Failed to parse table content for table ID %d: %v", table.ID, err)
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
		Tables      []models.TableContent `json:"tableData"`
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

func GetPostLikes(w http.ResponseWriter, r *http.Request) {
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

	var likeCount int64
	// Считаем количество лайков для поста
	if err := database.DB.Model(&models.Like{}).Where("post_id = ?", postID).Count(&likeCount).Error; err != nil {
		http.Error(w, "Failed to fetch like count", http.StatusInternalServerError)
		return
	}

	var isLiked bool
	// Проверяем, лайкнул ли пользователь этот пост
	if err := database.DB.Model(&models.Like{}).Where("post_id = ? AND user_id = ?", postID, userID).First(&models.Like{}).Error; err == nil {
		isLiked = true
	} else {
		isLiked = false
	}

	// Возвращаем количество лайков и статус лайка
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"likes":   likeCount,
		"isLiked": isLiked,
	})
}

// UnlikePost - Remove a like from a post
func UnlikePost(w http.ResponseWriter, r *http.Request) {
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

	// Удаляем лайк из базы данных
	if err := database.DB.Where("user_id = ? AND post_id = ?", userID, postID).Delete(&models.Like{}).Error; err != nil {
		http.Error(w, "Failed to unlike post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Post unliked successfully"})
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

func GetSavedPosts(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	var savedPosts []models.SavedPost
	// Загружаем сохранённые посты вместе с их автором и другими связанными данными
	if err := database.DB.Where("user_id = ?", userID).
		Preload("Post.Author").    // Загрузка данных автора
		Preload("Post.Tags").      // Загрузка тегов поста
		Preload("Post.Images").    // Загрузка изображений поста
		Preload("Post.Videos").    // Загрузка видео поста
		Preload("Post.Maps").      // Загрузка карт поста
		Preload("Post.TableData"). // Загрузка таблиц поста
		Find(&savedPosts).Error; err != nil {
		http.Error(w, "Failed to retrieve saved posts", http.StatusInternalServerError)
		return
	}

	// Форматирование ответа
	response := []map[string]interface{}{}
	for _, savedPost := range savedPosts {
		post := savedPost.Post
		formattedPost := map[string]interface{}{
			"post_id":     post.ID,
			"title":       post.Title,
			"description": post.Description,
			"date":        post.Date.Format("2006-01-02 15:04:05"),
			"tags":        extractTagNames(post.Tags),
			"imageUrl": func() []string {
				var images []string
				for _, img := range post.Images {
					images = append(images, img.URL)
				}
				return images
			}(),
			"videoUrl": func() []string {
				var videos []string
				for _, v := range post.Videos {
					videos = append(videos, v.URL)
				}
				return videos
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
			"tableData": formatTableData(post.TableData),
			"author": map[string]interface{}{
				"name":     post.Author.Username,
				"imageUrl": post.Author.Avatar,
			},
		}
		response = append(response, formattedPost)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
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

func SaveStatus(w http.ResponseWriter, r *http.Request) {
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

	var savedPost models.SavedPost
	if err := database.DB.Where("user_id = ? AND post_id = ?", userID, postID).First(&savedPost).Error; err == nil {
		// Если пост сохранён
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"post_id": postID,
			"isSaved": true,
		})
		return
	}

	// Если пост не сохранён
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"post_id": postID,
		"isSaved": false,
	})
}

func jsonResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func GetSaveStatus(w http.ResponseWriter, r *http.Request) {
	// Parse Post ID
	postID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Invalid Post ID"})
		return
	}

	// Parse User ID from query parameters
	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "User ID is required"})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Invalid User ID"})
		return
	}

	// Check if the post is saved
	var savedPost models.SavedPost
	err = database.DB.Where("user_id = ? AND post_id = ?", userID, postID).First(&savedPost).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "Internal Server Error"})
		return
	}

	// Respond with saved status
	isSaved := err == nil
	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"post_id": postID,
		"isSaved": isSaved,
	})
}
