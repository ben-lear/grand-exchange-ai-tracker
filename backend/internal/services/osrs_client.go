package services

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/go-resty/resty/v2"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
)

const (
	// OSRS API endpoints
	bulkDumpURL      = "https://chisel.weirdgloop.org/gazproj/gazbot/os_dump.json"
	historicalAPIURL = "https://api.weirdgloop.org/exchange/history/osrs"
	itemDetailURL    = "https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json"

	// Request settings
	requestTimeout   = 30 * time.Second
	maxRetries       = 3
	retryWaitTime    = 2 * time.Second
	maxRetryWaitTime = 10 * time.Second
	userAgent        = "OSRS-GE-Tracker/1.0 (Educational Project)"
)

// OSRSClient handles API calls to OSRS services
type OSRSClient interface {
	// FetchBulkDump fetches all current prices from the bulk dump endpoint
	FetchBulkDump() (map[int]models.BulkDumpItem, error)

	// FetchLatestPrices fetches the latest prices for specific items (up to 100 at a time)
	FetchLatestPrices(itemIDs []int) (map[int]models.HistoricalDataPoint, error)

	// FetchHistoricalData fetches historical price data for an item
	FetchHistoricalData(itemID int, period string) ([]models.HistoricalDataPoint, error)

	// FetchSampleData fetches 150 sampled data points across full history
	FetchSampleData(itemID int) ([]models.HistoricalDataPoint, error)

	// FetchAllHistoricalData fetches complete price history for an item
	FetchAllHistoricalData(itemID int) ([]models.HistoricalDataPoint, error)

	// FetchItemDetail fetches detailed item information
	FetchItemDetail(itemID int) (*models.ItemDetail, error)
}

// osrsClient implements OSRSClient
type osrsClient struct {
	client *resty.Client
	logger *zap.SugaredLogger
}

// NewOSRSClient creates a new OSRS API client
func NewOSRSClient(logger *zap.SugaredLogger) OSRSClient {
	client := resty.New()
	client.SetTimeout(requestTimeout)
	client.SetRetryCount(maxRetries)
	client.SetRetryWaitTime(retryWaitTime)
	client.SetRetryMaxWaitTime(maxRetryWaitTime)
	client.SetHeader("User-Agent", userAgent)

	// Add retry conditions
	client.AddRetryCondition(func(r *resty.Response, err error) bool {
		// Retry on network errors
		if err != nil {
			return true
		}
		// Retry on 5xx server errors and 429 rate limit
		return r.StatusCode() >= 500 || r.StatusCode() == 429
	})

	return &osrsClient{
		client: client,
		logger: logger,
	}
}

// FetchBulkDump fetches all current prices from the bulk dump endpoint
func (c *osrsClient) FetchBulkDump() (map[int]models.BulkDumpItem, error) {
	c.logger.Info("Fetching bulk price dump from OSRS API")

	resp, err := c.client.R().Get(bulkDumpURL)
	if err != nil {
		c.logger.Errorw("Failed to fetch bulk dump", "error", err)
		return nil, fmt.Errorf("failed to fetch bulk dump: %w", err)
	}

	if resp.StatusCode() != 200 {
		c.logger.Errorw("Bulk dump request failed", "statusCode", resp.StatusCode(), "body", string(resp.Body()))
		return nil, fmt.Errorf("bulk dump request failed with status %d", resp.StatusCode())
	}

	// Parse response
	var rawData map[string]models.BulkDumpItem
	if err := json.Unmarshal(resp.Body(), &rawData); err != nil {
		c.logger.Errorw("Failed to parse bulk dump response", "error", err)
		return nil, fmt.Errorf("failed to parse bulk dump response: %w", err)
	}

	// Convert string keys to int
	result := make(map[int]models.BulkDumpItem)
	for itemIDStr, item := range rawData {
		itemID, err := strconv.Atoi(itemIDStr)
		if err != nil {
			c.logger.Warnw("Skipping invalid item ID", "itemID", itemIDStr, "error", err)
			continue
		}
		item.ItemID = itemID
		result[itemID] = item
	}

	c.logger.Infow("Successfully fetched bulk dump", "itemCount", len(result))
	return result, nil
}

