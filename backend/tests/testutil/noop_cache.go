package testutil

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"time"
)

var ErrCacheMiss = errors.New("cache miss")

type NoopCache struct {
	store map[string]string
	mu    sync.RWMutex
}

func NewNoopCache() *NoopCache {
	return &NoopCache{store: map[string]string{}}
}

func (c *NoopCache) Get(_ context.Context, key string) (string, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	v, ok := c.store[key]
	if !ok {
		return "", ErrCacheMiss
	}
	return v, nil
}

func (c *NoopCache) Set(_ context.Context, key string, value string, expiration time.Duration) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.store[key] = value
	return nil
}

func (c *NoopCache) Delete(_ context.Context, key string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.store, key)
	return nil
}

func (c *NoopCache) DeletePattern(_ context.Context, pattern string) error {
	// Keep it simple for tests: clear everything.
	c.mu.Lock()
	defer c.mu.Unlock()
	c.store = map[string]string{}
	return nil
}

func (c *NoopCache) GetJSON(_ context.Context, key string, dest interface{}) error {
	v, err := c.Get(context.Background(), key)
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(v), dest)
}

func (c *NoopCache) SetJSON(_ context.Context, key string, value interface{}, expiration time.Duration) error {
	b, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return c.Set(context.Background(), key, string(b), expiration)
}

func (c *NoopCache) Exists(_ context.Context, key string) (bool, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	_, ok := c.store[key]
	return ok, nil
}
