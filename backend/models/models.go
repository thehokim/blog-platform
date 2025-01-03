package models

import "time"

// User represents a user in the system
type User struct {
	ID                uint      `gorm:"primaryKey"`
	FirstName         string    `json:"first_name,omitempty"`
	LastName          string    `json:"last_name,omitempty"`
	Bio               string    `json:"bio,omitempty"`
	Website           string    `json:"website,omitempty"`
	Username          string    `json:"username,omitempty" gorm:"unique;default:null"` // Позволяем NULL для уникального значения
	Avatar            string    `json:"avatar,omitempty"`
	Email             string    `json:"email" gorm:"unique;not null"`
	Password          string    `json:"-" gorm:"not null"`
	IsActive          bool      `json:"is_active"`
	VerificationToken string    `gorm:"default:null" json:"verification_token,omitempty"`
	ResetToken        string    `gorm:"default:null" json:"reset_token,omitempty"`
	ResetTokenExpires time.Time `gorm:"default:null"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

// Post represents a blog post
type Post struct {
	ID          uint           `gorm:"primaryKey"`
	Title       string         `gorm:"not null"`
	Slug        string         `gorm:"unique"`
	Description string         `gorm:"not null"`
	AuthorID    uint           `gorm:"index"`
	Author      User           `gorm:"foreignKey:AuthorID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Tags        []Tag          `gorm:"many2many:post_tags;"`
	Images      []ImageContent `gorm:"foreignKey:PostID"`
	Maps        []MapContent   `gorm:"foreignKey:PostID"`
	Videos      []VideoContent `gorm:"foreignKey:PostID"`
	TableData   []TableContent `gorm:"foreignKey:PostID"`
	Date        time.Time      `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// Tag represents a tag associated with posts
type Tag struct {
	ID        uint      `gorm:"primaryKey"`
	Name      string    `gorm:"unique;not null"`
	Posts     []Post    `gorm:"many2many:post_tags;"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Comment represents a comment on a post
type Comment struct {
	ID        uint      `gorm:"primaryKey"`
	Content   string    `gorm:"not null"`
	PostID    uint      `gorm:"not null;index"`
	AuthorID  uint      `gorm:"not null;index"`
	Likes     int       `gorm:"default:0"`
	Edited    bool      `gorm:"default:false"`
	Deleted   bool      `gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Like represents a like for a post or comment
type Like struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	PostID    *uint     `gorm:"index;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"post_id,omitempty"`
	CommentID *uint     `gorm:"index;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"comment_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type Notification struct {
	ID             uint       `gorm:"primaryKey"`
	UserID         uint       `gorm:"not null"`
	Type           string     `gorm:"not null"` // Например, "like", "comment", "reaction_to_notification"
	PostID         *uint      `json:"post_id,omitempty"`
	CommentID      *uint      `json:"comment_id,omitempty"`
	NotificationID *uint      `json:"notification_id,omitempty"` // ID родительского уведомления
	Message        string     `gorm:"not null"`
	IsRead         bool       `gorm:"default:false"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	Reactions      []Reaction `gorm:"foreignKey:NotificationID"` // Связь с реакциями
}

type Reaction struct {
	ID             uint      `gorm:"primaryKey"`
	UserID         uint      `gorm:"not null;index"`
	NotificationID *uint     `gorm:"index;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"` // ID уведомления
	Type           string    `gorm:"not null"`                                            // Тип реакции ("like", "dislike", "emoji")
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type SavedPost struct {
	ID        uint `gorm:"primaryKey"`
	UserID    uint `gorm:"not null;index"`
	PostID    uint `gorm:"not null;index"`
	CreatedAt time.Time
}

// TextContent represents a block of text content
type TextContent struct {
	ID        uint      `gorm:"primaryKey"`
	Content   string    `gorm:"not null"`
	PostID    uint      `gorm:"not null;index"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ImageContent represents an image block
type ImageContent struct {
	ID        uint      `gorm:"primaryKey"`
	URL       string    `gorm:"not null"`
	AltText   string    `json:"alt_text"`
	PostID    uint      `gorm:"not null;index"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// MapContent represents a map block
type MapContent struct {
	ID        uint      `gorm:"primaryKey"`
	Latitude  float64   `gorm:"not null"`
	Longitude float64   `gorm:"not null"`
	PostID    uint      `gorm:"not null;index"`
	Url       string    `gorm:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// VideoContent represents a video block
type VideoContent struct {
	ID        uint      `gorm:"primaryKey"`
	URL       string    `gorm:"not null"`
	Caption   string    `json:"caption"`
	PostID    uint      `gorm:"not null;index"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableContent represents a table block
type TableContent struct {
	ID        uint      `gorm:"primaryKey"`
	Data      string    `gorm:"type:jsonb;not null"` // JSON строка для хранения таблицы
	PostID    uint      `gorm:"not null;index"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TagContent represents tags associated with a post
type TagContent struct {
	ID        uint      `gorm:"primaryKey"`
	Name      string    `gorm:"unique;not null"`
	PostID    uint      `gorm:"not null;index"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
