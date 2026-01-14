package unit

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/services"
)

type memoryCache struct {
	mu sync.Mutex
	kv map[string]string
}

func newMemoryCache() *memoryCache {
	return &memoryCache{kv: map[string]string{}}
}

func (c *memoryCache) Get(_ context.Context, key string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	v, ok := c.kv[key]
	if !ok {
		return "", errors.New("cache miss")
	}
	return v, nil
}

func (c *memoryCache) Set(_ context.Context, key string, value string, _ time.Duration) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.kv[key] = value
	return nil
}

func (c *memoryCache) Delete(_ context.Context, key string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.kv, key)
	return nil
}

func (c *memoryCache) DeletePattern(_ context.Context, pattern string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Minimal pattern support for our test usage: "prefix:*".
	if strings.HasSuffix(pattern, "*") {
		prefix := strings.TrimSuffix(pattern, "*")
		for k := range c.kv {
			if strings.HasPrefix(k, prefix) {
				delete(c.kv, k)
			}
		}
		return nil
	}

	delete(c.kv, pattern)
	return nil
}

func (c *memoryCache) GetJSON(ctx context.Context, key string, dest interface{}) error {
	v, err := c.Get(ctx, key)
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(v), dest)
}

func (c *memoryCache) SetJSON(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	b, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return c.Set(ctx, key, string(b), expiration)
}

func (c *memoryCache) Exists(_ context.Context, key string) (bool, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	_, ok := c.kv[key]
	return ok, nil
}

type fakeItemRepo struct {
	getByItemIDCalls int
	getByItemIDItem  *models.Item
	getByItemIDErr   error

	upsertCalls int
	upsertErr   error

	bulkUpsertCalls int
	bulkUpsertErr   error

	countAll          int64
	countMembersTrue  int64
	countMembersFalse int64
}

func (r *fakeItemRepo) GetAll(_ context.Context, params models.ItemListParams) ([]models.Item, int64, error) {
	if params.Members == nil {
		return nil, r.countAll, nil
	}
	if *params.Members {
		return nil, r.countMembersTrue, nil
	}
	return nil, r.countMembersFalse, nil
}

func (r *fakeItemRepo) GetByID(_ context.Context, _ uint) (*models.Item, error) { return nil, nil }

func (r *fakeItemRepo) GetByItemID(_ context.Context, _ int) (*models.Item, error) {
	r.getByItemIDCalls++
	return r.getByItemIDItem, r.getByItemIDErr
}

func (r *fakeItemRepo) Search(_ context.Context, _ models.ItemSearchParams) ([]models.Item, int64, error) {
	return nil, 0, nil
}

func (r *fakeItemRepo) Create(_ context.Context, _ *models.Item) error { return nil }

func (r *fakeItemRepo) Update(_ context.Context, _ *models.Item) error { return nil }

func (r *fakeItemRepo) Upsert(_ context.Context, _ *models.Item) error {
	r.upsertCalls++
	return r.upsertErr
}

func (r *fakeItemRepo) BulkUpsert(_ context.Context, _ []models.Item) error {
	r.bulkUpsertCalls++
	return r.bulkUpsertErr
}

func (r *fakeItemRepo) Delete(_ context.Context, _ uint) error { return nil }

func (r *fakeItemRepo) Count(_ context.Context) (int64, error) { return 0, nil }

type fakePriceRepo struct {
	getCurrentPriceCalls int
	getCurrentPriceResp  *models.CurrentPrice
	getCurrentPriceErr   error

	getAllCurrentPricesCalls int
	getAllCurrentPricesResp  []models.CurrentPrice
	getAllCurrentPricesErr   error

	upsertCurrentPriceCalls int
	upsertCurrentPriceErr   error
}

func (r *fakePriceRepo) GetCurrentPrice(_ context.Context, _ int) (*models.CurrentPrice, error) {
	r.getCurrentPriceCalls++
	return r.getCurrentPriceResp, r.getCurrentPriceErr
}

func (r *fakePriceRepo) GetCurrentPrices(_ context.Context, _ []int) ([]models.CurrentPrice, error) {
	return nil, nil
}

