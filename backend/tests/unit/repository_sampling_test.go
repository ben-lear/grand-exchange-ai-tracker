package unit

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/guavi/osrs-ge-tracker/internal/models"
	"github.com/guavi/osrs-ge-tracker/internal/repository"
	"github.com/guavi/osrs-ge-tracker/internal/utils"
)

// TestSampleTimeseriesPoints_EvenlySpacedInTime verifies that sampling produces

// evenly-spaced points on the time axis, not array index axis.

func TestSampleTimeseriesPoints_EvenlySpacedInTime(t *testing.T) {

	// Create test data with irregular array spacing but regular time spacing

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	high3000 := int64(3000)

	high4000 := int64(4000)

	low500 := int64(500)

	// Data points at 0h, 1h, 2h, 3h, 4h (evenly spaced in time)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high3000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(3 * time.Hour), AvgHighPrice: &high4000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	// Sample to 3 points - should get points at ~0h, ~2h, ~4h

	sampled := repository.SampleTimeseriesPoints(points, 3)

	require.Len(t, sampled, 3, "Should return exactly 3 points")

	// Verify the sampled points are evenly distributed in time

	// Point 0 should be near 0h

	assert.True(t, sampled[0].Timestamp.Equal(baseTime) || sampled[0].Timestamp.Equal(baseTime.Add(1*time.Hour)),

		"First point should be at or near start time")

	// Point 1 should be near 2h (middle)

	assert.True(t, sampled[1].Timestamp.Equal(baseTime.Add(2*time.Hour)),

		"Middle point should be near the middle time (2h)")

	// Point 2 should be near 4h

	assert.True(t, sampled[2].Timestamp.Equal(baseTime.Add(4*time.Hour)) || sampled[2].Timestamp.Equal(baseTime.Add(3*time.Hour)),

		"Last point should be at or near end time")

}

// TestSampleTimeseriesPoints_IrregularSpacing tests sampling with irregular time gaps.

// With the new behavior, some target times may have empty zones and be skipped.

