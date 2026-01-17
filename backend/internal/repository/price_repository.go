package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/utils"
)

// timeseriesAccessor provides TimeAccessor for PriceTimeseriesPoint.
//
//nolint:dupl // Accessors are structurally similar but type-specific; cannot be generalized further.
var timeseriesAccessor = utils.TimeAccessor[models.PriceTimeseriesPoint]{
	GetTime: func(p models.PriceTimeseriesPoint) time.Time { return p.Timestamp },
	GetHigh: func(p models.PriceTimeseriesPoint) *int64 { return p.AvgHighPrice },
	GetLow:  func(p models.PriceTimeseriesPoint) *int64 { return p.AvgLowPrice },
	SetHigh: func(p *models.PriceTimeseriesPoint, v *int64) { p.AvgHighPrice = v },
	SetLow:  func(p *models.PriceTimeseriesPoint, v *int64) { p.AvgLowPrice = v },
}

// dailyAccessor provides TimeAccessor for PriceTimeseriesDaily.
//
//nolint:dupl // Accessors are structurally similar but type-specific; cannot be generalized further.
var dailyAccessor = utils.TimeAccessor[models.PriceTimeseriesDaily]{
	GetTime: func(p models.PriceTimeseriesDaily) time.Time { return p.Day },
	GetHigh: func(p models.PriceTimeseriesDaily) *int64 { return p.AvgHighPrice },
	GetLow:  func(p models.PriceTimeseriesDaily) *int64 { return p.AvgLowPrice },
	SetHigh: func(p *models.PriceTimeseriesDaily, v *int64) { p.AvgHighPrice = v },
	SetLow:  func(p *models.PriceTimeseriesDaily, v *int64) { p.AvgLowPrice = v },
}

// priceRepository implements PriceRepository.
type priceRepository struct {
	dbClient *gorm.DB
	logger   *zap.SugaredLogger
}

// upsertBatchSize is the number of records inserted per GORM batch operation
// when performing upserts with ON CONFLICT DO NOTHING strategy. This size
// balances memory usage with database round-trip overhead.
const upsertBatchSize = 2000

// dbClient: Database client for executing GORM operations.
func NewPriceRepository(dbClient *gorm.DB, logger *zap.SugaredLogger) PriceRepository {
	return &priceRepository{
		dbClient: dbClient,
		logger:   logger,
	}
}

// EnsureFuturePartitions creates partitions for price_latest for the next N days.
func (r *priceRepository) EnsureFuturePartitions(ctx context.Context, daysAhead int) error {
	now := time.Now().UTC()
	createdCount := 0
	skippedCount := 0

	for i := 0; i <= daysAhead; i++ {
		targetDate := now.AddDate(0, 0, i)
		partitionDate := targetDate.Format("2006_01_02")
		partitionName := "price_latest_" + partitionDate

		// Check if partition already exists
		var exists bool
		err := r.dbClient.WithContext(ctx).Raw(
			"SELECT EXISTS (SELECT 1 FROM pg_class WHERE relname = ?)",
			partitionName,
		).Scan(&exists).Error

		if err != nil {
			return fmt.Errorf("failed to check partition existence for %s: %w", partitionName, err)
		}

		if exists {
			skippedCount++
			continue
		}

		// Create partition
		startTime := time.Date(targetDate.Year(), targetDate.Month(), targetDate.Day(), 0, 0, 0, 0, time.UTC)
		endTime := startTime.AddDate(0, 0, 1)

		sql := fmt.Sprintf(
			"CREATE TABLE IF NOT EXISTS %s PARTITION OF price_latest FOR VALUES FROM ('%s') TO ('%s')",
			partitionName,
			startTime.Format("2006-01-02 15:04:05-07"),
			endTime.Format("2006-01-02 15:04:05-07"),
		)

		if err := r.dbClient.WithContext(ctx).Exec(sql).Error; err != nil {
			return fmt.Errorf("failed to create partition %s: %w", partitionName, err)
		}

		r.logger.Infow("Created partition", "partition", partitionName, "date", targetDate.Format("2006-01-02"))
		createdCount++
	}

	r.logger.Infow("Partition maintenance completed",
		"created", createdCount,
		"skipped", skippedCount,
		"days_ahead", daysAhead,
	)

	return nil
}

