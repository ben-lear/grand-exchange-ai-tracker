package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/go-resty/resty/v2"
	"go.uber.org/zap"
)

const (
	defaultWikiPricesBaseURL = "https://prices.runescape.wiki/api/v1/osrs"
)

// WikiPricesClient handles API calls to the OSRS Wiki Real-time Prices API.
//
// Docs: https://prices.runescape.wiki/api/v1/osrs
// Endpoints used:
// - GET /mapping
// - GET /latest
// - GET /timeseries?timestep=<5m|1h|6h|24h>&id=<itemId>
//
// Note: The wiki requests a descriptive User-Agent; we reuse the existing UA.
type WikiPricesClient interface {
	FetchMapping(ctx context.Context) ([]WikiMappingItem, error)
	FetchLatestAll(ctx context.Context) (map[int]WikiLatestItem, error)
	FetchLatest(ctx context.Context, itemIDs []int) (map[int]WikiLatestItem, error)
	FetchTimeseries(ctx context.Context, itemID int, timestep string) ([]WikiTimeseriesPoint, error)
}

type wikiPricesClient struct {
	client  *resty.Client
	baseURL string
	logger  *zap.SugaredLogger
}

func NewWikiPricesClient(logger *zap.SugaredLogger, baseURL string) WikiPricesClient {
	if strings.TrimSpace(baseURL) == "" {
		baseURL = defaultWikiPricesBaseURL
	}

	client := resty.New()
	client.SetTimeout(requestTimeout)
	client.SetRetryCount(maxRetries)
	client.SetRetryWaitTime(retryWaitTime)
	client.SetRetryMaxWaitTime(maxRetryWaitTime)
	client.SetHeader("User-Agent", userAgent)

	client.AddRetryCondition(func(r *resty.Response, err error) bool {
		if err != nil {
			return true
		}
		return r.StatusCode() >= 500 || r.StatusCode() == 429
	})

	return &wikiPricesClient{
		client:  client,
		baseURL: strings.TrimRight(baseURL, "/"),
		logger:  logger,
	}
}

// WikiMappingItem is an item entry returned by /mapping.
type WikiMappingItem struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Examine  string `json:"examine"`
	Members  bool   `json:"members"`
	LowAlch  int64  `json:"lowalch"`
	HighAlch int64  `json:"highalch"`
	Limit    int    `json:"limit"`
	Value    int64  `json:"value"`
	Icon     string `json:"icon"`
}

// WikiLatestItem is a per-item record returned by /latest.
type WikiLatestItem struct {
	High     *int64 `json:"high"`
	HighTime *int64 `json:"highTime"`
	Low      *int64 `json:"low"`
	LowTime  *int64 `json:"lowTime"`
}

type wikiLatestResponse struct {
	Data map[string]WikiLatestItem `json:"data"`
}

// WikiTimeseriesPoint is a bucket returned by /timeseries.
type WikiTimeseriesPoint struct {
	Timestamp       int64  `json:"timestamp"`
	AvgHighPrice    *int64 `json:"avgHighPrice"`
	AvgLowPrice     *int64 `json:"avgLowPrice"`
	HighPriceVolume int64  `json:"highPriceVolume"`
	LowPriceVolume  int64  `json:"lowPriceVolume"`
}

type wikiTimeseriesResponse struct {
	Data []WikiTimeseriesPoint `json:"data"`
}

func (c *wikiPricesClient) FetchMapping(ctx context.Context) ([]WikiMappingItem, error) {
	url := c.baseURL + "/mapping"
	c.logger.Infow("Fetching wiki mapping", "url", url)

	resp, err := c.client.R().SetContext(ctx).Get(url)
	if err != nil {
		c.logger.Errorw("Failed to fetch wiki mapping", "error", err)
		return nil, fmt.Errorf("fetch wiki mapping: %w", err)
	}
	if resp.StatusCode() != 200 {
		c.logger.Errorw("Wiki mapping request failed", "statusCode", resp.StatusCode(), "body", string(resp.Body()))
		return nil, fmt.Errorf("wiki mapping request failed with status %d", resp.StatusCode())
	}

	var items []WikiMappingItem
	if err := json.Unmarshal(resp.Body(), &items); err != nil {
		c.logger.Errorw("Failed to parse wiki mapping response", "error", err)
		return nil, fmt.Errorf("parse wiki mapping response: %w", err)
	}

	return items, nil
}

