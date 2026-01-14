package models

import "time"

// TimePeriod represents different time ranges for historical data
type TimePeriod string

const (
	Period24Hours TimePeriod = "24h"
	Period7Days   TimePeriod = "7d"
	Period30Days  TimePeriod = "30d"
	Period90Days  TimePeriod = "90d"
	Period1Year   TimePeriod = "1y"
	PeriodAll     TimePeriod = "all"
)

// IsValid checks if the time period is valid
func (p TimePeriod) IsValid() bool {
	switch p {
	case Period24Hours, Period7Days, Period30Days, Period90Days, Period1Year, PeriodAll:
		return true
	default:
		return false
	}
}

// Duration returns the time.Duration for the period
func (p TimePeriod) Duration() time.Duration {
	switch p {
	case Period24Hours:
		return 24 * time.Hour
	case Period7Days:
		return 7 * 24 * time.Hour
	case Period30Days:
		return 30 * 24 * time.Hour
	case Period90Days:
		return 90 * 24 * time.Hour
	case Period1Year:
		return 365 * 24 * time.Hour
	default:
		return 0
	}
}

// PricePoint represents a single price data point
type PricePoint struct {
	Timestamp time.Time `json:"timestamp"`
	HighPrice int64     `json:"highPrice"`
	LowPrice  int64     `json:"lowPrice"`
}

// BulkDumpItem represents an item in the OSRS bulk price dump
type BulkDumpItem struct {
	High      int64 `json:"high"`
	HighTime  int64 `json:"highTime"`
	Low       int64 `json:"low"`
	LowTime   int64 `json:"lowTime"`
	ItemID    int   `json:"-"` // Set from map key
}

// HistoricalDataPoint represents a point in historical price data
type HistoricalDataPoint struct {
	Timestamp int64 `json:"timestamp"`
	AvgPrice  int64 `json:"avgHighPrice"`
	Volume    int64 `json:"avgLowPrice"`
}

// ItemDetail represents detailed item information from OSRS API
type ItemDetail struct {
	Icon        string      `json:"icon"`
	IconLarge   string      `json:"icon_large"`
	ID          int         `json:"id"`
	Type        string      `json:"type"`
	TypeIcon    string      `json:"typeIcon"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Current     PriceValue  `json:"current"`
	Today       PriceChange `json:"today"`
	Members     string      `json:"members"`
}

// PriceValue represents a price with trend information
type PriceValue struct {
	Trend string `json:"trend"`
	Price string `json:"price"`
}

// PriceChange represents price change information
type PriceChange struct {
	Trend string `json:"trend"`
	Price string `json:"price"`
}
