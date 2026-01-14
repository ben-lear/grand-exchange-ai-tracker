package models

import (
	"encoding/json"
	"fmt"
	"time"
)

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
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Examine  string `json:"examine,omitempty"`
	Members  *bool  `json:"members,omitempty"`
	LowAlch  *int64 `json:"lowalch,omitempty"`
	HighAlch *int64 `json:"highalch,omitempty"`
	Limit    *int   `json:"limit,omitempty"`
	Value    *int64 `json:"value,omitempty"`
	Icon     string `json:"icon,omitempty"`
	Price    *int64 `json:"price,omitempty"`
	Last     *int64 `json:"last,omitempty"`
	Volume   *int64 `json:"volume,omitempty"`
	ItemID   int    `json:"-"` // Set from map key for backwards compatibility
}

// HistoricalDataPoint represents a point in historical price data
type HistoricalDataPoint struct {
	ID        string    `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Price     int64     `json:"price"`
	Volume    int64     `json:"volume"`
}

func (p *HistoricalDataPoint) UnmarshalJSON(data []byte) error {
	var raw struct {
		ID        string          `json:"id"`
		Timestamp json.RawMessage `json:"timestamp"`
		Price     int64           `json:"price"`
		Volume    int64           `json:"volume"`
	}

	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	p.ID = raw.ID
	p.Price = raw.Price
	p.Volume = raw.Volume

	// Timestamp can be either:
	// - integer milliseconds since epoch (last90d/sample/all)
	// - RFC3339 string (latest)
	if len(raw.Timestamp) == 0 {
		p.Timestamp = time.Time{}
		return nil
	}

	// Try numeric first
	var ms int64
	if err := json.Unmarshal(raw.Timestamp, &ms); err == nil {
		p.Timestamp = time.Unix(0, ms*int64(time.Millisecond)).UTC()
		return nil
	}

	var ts string
	if err := json.Unmarshal(raw.Timestamp, &ts); err == nil {
		parsed, parseErr := time.Parse(time.RFC3339Nano, ts)
		if parseErr != nil {
			return fmt.Errorf("parse timestamp %q: %w", ts, parseErr)
		}
		p.Timestamp = parsed.UTC()
		return nil
	}

	return fmt.Errorf("unsupported timestamp encoding: %s", string(raw.Timestamp))
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
