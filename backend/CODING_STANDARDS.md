# Backend Coding Standards

This document outlines the naming conventions, design patterns, and coding standards for the OSRS Grand Exchange Tracker backend.

## Table of Contents

1. [Variable Naming](#variable-naming)
2. [Function Naming](#function-naming)
3. [Struct Field Naming](#struct-field-naming)
4. [Configuration Patterns](#configuration-patterns)
5. [Package Organization](#package-organization)
6. [Examples](#examples)

---

## Variable Naming

### General Principles

- **Use descriptive names** that clearly communicate purpose and type
- **Avoid single-letter names** except for common Go idioms:
  - `i`, `j`, `k` for loop indices
  - `c` for Fiber context (`*fiber.Ctx`)
  - `w` for `http.ResponseWriter`
  - `r` for `http.Request` or readers
  - `err` for errors
- **Self-documenting names** reduce need for comments

### Client Variables

External resource connections should always use the `Client` suffix:

```go
// ✅ GOOD - Clear that these are connection clients
dbClient := database.NewPostgresDB(cfg.Database, logger)
redisClient := database.NewRedisClient(cfg.Cache, logger)
httpClient := &http.Client{Timeout: 10 * time.Second}

// ❌ BAD - Ambiguous, could be anything
db := database.NewPostgresDB(cfg.Database, logger)
redis := database.NewRedisClient(cfg.Cache, logger)
```

**Rationale**: The `Client` suffix makes it immediately obvious that these variables represent connections to external resources, not data structures or local state.

### Config Parameter Names

Configuration parameters passed to functions should be descriptive and purpose-specific:

```go
// ✅ GOOD - Clear what type of config and its purpose
func NewPostgresDB(dbConfig config.PostgresConfig, logger *zap.SugaredLogger) (*PostgresDB, error) {
    dsn := fmt.Sprintf("host=%s port=%s user=%s...", dbConfig.Host, dbConfig.Port, ...)
}

func NewSSEHandler(hub *services.SSEHub, logger *zap.SugaredLogger, sseConfig config.SSEConfig) *sseHandler {
    return &sseHandler{hub: hub, logger: logger, sseConfig: sseConfig}
}

// ❌ BAD - Generic naming doesn't convey purpose
func NewPostgresDB(cfg config.PostgresConfig, logger *zap.SugaredLogger) (*PostgresDB, error) {
    dsn := fmt.Sprintf("host=%s port=%s user=%s...", cfg.Host, cfg.Port, ...)
}

func NewSSEHandler(hub *services.SSEHub, logger *zap.SugaredLogger, config config.SSEConfig) *sseHandler {
    return &sseHandler{hub: hub, logger: logger, config: config} // Package name collision!
}
```

**Rationale**: Descriptive parameter names make function signatures self-documenting and avoid package name collisions.

### Avoiding Package Name Collisions

When using types from a package named `config`, avoid naming variables just `config`:

```go
// ✅ GOOD - No collision with package name
type sseHandler struct {
    hub       *services.SSEHub
    logger    *zap.SugaredLogger
    sseConfig config.SSEConfig  // Clear and no collision
}

// ❌ BAD - Collides with config package name
type sseHandler struct {
    hub    *services.SSEHub
    logger *zap.SugaredLogger
    config config.SSEConfig  // Confusing: is it the package or the field?
}
```

---

## Function Naming

### Constructor Functions

- Use `New<TypeName>` pattern for constructors
- Accept specific config structs, not generic `*config.Config`
- Order parameters: dependencies first, config second, logger last

```go
// ✅ GOOD - Clear dependencies and parameters
func NewPostgresDB(dbConfig config.PostgresConfig, logger *zap.SugaredLogger) (*PostgresDB, error)
func NewItemService(repo repository.ItemRepository, cache services.CacheService, logger *zap.SugaredLogger) *itemService
func NewSSEHandler(hub *services.SSEHub, logger *zap.SugaredLogger, sseConfig config.SSEConfig) *sseHandler

// ❌ BAD - Takes entire config struct when only needs subset
func NewPostgresDB(cfg *config.Config, logger *zap.SugaredLogger) (*PostgresDB, error)
```

### Method Names

- Use clear action verbs: `Get`, `Create`, `Update`, `Delete`, `Fetch`, `Store`
- Avoid ambiguous names like `Do`, `Process`, `Handle` without context
- Boolean checks should read like questions: `IsValid`, `HasExpired`, `CanAccess`

```go
// ✅ GOOD
func (s *itemService) GetItemByID(ctx context.Context, id int) (*models.Item, error)
func (r *priceRepository) StorePriceHistory(ctx context.Context, prices []models.Price) error
func (c *cacheService) IsConnected() bool

// ❌ BAD
func (s *itemService) Item(ctx context.Context, id int) (*models.Item, error)
func (r *priceRepository) Prices(ctx context.Context, prices []models.Price) error
func (c *cacheService) Connected() bool
```

---

## Struct Field Naming

### Config Struct Naming Pattern

We follow a specific pattern for configuration structs to balance flexibility and clarity:

- **Struct names**: Implementation-specific (e.g., `PostgresConfig`, `RedisConfig`, `SSEConfig`)
- **Field names in main Config**: Purpose-generic (e.g., `Database`, `Cache`, `SSE`)

```go
// ✅ GOOD - Implementation-specific struct, purpose-generic field
type PostgresConfig struct {
    Host     string
    Port     string
    User     string
    Password string
    DB       string
    SSLMode  string
}

type Config struct {
    Port        int
    Environment string
    Database    PostgresConfig  // Purpose-generic field name
    Cache       RedisConfig     // Purpose-generic field name
    SSE         SSEConfig       // Purpose-generic field name
}
```

**Rationale**: This pattern allows us to swap implementations without changing field access patterns. If we switch from PostgreSQL to MySQL, we change `PostgresConfig` to `MySQLConfig` but keep `cfg.Database.*` field access throughout the codebase.

### Struct Field Order

Order struct fields logically:

1. **Identifiers first** (ID, Name, Key)
2. **Core business fields**
3. **Metadata fields** (timestamps, flags)
4. **Dependencies last** (logger, clients, config)

```go
// ✅ GOOD - Logical ordering
type itemService struct {
    // Dependencies
    repo   repository.ItemRepository
    cache  services.CacheService
    logger *zap.SugaredLogger
}

type Item struct {
    // Identifiers
    ItemID int    `gorm:"primaryKey;column:item_id" json:"item_id"`
    Name   string `gorm:"column:name;index" json:"name"`
    
    // Business fields
    Description string `gorm:"column:description" json:"description"`
    Icon        string `gorm:"column:icon" json:"icon"`
    Members     bool   `gorm:"column:members" json:"members"`
    
    // Metadata
    CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
    UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}
```

---

## Configuration Patterns

### The "Reduce Chaining" Principle

Pass the appropriate level of configuration to functions to avoid repetitive field access:

```go
// ✅ GOOD - Pass specific config level, minimal chaining
func NewPostgresDB(dbConfig config.PostgresConfig, logger *zap.SugaredLogger) (*PostgresDB, error) {
    dsn := fmt.Sprintf(
        "host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
        dbConfig.Host,
        dbConfig.Port,
        dbConfig.User,
        dbConfig.Password,
        dbConfig.DB,
        dbConfig.SSLMode,
    )
    // Clear, concise field access
}

func NewSSEHandler(hub *services.SSEHub, logger *zap.SugaredLogger, sseConfig config.SSEConfig) *sseHandler {
    // Can directly access sseConfig.HeartbeatInterval, sseConfig.MaxClients, etc.
    return &sseHandler{hub: hub, logger: logger, sseConfig: sseConfig}
}

// ❌ BAD - Repetitive chaining
func NewPostgresDB(cfg *config.Config, logger *zap.SugaredLogger) (*PostgresDB, error) {
    dsn := fmt.Sprintf(
        "host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
        cfg.Database.Host,      // cfg.Database. repeated 6 times
        cfg.Database.Port,
        cfg.Database.User,
        cfg.Database.Password,
        cfg.Database.DB,
        cfg.Database.SSLMode,
    )
}
```

**When to pass `*config.Config` vs specific config structs:**

- **Pass full `*config.Config`**: When the function needs settings from multiple config sections
- **Pass specific struct**: When the function only needs one config section (database, cache, SSE, etc.)

### Environment Variable Mapping

Viper automatically maps nested config to environment variables using underscores:

```go
// Config structure
type Config struct {
    Database PostgresConfig  // Nested struct
    Cache    RedisConfig     // Nested struct
}

// Environment variables (no changes needed from existing .env)
POSTGRES_HOST=localhost      → cfg.Database.Host
POSTGRES_PORT=5432           → cfg.Database.Port
POSTGRES_USER=osrs_tracker   → cfg.Database.User
REDIS_HOST=localhost         → cfg.Cache.Host
REDIS_PORT=6379              → cfg.Cache.Port
```

This is enabled by:
```go
viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
viper.SetDefault("database.host", "localhost")  // Maps to POSTGRES_HOST via Database prefix
```

---

## Package Organization

### Internal Package Structure

```
internal/
├── config/         # Configuration loading and types
├── database/       # Database connection clients (PostgreSQL, Redis)
├── models/         # Data models and GORM schemas
├── repository/     # Data access layer (interfaces + implementations)
├── services/       # Business logic layer
├── handlers/       # HTTP handlers (Fiber routes)
├── middleware/     # HTTP middleware (CORS, logging, rate limiting)
├── scheduler/      # Cron jobs and background tasks
└── utils/          # Shared utilities and helpers
```

### Dependency Direction

Dependencies should flow inward:

```
handlers → services → repository → database
   ↓          ↓           ↓
middleware  models     config
```

- **Handlers** depend on services and middleware
- **Services** depend on repositories and models
- **Repositories** depend on database clients and models
- **Database clients** depend only on config

### Interface Definitions

Define interfaces in the **consuming package**, not the implementing package:

```go
// ✅ GOOD - Interface in services/ package (consumer)
// File: internal/services/interfaces.go
package services

type ItemRepository interface {
    GetItemByID(ctx context.Context, id int) (*models.Item, error)
    GetAllItems(ctx context.Context) ([]models.Item, error)
}

// Implementation in repository/ package (provider)
// File: internal/repository/item_repository.go
package repository

type itemRepository struct {
    db     *gorm.DB
    logger *zap.SugaredLogger
}

func (r *itemRepository) GetItemByID(ctx context.Context, id int) (*models.Item, error) {
    // Implementation
}

// ❌ BAD - Interface in repository/ package (provider)
// Creates circular dependency risk and couples consumer to provider
```

**Rationale**: This follows the Dependency Inversion Principle and makes testing easier (mock in the consumer package).

---

## Examples

### Complete Configuration Flow Example

```go
// 1. Define implementation-specific config structs
type PostgresConfig struct {
    Host     string
    Port     string
    User     string
    Password string
    DB       string
    SSLMode  string
}

// 2. Use purpose-generic field names in main Config
type Config struct {
    Database PostgresConfig  // Purpose-generic
    Cache    RedisConfig     // Purpose-generic
}

// 3. Constructor accepts specific config with descriptive parameter name
func NewPostgresDB(dbConfig config.PostgresConfig, logger *zap.SugaredLogger) (*PostgresDB, error) {
    // Minimal chaining - just dbConfig.Field
    dsn := fmt.Sprintf("host=%s port=%s...", dbConfig.Host, dbConfig.Port, ...)
}

// 4. Main function passes appropriate config level with clear variable names
func main() {
    cfg := config.LoadConfig()
    logger := utils.NewLogger(cfg.Environment)
    
    // Clear variable names with Client suffix
    dbClient, err := database.NewPostgresDB(cfg.Database, logger)  // Pass cfg.Database
    if err != nil {
        logger.Fatal("Database connection failed", zap.Error(err))
    }
    
    redisClient, err := database.NewRedisClient(cfg.Cache, logger)  // Pass cfg.Cache
    if err != nil {
        logger.Fatal("Redis connection failed", zap.Error(err))
    }
}
```

### Good vs. Bad Naming Examples

#### Example 1: Variable Names

```go
// ✅ GOOD
dbClient := database.NewPostgresDB(cfg.Database, logger)
redisClient := database.NewRedisClient(cfg.Cache, logger)
cacheService := services.NewCacheService(redisClient, logger)

// ❌ BAD
db := database.NewPostgresDB(cfg.Database, logger)          // Ambiguous
redis := database.NewRedisClient(cfg.Cache, logger)         // Could be data, not client
cache := services.NewCacheService(redis, logger)            // Not clear it's a service
```

#### Example 2: Config Parameters

```go
// ✅ GOOD - Descriptive, purpose-specific
func NewSSEHandler(hub *services.SSEHub, logger *zap.SugaredLogger, sseConfig config.SSEConfig) *sseHandler {
    return &sseHandler{
        hub:       hub,
        logger:    logger,
        sseConfig: sseConfig,  // No package name collision
    }
}

// ❌ BAD - Generic naming, package collision
func NewSSEHandler(hub *services.SSEHub, logger *zap.SugaredLogger, config config.SSEConfig) *sseHandler {
    return &sseHandler{
        hub:    hub,
        logger: logger,
        config: config,  // Collides with config package name
    }
}
```

#### Example 3: Struct Field Naming

```go
// ✅ GOOD - Implementation-specific struct, purpose-generic field
type RedisConfig struct {  // Implementation name in struct
    Host     string
    Port     string
    Password string
    DB       int
}

type Config struct {
    Cache RedisConfig  // Purpose-generic field name
}

// Usage: cfg.Cache.Host (purpose-driven access)

// ❌ BAD - Implementation name in field
type Config struct {
    Redis RedisConfig  // Implementation-specific field
}

// Usage: cfg.Redis.Host (couples to Redis implementation)
```

#### Example 4: Reduce Chaining

```go
// ✅ GOOD - Pass appropriate level
func setupHandlers(app *fiber.App, services *appServices, cfg *config.Config) {
    // Pass full config when multiple sections needed
    app.Use(middleware.NewLogger(cfg))
    
    // Pass specific config when only one section needed
    sseHandler := handlers.NewSSEHandler(services.sseHub, services.logger, cfg.SSE)
    app.Get("/events", sseHandler.HandleSSE)
}

// ❌ BAD - Always passing full config
func setupHandlers(app *fiber.App, services *appServices, cfg *config.Config) {
    app.Use(middleware.NewLogger(cfg))
    
    // Forces unnecessary chaining in handler
    sseHandler := handlers.NewSSEHandler(services.sseHub, services.logger, cfg)
    // Now handler must do: cfg.SSE.HeartbeatInterval, cfg.SSE.MaxClients, etc.
    app.Get("/events", sseHandler.HandleSSE)
}
```

---

## Summary

### Key Naming Conventions

1. **Client suffix** for external resource connections (`dbClient`, `redisClient`)
2. **Descriptive config parameters** (`dbConfig`, `cacheConfig`, `sseConfig`)
3. **Implementation-specific struct names** (`PostgresConfig`, `RedisConfig`)
4. **Purpose-generic config field names** (`Database`, `Cache`, `SSE`)
5. **Avoid package name collisions** (don't use `config` as a variable name)
6. **Reduce chaining** by passing appropriate config level

### Design Principles

- **Self-documenting code**: Names should clearly convey purpose and type
- **Minimal coupling**: Pass only what's needed, not entire config trees
- **Consistency**: Apply patterns uniformly across codebase
- **Flexibility**: Config field names allow implementation changes without refactoring

### Further Reading

- [Effective Go - Names](https://go.dev/doc/effective_go#names)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- [Standard Go Project Layout](https://github.com/golang-standards/project-layout)

---

**Document Version**: 1.0  
**Last Updated**: January 16, 2026  
**Related**: [CONFIG_REFACTOR_PLAN.md](CONFIG_REFACTOR_PLAN.md), [REFACTOR_PROGRESS.md](REFACTOR_PROGRESS.md)