func TestSampleTimeseriesPoints_IrregularSpacing(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	low500 := int64(500)

	// Irregular spacing: many points in first hour, few in rest of day

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(10 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(20 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(30 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(40 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(50 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		// Large gap

		{ItemID: 1, Timestamp: baseTime.Add(12 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: &low500},

		// Another large gap

		{ItemID: 1, Timestamp: baseTime.Add(24 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	// Sample to 4 points - but may get fewer due to empty zones

	sampled := repository.SampleTimeseriesPoints(points, 4)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	require.LessOrEqual(t, len(sampled), 4, "Should not return more than requested")

	// Verify points span the time range (not all clustered in dense regions)

	if len(sampled) >= 2 {

		firstPoint := sampled[0].Timestamp

		lastPoint := sampled[len(sampled)-1].Timestamp

		timeDiff := lastPoint.Sub(firstPoint)

		assert.Greater(t, timeDiff, 10*time.Hour, "Sampled points should span a significant portion of the time range")

	}

}

// TestSampleTimeseriesPoints_WithNilValues tests that missing values are filled from neighbors.

// NOTE: Points with BOTH values missing are skipped entirely in the new behavior.

func TestSampleTimeseriesPoints_WithNilValues(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	low500 := int64(500)

	// Create points where some have partially nil prices (not both nil)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: nil, AvgLowPrice: &low500}, // Missing high only

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: nil}, // Missing low only

		{ItemID: 1, Timestamp: baseTime.Add(3 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(5 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: &low500},
	}

	// Sample to 3 points

	sampled := repository.SampleTimeseriesPoints(points, 3)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// All sampled points that have ONE value should have the other filled in

	for i, point := range sampled {

		// If point has one value, it should have both after neighbor fill

		hasHigh := point.AvgHighPrice != nil

		hasLow := point.AvgLowPrice != nil

		// Either both present or neither (skip entirely in new behavior)

		if hasHigh || hasLow {

			assert.NotNil(t, point.AvgHighPrice, "Point %d with at least one value should have AvgHighPrice filled", i)

			assert.NotNil(t, point.AvgLowPrice, "Point %d with at least one value should have AvgLowPrice filled", i)

		}

	}

}

// TestSampleTimeseriesPoints_NoSamplingNeeded tests that if points <= target, returns all points.

func TestSampleTimeseriesPoints_NoSamplingNeeded(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	// Request same or more points than available

	sampled := repository.SampleTimeseriesPoints(points, 3)

	assert.Equal(t, points, sampled, "Should return all points unchanged when no sampling needed")

	sampled = repository.SampleTimeseriesPoints(points, 5)

	assert.Equal(t, points, sampled, "Should return all points when target exceeds available")

}

// TestSampleTimeseriesPoints_EdgeCases tests boundary conditions.

func TestSampleTimeseriesPoints_EdgeCases(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	t.Run("sample to 1 point", func(t *testing.T) {

		points := []models.PriceTimeseriesPoint{

			{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

			{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},

			{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},
		}

		sampled := repository.SampleTimeseriesPoints(points, 1)

		require.Len(t, sampled, 1)

		// Should get first point (or one close to start)

		assert.True(t, sampled[0].Timestamp.Equal(baseTime) || sampled[0].Timestamp.Before(baseTime.Add(30*time.Minute)))

	})

	t.Run("sample to 2 points", func(t *testing.T) {

		points := []models.PriceTimeseriesPoint{

			{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

			{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},

			{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},
		}

		sampled := repository.SampleTimeseriesPoints(points, 2)

		require.Len(t, sampled, 2)

		// Should get start and end (or close to them)

		assert.True(t, sampled[0].Timestamp.Equal(baseTime) || sampled[0].Timestamp.Before(baseTime.Add(30*time.Minute)))

		assert.True(t, sampled[1].Timestamp.Equal(baseTime.Add(2*time.Hour)) || sampled[1].Timestamp.After(baseTime.Add(90*time.Minute)))

	})

}

// TestSampleDailyPoints_EvenlySpacedInTime verifies daily sampling produces

// evenly-spaced points on the time axis.

func TestSampleDailyPoints_EvenlySpacedInTime(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	low500 := int64(500)

	// Create 10 days of data

	points := make([]models.PriceTimeseriesDaily, 10)

	for i := 0; i < 10; i++ {

		price := high1000

		if i%2 == 0 {

			price = high2000

		}

		points[i] = models.PriceTimeseriesDaily{

			ItemID: 1,

			Day: baseDay.AddDate(0, 0, i),

			AvgHighPrice: &price,

			AvgLowPrice: &low500,
		}

	}

	// Sample to 4 points - should get days ~0, ~3, ~6, ~9

	sampled := repository.SampleDailyPoints(points, 4)

	require.Len(t, sampled, 4, "Should return exactly 4 points")

	// Verify time distribution

	assert.True(t, sampled[0].Day.Equal(baseDay) || sampled[0].Day.Equal(baseDay.AddDate(0, 0, 1)),

		"First point should be at or near start")

	// Should span the full range

	firstDay := sampled[0].Day

	lastDay := sampled[len(sampled)-1].Day

	daysDiff := lastDay.Sub(firstDay).Hours() / 24

	assert.Greater(t, daysDiff, 7.0, "Sampled points should span most of the 10-day range")

}

// TestSampleDailyPoints_IrregularSpacing tests daily sampling with gaps.

// With the new behavior, some target times may have empty zones and be skipped.

func TestSampleDailyPoints_IrregularSpacing(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	// Irregular spacing: days 0, 1, 2, then jump to 10, 11, then jump to 30

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 2), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 10), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 11), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 30), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	// Sample to 4 points - but may get fewer due to empty zones

	sampled := repository.SampleDailyPoints(points, 4)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	require.LessOrEqual(t, len(sampled), 4, "Should not return more than requested")

	// Verify points span the time range if we have multiple points

	if len(sampled) >= 2 {

		firstDay := sampled[0].Day

		lastDay := sampled[len(sampled)-1].Day

		daysDiff := lastDay.Sub(firstDay).Hours() / 24

		assert.Greater(t, daysDiff, 5.0, "Sampled points should span a significant portion of the time range")

	}

}

// TestSampleDailyPoints_WithNilValues tests that missing values are filled.

// NOTE: Points with BOTH values missing are skipped entirely in the new behavior.

func TestSampleDailyPoints_WithNilValues(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: nil, AvgLowPrice: &low500}, // Missing high only

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 2), AvgHighPrice: &high1000, AvgLowPrice: nil}, // Missing low only

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 3), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 4), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleDailyPoints(points, 3)

	require.GreaterOrEqual(t, len(sampled), 1)

	// All points with at least one value should have both filled

	for i, point := range sampled {

		hasHigh := point.AvgHighPrice != nil

		hasLow := point.AvgLowPrice != nil

		if hasHigh || hasLow {

			assert.NotNil(t, point.AvgHighPrice, "Point %d should have AvgHighPrice filled", i)

			assert.NotNil(t, point.AvgLowPrice, "Point %d should have AvgLowPrice filled", i)

		}

	}

}

// TestSampleDailyPoints_NoSamplingNeeded tests boundary conditions for daily sampling.

func TestSampleDailyPoints_NoSamplingNeeded(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 2), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleDailyPoints(points, 3)

	assert.Equal(t, points, sampled, "Should return all points unchanged")

	sampled = repository.SampleDailyPoints(points, 5)

	assert.Equal(t, points, sampled, "Should return all points when target exceeds available")

}

// TestFindClosestNeighbor_TimeProximity verifies neighbor finding uses time distance.

