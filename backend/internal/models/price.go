package models

import (
	"time"
)

// CurrentPrice represents the latest price for an item.
// Note: Repository methods use raw SQL queries against price_latest table.
type CurrentPrice struct {
	ItemID        int        `gorm:"primaryKey" json:"itemId"`
	HighPrice     *int64     `gorm:"type:bigint" json:"highPrice"`
	HighPriceTime *time.Time `gorm:"type:timestamp with time zone" json:"highPriceTime"`
	LowPrice      *int64     `gorm:"type:bigint" json:"lowPrice"`
	LowPriceTime  *time.Time `gorm:"type:timestamp with time zone" json:"lowPriceTime"`
	UpdatedAt     time.Time  `gorm:"type:timestamp with time zone;default:CURRENT_TIMESTAMP" json:"updatedAt"`
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

// PriceLatest represents a minute-level snapshot from the wiki /latest endpoint.
//
// Note: storage is append-only in the DB (PK: item_id + observed_at).
type PriceLatest struct {
	ItemID        int        `gorm:"primaryKey" json:"itemId"`
	ObservedAt    time.Time  `gorm:"type:timestamp with time zone;not null;primaryKey" json:"observedAt"`
	HighPrice     *int64     `gorm:"type:bigint" json:"highPrice"`
	HighPriceTime *time.Time `gorm:"type:timestamp with time zone" json:"highPriceTime"`
	LowPrice      *int64     `gorm:"type:bigint" json:"lowPrice"`
	LowPriceTime  *time.Time `gorm:"type:timestamp with time zone" json:"lowPriceTime"`
	UpdatedAt     time.Time  `gorm:"type:timestamp with time zone;default:CURRENT_TIMESTAMP" json:"updatedAt"`
}

func (PriceLatest) TableName() string {
	return "price_latest"
}

// PriceTimeseriesPoint is the shared schema used by the bucketed /timeseries tables.
//
// Each resolution has its own table (PK: item_id + timestamp).
type PriceTimeseriesPoint struct {
	ItemID          int       `gorm:"primaryKey" json:"itemId"`
	Timestamp       time.Time `gorm:"type:timestamp with time zone;not null;primaryKey" json:"timestamp"`
	AvgHighPrice    *int64    `gorm:"type:bigint" json:"avgHighPrice"`
	AvgLowPrice     *int64    `gorm:"type:bigint" json:"avgLowPrice"`
	HighPriceVolume int64     `gorm:"type:bigint;not null;default:0" json:"highPriceVolume"`
	LowPriceVolume  int64     `gorm:"type:bigint;not null;default:0" json:"lowPriceVolume"`
	InsertedAt      time.Time `gorm:"type:timestamp with time zone;default:CURRENT_TIMESTAMP" json:"insertedAt"`
}

type PriceTimeseries5m struct{ PriceTimeseriesPoint }

func (PriceTimeseries5m) TableName() string { return "price_timeseries_5m" }

type PriceTimeseries1h struct{ PriceTimeseriesPoint }

func (PriceTimeseries1h) TableName() string { return "price_timeseries_1h" }

type PriceTimeseries6h struct{ PriceTimeseriesPoint }

func (PriceTimeseries6h) TableName() string { return "price_timeseries_6h" }

type PriceTimeseries24h struct{ PriceTimeseriesPoint }

func (PriceTimeseries24h) TableName() string { return "price_timeseries_24h" }

// PriceTimeseriesDaily represents the long-term daily rollup derived from pruned 24h buckets.
type PriceTimeseriesDaily struct {
	ItemID          int       `gorm:"primaryKey" json:"itemId"`
	Day             time.Time `gorm:"type:date;not null;primaryKey" json:"day"`
	AvgHighPrice    *int64    `gorm:"type:bigint" json:"avgHighPrice"`
	AvgLowPrice     *int64    `gorm:"type:bigint" json:"avgLowPrice"`
	HighPriceVolume int64     `gorm:"type:bigint;not null;default:0" json:"highPriceVolume"`
	LowPriceVolume  int64     `gorm:"type:bigint;not null;default:0" json:"lowPriceVolume"`
	InsertedAt      time.Time `gorm:"type:timestamp with time zone;default:CURRENT_TIMESTAMP" json:"insertedAt"`
}

func (PriceTimeseriesDaily) TableName() string { return "price_timeseries_daily" }
