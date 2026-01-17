//nolint:revive // Price models naturally have many public structs for different table types
package models

import (
	"time"
)

// CurrentPrice represents the latest price for an item.
// Note: Repository methods use raw SQL queries against price_latest table.
type CurrentPrice struct {
	UpdatedAt     time.Time  `gorm:"type:timestamp with time zone;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	HighPrice     *int64     `gorm:"type:bigint" json:"highPrice"`
	HighPriceTime *time.Time `gorm:"type:timestamp with time zone" json:"highPriceTime"`
	LowPrice      *int64     `gorm:"type:bigint" json:"lowPrice"`
	LowPriceTime  *time.Time `gorm:"type:timestamp with time zone" json:"lowPriceTime"`
	ItemID        int        `gorm:"primaryKey" json:"itemId"`
}

// PriceHistoryParams contains parameters for querying price history.
type PriceHistoryParams struct {
	StartTime *time.Time
	EndTime   *time.Time
	MaxPoints *int
	Period    TimePeriod
	ItemID    int
	Limit     int
	Refresh   bool
}

// PriceHistoryResponse represents the response structure for historical prices.
type PriceHistoryResponse struct {
	FirstDate *time.Time   `json:"firstDate,omitempty"`
	LastDate  *time.Time   `json:"lastDate,omitempty"`
	Period    string       `json:"period"`
	Data      []PricePoint `json:"data"`
	ItemID    int          `json:"itemId"`
	Count     int          `json:"count"`
}

// CurrentPriceWithItem represents current price with item details.
type CurrentPriceWithItem struct {
	Item *Item `json:"item,omitempty"`
	CurrentPrice
}

// BulkPriceUpdate represents a batch update for current prices.
type BulkPriceUpdate struct {
	HighPrice     *int64
	HighPriceTime *time.Time
	LowPrice      *int64
	LowPriceTime  *time.Time
	ItemID        int
}

// PriceLatest represents a minute-level snapshot from the wiki /latest endpoint.
//
// Note: storage is append-only in the DB (PK: item_id + observed_at).
type PriceLatest struct {
	ObservedAt    time.Time  `gorm:"type:timestamp with time zone;not null;primaryKey" json:"observedAt"`
	UpdatedAt     time.Time  `gorm:"type:timestamp with time zone;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	HighPrice     *int64     `gorm:"type:bigint" json:"highPrice"`
	HighPriceTime *time.Time `gorm:"type:timestamp with time zone" json:"highPriceTime"`
	LowPrice      *int64     `gorm:"type:bigint" json:"lowPrice"`
	LowPriceTime  *time.Time `gorm:"type:timestamp with time zone" json:"lowPriceTime"`
	ItemID        int        `gorm:"primaryKey" json:"itemId"`
}

func (PriceLatest) TableName() string {
	return "price_latest"
}

// PriceTimeseriesPoint is the shared schema used by the bucketed /timeseries tables.
//
// Each resolution has its own table (PK: item_id + timestamp).
type PriceTimeseriesPoint struct {
	Timestamp       time.Time `gorm:"type:timestamp with time zone;not null;primaryKey" json:"timestamp"`
	InsertedAt      time.Time `gorm:"type:timestamp with time zone;default:CURRENT_TIMESTAMP" json:"insertedAt"`
	AvgHighPrice    *int64    `gorm:"type:bigint" json:"avgHighPrice"`
	AvgLowPrice     *int64    `gorm:"type:bigint" json:"avgLowPrice"`
	ItemID          int       `gorm:"primaryKey" json:"itemId"`
	HighPriceVolume int64     `gorm:"type:bigint;not null;default:0" json:"highPriceVolume"`
	LowPriceVolume  int64     `gorm:"type:bigint;not null;default:0" json:"lowPriceVolume"`
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
	Day             time.Time `gorm:"type:date;not null;primaryKey" json:"day"`
	InsertedAt      time.Time `gorm:"type:timestamp with time zone;default:CURRENT_TIMESTAMP" json:"insertedAt"`
	AvgHighPrice    *int64    `gorm:"type:bigint" json:"avgHighPrice"`
	AvgLowPrice     *int64    `gorm:"type:bigint" json:"avgLowPrice"`
	ItemID          int       `gorm:"primaryKey" json:"itemId"`
	HighPriceVolume int64     `gorm:"type:bigint;not null;default:0" json:"highPriceVolume"`
	LowPriceVolume  int64     `gorm:"type:bigint;not null;default:0" json:"lowPriceVolume"`
}

func (PriceTimeseriesDaily) TableName() string { return "price_timeseries_daily" }
