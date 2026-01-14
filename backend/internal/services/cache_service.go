package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// cacheService implements CacheService
type cacheService struct {
	client *redis.Client
	logger *zap.SugaredLogger
}

// NewCacheService creates a new cache service
func NewCacheService(client *redis.Client, logger *zap.SugaredLogger) CacheService {
	return &cacheService{
		client: client,
		logger: logger,
	}
}

// Get retrieves a value from cache
func (s *cacheService) Get(ctx context.Context, key string) (string, error) {
	val, err := s.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("key not found: %s", key)
	}
	if err != nil {
		s.logger.Errorw("Failed to get from cache", "key", key, "error", err)
		return "", err
	}
	return val, nil
}

// Set stores a value in cache with expiration
func (s *cacheService) Set(ctx context.Context, key string, value string, expiration time.Duration) error {
	if err := s.client.Set(ctx, key, value, expiration).Err(); err != nil {
		s.logger.Errorw("Failed to set cache", "key", key, "error", err)
		return err
	}
	return nil
}

// Delete removes a value from cache
func (s *cacheService) Delete(ctx context.Context, key string) error {
	if err := s.client.Del(ctx, key).Err(); err != nil {
		s.logger.Errorw("Failed to delete from cache", "key", key, "error", err)
		return err
	}
	return nil
}

// DeletePattern removes all keys matching a pattern
func (s *cacheService) DeletePattern(ctx context.Context, pattern string) error {
	var cursor uint64
	var keys []string

	// Scan for matching keys
	for {
		var scanKeys []string
		var err error
		scanKeys, cursor, err = s.client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			s.logger.Errorw("Failed to scan cache keys", "pattern", pattern, "error", err)
			return err
		}

		keys = append(keys, scanKeys...)

		if cursor == 0 {
			break
		}
	}

	// Delete all matching keys
	if len(keys) > 0 {
		if err := s.client.Del(ctx, keys...).Err(); err != nil {
			s.logger.Errorw("Failed to delete cache keys", "pattern", pattern, "count", len(keys), "error", err)
			return err
		}
		s.logger.Debugw("Deleted cache keys", "pattern", pattern, "count", len(keys))
	}

	return nil
}

// GetJSON retrieves and unmarshals a JSON value from cache
func (s *cacheService) GetJSON(ctx context.Context, key string, dest interface{}) error {
	val, err := s.Get(ctx, key)
	if err != nil {
		return err
	}

	if err := json.Unmarshal([]byte(val), dest); err != nil {
		s.logger.Errorw("Failed to unmarshal JSON from cache", "key", key, "error", err)
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	return nil
}

// SetJSON marshals and stores a JSON value in cache
func (s *cacheService) SetJSON(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		s.logger.Errorw("Failed to marshal JSON for cache", "key", key, "error", err)
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	return s.Set(ctx, key, string(data), expiration)
}

// Exists checks if a key exists in cache
func (s *cacheService) Exists(ctx context.Context, key string) (bool, error) {
	count, err := s.client.Exists(ctx, key).Result()
	if err != nil {
		s.logger.Errorw("Failed to check cache existence", "key", key, "error", err)
		return false, err
	}
	return count > 0, nil
}