// FetchLatestPrices fetches the latest prices for specific items
func (c *osrsClient) FetchLatestPrices(itemIDs []int) (map[int]models.HistoricalDataPoint, error) {
	if len(itemIDs) == 0 {
		return make(map[int]models.HistoricalDataPoint), nil
	}

	if len(itemIDs) > 100 {
		c.logger.Warnw("Too many item IDs for single request, truncating", "requested", len(itemIDs), "limit", 100)
		itemIDs = itemIDs[:100]
	}

	// Build query parameter
	idStrings := make([]string, len(itemIDs))
	for i, id := range itemIDs {
		idStrings[i] = strconv.Itoa(id)
	}
	idsParam := strings.Join(idStrings, ",")

	url := fmt.Sprintf("%s/latest", historicalAPIURL)
	c.logger.Infow("Fetching latest prices", "itemCount", len(itemIDs))

	resp, err := c.client.R().
		SetQueryParam("id", idsParam).
		Get(url)

	if err != nil {
		c.logger.Errorw("Failed to fetch latest prices", "error", err)
		return nil, fmt.Errorf("failed to fetch latest prices: %w", err)
	}

	if resp.StatusCode() != 200 {
		c.logger.Errorw("Latest prices request failed", "statusCode", resp.StatusCode())
		return nil, fmt.Errorf("latest prices request failed with status %d", resp.StatusCode())
	}

	// Parse response
	var rawData map[string][]models.HistoricalDataPoint
	if err := json.Unmarshal(resp.Body(), &rawData); err != nil {
		c.logger.Errorw("Failed to parse latest prices response", "error", err)
		return nil, fmt.Errorf("failed to parse latest prices response: %w", err)
	}

	// Convert to result format
	result := make(map[int]models.HistoricalDataPoint)
	for itemIDStr, dataPoints := range rawData {
		if len(dataPoints) == 0 {
			continue
		}
		itemID, err := strconv.Atoi(itemIDStr)
		if err != nil {
			c.logger.Warnw("Skipping invalid item ID in response", "itemID", itemIDStr)
			continue
		}
		result[itemID] = dataPoints[0]
	}

	c.logger.Infow("Successfully fetched latest prices", "resultCount", len(result))
	return result, nil
}

// FetchHistoricalData fetches historical price data for an item
func (c *osrsClient) FetchHistoricalData(itemID int, period string) ([]models.HistoricalDataPoint, error) {
	var endpoint string
	switch period {
	case "90d", "last90d":
		endpoint = "last90d"
	default:
		c.logger.Warnw("Invalid period, using sample", "period", period)
		return c.FetchSampleData(itemID)
	}

	url := fmt.Sprintf("%s/%s", historicalAPIURL, endpoint)
	c.logger.Infow("Fetching historical data", "itemID", itemID, "period", period)

	resp, err := c.client.R().
		SetQueryParam("id", strconv.Itoa(itemID)).
		Get(url)

	if err != nil {
		c.logger.Errorw("Failed to fetch historical data", "itemID", itemID, "error", err)
		return nil, fmt.Errorf("failed to fetch historical data: %w", err)
	}

	if resp.StatusCode() != 200 {
		c.logger.Errorw("Historical data request failed", "itemID", itemID, "statusCode", resp.StatusCode())
		return nil, fmt.Errorf("historical data request failed with status %d", resp.StatusCode())
	}

	// Parse response
	var rawData map[string][]models.HistoricalDataPoint
	if err := json.Unmarshal(resp.Body(), &rawData); err != nil {
		c.logger.Errorw("Failed to parse historical data response", "error", err)
		return nil, fmt.Errorf("failed to parse historical data response: %w", err)
	}

	// Get data for the item
	itemIDStr := strconv.Itoa(itemID)
	dataPoints, exists := rawData[itemIDStr]
	if !exists || len(dataPoints) == 0 {
		c.logger.Warnw("No historical data found for item", "itemID", itemID)
		return []models.HistoricalDataPoint{}, nil
	}

	c.logger.Infow("Successfully fetched historical data", "itemID", itemID, "pointCount", len(dataPoints))
	return dataPoints, nil
}

