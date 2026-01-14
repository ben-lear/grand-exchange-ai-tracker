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

	logger.Info("fetching items list from API", "category", category, "letter", letter, "page", page)

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
		logger.Debug("SetResult gave empty items, trying manual JSON unmarshal")
		if err := json.Unmarshal(resp.Body(), &response); err != nil {
			logger.Error("manual JSON unmarshal failed", "error", err)
			return nil, fmt.Errorf("failed to parse response: %w", err)
		}
	}

	logger.Info("items list fetched", "total", response.Total, "items_count", len(response.Items), "status", resp.StatusCode())

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

	logger.Info("fetching item detail from API", "itemId", itemID)

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

	logger.Info("fetching price graph from API", "itemId", itemID)

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
