package database

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"

	"github.com/guavi/osrs-ge-tracker/internal/config"
)

// NewRedisClient creates a new Redis client using the provided cache configuration.
// The function accepts a RedisConfig struct directly (instead of the full Config) to reduce chaining
// and make the dependency explicit. This follows the naming convention where parameter names are
// descriptive (cacheConfig) and match the purpose of the configuration being passed.
//
// The client is configured with:
// - Host and port from the config
// - Optional password authentication
// - Configurable database number (0-15)
//
// The function tests the connection with a PING command before returning.
// Returns an error if the connection fails or if PING returns an error.
func NewRedisClient(cacheConfig config.RedisConfig) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cacheConfig.Host, cacheConfig.Port),
		Password: cacheConfig.Password,
		DB:       cacheConfig.DB,
	})

	// Test connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return client, nil
}
