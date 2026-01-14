package config

import (
	"fmt"

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

	// OSRS API
	OSRSBulkDumpURL string
	OSRSHistoryURL  string
	OSRSDetailURL   string
	OSRSUserAgent   string

	// Scheduler
	PricePollInterval     string // Default: "*/1 * * * *" (every 1 minute)
	HistoricalSyncCron    string // Default: "0 * * * *" (every hour)
	FullHistoricalCron    string // Default: "0 0 * * *" (daily)
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

		OSRSBulkDumpURL: viper.GetString("OSRS_BULK_DUMP_URL"),
		OSRSHistoryURL:  viper.GetString("OSRS_HISTORY_URL"),
		OSRSDetailURL:   viper.GetString("OSRS_DETAIL_URL"),
		OSRSUserAgent:   viper.GetString("OSRS_USER_AGENT"),

		PricePollInterval:  viper.GetString("PRICE_POLL_INTERVAL"),
		HistoricalSyncCron: viper.GetString("HISTORICAL_SYNC_CRON"),
		FullHistoricalCron: viper.GetString("FULL_HISTORICAL_CRON"),
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

	// OSRS API defaults
	viper.SetDefault("OSRS_BULK_DUMP_URL", "https://chisel.weirdgloop.org/gazproj/gazbot/os_dump.json")
	viper.SetDefault("OSRS_HISTORY_URL", "https://api.weirdgloop.org/exchange/history/osrs")
	viper.SetDefault("OSRS_DETAIL_URL", "https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json")
	viper.SetDefault("OSRS_USER_AGENT", "OSRS-GE-Tracker/1.0")

	// Scheduler defaults
	viper.SetDefault("PRICE_POLL_INTERVAL", "*/1 * * * *")     // Every 1 minute
	viper.SetDefault("HISTORICAL_SYNC_CRON", "0 * * * *")      // Every hour
	viper.SetDefault("FULL_HISTORICAL_CRON", "0 0 * * *")      // Daily at midnight
}