func (c *wikiPricesClient) FetchLatestAll(ctx context.Context) (map[int]WikiLatestItem, error) {
	url := c.baseURL + "/latest"
	c.logger.Infow("Fetching wiki latest (all)", "url", url)

	resp, err := c.client.R().SetContext(ctx).Get(url)
	if err != nil {
		c.logger.Errorw("Failed to fetch wiki latest", "error", err)
		return nil, fmt.Errorf("fetch wiki latest: %w", err)
	}
	if resp.StatusCode() != 200 {
		c.logger.Errorw("Wiki latest request failed", "statusCode", resp.StatusCode(), "body", string(resp.Body()))
		return nil, fmt.Errorf("wiki latest request failed with status %d", resp.StatusCode())
	}

	var parsed wikiLatestResponse
	if err := json.Unmarshal(resp.Body(), &parsed); err != nil {
		c.logger.Errorw("Failed to parse wiki latest response", "error", err)
		return nil, fmt.Errorf("parse wiki latest response: %w", err)
	}

	return parseLatestMap(parsed.Data), nil
}

func (c *wikiPricesClient) FetchLatest(ctx context.Context, itemIDs []int) (map[int]WikiLatestItem, error) {
	if len(itemIDs) == 0 {
		return map[int]WikiLatestItem{}, nil
	}

	idStrings := make([]string, 0, len(itemIDs))
	for _, id := range itemIDs {
		idStrings = append(idStrings, strconv.Itoa(id))
	}

	url := c.baseURL + "/latest"
	c.logger.Infow("Fetching wiki latest", "url", url, "itemCount", len(itemIDs))

	resp, err := c.client.R().
		SetContext(ctx).
		SetQueryParam("id", strings.Join(idStrings, ",")).
		Get(url)
	if err != nil {
		c.logger.Errorw("Failed to fetch wiki latest", "error", err)
		return nil, fmt.Errorf("fetch wiki latest: %w", err)
	}
	if resp.StatusCode() != 200 {
		c.logger.Errorw("Wiki latest request failed", "statusCode", resp.StatusCode(), "body", string(resp.Body()))
		return nil, fmt.Errorf("wiki latest request failed with status %d", resp.StatusCode())
	}

	var parsed wikiLatestResponse
	if err := json.Unmarshal(resp.Body(), &parsed); err != nil {
		c.logger.Errorw("Failed to parse wiki latest response", "error", err)
		return nil, fmt.Errorf("parse wiki latest response: %w", err)
	}

	return parseLatestMap(parsed.Data), nil
}

func (c *wikiPricesClient) FetchTimeseries(ctx context.Context, itemID int, timestep string) ([]WikiTimeseriesPoint, error) {
	normalized := strings.TrimSpace(strings.ToLower(timestep))
	switch normalized {
	case "5m", "1h", "6h", "24h":
		// ok
	default:
		return nil, fmt.Errorf("invalid timestep %q (expected one of 5m, 1h, 6h, 24h)", timestep)
	}

	url := c.baseURL + "/timeseries"
	c.logger.Infow("Fetching wiki timeseries", "url", url, "itemID", itemID, "timestep", normalized)

	resp, err := c.client.R().
		SetContext(ctx).
		SetQueryParam("id", strconv.Itoa(itemID)).
		SetQueryParam("timestep", normalized).
		Get(url)
	if err != nil {
		c.logger.Errorw("Failed to fetch wiki timeseries", "itemID", itemID, "timestep", normalized, "error", err)
		return nil, fmt.Errorf("fetch wiki timeseries: %w", err)
	}
	if resp.StatusCode() != 200 {
		c.logger.Errorw("Wiki timeseries request failed", "itemID", itemID, "timestep", normalized, "statusCode", resp.StatusCode(), "body", string(resp.Body()))
		return nil, fmt.Errorf("wiki timeseries request failed with status %d", resp.StatusCode())
	}

	var parsed wikiTimeseriesResponse
	if err := json.Unmarshal(resp.Body(), &parsed); err != nil {
		c.logger.Errorw("Failed to parse wiki timeseries response", "error", err)
		return nil, fmt.Errorf("parse wiki timeseries response: %w", err)
	}

	if parsed.Data == nil {
		return []WikiTimeseriesPoint{}, nil
	}
	return parsed.Data, nil
}

func parseLatestMap(in map[string]WikiLatestItem) map[int]WikiLatestItem {
	out := make(map[int]WikiLatestItem, len(in))
	for idStr, item := range in {
		id, err := strconv.Atoi(idStr)
		if err != nil {
			continue
		}
		out[id] = item
	}
	return out
}

// UnixSecondsToTime returns a UTC time for a unix seconds value.
func UnixSecondsToTime(sec int64) time.Time {
	return time.Unix(sec, 0).UTC()
}