// GetCurrentPrice returns the current price for an item.
func (r *priceRepository) GetCurrentPrice(ctx context.Context, itemID int) (*models.CurrentPrice, error) {
	var price models.CurrentPrice
	tx := r.dbClient.WithContext(ctx).Raw(`
		SELECT
			item_id,
			high_price,
			high_price_time,
			low_price,
			low_price_time,
			observed_at AS updated_at
		FROM price_latest
		WHERE item_id = ?
		ORDER BY observed_at DESC
		LIMIT 1
	`, itemID).Scan(&price)
	if tx.Error != nil {
		r.logger.Errorw("Failed to get current price", "itemID", itemID, "error", tx.Error)
		return nil, fmt.Errorf("failed to get current price: %w", tx.Error)
	}
	if tx.RowsAffected == 0 {
		return nil, nil
	}
	return &price, nil
}

// GetCurrentPrices returns current prices for specified items.
func (r *priceRepository) GetCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	if len(itemIDs) == 0 {
		return []models.CurrentPrice{}, nil
	}

	var prices []models.CurrentPrice
	tx := r.dbClient.WithContext(ctx).Raw(`
		SELECT DISTINCT ON (item_id)
			item_id,
			high_price,
			high_price_time,
			low_price,
			low_price_time,
			observed_at AS updated_at
		FROM price_latest
		WHERE item_id IN ?
		ORDER BY item_id, observed_at DESC
	`, itemIDs).Scan(&prices)
	if tx.Error != nil {
		r.logger.Errorw("Failed to get current prices", "itemIDs", itemIDs, "error", tx.Error)
		return nil, fmt.Errorf("failed to get current prices: %w", tx.Error)
	}
	return prices, nil
}

// GetAllCurrentPrices returns all current prices.
func (r *priceRepository) GetAllCurrentPrices(ctx context.Context) ([]models.CurrentPrice, error) {
	var prices []models.CurrentPrice
	tx := r.dbClient.WithContext(ctx).Raw(`
		SELECT DISTINCT ON (item_id)
			item_id,
			high_price,
			high_price_time,
			low_price,
			low_price_time,
			observed_at AS updated_at
		FROM price_latest
		ORDER BY item_id, observed_at DESC
	`).Scan(&prices)
	if tx.Error != nil {
		r.logger.Errorw("Failed to get all current prices", "error", tx.Error)
		return nil, fmt.Errorf("failed to get all current prices: %w", tx.Error)
	}
	return prices, nil
}

// UpsertCurrentPrice creates or updates a current price.
func (r *priceRepository) UpsertCurrentPrice(ctx context.Context, price *models.CurrentPrice) error {
	if price == nil {
		return nil
	}

	observedAt := time.Now().UTC().Truncate(time.Minute)
	snapshot := models.PriceLatest{
		ItemID:        price.ItemID,
		ObservedAt:    observedAt,
		HighPrice:     price.HighPrice,
		HighPriceTime: price.HighPriceTime,
		LowPrice:      price.LowPrice,
		LowPriceTime:  price.LowPriceTime,
		UpdatedAt:     time.Now().UTC(),
	}

	if err := r.dbClient.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "item_id"}, {Name: "observed_at"}},
		DoNothing: true,
	}).Create(&snapshot).Error; err != nil {
		r.logger.Errorw("Failed to insert price_latest snapshot", "itemID", price.ItemID, "error", err)
		return fmt.Errorf("failed to insert price_latest snapshot: %w", err)
	}
	return nil
}

