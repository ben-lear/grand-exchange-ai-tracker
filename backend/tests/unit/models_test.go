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
	item := models.Item{
		ItemID:  2,
		Name:    "Cannonball",
		IconURL: "https://example.com/icon.png",
		Members: false,
	}

	assert.Equal(t, 2, item.ItemID)
	assert.Equal(t, "Cannonball", item.Name)
	assert.False(t, item.Members)
	assert.Equal(t, "items", item.TableName())
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
	assert.Equal(t, "current_prices", price.TableName())
}

func TestPriceHistoryModel(t *testing.T) {
	highPrice := int64(1000)
	lowPrice := int64(900)
	now := time.Now()

	history := models.PriceHistory{
		ItemID:    2,
		HighPrice: &highPrice,
		LowPrice:  &lowPrice,
		Timestamp: now,
	}

	assert.Equal(t, 2, history.ItemID)
	assert.Equal(t, int64(1000), *history.HighPrice)
	assert.Equal(t, int64(900), *history.LowPrice)
	assert.Equal(t, "price_history", history.TableName())
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
}

func TestPriceTimeseriesModelTableNames(t *testing.T) {
	assert.Equal(t, "price_timeseries_5m", models.PriceTimeseries5m{}.TableName())
	assert.Equal(t, "price_timeseries_1h", models.PriceTimeseries1h{}.TableName())
	assert.Equal(t, "price_timeseries_6h", models.PriceTimeseries6h{}.TableName())
	assert.Equal(t, "price_timeseries_24h", models.PriceTimeseries24h{}.TableName())
	assert.Equal(t, "price_timeseries_daily", models.PriceTimeseriesDaily{}.TableName())
}