func TestFindClosestNeighbor_TimeProximity(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC) // Noon

	high1000 := int64(1000)

	high2000 := int64(2000)

	high3000 := int64(3000)

	// Points at different times with varying values

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime.Add(-2 * time.Hour), AvgHighPrice: &high1000}, // 10 AM

		{ItemID: 1, Timestamp: baseTime.Add(-30 * time.Minute), AvgHighPrice: &high2000}, // 11:30 AM

		{ItemID: 1, Timestamp: baseTime.Add(30 * time.Minute), AvgHighPrice: nil}, // 12:30 PM (nil)

		{ItemID: 1, Timestamp: baseTime.Add(45 * time.Minute), AvgHighPrice: &high3000}, // 12:45 PM

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: nil}, // 2 PM (nil)

	}

	// Find neighbor for noon, searching from 11AM to 1PM

	leftBound := baseTime.Add(-1 * time.Hour)

	rightBound := baseTime.Add(1 * time.Hour)

	closest := utils.FindClosestWithField(points, baseTime, leftBound, rightBound,

		func(p models.PriceTimeseriesPoint) time.Time { return p.Timestamp },

		func(p models.PriceTimeseriesPoint) *int64 { return p.AvgHighPrice })

	require.NotNil(t, closest, "Should find a neighbor")

	// Should find the 11:30 AM point (30 min away), not the 12:45 PM (45 min away)

	assert.Equal(t, int64(2000), *closest.AvgHighPrice, "Should find the time-closest neighbor with non-nil value")

	assert.True(t, closest.Timestamp.Equal(baseTime.Add(-30*time.Minute)), "Should be the 11:30 AM point")

}

// TestFindClosestDailyNeighbor_TimeProximity verifies daily neighbor finding.

func TestFindClosestDailyNeighbor_TimeProximity(t *testing.T) {

	baseDay := time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC) // Jan 15

	high1000 := int64(1000)

	high2000 := int64(2000)

	high3000 := int64(3000)

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay.AddDate(0, 0, -5), AvgHighPrice: &high1000}, // Jan 10

		{ItemID: 1, Day: baseDay.AddDate(0, 0, -2), AvgHighPrice: &high2000}, // Jan 13

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 3), AvgHighPrice: nil}, // Jan 18 (nil)

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 4), AvgHighPrice: &high3000}, // Jan 19

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 10), AvgHighPrice: nil}, // Jan 25 (nil)

	}

	// Find neighbor for Jan 15, searching from Jan 12 to Jan 18

	leftBound := baseDay.AddDate(0, 0, -3)

	rightBound := baseDay.AddDate(0, 0, 3)

	closest := utils.FindClosestWithField(points, baseDay, leftBound, rightBound,

		func(p models.PriceTimeseriesDaily) time.Time { return p.Day },

		func(p models.PriceTimeseriesDaily) *int64 { return p.AvgHighPrice })

	require.NotNil(t, closest, "Should find a neighbor")

	// Should find Jan 13 (2 days away), not Jan 19 (4 days away, and outside range)

	assert.Equal(t, int64(2000), *closest.AvgHighPrice)

	assert.True(t, closest.Day.Equal(baseDay.AddDate(0, 0, -2)), "Should be Jan 13")

}

// TestSampleTimeseriesPoints_PointsClosestToTheirTargetTime verifies that each sampled

// point is closer to its assigned target time than to neighboring target times.

// This is a critical property to prevent points from being "stolen" by adjacent samples.

