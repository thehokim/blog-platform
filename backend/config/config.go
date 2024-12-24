package config

import (
	"encoding/json"
	"fmt"
	"os"
)

// Config represents the structure of your JSON configuration file
type Config struct {
	Databases struct {
		Default struct {
			Host     string `json:"host"`
			Port     string `json:"port"`
			Username string `json:"username"`
			Password string `json:"password"`
			Database string `json:"database"`
			Driver   string `json:"driver"`
			Sslmode  string `json:"sslmode"`
		} `json:"default"`
	} `json:"databases"`
	UrlPrefix string `json:"url_prefix"`
	Theme     string `json:"theme"`
	Language  string `json:"language"`
	Store     struct {
		Path    string `json:"path"`
		Prefix  string `json:"prefix"`
		MaxSize int    `json:"max_size"`
	} `json:"store"`
	Logger struct {
		Path   string `json:"path"`
		Level  string `json:"level"`
		Format string `json:"format"`
	} `json:"logger"`
}

// LoadConfig loads the configuration from a JSON file
func LoadConfig(filePath string) (*Config, error) {
	// Open the file
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("unable to open config file: %v", err)
	}
	defer file.Close()

	// Decode the JSON file into the Config struct
	var config Config
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&config); err != nil {
		return nil, fmt.Errorf("unable to decode config file: %v", err)
	}

	return &config, nil
}
