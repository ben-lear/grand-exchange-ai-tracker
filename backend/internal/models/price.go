package models

import (
	"time"
)

// CurrentPrice represents the latest price for an item
type CurrentPrice struct {
	ItemID        int        `gorm:"primaryKey" json:"itemId"`
	HighPrice     *int64     `gorm:"type:bigint" json:"highPrice"`
	HighPriceTime *time.Time `gorm:"type:timestamp with time zone" json:"highPriceTime"`
	LowPrice      *int64     `gorm:"type:bigint" json:"lowPrice"`
	LowPriceTime  *time.Time `gorm:"type:timestamp with time zone" json:"lowPriceTime"`
	UpdatedAt     time.Time  `gorm:"type:timestamp with time zone;default:CURRENT_TIMESTAMP" json:"updatedAt"`
}

// TableName overrides the table name
func (CurrentPrice) TableName() string {
	return "current_prices"
}

// PriceHistory represents historical price data for an item
type PriceHistory struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ItemID    int       `gorm:"not null;index:idx_price_history_item_timestamp" json:"itemId"`
	HighPrice *int64    `gorm:"type:bigint" json:"highPrice"`
	LowPrice  *int64    `gorm:"type:bigint" json:"lowPrice"`
	Timestamp time.Time `gorm:"type:timestamp with time zone;not null;primaryKey" json:"timestamp"`
}

// TableName overrides the table name
func (PriceHistory) TableName() string {
	return "price_history"
}

// PriceHistoryParams contains parameters for querying price history
type PriceHistoryParams struct {
	ItemID    int
	Period    TimePeriod
	StartTime *time.Time
	EndTime   *time.Time
	MaxPoints *int // Maximum number of points to return (for sampling)
	Limit     int
}

// PriceHistoryResponse represents the response structure for historical prices
type PriceHistoryResponse struct {
	ItemID    int          `json:"itemId"`
	Period    string       `json:"period"`
	Data      []PricePoint `json:"data"`
	Count     int          `json:"count"`
	FirstDate *time.Time   `json:"firstDate,omitempty"`
	LastDate  *time.Time   `json:"lastDate,omitempty"`
}

// CurrentPriceWithItem represents current price with item details
type CurrentPriceWithItem struct {
	CurrentPrice
	Item *Item `json:"item,omitempty"`
}

// BulkPriceUpdate represents a batch update for current prices
type BulkPriceUpdate struct {
	ItemID        int
	HighPrice     *int64
	HighPriceTime *time.Time
	LowPrice      *int64
	LowPriceTime  *time.Time
}

// BulkHistoryInsert represents a batch insert for price history
type BulkHistoryInsert struct {
	ItemID    int
	HighPrice *int64
	LowPrice  *int64
	Timestamp time.Time
}