func TestSampleTimeseriesPoints_PointsClosestToTheirTargetTime(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	// Create MORE points than targets to actually test Voronoi partitioning

	// Data points: 0h, 0.8h, 1.6h, 1.8h, 2h (5 points)

	// Requesting 3 samples

	// Target times will be: 0h, 1h, 2h (with timeStep = 1h)

	// Ownership zones:

	//   target[0] at 0h: [0h, 0.5h) → should select 0h

	//   target[1] at 1h: [0.5h, 1.5h) → should select 0.8h (closest to 1h)

	//   target[2] at 2h: [1.5h, 2h] → should select 2h (closest to 2h)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 0h

		{ItemID: 1, Timestamp: baseTime.Add(48 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 0.8h

		{ItemID: 1, Timestamp: baseTime.Add(96 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 1.6h

		{ItemID: 1, Timestamp: baseTime.Add(108 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 1.8h

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 2h

	}

	// Sample to 3 points

	sampled := repository.SampleTimeseriesPoints(points, 3)

	require.Len(t, sampled, 3, "Should return 3 points")

	// Verify each sampled point is closest to its assigned target

	// sampled[0] should be from zone [0h, 0.5h) → expect 0h

	assert.Equal(t, baseTime, sampled[0].Timestamp, "First sample should be 0h")

	// sampled[1] should be from zone [0.5h, 1.5h) → expect 0.8h

	assert.Equal(t, baseTime.Add(48*time.Minute), sampled[1].Timestamp, "Second sample should be 0.8h (closest to 1h)")

	// sampled[2] should be from zone [1.5h, 2h] → expect 2h

	assert.Equal(t, baseTime.Add(2*time.Hour), sampled[2].Timestamp, "Third sample should be 2h")

}

// TestSampleTimeseriesPoints_EmptyZonesSkipped verifies that when an ownership zone

// has no data points, that zone is skipped and fewer points are returned.

func TestSampleTimeseriesPoints_EmptyZonesSkipped(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	// Create data with a large gap in the middle (MORE points than targets)

	// Data points: 0h, 0.1h, 0.2h, 3.8h, 3.9h, 4h (6 points, requesting 4 targets)

	// Target times: 0h, 1.33h, 2.67h, 4h (with timeStep ≈ 1.33h)

	// Ownership zones with midpoints:

	//   target[0] at 0h: [0h, 0.67h) → has 0h, 0.1h, 0.2h → selects 0h

	//   target[1] at 1.33h: [0.67h, 2h) → EMPTY

	//   target[2] at 2.67h: [2h, 3.33h) → EMPTY

	//   target[3] at 4h: [3.33h, 4h+1ns) → has 3.8h, 3.9h, 4h → selects 4h

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 0h

		{ItemID: 1, Timestamp: baseTime.Add(6 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 0.1h

		{ItemID: 1, Timestamp: baseTime.Add(12 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 0.2h

		{ItemID: 1, Timestamp: baseTime.Add(228 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 3.8h

		{ItemID: 1, Timestamp: baseTime.Add(234 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 3.9h

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 4h

	}

	// Sample to 4 points, but expect only 2 due to empty zones

	sampled := repository.SampleTimeseriesPoints(points, 4)

	require.Len(t, sampled, 2, "Should return only 2 points (2 zones are empty)")

	// First sample should be 0h (closest to target 0h)

	assert.Equal(t, baseTime, sampled[0].Timestamp, "First sample should be 0h")

	// Second sample should be 4h (closest to target 4h)

	assert.Equal(t, baseTime.Add(4*time.Hour), sampled[1].Timestamp, "Second sample should be 4h")

}

// TestSampleTimeseriesPoints_SinglePointPerZone verifies correct selection when

// exactly one point falls in each zone.

func TestSampleTimeseriesPoints_SinglePointPerZone(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	high3000 := int64(3000)

	low500 := int64(500)

	// Points exactly at the boundaries between zones should be deterministic

	// Data: 0h, 3h, 6h (3 points)

	// Targets: 0h, 3h, 6h (3 targets, timeStep=3h)

	// Zones: [0h, 1.5h), [1.5h, 4.5h), [4.5h, 6h+1ns)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(3 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(6 * time.Hour), AvgHighPrice: &high3000, AvgLowPrice: &low500},
	}

	// This should return all points unchanged since len(points) <= targetPoints

	sampled := repository.SampleTimeseriesPoints(points, 3)

	require.Len(t, sampled, 3, "Should return all 3 points")

	assert.Equal(t, high1000, *sampled[0].AvgHighPrice)

	assert.Equal(t, high2000, *sampled[1].AvgHighPrice)

	assert.Equal(t, high3000, *sampled[2].AvgHighPrice)

}

// TestSampleTimeseriesPoints_MultiplePointsInZone verifies that the closest point

// to the target time is selected when multiple points fall in the same zone.

func TestSampleTimeseriesPoints_MultiplePointsInZone(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	high3000 := int64(3000)

	high4000 := int64(4000)

	low500 := int64(500)

	// Target: 3 samples over 6h → targets at 0h, 3h, 6h

	// Zone[1] at 3h: [1.5h, 4.5h) contains points at 2h, 2.5h, 3.2h, 4h

	// 3.2h is closest to target 3h

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 0h

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: &low500}, // 2h

		{ItemID: 1, Timestamp: baseTime.Add(150 * time.Minute), AvgHighPrice: &high3000, AvgLowPrice: &low500}, // 2.5h

		{ItemID: 1, Timestamp: baseTime.Add(192 * time.Minute), AvgHighPrice: &high4000, AvgLowPrice: &low500}, // 3.2h (closest to 3h)

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500}, // 4h

		{ItemID: 1, Timestamp: baseTime.Add(6 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: &low500}, // 6h

	}

	sampled := repository.SampleTimeseriesPoints(points, 3)

	require.Len(t, sampled, 3, "Should return 3 points")

	// Middle point should be 3.2h (192min), as it's closest to target 3h

	assert.Equal(t, baseTime.Add(192*time.Minute), sampled[1].Timestamp,

		"Should select 3.2h as closest to target 3h")

	assert.Equal(t, high4000, *sampled[1].AvgHighPrice)

}

// =============================================================================

// EDGE CASE TESTS (Step 1 of REFACTOR_SAMPLING.md)

// These tests lock in current behavior before the generic refactor.

// =============================================================================

// --- Boundary Condition Tests ---

// TestSampleTimeseries_TargetEqualsLength verifies that when targetPoints equals

// the length of the input, the input is returned unchanged.

func TestSampleTimeseries_TargetEqualsLength(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(3 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleTimeseriesPoints(points, 5)

	assert.Equal(t, points, sampled, "Should return input unchanged when target equals length")

}

// TestSampleTimeseries_TargetEqualsLengthMinusOne verifies sampling when

// targetPoints is exactly one less than input length.

func TestSampleTimeseries_TargetEqualsLengthMinusOne(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(3 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleTimeseriesPoints(points, 4)

	require.Len(t, sampled, 4, "Should return exactly 4 points")

	// First and last should be preserved (or close to them)

	assert.True(t, sampled[0].Timestamp.Equal(baseTime) ||

		sampled[0].Timestamp.Before(baseTime.Add(30*time.Minute)),

		"First sample should be at or near start")

	assert.True(t, sampled[len(sampled)-1].Timestamp.Equal(baseTime.Add(4*time.Hour)) ||

		sampled[len(sampled)-1].Timestamp.After(baseTime.Add(3*time.Hour+30*time.Minute)),

		"Last sample should be at or near end")

}

// TestSampleTimeseries_ZeroDurationSpan verifies behavior when all points have

// identical timestamps (zero time span).

func TestSampleTimeseries_ZeroDurationSpan(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	high3000 := int64(3000)

	low500 := int64(500)

	// All points at the same timestamp

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high2000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high3000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleTimeseriesPoints(points, 2)

	// With zero duration, timeStep will be 0, all points are at the same time.

	// All points fall into the first zone (which includes all points from start to end).

	// The algorithm should not crash and should return something reasonable.

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	require.LessOrEqual(t, len(sampled), 2, "Should not return more than requested")

}

// TestSampleTimeseries_SinglePointInput verifies behavior with exactly 1 input point.

func TestSampleTimeseries_SinglePointInput(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	// Requesting more than available

	sampled := repository.SampleTimeseriesPoints(points, 5)

	assert.Equal(t, points, sampled, "Should return the single point unchanged")

	// Requesting exactly 1

	sampled = repository.SampleTimeseriesPoints(points, 1)

	assert.Equal(t, points, sampled, "Should return the single point")

}

// TestSampleTimeseries_TwoPointInput verifies behavior with exactly 2 input points.

func TestSampleTimeseries_TwoPointInput(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	low500 := int64(500)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: &low500},
	}

	// Requesting 2 (equals length) - should return unchanged

	sampled := repository.SampleTimeseriesPoints(points, 2)

	assert.Equal(t, points, sampled, "Should return both points unchanged")

	// Requesting 1 - should return first point

	sampled = repository.SampleTimeseriesPoints(points, 1)

	require.Len(t, sampled, 1)

	assert.Equal(t, baseTime, sampled[0].Timestamp, "Should return first point when sampling to 1")

}

// --- Sparse Data Tests ---

// TestSampleTimeseries_LargeGapsBetweenPoints tests sampling with points clustered

// at start and end with a large empty gap in the middle.

func TestSampleTimeseries_LargeGapsBetweenPoints(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	// Cluster at start (0-10min), large gap, cluster at end (23h50m-24h)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(5 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(10 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		// Large gap

		{ItemID: 1, Timestamp: baseTime.Add(23*time.Hour + 50*time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(23*time.Hour + 55*time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(24 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	// Request 5 samples - middle zones will be empty

	sampled := repository.SampleTimeseriesPoints(points, 5)

	// Should have points from start cluster and end cluster

	require.GreaterOrEqual(t, len(sampled), 2, "Should return at least 2 points (start and end clusters)")

	require.LessOrEqual(t, len(sampled), 5, "Should not return more than requested")

	// First sample should be from start cluster

	assert.True(t, sampled[0].Timestamp.Before(baseTime.Add(1*time.Hour)),

		"First sample should be from start cluster")

	// Last sample should be from end cluster

	assert.True(t, sampled[len(sampled)-1].Timestamp.After(baseTime.Add(23*time.Hour)),

		"Last sample should be from end cluster")

}

// TestSampleTimeseries_AlternatingNilHighLow tests sampling when points alternate

// between having nil high and nil low values.

func TestSampleTimeseries_AlternatingNilHighLow(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	// Alternating nil pattern

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: nil},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: nil},

		{ItemID: 1, Timestamp: baseTime.Add(3 * time.Hour), AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: nil},

		{ItemID: 1, Timestamp: baseTime.Add(5 * time.Hour), AvgHighPrice: nil, AvgLowPrice: &low500},
	}

	sampled := repository.SampleTimeseriesPoints(points, 3)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// All sampled points with one value should have both filled from neighbors

	for i, point := range sampled {

		if point.AvgHighPrice != nil || point.AvgLowPrice != nil {

			assert.NotNil(t, point.AvgHighPrice, "Point %d should have AvgHighPrice filled", i)

			assert.NotNil(t, point.AvgLowPrice, "Point %d should have AvgLowPrice filled", i)

		}

	}

}

// TestSampleTimeseries_AllHighsNil tests sampling when all AvgHighPrice values are nil.

func TestSampleTimeseries_AllHighsNil(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	low500 := int64(500)

	low600 := int64(600)

	low700 := int64(700)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: nil, AvgLowPrice: &low600},

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: nil, AvgLowPrice: &low700},

		{ItemID: 1, Timestamp: baseTime.Add(3 * time.Hour), AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: nil, AvgLowPrice: &low600},
	}

	sampled := repository.SampleTimeseriesPoints(points, 3)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// AvgHighPrice should remain nil (no neighbors have it)

	for _, point := range sampled {

		assert.Nil(t, point.AvgHighPrice, "AvgHighPrice should remain nil when no neighbor has it")

		assert.NotNil(t, point.AvgLowPrice, "AvgLowPrice should be present")

	}

}

// TestSampleTimeseries_AllLowsNil tests sampling when all AvgLowPrice values are nil.

func TestSampleTimeseries_AllLowsNil(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	high3000 := int64(3000)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: nil},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: nil},

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high3000, AvgLowPrice: nil},

		{ItemID: 1, Timestamp: baseTime.Add(3 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: nil},

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: nil},
	}

	sampled := repository.SampleTimeseriesPoints(points, 3)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// AvgLowPrice should remain nil (no neighbors have it)

	for _, point := range sampled {

		assert.NotNil(t, point.AvgHighPrice, "AvgHighPrice should be present")

		assert.Nil(t, point.AvgLowPrice, "AvgLowPrice should remain nil when no neighbor has it")

	}

}

// --- Neighbor-Filling Edge Cases ---

// TestSampleTimeseries_FirstSampledPointMissingValue tests neighbor-filling when

// the first selected point is missing a value.

func TestSampleTimeseries_FirstSampledPointMissingValue(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	low500 := int64(500)

	// First point is missing AvgHighPrice

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(30 * time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleTimeseriesPoints(points, 2)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// If first point was sampled and had nil high, it should be filled from neighbor

	if sampled[0].Timestamp.Equal(baseTime) {

		assert.NotNil(t, sampled[0].AvgHighPrice, "First point's missing high should be filled from neighbor")

	}

}

// TestSampleTimeseries_LastSampledPointMissingValue tests neighbor-filling when

// the last selected point is missing a value.

func TestSampleTimeseries_LastSampledPointMissingValue(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	// Last point is missing AvgLowPrice

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1*time.Hour + 30*time.Minute), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: nil},
	}

	sampled := repository.SampleTimeseriesPoints(points, 2)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// If last point was sampled and had nil low, it should be filled from neighbor

	lastIdx := len(sampled) - 1

	if sampled[lastIdx].Timestamp.Equal(baseTime.Add(2 * time.Hour)) {

		assert.NotNil(t, sampled[lastIdx].AvgLowPrice, "Last point's missing low should be filled from neighbor")

	}

}

// TestSampleTimeseries_AllNeighborsInRangeMissingValue tests when no valid neighbor

// exists in the search range for filling a missing value.

func TestSampleTimeseries_AllNeighborsInRangeMissingValue(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	// Points are spaced so that zone boundaries might exclude neighbors with values

	// Point at 2h has nil high; neighbors in its zone also have nil high

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(2 * time.Hour), AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(3 * time.Hour), AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleTimeseriesPoints(points, 3)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// Middle point (if sampled) may have nil AvgHighPrice if no neighbors in range have it

	// This documents current behavior - nil remains nil if no neighbor found

	for _, point := range sampled {

		// Points with only AvgLowPrice should retain nil AvgHighPrice if no neighbor found

		assert.NotNil(t, point.AvgLowPrice, "AvgLowPrice should always be present")

	}

}

// TestSampleTimeseries_ExactTieInTimeDistance tests behavior when two neighbors

// are equidistant from the center time.

func TestSampleTimeseries_ExactTieInTimeDistance(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC) // Noon

	high1000 := int64(1000)

	high2000 := int64(2000)

	// Two points equidistant from center (noon)

	// Point at 11:30 and 12:30 are both 30 min from noon

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime.Add(-30 * time.Minute), AvgHighPrice: &high1000}, // 11:30

		{ItemID: 1, Timestamp: baseTime.Add(30 * time.Minute), AvgHighPrice: &high2000}, // 12:30

	}

	leftBound := baseTime.Add(-1 * time.Hour)

	rightBound := baseTime.Add(1 * time.Hour)

	closest := utils.FindClosestWithField(points, baseTime, leftBound, rightBound,

		func(p models.PriceTimeseriesPoint) time.Time { return p.Timestamp },

		func(p models.PriceTimeseriesPoint) *int64 { return p.AvgHighPrice })

	require.NotNil(t, closest, "Should find a neighbor")

	// Current behavior: first found wins when equidistant (iteration order)

	// This test documents the current behavior

	assert.Equal(t, int64(1000), *closest.AvgHighPrice,

		"Should return first equidistant neighbor (current behavior)")

}

