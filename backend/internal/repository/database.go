package repository

import (
	"fmt"

	"github.com/guavi/grand-exchange-ai-tracker/internal/config"
	"github.com/guavi/grand-exchange-ai-tracker/internal/models"
	"github.com/guavi/grand-exchange-ai-tracker/pkg/logger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDatabase initializes the database connection and runs migrations
func InitDatabase(cfg *config.DatabaseConfig) error {
	dsn := cfg.DSN()

	logger.Info("connecting to database", "host", cfg.Host, "port", cfg.Port, "database", cfg.Name)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying SQL DB for connection pool configuration
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(25)

	// Test connection
	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("database connection established successfully")

	// Run auto-migrations
	logger.Info("running database migrations")
	// Migrate Item first (no foreign keys)
	if err := db.AutoMigrate(&models.Item{}); err != nil {
		return fmt.Errorf("failed to migrate items table: %w", err)
	}

	// Then migrate tables with foreign keys
	if err := db.AutoMigrate(
		&models.PriceHistory{},
		&models.PriceTrend{},
	); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	logger.Info("database migrations completed successfully")

	DB = db
	return nil
}

// CloseDatabase closes the database connection
func CloseDatabase() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}
