// Package models contains the database models for the OSRS GE Tracker
package models

import (
	"time"
)

// Item represents an OSRS item
type Item struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	ItemID       int       `gorm:"uniqueIndex;not null" json:"item_id"`
	Name         string    `gorm:"size:255;not null" json:"name"`
	Description  string    `gorm:"type:text" json:"description"`
	IconURL      string    `gorm:"type:text" json:"icon_url"`
	IconLargeURL string    `gorm:"type:text" json:"icon_large_url"`
	Type         string    `gorm:"size:100" json:"type"`
	Members      bool      `gorm:"default:false" json:"members"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// PriceHistory represents a price point for an item
type PriceHistory struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ItemID    uint      `gorm:"not null;index" json:"item_id"`
	Timestamp int64     `gorm:"not null" json:"timestamp"`
	Price     int       `gorm:"not null" json:"price"`
	Volume    int       `json:"volume"`
	CreatedAt time.Time `json:"created_at"`
	Item      Item      `gorm:"foreignKey:ItemID" json:"-"`
}

// PriceTrend represents current price trends for an item
type PriceTrend struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	ItemID           uint      `gorm:"uniqueIndex;not null" json:"item_id"`
	CurrentPrice     int       `json:"current_price"`
	CurrentTrend     string    `gorm:"size:20" json:"current_trend"`
	TodayPriceChange int       `gorm:"default:0" json:"today_price_change"`
	TodayTrend       string    `gorm:"size:20" json:"today_trend"`
	Day30Change      string    `gorm:"size:20" json:"day30_change"`
	Day30Trend       string    `gorm:"size:20" json:"day30_trend"`
	Day90Change      string    `gorm:"size:20" json:"day90_change"`
	Day90Trend       string    `gorm:"size:20" json:"day90_trend"`
	Day180Change     string    `gorm:"size:20" json:"day180_change"`
	Day180Trend      string    `gorm:"size:20" json:"day180_trend"`
	UpdatedAt        time.Time `json:"updated_at"`
	Item             Item      `gorm:"foreignKey:ItemID" json:"-"`
}

// TableName overrides
func (Item) TableName() string {
	return "items"
}

func (PriceHistory) TableName() string {
	return "price_history"
}

func (PriceTrend) TableName() string {
	return "price_trends"
}
