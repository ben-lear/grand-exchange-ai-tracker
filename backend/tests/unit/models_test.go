package unit

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/guavi/osrs-ge-tracker/internal/models"
)

func TestTimePeriod_IsValid(t *testing.T) {
	tests := []struct {
		name   string
		period models.TimePeriod
		want   bool
	}{
		{"24h is valid", models.Period24Hours, true},
		{"7d is valid", models.Period7Days, true},
		{"30d is valid", models.Period30Days, true},
		{"90d is valid", models.Period90Days, true},
		{"1y is valid", models.Period1Year, true},
		{"all is valid", models.PeriodAll, true},
		{"invalid period", models.TimePeriod("invalid"), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.period.IsValid())
		})
	}
}

func TestTimePeriod_Duration(t *testing.T) {
	tests := []struct {
		name   string
		period models.TimePeriod
		want   time.Duration
	}{
		{"24h duration", models.Period24Hours, 24 * time.Hour},
		{"7d duration", models.Period7Days, 7 * 24 * time.Hour},
		{"30d duration", models.Period30Days, 30 * 24 * time.Hour},
		{"90d duration", models.Period90Days, 90 * 24 * time.Hour},
		{"1y duration", models.Period1Year, 365 * 24 * time.Hour},
		{"all duration", models.PeriodAll, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.period.Duration())
		})
	}
}

func TestDefaultItemListParams(t *testing.T) {
	params := models.DefaultItemListParams()

	assert.Equal(t, 1, params.Page)
	assert.Equal(t, 100, params.Limit)
	assert.Equal(t, 0, params.Offset)
	assert.Equal(t, "name", params.SortBy)
	assert.Equal(t, "asc", params.Order)
	assert.Nil(t, params.Members)
}

func TestItemModel(t *testing.T) {
	examine := "Ammo for the Dwarf cannon"
	value := 6
	iconName := "Cannonball_4.png"

	item := models.Item{
		ItemID:   2,
		Name:     "Cannonball",
		IconURL:  "https://example.com/icon.png",
		Members:  false,
		Examine:  &examine,
		Value:    &value,
		IconName: &iconName,
	}

	assert.Equal(t, 2, item.ItemID)
	assert.Equal(t, "Cannonball", item.Name)
	assert.False(t, item.Members)
	assert.Equal(t, "items", item.TableName())

	// Verify Wiki metadata fields added in migration 004
	assert.Equal(t, "Ammo for the Dwarf cannon", *item.Examine)
	assert.Equal(t, 6, *item.Value)
	assert.Equal(t, "Cannonball_4.png", *item.IconName)
}

func TestItemModel_WikiMetadataOptional(t *testing.T) {
	// Wiki metadata fields should be optional - item can exist without them
	item := models.Item{
		ItemID:  999,
		Name:    "Unknown Item",
		Members: false,
	}

	assert.Equal(t, 999, item.ItemID)
	assert.Nil(t, item.Examine, "Examine should be nil")
	assert.Nil(t, item.Value, "Value should be nil")
	assert.Nil(t, item.IconName, "IconName should be nil")
}

func TestCurrentPriceModel(t *testing.T) {
	highPrice := int64(1000)
	lowPrice := int64(900)
	now := time.Now()

	price := models.CurrentPrice{
		ItemID:        2,
		HighPrice:     &highPrice,
		HighPriceTime: &now,
		LowPrice:      &lowPrice,
		LowPriceTime:  &now,
	}

	assert.Equal(t, 2, price.ItemID)
	assert.Equal(t, int64(1000), *price.HighPrice)
	assert.Equal(t, int64(900), *price.LowPrice)

	// ARCHITECTURAL NOTE:
	// CurrentPrice is now a Data Transfer Object (DTO) used by handlers and services.
	// It does NOT map to a database table directly. Instead, repository methods use
	// raw SQL queries against the price_latest table to populate this struct.
	// The price_latest table stores minute-level snapshots with (item_id, observed_at) as PK.
	// Repository queries use DISTINCT ON (item_id) to get the latest snapshot per item.
}

func TestPriceLatestModel(t *testing.T) {
	highPrice := int64(1000)
	lowPrice := int64(900)
	now := time.Now().UTC().Truncate(time.Minute)

	pl := models.PriceLatest{
		ItemID:     2,
		ObservedAt: now,
		HighPrice:  &highPrice,
		LowPrice:   &lowPrice,
		UpdatedAt:  now,
	}

	assert.Equal(t, 2, pl.ItemID)
	assert.Equal(t, "price_latest", pl.TableName())

	// NOTE: PriceLatest represents minute-level price snapshots in the price_latest table.
	// This table is partitioned by day (observed_at) and stores append-only data.
	// Primary key: (item_id, observed_at) - allows tracking price changes over time.
	// UpsertCurrentPrice() inserts these snapshots, GetCurrentPrice() queries the latest one.
}

func TestPriceTimeseriesModelTableNames(t *testing.T) {
	// Verify table name mappings for all timeseries resolutions
	assert.Equal(t, "price_timeseries_5m", models.PriceTimeseries5m{}.TableName())
	assert.Equal(t, "price_timeseries_1h", models.PriceTimeseries1h{}.TableName())
	assert.Equal(t, "price_timeseries_6h", models.PriceTimeseries6h{}.TableName())
	assert.Equal(t, "price_timeseries_24h", models.PriceTimeseries24h{}.TableName())
	assert.Equal(t, "price_timeseries_daily", models.PriceTimeseriesDaily{}.TableName())

	// NOTE: Each timeseries table stores bucketed averages from the Wiki Prices API /timeseries endpoint.
	// - 5m/1h/6h/24h: Populated by API, pruned after rollup to next level
	// - daily: Long-term storage, derived from 24h buckets via Rollup24hToDailyBefore()
	// All tables have PK: (item_id, timestamp) for 5m/1h/6h/24h or (item_id, day) for daily
}
