package config

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

// PostgresConfig holds PostgreSQL database configuration.
// Implementation-specific struct name, used as purpose-generic field "Database" in main Config.
type PostgresConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DB       string
	SSLMode  string
}

// RedisConfig holds Redis cache configuration.
// Implementation-specific struct name, used as purpose-generic field "Cache" in main Config.
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// Config holds all application configuration.
//
// Naming Convention:
//   - Nested config structs use implementation-specific names (PostgresConfig, RedisConfig)
//   - Config fields use purpose-generic names (Database, Cache)
//   - This pattern allows flexibility: implementation can change without affecting field names
//   - Environment variables map to nested paths: POSTGRES_HOST → cfg.Database.Host via Viper
type Config struct {
	Database          PostgresConfig
	Port              string
	Environment       string
	CorsOrigins       string
	WikiPricesBaseURL string
	Cache             RedisConfig
	SSE               SSEConfig
}

// SSEConfig contains SSE-specific configuration.
type SSEConfig struct {
	Enabled           bool
	ConnectionTimeout time.Duration
	HeartbeatInterval time.Duration
	MaxClients        int
}

func LoadConfig() (*Config, error) {
	// Set config file name and paths
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./backend")
	viper.AddConfigPath("../../")

	// Allow reading from environment variables
	viper.AutomaticEnv()
	// Map environment variables like POSTGRES_HOST to nested config paths like "database.host"
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// Set defaults
	setDefaults()

	// Read config file (optional)
	if err := viper.ReadInConfig(); err != nil {
		var configNotFoundErr viper.ConfigFileNotFoundError
		if !errors.As(err, &configNotFoundErr) {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
		// Config file not found; using defaults and env vars
	}

	config := &Config{
		Port:        viper.GetString("PORT"),
		Environment: viper.GetString("ENVIRONMENT"),
		CorsOrigins: viper.GetString("CORS_ORIGINS"),

		Database: PostgresConfig{
			Host:     viper.GetString("database.host"),
			Port:     viper.GetString("database.port"),
			User:     viper.GetString("database.user"),
			Password: viper.GetString("database.password"),
			DB:       viper.GetString("database.db"),
			SSLMode:  viper.GetString("database.sslmode"),
		},

		Cache: RedisConfig{
			Host:     viper.GetString("cache.host"),
			Port:     viper.GetString("cache.port"),
			Password: viper.GetString("cache.password"),
			DB:       viper.GetInt("cache.db"),
		},

		WikiPricesBaseURL: viper.GetString("WIKI_PRICES_BASE_URL"),

		SSE: SSEConfig{
			Enabled:           viper.GetBool("SSE_ENABLED"),
			ConnectionTimeout: viper.GetDuration("SSE_CONNECTION_TIMEOUT"),
			HeartbeatInterval: viper.GetDuration("SSE_HEARTBEAT_INTERVAL"),
			MaxClients:        viper.GetInt("SSE_MAX_CLIENTS"),
		},
	}

	return config, nil
}

func setDefaults() {
	// Server defaults
	viper.SetDefault("PORT", "8080")
	viper.SetDefault("ENVIRONMENT", "development")
	viper.SetDefault("CORS_ORIGINS", "*")

	// Database defaults (maps to PostgresConfig via "database.*")
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", "5432")
	viper.SetDefault("database.user", "osrs_tracker")
	viper.SetDefault("database.password", "password")
	viper.SetDefault("database.db", "osrs_ge_tracker")
	viper.SetDefault("database.sslmode", "disable")

	// Cache defaults (maps to RedisConfig via "cache.*")
	viper.SetDefault("cache.host", "localhost")
	viper.SetDefault("cache.port", "6379")
	viper.SetDefault("cache.password", "")
	viper.SetDefault("cache.db", 0)

	// OSRS Wiki prices API defaults
	viper.SetDefault("WIKI_PRICES_BASE_URL", "https://prices.runescape.wiki/api/v1/osrs")

	// SSE defaults
	viper.SetDefault("SSE_ENABLED", true)
	viper.SetDefault("SSE_CONNECTION_TIMEOUT", 30*time.Minute)
	viper.SetDefault("SSE_HEARTBEAT_INTERVAL", 30*time.Second)
	viper.SetDefault("SSE_MAX_CLIENTS", 100)
}
