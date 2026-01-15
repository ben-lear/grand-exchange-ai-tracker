package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	// Server
	Port        string
	Environment string
	CorsOrigins string

	// Database
	PostgresHost     string
	PostgresPort     string
	PostgresUser     string
	PostgresPassword string
	PostgresDB       string
	PostgresSSLMode  string

	// Redis
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	// OSRS Wiki Real-time Prices API
	WikiPricesBaseURL string

	// SSE (Server-Sent Events)
	SSE SSEConfig
}

// SSEConfig contains SSE-specific configuration
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

	// Set defaults
	setDefaults()

	// Read config file (optional)
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
		// Config file not found; using defaults and env vars
	}

	config := &Config{
		Port:        viper.GetString("PORT"),
		Environment: viper.GetString("ENVIRONMENT"),
		CorsOrigins: viper.GetString("CORS_ORIGINS"),

		PostgresHost:     viper.GetString("POSTGRES_HOST"),
		PostgresPort:     viper.GetString("POSTGRES_PORT"),
		PostgresUser:     viper.GetString("POSTGRES_USER"),
		PostgresPassword: viper.GetString("POSTGRES_PASSWORD"),
		PostgresDB:       viper.GetString("POSTGRES_DB"),
		PostgresSSLMode:  viper.GetString("POSTGRES_SSL_MODE"),

		RedisHost:     viper.GetString("REDIS_HOST"),
		RedisPort:     viper.GetString("REDIS_PORT"),
		RedisPassword: viper.GetString("REDIS_PASSWORD"),
		RedisDB:       viper.GetInt("REDIS_DB"),

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

	// Database defaults
	viper.SetDefault("POSTGRES_HOST", "localhost")
	viper.SetDefault("POSTGRES_PORT", "5432")
	viper.SetDefault("POSTGRES_USER", "osrs_tracker")
	viper.SetDefault("POSTGRES_PASSWORD", "password")
	viper.SetDefault("POSTGRES_DB", "osrs_ge_tracker")
	viper.SetDefault("POSTGRES_SSL_MODE", "disable")

	// Redis defaults
	viper.SetDefault("REDIS_HOST", "localhost")
	viper.SetDefault("REDIS_PORT", "6379")
	viper.SetDefault("REDIS_PASSWORD", "")
	viper.SetDefault("REDIS_DB", 0)

	// OSRS Wiki prices API defaults
	viper.SetDefault("WIKI_PRICES_BASE_URL", "https://prices.runescape.wiki/api/v1/osrs")

	// SSE defaults
	viper.SetDefault("SSE_ENABLED", true)
	viper.SetDefault("SSE_CONNECTION_TIMEOUT", 30*time.Minute)
	viper.SetDefault("SSE_HEARTBEAT_INTERVAL", 30*time.Second)
	viper.SetDefault("SSE_MAX_CLIENTS", 100)
}