// BulkUpsertCurrentPrices creates or updates multiple current prices.
func (r *priceRepository) BulkUpsertCurrentPrices(ctx context.Context, updates []models.BulkPriceUpdate) error {
	if len(updates) == 0 {
		return nil
	}

	observedAt := time.Now().UTC().Truncate(time.Minute)
	now := time.Now().UTC()

	// Convert to PriceLatest snapshots.
	snapshots := make([]models.PriceLatest, 0, len(updates))
	for _, update := range updates {
		snapshots = append(snapshots, models.PriceLatest{
			ItemID:        update.ItemID,
			ObservedAt:    observedAt,
			HighPrice:     update.HighPrice,
			HighPriceTime: update.HighPriceTime,
			LowPrice:      update.LowPrice,
			LowPriceTime:  update.LowPriceTime,
			UpdatedAt:     now,
		})
	}

	// Batch size for inserts
	batchSize := 2000
	for i := 0; i < len(snapshots); i += batchSize {
		end := i + batchSize
		if end > len(snapshots) {
			end = len(snapshots)
		}

		batch := snapshots[i:end]
		if err := r.dbClient.WithContext(ctx).Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "item_id"}, {Name: "observed_at"}},
			DoNothing: true,
		}).Create(&batch).Error; err != nil {
			r.logger.Errorw("Failed to bulk insert price_latest", "batch", i/batchSize, "error", err)
			return fmt.Errorf("failed to bulk insert price_latest: %w", err)
		}
	}

	r.logger.Infow("Successfully inserted price_latest snapshots", "count", len(snapshots), "observedAt", observedAt)
	return nil
}

func normalizeTimestep(timestep string) string {
	return strings.TrimSpace(strings.ToLower(timestep))
}

func timeseriesTableForTimestep(timestep string) (string, error) {
	switch normalizeTimestep(timestep) {
	case "5m":
		return "price_timeseries_5m", nil
	case "1h":
		return "price_timeseries_1h", nil
	case "6h":
		return "price_timeseries_6h", nil
	case "24h":
		return "price_timeseries_24h", nil
	default:
		return "", fmt.Errorf("invalid timestep %q (expected one of 5m, 1h, 6h, 24h)", timestep)
	}
}

// SampleTimeseriesPoints reduces a slice of time-ordered points to targetPoints
// using Voronoi partitioning on the time axis.
func SampleTimeseriesPoints(points []models.PriceTimeseriesPoint, targetPoints int) []models.PriceTimeseriesPoint {
	return utils.SampleByTime(points, targetPoints, timeseriesAccessor)
}

// SampleDailyPoints reduces a slice of day-ordered points to targetPoints
// using Voronoi partitioning on the time axis.
func SampleDailyPoints(points []models.PriceTimeseriesDaily, targetPoints int) []models.PriceTimeseriesDaily {
	return utils.SampleByTime(points, targetPoints, dailyAccessor)
}

// batchInsertTimeseries inserts price timeseries points in batches using GORM's
// Create with ON CONFLICT DO NOTHING. The generic type T must be one of the
// timeseries models (PriceTimeseries5m, PriceTimeseries1h, PriceTimeseries6h,
// PriceTimeseries24h) that embed PriceTimeseriesPoint and implement TableName().
func batchInsertTimeseries[T any](
	ctx context.Context,
	dbClient *gorm.DB,
	points []models.PriceTimeseriesPoint,
	timestep string,
	converter func(models.PriceTimeseriesPoint) T,
) error {
	if len(points) == 0 {
		return nil
	}

	// Convert base points to typed wrapper
	rows := make([]T, len(points))
	for i := range points {
		rows[i] = converter(points[i])
	}

	// Define upsert conflict strategy
	conflict := clause.OnConflict{
		Columns:   []clause.Column{{Name: "item_id"}, {Name: "timestamp"}},
		DoNothing: true,
	}

	// Insert in batches
	for i := 0; i < len(rows); i += upsertBatchSize {
		end := i + upsertBatchSize
		if end > len(rows) {
			end = len(rows)
		}
		batch := rows[i:end]

		if err := dbClient.WithContext(ctx).Clauses(conflict).Create(&batch).Error; err != nil {
			return fmt.Errorf("insert timeseries %s batch: %w", timestep, err)
		}
	}

	return nil
}

