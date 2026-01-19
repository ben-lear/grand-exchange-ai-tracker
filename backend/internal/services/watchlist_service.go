package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/utils"
	"go.uber.org/zap"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// WatchlistService handles business logic for watchlist sharing
type WatchlistService interface {
	CreateShare(ctx context.Context, watchlistData interface{}) (*models.WatchlistShareResponse, error)
	GetShare(ctx context.Context, token string) (*models.WatchlistShareDetailResponse, error)
	CleanupExpiredShares(ctx context.Context) (int64, error)
}

type watchlistService struct {
	db     *gorm.DB
	logger *zap.SugaredLogger
}

// NewWatchlistService creates a new watchlist service
func NewWatchlistService(db *gorm.DB, logger *zap.SugaredLogger) WatchlistService {
	return &watchlistService{
		db:     db,
		logger: logger,
	}
}

// CreateShare creates a new watchlist share with a memorable token
func (s *watchlistService) CreateShare(
	ctx context.Context,
	watchlistData interface{},
) (*models.WatchlistShareResponse, error) {
	// Convert watchlist data to JSON
	jsonData, err := json.Marshal(watchlistData)
	if err != nil {
		s.logger.Errorw("Failed to marshal watchlist data", "error", err)
		return nil, fmt.Errorf("invalid watchlist data: %w", err)
	}

	// Generate unique token with collision retry
	maxRetries := 5
	var token string
	var share models.WatchlistShare

	for i := 0; i < maxRetries; i++ {
		token, err = utils.GenerateShareToken()
		if err != nil {
			s.logger.Errorw("Failed to generate share token", "error", err, "attempt", i+1)
			continue
		}

		// Check if token already exists
		result := s.db.WithContext(ctx).Where("token = ?", token).First(&share)
		if result.Error == gorm.ErrRecordNotFound {
			// Token is unique, break the loop
			break
		}

		if result.Error != nil {
			s.logger.Errorw("Database error checking token uniqueness", "error", result.Error, "token", token)
			return nil, fmt.Errorf("database error: %w", result.Error)
		}

		// Token collision, retry
		s.logger.Debugw("Token collision, retrying", "token", token, "attempt", i+1)
	}

	if token == "" {
		return nil, fmt.Errorf("failed to generate unique token after %d attempts", maxRetries)
	}

	// Create share record
	expiresAt := time.Now().Add(7 * 24 * time.Hour) // 7 days
	share = models.WatchlistShare{
		Token:         token,
		WatchlistData: datatypes.JSON(jsonData),
		ExpiresAt:     expiresAt,
		AccessCount:   0,
	}

	if err := s.db.WithContext(ctx).Create(&share).Error; err != nil {
		s.logger.Errorw("Failed to create share", "error", err, "token", token)
		return nil, fmt.Errorf("failed to create share: %w", err)
	}

	s.logger.Infow("Created watchlist share", "token", token, "expires_at", expiresAt)

	response := &models.WatchlistShareResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		ShareURL:  fmt.Sprintf("/watchlist/share/%s", token),
	}

	return response, nil
}

// GetShare retrieves a watchlist share by token and increments access count
func (s *watchlistService) GetShare(ctx context.Context, token string) (*models.WatchlistShareDetailResponse, error) {
	// Validate token format
	if !utils.ValidateShareToken(token) {
		return nil, fmt.Errorf("invalid token format")
	}

	var share models.WatchlistShare
	if err := s.db.WithContext(ctx).Where("token = ?", token).First(&share).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			s.logger.Debugw("Share not found", "token", token)
			return nil, fmt.Errorf("share not found")
		}
		s.logger.Errorw("Database error retrieving share", "error", err, "token", token)
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if expired
	if share.IsExpired() {
		s.logger.Debugw("Share has expired", "token", token, "expires_at", share.ExpiresAt)
		return nil, fmt.Errorf("share has expired")
	}

	// Parse watchlist data
	var watchlistData interface{}
	if err := json.Unmarshal(share.WatchlistData, &watchlistData); err != nil {
		s.logger.Errorw("Failed to unmarshal watchlist data", "error", err, "token", token)
		return nil, fmt.Errorf("invalid watchlist data: %w", err)
	}

	// Increment access count
	share.IncrementAccessCount()
	if err := s.db.WithContext(ctx).Model(&share).Update("access_count", share.AccessCount).Error; err != nil {
		// Log but don't fail the request
		s.logger.Warnw("Failed to increment access count", "error", err, "token", token)
	}

	s.logger.Infow("Retrieved watchlist share", "token", token, "access_count", share.AccessCount)

	response := &models.WatchlistShareDetailResponse{
		WatchlistData: watchlistData,
		CreatedAt:     share.CreatedAt,
		ExpiresAt:     share.ExpiresAt,
		AccessCount:   share.AccessCount,
	}

	return response, nil
}

// CleanupExpiredShares deletes all expired shares
func (s *watchlistService) CleanupExpiredShares(ctx context.Context) (int64, error) {
	result := s.db.WithContext(ctx).
		Where("expires_at < ?", time.Now()).
		Delete(&models.WatchlistShare{})

	if result.Error != nil {
		s.logger.Errorw("Failed to cleanup expired shares", "error", result.Error)
		return 0, fmt.Errorf("cleanup failed: %w", result.Error)
	}

	if result.RowsAffected > 0 {
		s.logger.Infow("Cleaned up expired shares", "count", result.RowsAffected)
	}

	return result.RowsAffected, nil
}
