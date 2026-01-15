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
)

// priceRepository implements PriceRepository
type priceRepository struct {
	db     *gorm.DB
	logger *zap.SugaredLogger
}

// NewPriceRepository creates a new price repository
func NewPriceRepository(db *gorm.DB, logger *zap.SugaredLogger) PriceRepository {
	return &priceRepository{
		db:     db,
		logger: logger,
	}
}

// EnsureFuturePartitions creates partitions for price_latest for the next N days
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
		err := r.db.WithContext(ctx).Raw(
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

		if err := r.db.WithContext(ctx).Exec(sql).Error; err != nil {
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

// GetCurrentPrice returns the current price for an item
func (r *priceRepository) GetCurrentPrice(ctx context.Context, itemID int) (*models.CurrentPrice, error) {
	var price models.CurrentPrice
	tx := r.db.WithContext(ctx).Raw(`
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

// GetCurrentPrices returns current prices for specified items
func (r *priceRepository) GetCurrentPrices(ctx context.Context, itemIDs []int) ([]models.CurrentPrice, error) {
	if len(itemIDs) == 0 {
		return []models.CurrentPrice{}, nil
	}

	var prices []models.CurrentPrice
	tx := r.db.WithContext(ctx).Raw(`
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

// GetAllCurrentPrices returns all current prices
func (r *priceRepository) GetAllCurrentPrices(ctx context.Context) ([]models.CurrentPrice, error) {
	var prices []models.CurrentPrice
	tx := r.db.WithContext(ctx).Raw(`
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

// UpsertCurrentPrice creates or updates a current price
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

	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "item_id"}, {Name: "observed_at"}},
		DoNothing: true,
	}).Create(&snapshot).Error; err != nil {
		r.logger.Errorw("Failed to insert price_latest snapshot", "itemID", price.ItemID, "error", err)
		return fmt.Errorf("failed to insert price_latest snapshot: %w", err)
	}
	return nil
}

// BulkUpsertCurrentPrices creates or updates multiple current prices
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
		if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
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

func sampleTimeseriesPoints(points []models.PriceTimeseriesPoint, targetPoints int) []models.PriceTimeseriesPoint {
	if len(points) <= targetPoints {
		return points
	}

	step := float64(len(points)) / float64(targetPoints)
	sampled := make([]models.PriceTimeseriesPoint, targetPoints)

	// First pass: select evenly-spaced sample points
	sampleIndices := make([]int, targetPoints)
	for i := 0; i < targetPoints; i++ {
		idx := int(float64(i) * step)
		if idx >= len(points) {
			idx = len(points) - 1
		}
		sampleIndices[i] = idx
		sampled[i] = points[idx]
	}

	// Second pass: fill missing values from neighbors
	for i := 0; i < targetPoints; i++ {
		currentIdx := sampleIndices[i]
		point := &sampled[i]

		// Determine the search range (neighbors closer to this sample than to others)
		leftBound := 0
		rightBound := len(points) - 1
		if i > 0 {
			leftBound = (sampleIndices[i-1] + currentIdx) / 2
		}
		if i < targetPoints-1 {
			rightBound = (currentIdx + sampleIndices[i+1]) / 2
		}

		// Fill missing AvgHighPrice
		if point.AvgHighPrice == nil {
			if neighbor := findClosestNeighborWithHigh(points, currentIdx, leftBound, rightBound); neighbor != nil {
				point.AvgHighPrice = neighbor.AvgHighPrice
			}
		}

		// Fill missing AvgLowPrice
		if point.AvgLowPrice == nil {
			if neighbor := findClosestNeighborWithLow(points, currentIdx, leftBound, rightBound); neighbor != nil {
				point.AvgLowPrice = neighbor.AvgLowPrice
			}
		}
	}

	return sampled
}

// findClosestNeighborWithHigh finds the nearest point with a non-nil AvgHighPrice
func findClosestNeighborWithHigh(points []models.PriceTimeseriesPoint, centerIdx, leftBound, rightBound int) *models.PriceTimeseriesPoint {
	closestDist := len(points)
	var closest *models.PriceTimeseriesPoint

	for i := leftBound; i <= rightBound; i++ {
		if points[i].AvgHighPrice != nil {
			dist := abs(i - centerIdx)
			if dist < closestDist {
				closestDist = dist
				closest = &points[i]
			}
		}
	}
	return closest
}

// findClosestNeighborWithLow finds the nearest point with a non-nil AvgLowPrice
func findClosestNeighborWithLow(points []models.PriceTimeseriesPoint, centerIdx, leftBound, rightBound int) *models.PriceTimeseriesPoint {
	closestDist := len(points)
	var closest *models.PriceTimeseriesPoint

	for i := leftBound; i <= rightBound; i++ {
		if points[i].AvgLowPrice != nil {
			dist := abs(i - centerIdx)
			if dist < closestDist {
				closestDist = dist
				closest = &points[i]
			}
		}
	}
	return closest
}

// abs returns the absolute value of an integer
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func sampleDailyPoints(points []models.PriceTimeseriesDaily, targetPoints int) []models.PriceTimeseriesDaily {
	if len(points) <= targetPoints {
		return points
	}

	step := float64(len(points)) / float64(targetPoints)
	sampled := make([]models.PriceTimeseriesDaily, targetPoints)

	// First pass: select evenly-spaced sample points
	sampleIndices := make([]int, targetPoints)
	for i := 0; i < targetPoints; i++ {
		idx := int(float64(i) * step)
		if idx >= len(points) {
			idx = len(points) - 1
		}
		sampleIndices[i] = idx
		sampled[i] = points[idx]
	}

	// Second pass: fill missing values from neighbors
	for i := 0; i < targetPoints; i++ {
		currentIdx := sampleIndices[i]
		point := &sampled[i]

		// Determine the search range (neighbors closer to this sample than to others)
		leftBound := 0
		rightBound := len(points) - 1
		if i > 0 {
			leftBound = (sampleIndices[i-1] + currentIdx) / 2
		}
		if i < targetPoints-1 {
			rightBound = (currentIdx + sampleIndices[i+1]) / 2
		}

		// Fill missing AvgHighPrice
		if point.AvgHighPrice == nil {
			if neighbor := findClosestDailyNeighborWithHigh(points, currentIdx, leftBound, rightBound); neighbor != nil {
				point.AvgHighPrice = neighbor.AvgHighPrice
			}
		}

		// Fill missing AvgLowPrice
		if point.AvgLowPrice == nil {
			if neighbor := findClosestDailyNeighborWithLow(points, currentIdx, leftBound, rightBound); neighbor != nil {
				point.AvgLowPrice = neighbor.AvgLowPrice
			}
		}
	}

	return sampled
}

// findClosestDailyNeighborWithHigh finds the nearest daily point with a non-nil AvgHighPrice
func findClosestDailyNeighborWithHigh(points []models.PriceTimeseriesDaily, centerIdx, leftBound, rightBound int) *models.PriceTimeseriesDaily {
	closestDist := len(points)
	var closest *models.PriceTimeseriesDaily

	for i := leftBound; i <= rightBound; i++ {
		if points[i].AvgHighPrice != nil {
			dist := abs(i - centerIdx)
			if dist < closestDist {
				closestDist = dist
				closest = &points[i]
			}
		}
	}
	return closest
}

// findClosestDailyNeighborWithLow finds the nearest daily point with a non-nil AvgLowPrice
func findClosestDailyNeighborWithLow(points []models.PriceTimeseriesDaily, centerIdx, leftBound, rightBound int) *models.PriceTimeseriesDaily {
	closestDist := len(points)
	var closest *models.PriceTimeseriesDaily

	for i := leftBound; i <= rightBound; i++ {
		if points[i].AvgLowPrice != nil {
			dist := abs(i - centerIdx)
			if dist < closestDist {
				closestDist = dist
				closest = &points[i]
			}
		}
	}
	return closest
}

func (r *priceRepository) InsertTimeseriesPoints(ctx context.Context, timestep string, points []models.PriceTimeseriesPoint) error {
	if len(points) == 0 {
		return nil
	}

	conflict := clause.OnConflict{
		Columns:   []clause.Column{{Name: "item_id"}, {Name: "timestamp"}},
		DoNothing: true,
	}

	batchSize := 2000
	switch normalizeTimestep(timestep) {
	case "5m":
		rows := make([]models.PriceTimeseries5m, len(points))
		for i := range points {
			rows[i] = models.PriceTimeseries5m{PriceTimeseriesPoint: points[i]}
		}
		for i := 0; i < len(rows); i += batchSize {
			end := i + batchSize
			if end > len(rows) {
				end = len(rows)
			}
			batch := rows[i:end]
			if err := r.db.WithContext(ctx).Clauses(conflict).Create(&batch).Error; err != nil {
				return fmt.Errorf("insert timeseries 5m batch: %w", err)
			}
		}
		return nil
	case "1h":
		rows := make([]models.PriceTimeseries1h, len(points))
		for i := range points {
			rows[i] = models.PriceTimeseries1h{PriceTimeseriesPoint: points[i]}
		}
		for i := 0; i < len(rows); i += batchSize {
			end := i + batchSize
			if end > len(rows) {
				end = len(rows)
			}
			batch := rows[i:end]
			if err := r.db.WithContext(ctx).Clauses(conflict).Create(&batch).Error; err != nil {
				return fmt.Errorf("insert timeseries 1h batch: %w", err)
			}
		}
		return nil
	case "6h":
		rows := make([]models.PriceTimeseries6h, len(points))
		for i := range points {
			rows[i] = models.PriceTimeseries6h{PriceTimeseriesPoint: points[i]}
		}
		for i := 0; i < len(rows); i += batchSize {
			end := i + batchSize
			if end > len(rows) {
				end = len(rows)
			}
			batch := rows[i:end]
			if err := r.db.WithContext(ctx).Clauses(conflict).Create(&batch).Error; err != nil {
				return fmt.Errorf("insert timeseries 6h batch: %w", err)
			}
		}
		return nil
	case "24h":
		rows := make([]models.PriceTimeseries24h, len(points))
		for i := range points {
			rows[i] = models.PriceTimeseries24h{PriceTimeseriesPoint: points[i]}
		}
		for i := 0; i < len(rows); i += batchSize {
			end := i + batchSize
			if end > len(rows) {
				end = len(rows)
			}
			batch := rows[i:end]
			if err := r.db.WithContext(ctx).Clauses(conflict).Create(&batch).Error; err != nil {
				return fmt.Errorf("insert timeseries 24h batch: %w", err)
			}
		}
		return nil
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

	batchSize := 2000
	for i := 0; i < len(points); i += batchSize {
		end := i + batchSize
		if end > len(points) {
			end = len(points)
		}
		batch := points[i:end]
		if err := r.db.WithContext(ctx).Clauses(conflict).Create(&batch).Error; err != nil {
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

	query := r.db.WithContext(ctx).Table(table).Where("item_id = ?", itemID)

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
		points = sampleTimeseriesPoints(points, *params.MaxPoints)
	}

	return points, nil
}

func (r *priceRepository) GetDailyPoints(ctx context.Context, itemID int, params models.PriceHistoryParams) ([]models.PriceTimeseriesDaily, error) {
	query := r.db.WithContext(ctx).Table("price_timeseries_daily").Where("item_id = ?", itemID)

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
		points = sampleDailyPoints(points, *params.MaxPoints)
	}

	return points, nil
}

func (r *priceRepository) Rollup24hToDailyBefore(ctx context.Context, cutoff time.Time) (int64, error) {
	cutoff = cutoff.UTC()

	// The 24h timestep is effectively daily; we store it as day-level rows in the rollup table.
	// Use ON CONFLICT DO NOTHING to keep append-only behavior.
	tx := r.db.WithContext(ctx).Exec(`
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
	tx := r.db.WithContext(ctx).Exec(`DELETE FROM price_latest WHERE observed_at < ?`, cutoff)
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
	tx := r.db.WithContext(ctx).Exec(stmt, cutoff)
	if tx.Error != nil {
		r.logger.Errorw("Failed to prune timeseries", "timestep", timestep, "table", table, "cutoff", cutoff, "error", tx.Error)
		return 0, fmt.Errorf("prune timeseries %s: %w", timestep, tx.Error)
	}
	return tx.RowsAffected, nil
}