// InsertTimeseriesPoints inserts bucketed /timeseries points for a timestep (append-only).
// Timestep must be one of: 5m, 1h, 6h, 24h (case-insensitive, normalized internally).
func (r *priceRepository) InsertTimeseriesPoints(ctx context.Context, timestep string, points []models.PriceTimeseriesPoint) error {
	if len(points) == 0 {
		return nil
	}

	normalized := normalizeTimestep(timestep)

	switch normalized {
	case "5m":
		return batchInsertTimeseries(ctx, r.dbClient, points, normalized, func(p models.PriceTimeseriesPoint) models.PriceTimeseries5m {
			return models.PriceTimeseries5m{PriceTimeseriesPoint: p}
		})
	case "1h":
		return batchInsertTimeseries(ctx, r.dbClient, points, normalized, func(p models.PriceTimeseriesPoint) models.PriceTimeseries1h {
			return models.PriceTimeseries1h{PriceTimeseriesPoint: p}
		})
	case "6h":
		return batchInsertTimeseries(ctx, r.dbClient, points, normalized, func(p models.PriceTimeseriesPoint) models.PriceTimeseries6h {
			return models.PriceTimeseries6h{PriceTimeseriesPoint: p}
		})
	case "24h":
		return batchInsertTimeseries(ctx, r.dbClient, points, normalized, func(p models.PriceTimeseriesPoint) models.PriceTimeseries24h {
			return models.PriceTimeseries24h{PriceTimeseriesPoint: p}
		})
	default:
		return fmt.Errorf("invalid timestep %q (expected one of 5m, 1h, 6h, 24h)", timestep)
	}
}

func (r *priceRepository) InsertDailyPoints(ctx context.Context, points []models.PriceTimeseriesDaily) error {
	if len(points) == 0 {
		return nil
	}

	conflict := clause.OnConflict{
		Columns:   []clause.Column{{Name: "item_id"}, {Name: "day"}},
		DoNothing: true,
	}

	for i := 0; i < len(points); i += upsertBatchSize {
		end := i + upsertBatchSize
		if end > len(points) {
			end = len(points)
		}
		batch := points[i:end]
		if err := r.dbClient.WithContext(ctx).Clauses(conflict).Create(&batch).Error; err != nil {
			return fmt.Errorf("insert daily points batch: %w", err)
		}
	}
	return nil
}

func (r *priceRepository) GetTimeseriesPoints(ctx context.Context, itemID int, timestep string, params models.PriceHistoryParams) ([]models.PriceTimeseriesPoint, error) {
	table, err := timeseriesTableForTimestep(timestep)
	if err != nil {
		return nil, err
	}

	query := r.dbClient.WithContext(ctx).Table(table).Where("item_id = ?", itemID)

	if params.StartTime != nil {
		query = query.Where("timestamp >= ?", params.StartTime.UTC())
	} else if params.Period != "" && params.Period != models.PeriodAll {
		d := params.Period.Duration()
		if d > 0 {
			start := time.Now().UTC().Add(-d)
			query = query.Where("timestamp >= ?", start)
		}
	}
	if params.EndTime != nil {
		query = query.Where("timestamp <= ?", params.EndTime.UTC())
	}

	query = query.Order("timestamp DESC")
	if params.Limit > 0 {
		query = query.Limit(params.Limit)
	}

	var points []models.PriceTimeseriesPoint
	if err := query.Find(&points).Error; err != nil {
		r.logger.Errorw("Failed to get timeseries points", "itemID", itemID, "timestep", timestep, "error", err)
		return nil, fmt.Errorf("get timeseries points: %w", err)
	}

	if params.MaxPoints != nil && len(points) > *params.MaxPoints {
		points = SampleTimeseriesPoints(points, *params.MaxPoints)
	}

	return points, nil
}

