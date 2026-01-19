package models

import (
	"time"

	"gorm.io/datatypes"
)

// WatchlistShare represents a temporarily shared watchlist with a memorable token.
type WatchlistShare struct {
	// Token is the memorable share identifier (adjective-adjective-noun format)
	Token string `gorm:"primaryKey;column:token;type:varchar(50)" json:"token"`

	// WatchlistData contains the complete watchlist in JSON format
	WatchlistData datatypes.JSON `gorm:"column:watchlist_data;type:jsonb;not null" json:"watchlist_data"`

	// CreatedAt is when the share was created
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// ExpiresAt is when the share expires (typically 7 days from creation)
	ExpiresAt time.Time `gorm:"column:expires_at;not null" json:"expires_at"`

	// AccessCount tracks how many times this share has been accessed
	AccessCount int `gorm:"column:access_count;default:0" json:"access_count"`
}

// TableName specifies the table name for GORM.
func (WatchlistShare) TableName() string {
	return "watchlist_shares"
}

// IsExpired checks if the share has expired.
func (ws *WatchlistShare) IsExpired() bool {
	return time.Now().After(ws.ExpiresAt)
}

// IncrementAccessCount increases the access counter.
func (ws *WatchlistShare) IncrementAccessCount() {
	ws.AccessCount++
}

// WatchlistShareRequest represents the request body for creating a share.
type WatchlistShareRequest struct {
	// WatchlistData contains the watchlist to share
	WatchlistData interface{} `json:"watchlist_data" validate:"required"`
}

// WatchlistShareResponse represents the response when creating a share.
type WatchlistShareResponse struct {
	// Token is the generated share token
	Token string `json:"token"`

	// ExpiresAt indicates when the share expires
	ExpiresAt time.Time `json:"expires_at"`

	// ShareURL is the full URL to access the shared watchlist
	ShareURL string `json:"share_url"`
}

// WatchlistShareDetailResponse represents the response when retrieving a share.
type WatchlistShareDetailResponse struct {
	// WatchlistData contains the watchlist data
	WatchlistData interface{} `json:"watchlist_data"`

	// CreatedAt is when the share was created
	CreatedAt time.Time `json:"created_at"`

	// ExpiresAt is when the share expires
	ExpiresAt time.Time `json:"expires_at"`

	// AccessCount shows how many times it's been accessed
	AccessCount int `json:"access_count"`
}