func (r *fakePriceRepo) GetAllCurrentPrices(_ context.Context) ([]models.CurrentPrice, error) {
	r.getAllCurrentPricesCalls++
	return r.getAllCurrentPricesResp, r.getAllCurrentPricesErr
}

func (r *fakePriceRepo) UpsertCurrentPrice(_ context.Context, _ *models.CurrentPrice) error {
	r.upsertCurrentPriceCalls++
	return r.upsertCurrentPriceErr
}

func (r *fakePriceRepo) BulkUpsertCurrentPrices(_ context.Context, _ []models.BulkPriceUpdate) error {
	return nil
}

func (r *fakePriceRepo) GetHistory(_ context.Context, _ models.PriceHistoryParams) ([]models.PriceHistory, error) {
	return nil, nil
}

func (r *fakePriceRepo) InsertHistory(_ context.Context, _ *models.PriceHistory) error { return nil }

func (r *fakePriceRepo) BulkInsertHistory(_ context.Context, _ []models.BulkHistoryInsert) error {
	return nil
}

func (r *fakePriceRepo) GetLatestHistoryTimestamp(_ context.Context, _ int) (*models.PriceHistory, error) {
	return nil, nil
}

func (r *fakePriceRepo) DeleteOldHistory(_ context.Context, _ int, _ int64) error { return nil }

func TestItemService_GetItemByItemID_UsesCache(t *testing.T) {
	logger := zap.NewNop().Sugar()
	ctx := context.Background()

	repo := &fakeItemRepo{getByItemIDItem: &models.Item{ItemID: 42, Name: "Test"}}
	cache := newMemoryCache()

	svc := services.NewItemService(repo, cache, logger)

	item, err := svc.GetItemByItemID(ctx, 42)
	require.NoError(t, err)
	require.NotNil(t, item)
	require.Equal(t, 42, item.ItemID)
	require.Equal(t, 1, repo.getByItemIDCalls)

	cached, err := cache.Exists(ctx, "item:42")
	require.NoError(t, err)
	require.True(t, cached)

	item2, err := svc.GetItemByItemID(ctx, 42)
	require.NoError(t, err)
	require.NotNil(t, item2)
	require.Equal(t, 42, item2.ItemID)
	require.Equal(t, 1, repo.getByItemIDCalls, "second call should hit cache")
}

func TestItemService_UpsertItem_InvalidatesCache(t *testing.T) {
	logger := zap.NewNop().Sugar()
	ctx := context.Background()

	repo := &fakeItemRepo{}
	cache := newMemoryCache()
	require.NoError(t, cache.SetJSON(ctx, "item:99", &models.Item{ItemID: 99, Name: "Cached"}, time.Hour))

	svc := services.NewItemService(repo, cache, logger)

	require.NoError(t, svc.UpsertItem(ctx, &models.Item{ItemID: 99, Name: "Updated"}))
	require.Equal(t, 1, repo.upsertCalls)

	exists, _ := cache.Exists(ctx, "item:99")
	require.False(t, exists)
}

func TestItemService_BulkUpsertItems_InvalidatesPattern(t *testing.T) {
	logger := zap.NewNop().Sugar()
	ctx := context.Background()

	repo := &fakeItemRepo{}
	cache := newMemoryCache()
	require.NoError(t, cache.Set(ctx, "item:1", "v", time.Hour))
	require.NoError(t, cache.Set(ctx, "item:2", "v", time.Hour))
	require.NoError(t, cache.Set(ctx, "other:1", "v", time.Hour))

	svc := services.NewItemService(repo, cache, logger)

	require.NoError(t, svc.BulkUpsertItems(ctx, []models.Item{{ItemID: 1, Name: "A"}, {ItemID: 2, Name: "B"}}))
	require.Equal(t, 1, repo.bulkUpsertCalls)

	exists, _ := cache.Exists(ctx, "item:1")
	require.False(t, exists)
	exists, _ = cache.Exists(ctx, "item:2")
	require.False(t, exists)
	exists, _ = cache.Exists(ctx, "other:1")
	require.True(t, exists)
}