// --- Voronoi Zone Edge Cases ---

// TestSampleTimeseries_PointExactlyOnZoneBoundary tests when a point's timestamp

// equals a zone boundary exactly.

func TestSampleTimeseries_PointExactlyOnZoneBoundary(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	high3000 := int64(3000)

	low500 := int64(500)

	// 3 targets over 4h: targets at 0h, 2h, 4h

	// Zone boundaries: 0h, 1h (midpoint 0-2), 3h (midpoint 2-4), 4h

	// Place a point exactly at 1h (boundary between zone 0 and zone 1)

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(1 * time.Hour), AvgHighPrice: &high2000, AvgLowPrice: &low500}, // Exactly on boundary

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: &high3000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleTimeseriesPoints(points, 3)

	// With 3 points and 3 targets, should return all points unchanged

	require.Len(t, sampled, 3, "Should return all 3 points")

}

// TestSampleTimeseries_AllPointsInSingleZone tests when all points cluster

// within one zone.

func TestSampleTimeseries_AllPointsInSingleZone(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	high3000 := int64(3000)

	low500 := int64(500)

	// Total span 4h, but all points within first 10 minutes

	// Targets at 0h, 2h, 4h; zones: [0h, 1h), [1h, 3h), [3h, 4h+1ns)

	// All points fall in zone 0

	points := []models.PriceTimeseriesPoint{

		{ItemID: 1, Timestamp: baseTime, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(3 * time.Minute), AvgHighPrice: &high2000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(6 * time.Minute), AvgHighPrice: &high3000, AvgLowPrice: &low500},

		{ItemID: 1, Timestamp: baseTime.Add(4 * time.Hour), AvgHighPrice: &high1000, AvgLowPrice: &low500}, // End marker for span

	}

	sampled := repository.SampleTimeseriesPoints(points, 3)

	// Should have at least 2 points (from populated zones)

	require.GreaterOrEqual(t, len(sampled), 2, "Should return points from populated zones")

	require.LessOrEqual(t, len(sampled), 3, "Should not return more than requested")

}

