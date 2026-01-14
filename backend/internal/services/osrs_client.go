package services

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/guavi/grand-exchange-ai-tracker/internal/config"
	"github.com/guavi/grand-exchange-ai-tracker/pkg/logger"
	"github.com/redis/go-redis/v9"
)

// OSRSAPIClient handles communication with the OSRS Grand Exchange API
type OSRSAPIClient struct {
	client      *resty.Client
	redisClient *redis.Client
	baseURL     string
	userAgent   string
}

// OSRSItemResponse represents the API response for item list
type OSRSItemResponse struct {
	Total int              `json:"total"`
	Items []OSRSItemDetail `json:"items"`
}

// OSRSItemDetail represents an individual item from the API
type OSRSItemDetail struct {
	Icon        string         `json:"icon"`
	IconLarge   string         `json:"icon_large"`
	ID          int            `json:"id"`
	Type        string         `json:"type"`
	TypeIcon    string         `json:"typeIcon"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Current     OSRSPriceInfo  `json:"current"`
	Today       OSRSPriceInfo  `json:"today"`
	Members     string         `json:"members"`
	Day30       *OSRSTrendInfo `json:"day30,omitempty"`
	Day90       *OSRSTrendInfo `json:"day90,omitempty"`
	Day180      *OSRSTrendInfo `json:"day180,omitempty"`
}

// OSRSPriceInfo represents price information
type OSRSPriceInfo struct {
	Trend string      `json:"trend"`
	Price interface{} `json:"price"` // Can be string or int
}

// OSRSTrendInfo represents trend information
type OSRSTrendInfo struct {
	Trend  string `json:"trend"`
	Change string `json:"change"`
}

// OSRSDetailResponse represents the API response for single item detail
type OSRSDetailResponse struct {
	Item OSRSItemDetail `json:"item"`
}

// OSRSGraphResponse represents the API response for price graph
type OSRSGraphResponse struct {
	Daily   map[string]int `json:"daily"`
	Average map[string]int `json:"average"`
}

// WeirdGloopDumpItem represents an item from the bulk dump
type WeirdGloopDumpItem struct {
	ID     int    `json:"id,string"` // Can be string or int
	Name   string `json:"name"`
	Limit  int    `json:"limit"`
	Value  int    `json:"value"`
	Price  int    `json:"price"`
	Volume int    `json:"volume"`
	// Additional fields if needed
}

// WeirdGloopDump represents the complete bulk data dump from WeirdGloop
type WeirdGloopDump map[string]interface{} // Will parse manually due to special keys

// WeirdGloopHistoricalData represents historical price data from WeirdGloop API
type WeirdGloopHistoricalData map[string][][]interface{} // id -> [[timestamp, price, volume?], ...]

// WeirdGloopLatestData represents latest price data from WeirdGloop API
type WeirdGloopLatestData map[string]struct {
	ID        string      `json:"id"`
	Timestamp string      `json:"timestamp"`
	Price     interface{} `json:"price"`  // Can be int or float
	Volume    interface{} `json:"volume"` // Can be null
}

// NewOSRSAPIClient creates a new OSRS API client
func NewOSRSAPIClient(cfg *config.OSRSAPIConfig, redisClient *redis.Client) *OSRSAPIClient {
	client := resty.New().
		SetBaseURL(cfg.BaseURL).
		SetHeader("User-Agent", cfg.UserAgent).
		SetTimeout(30 * time.Second).
		SetRetryCount(3).
		SetRetryWaitTime(2 * time.Second).
		SetRetryMaxWaitTime(10 * time.Second)

	return &OSRSAPIClient{
		client:      client,
		redisClient: redisClient,
		baseURL:     cfg.BaseURL,
		userAgent:   cfg.UserAgent,
	}
}

// FetchItemsList fetches items list by category, letter, and page
func (c *OSRSAPIClient) FetchItemsList(ctx context.Context, category int, letter string, page int) (*OSRSItemResponse, error) {
	cacheKey := fmt.Sprintf("osrs:items:list:%d:%s:%d", category, letter, page)

	// Try to get from cache
	if c.redisClient != nil {
		cached, err := c.redisClient.Get(ctx, cacheKey).Result()
		if err == nil {
			var response OSRSItemResponse
			if err := json.Unmarshal([]byte(cached), &response); err == nil {
				logger.Debug("cache hit for items list", "category", category, "letter", letter, "page", page)
				return &response, nil
			}
		}
	}

	logger.Debug("fetching items list from API", "category", category, "letter", letter, "page", page)

	var response OSRSItemResponse

	resp, err := c.client.R().
		SetContext(ctx).
		SetQueryParams(map[string]string{
			"category": strconv.Itoa(category),
			"alpha":    letter,
			"page":     strconv.Itoa(page),
		}).
		SetResult(&response).
		Get("/catalogue/items.json")

	if err != nil {
		return nil, fmt.Errorf("failed to fetch items list: %w", err)
	}

	if resp.StatusCode() != 200 {
		logger.Error("API returned non-200 status", "status", resp.StatusCode(), "body", resp.String())
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode())
	}

	// Log first 500 chars of response for debugging
	bodyStr := resp.String()
	if len(bodyStr) > 500 {
		logger.Debug("API response body (truncated)", "body", bodyStr[:500])
	} else {
		logger.Debug("API response body", "body", bodyStr)
	}

	// Try manual parsing if SetResult didn't work
	if len(response.Items) == 0 {
		// If body is empty, it's a valid case for letters with no items.
		if len(resp.Body()) == 0 || string(resp.Body()) == "" || string(resp.Body()) == "{}" {
			logger.Debug("API returned empty body, likely no items for this letter/page", "letter", letter, "page", page)
			return &OSRSItemResponse{Items: []OSRSItemDetail{}}, nil
		}

		logger.Debug("SetResult gave empty items, trying manual JSON unmarshal")
		if err := json.Unmarshal(resp.Body(), &response); err != nil {
			logger.Error("manual JSON unmarshal failed", "error", err, "body", string(resp.Body()))
			return nil, fmt.Errorf("failed to parse response: %w", err)
		}
	}

	logger.Debug("items list fetched", "total", response.Total, "items_count", len(response.Items), "status", resp.StatusCode())

	// Cache the response
	if c.redisClient != nil {
		data, _ := json.Marshal(response)
		c.redisClient.Set(ctx, cacheKey, data, 5*time.Minute)
	}

	return &response, nil
}

// FetchItemDetail fetches detailed information for a specific item
func (c *OSRSAPIClient) FetchItemDetail(ctx context.Context, itemID int) (*OSRSItemDetail, error) {
	cacheKey := fmt.Sprintf("osrs:item:%d", itemID)

	// Try to get from cache
	if c.redisClient != nil {
		cached, err := c.redisClient.Get(ctx, cacheKey).Result()
		if err == nil {
			var response OSRSDetailResponse
			if err := json.Unmarshal([]byte(cached), &response); err == nil {
				logger.Debug("cache hit for item detail", "itemId", itemID)
				return &response.Item, nil
			}
		}
	}

	logger.Debug("fetching item detail from API", "itemId", itemID)

	var response OSRSDetailResponse
	resp, err := c.client.R().
		SetContext(ctx).
		SetQueryParam("item", strconv.Itoa(itemID)).
		SetResult(&response).
		Get("/catalogue/detail.json")

	if err != nil {
		return nil, fmt.Errorf("failed to fetch item detail: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode())
	}

	// Cache the response
	if c.redisClient != nil {
		data, _ := json.Marshal(response)
		c.redisClient.Set(ctx, cacheKey, data, 10*time.Minute)
	}

	return &response.Item, nil
}

// FetchPriceGraph fetches 180 days of price history for an item
func (c *OSRSAPIClient) FetchPriceGraph(ctx context.Context, itemID int) (*OSRSGraphResponse, error) {
	cacheKey := fmt.Sprintf("osrs:graph:%d", itemID)

	// Try to get from cache
	if c.redisClient != nil {
		cached, err := c.redisClient.Get(ctx, cacheKey).Result()
		if err == nil {
			var response OSRSGraphResponse
			if err := json.Unmarshal([]byte(cached), &response); err == nil {
				logger.Debug("cache hit for price graph", "itemId", itemID)
				return &response, nil
			}
		}
	}

	logger.Debug("fetching price graph from API", "itemId", itemID)

	var response OSRSGraphResponse
	resp, err := c.client.R().
		SetContext(ctx).
		SetResult(&response).
		Get(fmt.Sprintf("/graph/%d.json", itemID))

	if err != nil {
		return nil, fmt.Errorf("failed to fetch price graph: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode())
	}

	// If the graph is empty, log debug to help diagnostics
	if len(response.Daily) == 0 && len(response.Average) == 0 {
		logger.Debug("price graph empty for item", "itemId", itemID)
	}

	// Cache the response
	if c.redisClient != nil {
		data, _ := json.Marshal(response)
		c.redisClient.Set(ctx, cacheKey, data, 5*time.Minute)
	}

	return &response, nil
}

// ParsePrice converts OSRS price strings to integers
// Examples: "5.2m" -> 5200000, "1.5k" -> 1500, "125" -> 125
func ParsePrice(priceInterface interface{}) int {
	switch v := priceInterface.(type) {
	case float64:
		return int(v)
	case int:
		return v
	case string:
		// Remove commas
		priceStr := strings.ReplaceAll(v, ",", "")

		// Check for millions (m)
		if strings.HasSuffix(strings.ToLower(priceStr), "m") {
			priceStr = strings.TrimSuffix(strings.ToLower(priceStr), "m")
			if val, err := strconv.ParseFloat(priceStr, 64); err == nil {
				return int(val * 1000000)
			}
		}

		// Check for thousands (k)
		if strings.HasSuffix(strings.ToLower(priceStr), "k") {
			priceStr = strings.TrimSuffix(strings.ToLower(priceStr), "k")
			if val, err := strconv.ParseFloat(priceStr, 64); err == nil {
				return int(val * 1000)
			}
		}

		// Try to parse as regular number
		// Remove any non-numeric characters except decimal point
		re := regexp.MustCompile(`[^\d.]`)
		priceStr = re.ReplaceAllString(priceStr, "")

		if val, err := strconv.ParseFloat(priceStr, 64); err == nil {
			return int(val)
		}
	}

	return 0
}

// IsMembersOnly checks if an item is members-only
func IsMembersOnly(membersStr string) bool {
	return strings.ToLower(membersStr) == "true"
}

// FetchBulkDump fetches the complete OSRS GE data dump from WeirdGloop
// This is the recommended way to get all items with current prices in one request
func (c *OSRSAPIClient) FetchBulkDump(ctx context.Context) (map[string]WeirdGloopDumpItem, int64, error) {
	const weirdGloopDumpURL = "https://chisel.weirdgloop.org/gazproj/gazbot/os_dump.json"

	logger.Info("fetching bulk GE data dump from WeirdGloop")

	// Create a temporary client for WeirdGloop (different base URL)
	tempClient := resty.New().
		SetHeader("User-Agent", c.userAgent).
		SetTimeout(60 * time.Second).
		SetRetryCount(3).
		SetRetryWaitTime(2 * time.Second).
		SetRetryMaxWaitTime(10 * time.Second)

	var fullResponse map[string]interface{}
	resp, err := tempClient.R().
		SetContext(ctx).
		SetResult(&fullResponse).
		Get(weirdGloopDumpURL)

	if err != nil {
		logger.Error("failed to fetch bulk dump", "error", err)
		return nil, 0, fmt.Errorf("failed to fetch bulk dump: %w", err)
	}

	if resp.StatusCode() != 200 {
		logger.Error("bulk dump API returned non-200 status", "status", resp.StatusCode())
		return nil, 0, fmt.Errorf("bulk dump API returned status %d", resp.StatusCode())
	}

	// Extract timestamp
	var jagexTimestamp int64
	if ts, ok := fullResponse["%JAGEX_TIMESTAMP%"]; ok {
		switch v := ts.(type) {
		case float64:
			jagexTimestamp = int64(v) / 1000 // Convert milliseconds to seconds
		case int64:
			jagexTimestamp = v / 1000
		}
	}

	// Parse items (everything except special keys)
	items := make(map[string]WeirdGloopDumpItem)
	for key, value := range fullResponse {
		// Skip special keys
		if key == "%JAGEX_TIMESTAMP%" || key == "%UPDATE_DETECTED%" {
			continue
		}

		// Parse item data
		if itemData, ok := value.(map[string]interface{}); ok {
			item := WeirdGloopDumpItem{}

			// Parse ID
			if id, ok := itemData["id"]; ok {
				switch v := id.(type) {
				case float64:
					item.ID = int(v)
				case string:
					if parsed, err := strconv.Atoi(v); err == nil {
						item.ID = parsed
					}
				}
			}

			// Parse other fields
			if name, ok := itemData["name"].(string); ok {
				item.Name = name
			}
			if limit, ok := itemData["limit"].(float64); ok {
				item.Limit = int(limit)
			}
			if value, ok := itemData["value"].(float64); ok {
				item.Value = int(value)
			}
			if price, ok := itemData["price"].(float64); ok {
				item.Price = int(price)
			}
			if volume, ok := itemData["volume"].(float64); ok {
				item.Volume = int(volume)
			}

			items[key] = item
		}
	}

	logger.Info("bulk dump fetched successfully", "item_count", len(items), "timestamp", jagexTimestamp)
	return items, jagexTimestamp, nil
}

// FetchSampleHistoricalData fetches sample historical data (150 points spread across entire history)
// This is optimized for initial data population on app startup
// Returns: []timestamp,price pairs and any error
func (c *OSRSAPIClient) FetchSampleHistoricalData(ctx context.Context, itemID int) ([][]interface{}, error) {
	const endpoint = "https://api.weirdgloop.org/exchange/history/osrs/sample"

	tempClient := resty.New().
		SetHeader("User-Agent", c.userAgent).
		SetTimeout(30 * time.Second).
		SetRetryCount(2).
		SetRetryWaitTime(1 * time.Second)

	// First, fetch as a generic map to handle the response correctly
	resp, err := tempClient.R().
		SetContext(ctx).
		SetQueryParam("id", strconv.Itoa(itemID)).
		Get(endpoint)

	if err != nil {
		logger.Warn("failed to fetch sample historical data", "itemId", itemID, "error", err)
		return nil, err
	}

	if resp.StatusCode() != 200 {
		logger.Debug("sample historical API returned non-200", "itemId", itemID, "status", resp.StatusCode())
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode())
	}

	// Try parsing as array first (most likely format)
	var dataArray [][]interface{}
	if err := json.Unmarshal(resp.Body(), &dataArray); err == nil {
		if len(dataArray) > 0 {
			logger.Debug("fetched sample historical data (array format)", "itemId", itemID, "data_points", len(dataArray))
			return dataArray, nil
		}
	}

	// Try parsing as map (nested format with item ID key)
	var responseMap map[string][][]interface{}
	if err := json.Unmarshal(resp.Body(), &responseMap); err == nil {
		for _, data := range responseMap {
			if len(data) > 0 {
				logger.Debug("fetched sample historical data (map format)", "itemId", itemID, "data_points", len(data))
				return data, nil
			}
		}
	}

	// Try parsing as nested map of arrays ({"data": [[...], [...]]})
	var nestedMap map[string][][]interface{}
	if err := json.Unmarshal(resp.Body(), &nestedMap); err == nil {
		if data, exists := nestedMap["data"]; exists && len(data) > 0 {
			logger.Debug("fetched sample historical data (nested format)", "itemId", itemID, "data_points", len(data))
			return data, nil
		}
	}

	// If no data found, return empty slice (item may have no history)
	logger.Debug("no historical data available for item", "itemId", itemID)
	return [][]interface{}{}, nil
}

// FetchHistoricalData fetches historical price data for items from WeirdGloop Exchange API
// Supports multiple items in a single request (pipe-separated IDs)
func (c *OSRSAPIClient) FetchHistoricalData(ctx context.Context, itemIDs []int, timeframe string) (map[string][][]interface{}, error) {
	if len(itemIDs) == 0 {
		return make(map[string][][]interface{}), nil
	}

	// Determine endpoint based on timeframe
	var endpoint string
	switch timeframe {
	case "90d":
		endpoint = "https://api.weirdgloop.org/exchange/history/osrs/last90d"
	case "all":
		endpoint = "https://api.weirdgloop.org/exchange/history/osrs/all"
	case "sample":
		endpoint = "https://api.weirdgloop.org/exchange/history/osrs/sample"
	default:
		endpoint = "https://api.weirdgloop.org/exchange/history/osrs/last90d"
	}

	// Build ID list (pipe-separated, but API only supports 1 per request for /all, /sample, /last90d)
	// For this implementation, we'll fetch one at a time to be safe
	result := make(map[string][][]interface{})

	for _, itemID := range itemIDs {
		if ctx.Err() != nil {
			return result, ctx.Err()
		}

		logger.Debug("fetching historical data for item", "itemId", itemID, "timeframe", timeframe)

		tempClient := resty.New().
			SetHeader("User-Agent", c.userAgent).
			SetTimeout(30 * time.Second).
			SetRetryCount(2).
			SetRetryWaitTime(1 * time.Second)

		resp, err := tempClient.R().
			SetContext(ctx).
			SetQueryParam("id", strconv.Itoa(itemID)).
			Get(endpoint)

		if err != nil {
			logger.Warn("failed to fetch historical data", "itemId", itemID, "error", err)
			continue
		}

		if resp.StatusCode() != 200 {
			logger.Debug("historical API returned non-200", "itemId", itemID, "status", resp.StatusCode())
			continue
		}

		// Try parsing as array first
		var dataArray [][]interface{}
		if err := json.Unmarshal(resp.Body(), &dataArray); err == nil && len(dataArray) > 0 {
			result[strconv.Itoa(itemID)] = dataArray
			time.Sleep(100 * time.Millisecond)
			continue
		}

		// Try parsing as map with item ID key
		var responseMap map[string][][]interface{}
		if err := json.Unmarshal(resp.Body(), &responseMap); err == nil {
			for k, v := range responseMap {
				result[k] = v
			}
			time.Sleep(100 * time.Millisecond)
			continue
		}

		logger.Debug("unable to parse historical data response", "itemId", itemID)

		// Small delay to be respectful of API
		time.Sleep(100 * time.Millisecond)
	}

	logger.Debug("historical data fetch completed", "item_count", len(result), "total_requested", len(itemIDs))
	return result, nil
}

// FetchLatestPrices fetches latest prices for multiple items from WeirdGloop API
// This endpoint supports up to 100 items per request
func (c *OSRSAPIClient) FetchLatestPrices(ctx context.Context, itemIDs []int) (map[string]interface{}, error) {
	if len(itemIDs) == 0 {
		return make(map[string]interface{}), nil
	}

	if len(itemIDs) > 100 {
		logger.Warn("fetching more than 100 items, this will be split into multiple requests", "count", len(itemIDs))
	}

	result := make(map[string]interface{})
	const endpoint = "https://api.weirdgloop.org/exchange/history/osrs/latest"

	// Process in batches of 100
	for i := 0; i < len(itemIDs); i += 100 {
		if ctx.Err() != nil {
			return result, ctx.Err()
		}

		end := i + 100
		if end > len(itemIDs) {
			end = len(itemIDs)
		}

		batch := itemIDs[i:end]

		// Build pipe-separated ID list
		idList := make([]string, len(batch))
		for j, id := range batch {
			idList[j] = strconv.Itoa(id)
		}
		idParam := strings.Join(idList, "|")

		logger.Debug("fetching latest prices batch", "batch_start", i, "batch_end", end, "total", len(itemIDs))

		tempClient := resty.New().
			SetHeader("User-Agent", c.userAgent).
			SetTimeout(30 * time.Second).
			SetRetryCount(2).
			SetRetryWaitTime(1 * time.Second)

		var response map[string]interface{}
		resp, err := tempClient.R().
			SetContext(ctx).
			SetQueryParam("id", idParam).
			SetResult(&response).
			Get(endpoint)

		if err != nil {
			logger.Warn("failed to fetch latest prices batch", "error", err)
			continue
		}

		if resp.StatusCode() != 200 {
			logger.Debug("latest prices API returned non-200", "status", resp.StatusCode())
			continue
		}

		// Merge results
		for k, v := range response {
			result[k] = v
		}

		// Small delay between batches
		time.Sleep(100 * time.Millisecond)
	}

	logger.Debug("latest prices fetch completed", "items_count", len(result), "total_requested", len(itemIDs))
	return result, nil
}
