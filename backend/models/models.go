package models

import "time"

// User represents a user in the system
type User struct {
	ID                uint      `gorm:"primaryKey"`
	FirstName         string    `json:"first_name,omitempty"`
	LastName          string    `json:"last_name,omitempty"`
	Bio               string    `json:"bio,omitempty"`
	Website           string    `json:"website,omitempty"`
	Username          string    `json:"username,omitempty" gorm:"unique;not null"`
	Avatar            string    `json:"avatar,omitempty"`
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
	Title       string         `json:"title"` // Убрали not null
	Slug        string         `gorm:"unique"`
	Description string         `json:"description"` // Убрали not null
	AuthorID    uint           `json:"author_id"`
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
	Posts     uint      `gorm:"many2many:post_tags;"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Comment struct {
	ID        uint      `json:"id"`
	Content   string    `json:"content"`
	PostID    uint      `json:"post_id"`
	AuthorID  uint      `json:"author_id"`
	ParentID  *uint     `json:"parent_id"`
	Likes     int       `json:"likes"`
	Edited    bool      `json:"edited"`
	Deleted   bool      `json:"deleted"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Author    User      `json:"author" gorm:"foreignKey:AuthorID"`
	Replies   []Reply   `json:"replies" gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE;"`
}

type Reply struct {
	ID        uint      `gorm:"primaryKey"`
	Content   string    `gorm:"not null"`
	PostID    uint      `gorm:"index;constraint:OnDelete:CASCADE;"`
	AuthorID  uint      `gorm:"not null;index"`
	ParentID  uint      `gorm:"not null;index;constraint:OnDelete:CASCADE;"` // Включаем каскадное удаление
	Likes     int       `gorm:"default:0"`
	Edited    bool      `gorm:"default:false"`
	Deleted   bool      `gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Author    User      `json:"author" gorm:"foreignKey:AuthorID"`
}

// Like represents a like for a post or comment
type Like struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	PostID    *uint     `gorm:"index;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"post_id,omitempty"`
	CommentID *uint     `gorm:"index;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"comment_id,omitempty"`
	ReplyID   *uint     `gorm:"index;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"reply_id,omitempty"`
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
	Post      Post `gorm:"foreignKey:PostID"`
	CreatedAt time.Time
}

type SaveStatus struct {
	ID       uint `gorm:"primaryKey"`
	UserID   uint
	StatusID uint
}

// TextContent represents a block of text content
type TextContent struct {
	ID        uint      `gorm:"primaryKey"`
	Content   string    `json:"content"` // Убрали not null
	PostID    uint      `gorm:"index"`   // Убрали not null
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ImageContent represents an image block
type ImageContent struct {
	ID        uint      `gorm:"primaryKey"`
	URL       string    `json:"url"` // Убрали not null
	AltText   string    `json:"alt_text"`
	PostID    uint      `gorm:"index"` // Убрали not null
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// MapContent represents a map block
type MapContent struct {
	ID        uint      `gorm:"primaryKey"`
	Latitude  float64   `json:"latitude"`  // Убрали not null
	Longitude float64   `json:"longitude"` // Убрали not null
	PostID    uint      `gorm:"index"`     // Убрали not null
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// VideoContent represents a video block
type VideoContent struct {
	ID        uint      `gorm:"primaryKey"`
	URL       string    `json:"url"` // Убрали not null
	Caption   string    `json:"caption"`
	PostID    uint      `gorm:"index"` // Убрали not null
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type TableContent struct {
	ID        uint      `gorm:"primaryKey"`
	Data      string    `gorm:"type:jsonb" json:"data"`
	PostID    uint      `gorm:"index;constraint:OnDelete:CASCADE,OnUpdate:CASCADE" json:"post_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