// =============================================================================

// DAILY POINT EDGE CASE TESTS (Parity with Timeseries tests)

// =============================================================================

// --- Boundary Condition Tests for Daily ---

// TestSampleDaily_TargetEqualsLength verifies that when targetPoints equals

// the length of the input, the input is returned unchanged.

func TestSampleDaily_TargetEqualsLength(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 2), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 3), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 4), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleDailyPoints(points, 5)

	assert.Equal(t, points, sampled, "Should return input unchanged when target equals length")

}

// TestSampleDaily_TargetEqualsLengthMinusOne verifies sampling when

// targetPoints is exactly one less than input length.

func TestSampleDaily_TargetEqualsLengthMinusOne(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 2), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 3), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 4), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleDailyPoints(points, 4)

	require.Len(t, sampled, 4, "Should return exactly 4 points")

	// First and last should be preserved (or close to them)

	assert.True(t, sampled[0].Day.Equal(baseDay) ||

		sampled[0].Day.Before(baseDay.AddDate(0, 0, 1)),

		"First sample should be at or near start")

	assert.True(t, sampled[len(sampled)-1].Day.Equal(baseDay.AddDate(0, 0, 4)) ||

		sampled[len(sampled)-1].Day.After(baseDay.AddDate(0, 0, 3)),

		"Last sample should be at or near end")

}