func TestPriceService_GetCurrentPrice_UsesCache(t *testing.T) {
	logger := zap.NewNop().Sugar()
	ctx := context.Background()

	high := int64(100)
	low := int64(90)
	now := time.Now().UTC()

	priceRepo := &fakePriceRepo{getCurrentPriceResp: &models.CurrentPrice{ItemID: 10, HighPrice: &high, LowPrice: &low, HighPriceTime: &now, LowPriceTime: &now}}
	itemRepo := &fakeItemRepo{}
	cache := newMemoryCache()

	svc := services.NewPriceService(priceRepo, itemRepo, cache, nil, logger)

	p, err := svc.GetCurrentPrice(ctx, 10)
	require.NoError(t, err)
	require.NotNil(t, p)
	require.Equal(t, 10, p.ItemID)
	require.Equal(t, 1, priceRepo.getCurrentPriceCalls)

	p2, err := svc.GetCurrentPrice(ctx, 10)
	require.NoError(t, err)
	require.NotNil(t, p2)
	require.Equal(t, 10, p2.ItemID)
	require.Equal(t, 1, priceRepo.getCurrentPriceCalls, "second call should hit cache")
}

func TestPriceService_GetAllCurrentPrices_UsesCache(t *testing.T) {
	logger := zap.NewNop().Sugar()
	ctx := context.Background()

	high := int64(100)
	low := int64(90)
	now := time.Now().UTC()

	priceRepo := &fakePriceRepo{getAllCurrentPricesResp: []models.CurrentPrice{
		{ItemID: 1, HighPrice: &high, LowPrice: &low, HighPriceTime: &now, LowPriceTime: &now},
		{ItemID: 2, HighPrice: &high, LowPrice: &low, HighPriceTime: &now, LowPriceTime: &now},
	}}
	itemRepo := &fakeItemRepo{}
	cache := newMemoryCache()

	svc := services.NewPriceService(priceRepo, itemRepo, cache, nil, logger)

	all, err := svc.GetAllCurrentPrices(ctx)
	require.NoError(t, err)
	require.Len(t, all, 2)
	require.Equal(t, 1, priceRepo.getAllCurrentPricesCalls)

	all2, err := svc.GetAllCurrentPrices(ctx)
	require.NoError(t, err)
	require.Len(t, all2, 2)
	require.Equal(t, 1, priceRepo.getAllCurrentPricesCalls, "second call should hit cache")
}

func TestPriceService_UpdateCurrentPrice_InvalidatesCaches(t *testing.T) {
	logger := zap.NewNop().Sugar()
	ctx := context.Background()

	priceRepo := &fakePriceRepo{}
	itemRepo := &fakeItemRepo{}
	cache := newMemoryCache()

	require.NoError(t, cache.Set(ctx, "price:current:10", "x", time.Hour))
	require.NoError(t, cache.Set(ctx, "price:current:all", "x", time.Hour))
	require.NoError(t, cache.Set(ctx, "price:history:10:7d", "x", time.Hour))

	svc := services.NewPriceService(priceRepo, itemRepo, cache, nil, logger)

	p := &models.CurrentPrice{ItemID: 10}
	require.NoError(t, svc.UpdateCurrentPrice(ctx, p))
	require.Equal(t, 1, priceRepo.upsertCurrentPriceCalls)

	exists, _ := cache.Exists(ctx, "price:current:10")
	require.False(t, exists)
	exists, _ = cache.Exists(ctx, "price:current:all")
	require.False(t, exists)

	// History cache is not invalidated by UpdateCurrentPrice.
	exists, _ = cache.Exists(ctx, "price:history:10:7d")
	require.True(t, exists)
}

func TestItemService_GetItemCount_UsesRepoTotal(t *testing.T) {
	logger := zap.NewNop().Sugar()
	ctx := context.Background()

	repo := &fakeItemRepo{countAll: 3, countMembersTrue: 2, countMembersFalse: 1}
	cache := newMemoryCache()
	svc := services.NewItemService(repo, cache, logger)

	count, err := svc.GetItemCount(ctx, nil)
	require.NoError(t, err)
	require.Equal(t, int64(3), count)

	members := true
	count, err = svc.GetItemCount(ctx, &members)
	require.NoError(t, err)
	require.Equal(t, int64(2), count)
}
