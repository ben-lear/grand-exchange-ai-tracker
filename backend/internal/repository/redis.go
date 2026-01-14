package repository

import (
	"context"
	"fmt"

	"github.com/guavi/grand-exchange-ai-tracker/internal/config"
	"github.com/guavi/grand-exchange-ai-tracker/pkg/logger"
	"github.com/redis/go-redis/v9"
)

// InitRedis initializes the Redis connection
func InitRedis(cfg *config.RedisConfig) (*redis.Client, error) {
	logger.Info("connecting to redis", "host", cfg.Host, "port", cfg.Port)

	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       0,
	})

	// Test connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	logger.Info("redis connection established successfully")
	return client, nil
}

// CloseRedis closes the Redis connection
func CloseRedis(client *redis.Client) error {
	if client == nil {
		return nil
	}
	return client.Close()
}