// TestSampleDaily_ZeroDurationSpan verifies behavior when all points have

// identical days (zero time span).

func TestSampleDaily_ZeroDurationSpan(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	high3000 := int64(3000)

	low500 := int64(500)

	// All points on the same day (unusual but possible with duplicate timestamps)

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high2000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high3000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleDailyPoints(points, 2)

	// Should not crash and should return something reasonable

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	require.LessOrEqual(t, len(sampled), 2, "Should not return more than requested")

}

// TestSampleDaily_SinglePointInput verifies behavior with exactly 1 input point.

func TestSampleDaily_SinglePointInput(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	// Requesting more than available

	sampled := repository.SampleDailyPoints(points, 5)

	assert.Equal(t, points, sampled, "Should return the single point unchanged")

	// Requesting exactly 1

	sampled = repository.SampleDailyPoints(points, 1)

	assert.Equal(t, points, sampled, "Should return the single point")

}

// TestSampleDaily_TwoPointInput verifies behavior with exactly 2 input points.

func TestSampleDaily_TwoPointInput(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	low500 := int64(500)

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: &high2000, AvgLowPrice: &low500},
	}

	// Requesting 2 (equals length) - should return unchanged

	sampled := repository.SampleDailyPoints(points, 2)

	assert.Equal(t, points, sampled, "Should return both points unchanged")

	// Requesting 1 - should return first point

	sampled = repository.SampleDailyPoints(points, 1)

	require.Len(t, sampled, 1)

	assert.Equal(t, baseDay, sampled[0].Day, "Should return first point when sampling to 1")

}

// --- Sparse Data Tests for Daily ---

// TestSampleDaily_LargeGapsBetweenPoints tests sampling with days clustered

// at start and end with a large empty gap in the middle.

func TestSampleDaily_LargeGapsBetweenPoints(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	// Cluster at start (days 0-2), large gap, cluster at end (days 88-90)

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 2), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		// Large gap

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 88), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 89), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 90), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	// Request 5 samples - middle zones will be empty

	sampled := repository.SampleDailyPoints(points, 5)

	// Should have points from start cluster and end cluster

	require.GreaterOrEqual(t, len(sampled), 2, "Should return at least 2 points (start and end clusters)")

	require.LessOrEqual(t, len(sampled), 5, "Should not return more than requested")

	// First sample should be from start cluster

	assert.True(t, sampled[0].Day.Before(baseDay.AddDate(0, 0, 10)),

		"First sample should be from start cluster")

	// Last sample should be from end cluster

	assert.True(t, sampled[len(sampled)-1].Day.After(baseDay.AddDate(0, 0, 80)),

		"Last sample should be from end cluster")

}

// TestSampleDaily_AlternatingNilHighLow tests sampling when points alternate

// between having nil high and nil low values.