func (r *priceRepository) GetDailyPoints(ctx context.Context, itemID int, params models.PriceHistoryParams) ([]models.PriceTimeseriesDaily, error) {
	query := r.dbClient.WithContext(ctx).Table("price_timeseries_daily").Where("item_id = ?", itemID)

	if params.StartTime != nil {
		start := params.StartTime.UTC().Format("2006-01-02")
		query = query.Where("day >= ?", start)
	} else if params.Period != "" && params.Period != models.PeriodAll {
		d := params.Period.Duration()
		if d > 0 {
			start := time.Now().UTC().Add(-d).Format("2006-01-02")
			query = query.Where("day >= ?", start)
		}
	}
	if params.EndTime != nil {
		end := params.EndTime.UTC().Format("2006-01-02")
		query = query.Where("day <= ?", end)
	}

	query = query.Order("day DESC")
	if params.Limit > 0 {
		query = query.Limit(params.Limit)
	}

	var points []models.PriceTimeseriesDaily
	if err := query.Find(&points).Error; err != nil {
		r.logger.Errorw("Failed to get daily timeseries points", "itemID", itemID, "error", err)
		return nil, fmt.Errorf("get daily points: %w", err)
	}

	if params.MaxPoints != nil && len(points) > *params.MaxPoints {
		points = SampleDailyPoints(points, *params.MaxPoints)
	}

	return points, nil
}

func (r *priceRepository) Rollup24hToDailyBefore(ctx context.Context, cutoff time.Time) (int64, error) {
	cutoff = cutoff.UTC()

	// The 24h timestep is effectively daily; we store it as day-level rows in the rollup table.
	// Use ON CONFLICT DO NOTHING to keep append-only behavior.
	tx := r.dbClient.WithContext(ctx).Exec(`
		INSERT INTO price_timeseries_daily (item_id, day, avg_high_price, avg_low_price, high_price_volume, low_price_volume)
		SELECT
			item_id,
			DATE(timestamp AT TIME ZONE 'UTC') AS day,
			avg_high_price,
			avg_low_price,
			high_price_volume,
			low_price_volume
		FROM price_timeseries_24h
		WHERE timestamp < ?
		ON CONFLICT (item_id, day) DO NOTHING
	`, cutoff)
	if tx.Error != nil {
		r.logger.Errorw("Failed to roll up 24h to daily", "cutoff", cutoff, "error", tx.Error)
		return 0, fmt.Errorf("rollup 24h to daily: %w", tx.Error)
	}

	return tx.RowsAffected, nil
}

func (r *priceRepository) PrunePriceLatestBefore(ctx context.Context, cutoff time.Time) (int64, error) {
	cutoff = cutoff.UTC()
	tx := r.dbClient.WithContext(ctx).Exec(`DELETE FROM price_latest WHERE observed_at < ?`, cutoff)
	if tx.Error != nil {
		r.logger.Errorw("Failed to prune price_latest", "cutoff", cutoff, "error", tx.Error)
		return 0, fmt.Errorf("prune price_latest: %w", tx.Error)
	}
	return tx.RowsAffected, nil
}

func (r *priceRepository) PruneTimeseriesBefore(ctx context.Context, timestep string, cutoff time.Time) (int64, error) {
	cutoff = cutoff.UTC()
	table, err := timeseriesTableForTimestep(timestep)
	if err != nil {
		return 0, err
	}

	stmt := fmt.Sprintf(`DELETE FROM %s WHERE timestamp < ?`, table)
	tx := r.dbClient.WithContext(ctx).Exec(stmt, cutoff)
	if tx.Error != nil {
		r.logger.Errorw("Failed to prune timeseries", "timestep", timestep, "table", table, "cutoff", cutoff, "error", tx.Error)
		return 0, fmt.Errorf("prune timeseries %s: %w", timestep, tx.Error)
	}
	return tx.RowsAffected, nil
}