// FetchSampleData fetches 150 sampled data points across full history
func (c *osrsClient) FetchSampleData(itemID int) ([]models.HistoricalDataPoint, error) {
	url := fmt.Sprintf("%s/sample", historicalAPIURL)
	c.logger.Infow("Fetching sample data", "itemID", itemID)

	resp, err := c.client.R().
		SetQueryParam("id", strconv.Itoa(itemID)).
		Get(url)

	if err != nil {
		c.logger.Errorw("Failed to fetch sample data", "itemID", itemID, "error", err)
		return nil, fmt.Errorf("failed to fetch sample data: %w", err)
	}

	if resp.StatusCode() != 200 {
		c.logger.Errorw("Sample data request failed", "itemID", itemID, "statusCode", resp.StatusCode())
		return nil, fmt.Errorf("sample data request failed with status %d", resp.StatusCode())
	}

	// Parse response
	var rawData map[string][]models.HistoricalDataPoint
	if err := json.Unmarshal(resp.Body(), &rawData); err != nil {
		c.logger.Errorw("Failed to parse sample data response", "error", err)
		return nil, fmt.Errorf("failed to parse sample data response: %w", err)
	}

	// Get data for the item
	itemIDStr := strconv.Itoa(itemID)
	dataPoints, exists := rawData[itemIDStr]
	if !exists || len(dataPoints) == 0 {
		c.logger.Warnw("No sample data found for item", "itemID", itemID)
		return []models.HistoricalDataPoint{}, nil
	}

	c.logger.Infow("Successfully fetched sample data", "itemID", itemID, "pointCount", len(dataPoints))
	return dataPoints, nil
}

// FetchAllHistoricalData fetches complete price history for an item
func (c *osrsClient) FetchAllHistoricalData(itemID int) ([]models.HistoricalDataPoint, error) {
	url := fmt.Sprintf("%s/all", historicalAPIURL)
	c.logger.Infow("Fetching all historical data", "itemID", itemID)

	resp, err := c.client.R().
		SetQueryParam("id", strconv.Itoa(itemID)).
		Get(url)

	if err != nil {
		c.logger.Errorw("Failed to fetch all historical data", "itemID", itemID, "error", err)
		return nil, fmt.Errorf("failed to fetch all historical data: %w", err)
	}

	if resp.StatusCode() != 200 {
		c.logger.Errorw("All historical data request failed", "itemID", itemID, "statusCode", resp.StatusCode())
		return nil, fmt.Errorf("all historical data request failed with status %d", resp.StatusCode())
	}

	// Parse response
	var rawData map[string][]models.HistoricalDataPoint
	if err := json.Unmarshal(resp.Body(), &rawData); err != nil {
		c.logger.Errorw("Failed to parse all historical data response", "error", err)
		return nil, fmt.Errorf("failed to parse all historical data response: %w", err)
	}

	// Get data for the item
	itemIDStr := strconv.Itoa(itemID)
	dataPoints, exists := rawData[itemIDStr]
	if !exists || len(dataPoints) == 0 {
		c.logger.Warnw("No historical data found for item", "itemID", itemID)
		return []models.HistoricalDataPoint{}, nil
	}

	c.logger.Infow("Successfully fetched all historical data", "itemID", itemID, "pointCount", len(dataPoints))
	return dataPoints, nil
}

// FetchItemDetail fetches detailed item information
func (c *osrsClient) FetchItemDetail(itemID int) (*models.ItemDetail, error) {
	c.logger.Infow("Fetching item detail", "itemID", itemID)

	resp, err := c.client.R().
		SetQueryParam("item", strconv.Itoa(itemID)).
		Get(itemDetailURL)

	if err != nil {
		c.logger.Errorw("Failed to fetch item detail", "itemID", itemID, "error", err)
		return nil, fmt.Errorf("failed to fetch item detail: %w", err)
	}

	if resp.StatusCode() != 200 {
		c.logger.Errorw("Item detail request failed", "itemID", itemID, "statusCode", resp.StatusCode())
		return nil, fmt.Errorf("item detail request failed with status %d", resp.StatusCode())
	}

	// Parse response
	var response struct {
		Item models.ItemDetail `json:"item"`
	}
	if err := json.Unmarshal(resp.Body(), &response); err != nil {
		c.logger.Errorw("Failed to parse item detail response", "error", err)
		return nil, fmt.Errorf("failed to parse item detail response: %w", err)
	}

	c.logger.Infow("Successfully fetched item detail", "itemID", itemID, "name", response.Item.Name)
	return &response.Item, nil
}