func TestSampleDaily_AlternatingNilHighLow(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	// Alternating nil pattern

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: nil},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 2), AvgHighPrice: &high1000, AvgLowPrice: nil},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 3), AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 4), AvgHighPrice: &high1000, AvgLowPrice: nil},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 5), AvgHighPrice: nil, AvgLowPrice: &low500},
	}

	sampled := repository.SampleDailyPoints(points, 3)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// All sampled points with one value should have both filled from neighbors

	for i, point := range sampled {

		if point.AvgHighPrice != nil || point.AvgLowPrice != nil {

			assert.NotNil(t, point.AvgHighPrice, "Point %d should have AvgHighPrice filled", i)

			assert.NotNil(t, point.AvgLowPrice, "Point %d should have AvgLowPrice filled", i)

		}

	}

}

// TestSampleDaily_AllHighsNil tests sampling when all AvgHighPrice values are nil.

func TestSampleDaily_AllHighsNil(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	low500 := int64(500)

	low600 := int64(600)

	low700 := int64(700)

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: nil, AvgLowPrice: &low600},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 2), AvgHighPrice: nil, AvgLowPrice: &low700},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 3), AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 4), AvgHighPrice: nil, AvgLowPrice: &low600},
	}

	sampled := repository.SampleDailyPoints(points, 3)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// AvgHighPrice should remain nil (no neighbors have it)

	for _, point := range sampled {

		assert.Nil(t, point.AvgHighPrice, "AvgHighPrice should remain nil when no neighbor has it")

		assert.NotNil(t, point.AvgLowPrice, "AvgLowPrice should be present")

	}

}

// TestSampleDaily_AllLowsNil tests sampling when all AvgLowPrice values are nil.

func TestSampleDaily_AllLowsNil(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	high3000 := int64(3000)

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: nil},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: &high2000, AvgLowPrice: nil},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 2), AvgHighPrice: &high3000, AvgLowPrice: nil},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 3), AvgHighPrice: &high1000, AvgLowPrice: nil},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 4), AvgHighPrice: &high2000, AvgLowPrice: nil},
	}

	sampled := repository.SampleDailyPoints(points, 3)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// AvgLowPrice should remain nil (no neighbors have it)

	for _, point := range sampled {

		assert.NotNil(t, point.AvgHighPrice, "AvgHighPrice should be present")

		assert.Nil(t, point.AvgLowPrice, "AvgLowPrice should remain nil when no neighbor has it")

	}

}

// --- Neighbor-Filling Edge Cases for Daily ---

// TestSampleDaily_FirstSampledPointMissingValue tests neighbor-filling when

// the first selected point is missing a value.

func TestSampleDaily_FirstSampledPointMissingValue(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	high2000 := int64(2000)

	low500 := int64(500)

	// First point is missing AvgHighPrice

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: nil, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 2), AvgHighPrice: &high2000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 3), AvgHighPrice: &high1000, AvgLowPrice: &low500},
	}

	sampled := repository.SampleDailyPoints(points, 2)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// If first point was sampled and had nil high, it should be filled from neighbor

	if sampled[0].Day.Equal(baseDay) {

		assert.NotNil(t, sampled[0].AvgHighPrice, "First point's missing high should be filled from neighbor")

	}

}

// TestSampleDaily_LastSampledPointMissingValue tests neighbor-filling when

// the last selected point is missing a value.

func TestSampleDaily_LastSampledPointMissingValue(t *testing.T) {

	baseDay := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	high1000 := int64(1000)

	low500 := int64(500)

	// Last point is missing AvgLowPrice

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay, AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 2), AvgHighPrice: &high1000, AvgLowPrice: &low500},

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 3), AvgHighPrice: &high1000, AvgLowPrice: nil},
	}

	sampled := repository.SampleDailyPoints(points, 2)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	// If last point was sampled and had nil low, it should be filled from neighbor

	lastIdx := len(sampled) - 1

	if sampled[lastIdx].Day.Equal(baseDay.AddDate(0, 0, 3)) {

		assert.NotNil(t, sampled[lastIdx].AvgLowPrice, "Last point's missing low should be filled from neighbor")

	}

}

// TestSampleDaily_ExactTieInTimeDistance tests behavior when two neighbors

// are equidistant from the center day.

func TestSampleDaily_ExactTieInTimeDistance(t *testing.T) {

	baseDay := time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC) // Jan 15

	high1000 := int64(1000)

	high2000 := int64(2000)

	// Two points equidistant from center (Jan 15)

	// Jan 14 and Jan 16 are both 1 day from Jan 15

	points := []models.PriceTimeseriesDaily{

		{ItemID: 1, Day: baseDay.AddDate(0, 0, -1), AvgHighPrice: &high1000}, // Jan 14

		{ItemID: 1, Day: baseDay.AddDate(0, 0, 1), AvgHighPrice: &high2000}, // Jan 16

	}

	leftBound := baseDay.AddDate(0, 0, -3)

	rightBound := baseDay.AddDate(0, 0, 3)

	closest := utils.FindClosestWithField(points, baseDay, leftBound, rightBound,

		func(p models.PriceTimeseriesDaily) time.Time { return p.Day },

		func(p models.PriceTimeseriesDaily) *int64 { return p.AvgHighPrice })

	require.NotNil(t, closest, "Should find a neighbor")

	// Current behavior: first found wins when equidistant (iteration order)

	assert.Equal(t, int64(1000), *closest.AvgHighPrice,

		"Should return first equidistant neighbor (current behavior)")

}
