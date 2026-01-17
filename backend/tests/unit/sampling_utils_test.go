package unit

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/guavi/osrs-ge-tracker/internal/utils"
)

// testPoint is a minimal type for testing the generic sampling algorithm.

type testPoint struct {
	Time time.Time

	High *int64

	Low *int64
}

// testAccessor provides TimeAccessor for testPoint.

var testAccessor = utils.TimeAccessor[testPoint]{

	GetTime: func(p testPoint) time.Time { return p.Time },

	GetHigh: func(p testPoint) *int64 { return p.High },

	GetLow: func(p testPoint) *int64 { return p.Low },

	SetHigh: func(p *testPoint, v *int64) { p.High = v },

	SetLow: func(p *testPoint, v *int64) { p.Low = v },
}

// Helper to create int64 pointers.

func intPtr(v int64) *int64 {

	return &v

}

// TestSampleByTime_Basic tests basic sampling functionality.

func TestSampleByTime_Basic(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	points := []testPoint{

		{Time: baseTime, High: intPtr(100), Low: intPtr(50)},

		{Time: baseTime.Add(1 * time.Hour), High: intPtr(200), Low: intPtr(100)},

		{Time: baseTime.Add(2 * time.Hour), High: intPtr(300), Low: intPtr(150)},

		{Time: baseTime.Add(3 * time.Hour), High: intPtr(400), Low: intPtr(200)},

		{Time: baseTime.Add(4 * time.Hour), High: intPtr(500), Low: intPtr(250)},
	}

	sampled := utils.SampleByTime(points, 3, testAccessor)

	require.Len(t, sampled, 3, "Should return exactly 3 points")

	// First point should be at or near start

	assert.True(t, sampled[0].Time.Equal(baseTime) ||

		sampled[0].Time.Before(baseTime.Add(1*time.Hour)))

	// Last point should be at or near end

	assert.True(t, sampled[2].Time.Equal(baseTime.Add(4*time.Hour)) ||

		sampled[2].Time.After(baseTime.Add(3*time.Hour)))

}

// TestSampleByTime_NoSamplingNeeded tests when input length <= target.

func TestSampleByTime_NoSamplingNeeded(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	points := []testPoint{

		{Time: baseTime, High: intPtr(100), Low: intPtr(50)},

		{Time: baseTime.Add(1 * time.Hour), High: intPtr(200), Low: intPtr(100)},

		{Time: baseTime.Add(2 * time.Hour), High: intPtr(300), Low: intPtr(150)},
	}

	// Request same or more points than available

	sampled := utils.SampleByTime(points, 3, testAccessor)

	assert.Equal(t, points, sampled, "Should return all points unchanged when target equals length")

	sampled = utils.SampleByTime(points, 5, testAccessor)

	assert.Equal(t, points, sampled, "Should return all points when target exceeds available")

}

// TestSampleByTime_SingleTarget tests sampling to 1 point.

func TestSampleByTime_SingleTarget(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	points := []testPoint{

		{Time: baseTime, High: intPtr(100), Low: intPtr(50)},

		{Time: baseTime.Add(1 * time.Hour), High: intPtr(200), Low: intPtr(100)},

		{Time: baseTime.Add(2 * time.Hour), High: intPtr(300), Low: intPtr(150)},
	}

	sampled := utils.SampleByTime(points, 1, testAccessor)

	require.Len(t, sampled, 1)

	assert.Equal(t, baseTime, sampled[0].Time, "Should return first point when sampling to 1")

}

// TestSampleByTime_VoronoiPartitioning tests that points are assigned to closest target.

func TestSampleByTime_VoronoiPartitioning(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	// Data points: 0h, 0.8h, 1.6h, 1.8h, 2h (5 points)

	// Requesting 3 samples

	// Target times: 0h, 1h, 2h (with timeStep = 1h)

	// Ownership zones:

	//   target[0] at 0h: [0h, 0.5h) → should select 0h

	//   target[1] at 1h: [0.5h, 1.5h) → should select 0.8h (closest to 1h)

	//   target[2] at 2h: [1.5h, 2h] → should select 2h (closest to 2h)

	points := []testPoint{

		{Time: baseTime, High: intPtr(100), Low: intPtr(50)},

		{Time: baseTime.Add(48 * time.Minute), High: intPtr(200), Low: intPtr(100)}, // 0.8h

		{Time: baseTime.Add(96 * time.Minute), High: intPtr(300), Low: intPtr(150)}, // 1.6h

		{Time: baseTime.Add(108 * time.Minute), High: intPtr(400), Low: intPtr(200)}, // 1.8h

		{Time: baseTime.Add(2 * time.Hour), High: intPtr(500), Low: intPtr(250)},
	}

	sampled := utils.SampleByTime(points, 3, testAccessor)

	require.Len(t, sampled, 3, "Should return 3 points")

	// sampled[0] should be 0h

	assert.Equal(t, baseTime, sampled[0].Time, "First sample should be 0h")

	// sampled[1] should be 0.8h (closest to 1h)

	assert.Equal(t, baseTime.Add(48*time.Minute), sampled[1].Time, "Second sample should be 0.8h")

	// sampled[2] should be 2h

	assert.Equal(t, baseTime.Add(2*time.Hour), sampled[2].Time, "Third sample should be 2h")

}

// TestSampleByTime_EmptyZonesSkipped tests that empty zones result in fewer samples.

func TestSampleByTime_EmptyZonesSkipped(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	// Large gap in middle - some zones will be empty

	points := []testPoint{

		{Time: baseTime, High: intPtr(100), Low: intPtr(50)},

		{Time: baseTime.Add(6 * time.Minute), High: intPtr(110), Low: intPtr(55)},

		{Time: baseTime.Add(12 * time.Minute), High: intPtr(120), Low: intPtr(60)},

		// Large gap

		{Time: baseTime.Add(228 * time.Minute), High: intPtr(400), Low: intPtr(200)},

		{Time: baseTime.Add(234 * time.Minute), High: intPtr(410), Low: intPtr(205)},

		{Time: baseTime.Add(4 * time.Hour), High: intPtr(500), Low: intPtr(250)},
	}

	// Sample to 4 points, but expect only 2 due to empty zones

	sampled := utils.SampleByTime(points, 4, testAccessor)

	require.Len(t, sampled, 2, "Should return only 2 points (2 zones are empty)")

	// First sample should be 0h

	assert.Equal(t, baseTime, sampled[0].Time, "First sample should be 0h")

	// Second sample should be 4h

	assert.Equal(t, baseTime.Add(4*time.Hour), sampled[1].Time, "Second sample should be 4h")

}

// TestSampleByTime_NeighborFilling tests that missing values are filled from neighbors.

func TestSampleByTime_NeighborFilling(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	points := []testPoint{

		{Time: baseTime, High: intPtr(100), Low: intPtr(50)},

		{Time: baseTime.Add(1 * time.Hour), High: nil, Low: intPtr(100)}, // Missing high

		{Time: baseTime.Add(2 * time.Hour), High: intPtr(300), Low: nil}, // Missing low

		{Time: baseTime.Add(3 * time.Hour), High: intPtr(400), Low: intPtr(200)},

		{Time: baseTime.Add(4 * time.Hour), High: intPtr(500), Low: intPtr(250)},
	}

	sampled := utils.SampleByTime(points, 3, testAccessor)

	require.GreaterOrEqual(t, len(sampled), 1)

	// All sampled points with one value should have both filled

	for i, point := range sampled {

		if point.High != nil || point.Low != nil {

			assert.NotNil(t, point.High, "Point %d should have High filled", i)

			assert.NotNil(t, point.Low, "Point %d should have Low filled", i)

		}

	}

}

// TestSampleByTime_AllHighsNil tests when all High values are nil.

func TestSampleByTime_AllHighsNil(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	points := []testPoint{

		{Time: baseTime, High: nil, Low: intPtr(50)},

		{Time: baseTime.Add(1 * time.Hour), High: nil, Low: intPtr(100)},

		{Time: baseTime.Add(2 * time.Hour), High: nil, Low: intPtr(150)},

		{Time: baseTime.Add(3 * time.Hour), High: nil, Low: intPtr(200)},
	}

	sampled := utils.SampleByTime(points, 2, testAccessor)

	require.GreaterOrEqual(t, len(sampled), 1)

	// High should remain nil (no neighbors have it)

	for _, point := range sampled {

		assert.Nil(t, point.High, "High should remain nil when no neighbor has it")

		assert.NotNil(t, point.Low, "Low should be present")

	}

}

// TestFindClosestWithField_Basic tests the neighbor finding function.

func TestFindClosestWithField_Basic(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC) // Noon

	points := []testPoint{

		{Time: baseTime.Add(-2 * time.Hour), High: intPtr(100)}, // 10 AM

		{Time: baseTime.Add(-30 * time.Minute), High: intPtr(200)}, // 11:30 AM

		{Time: baseTime.Add(30 * time.Minute), High: nil}, // 12:30 PM (nil)

		{Time: baseTime.Add(45 * time.Minute), High: intPtr(300)}, // 12:45 PM

	}

	leftBound := baseTime.Add(-1 * time.Hour)

	rightBound := baseTime.Add(1 * time.Hour)

	closest := utils.FindClosestWithField(points, baseTime, leftBound, rightBound,

		testAccessor.GetTime, testAccessor.GetHigh)

	require.NotNil(t, closest, "Should find a neighbor")

	// Should find 11:30 AM (30 min away), not 12:45 PM (45 min away)

	assert.Equal(t, int64(200), *closest.High)

	assert.True(t, closest.Time.Equal(baseTime.Add(-30*time.Minute)))

}

// TestFindClosestWithField_NoValidNeighbor tests when no neighbor has the field.

func TestFindClosestWithField_NoValidNeighbor(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)

	points := []testPoint{

		{Time: baseTime.Add(-30 * time.Minute), High: nil},

		{Time: baseTime.Add(30 * time.Minute), High: nil},
	}

	leftBound := baseTime.Add(-1 * time.Hour)

	rightBound := baseTime.Add(1 * time.Hour)

	closest := utils.FindClosestWithField(points, baseTime, leftBound, rightBound,

		testAccessor.GetTime, testAccessor.GetHigh)

	assert.Nil(t, closest, "Should return nil when no neighbor has the field")

}

// TestFindClosestWithField_OutOfRange tests filtering by time range.

func TestFindClosestWithField_OutOfRange(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)

	points := []testPoint{

		{Time: baseTime.Add(-2 * time.Hour), High: intPtr(100)}, // Out of range

		{Time: baseTime.Add(2 * time.Hour), High: intPtr(200)}, // Out of range

	}

	leftBound := baseTime.Add(-1 * time.Hour)

	rightBound := baseTime.Add(1 * time.Hour)

	closest := utils.FindClosestWithField(points, baseTime, leftBound, rightBound,

		testAccessor.GetTime, testAccessor.GetHigh)

	assert.Nil(t, closest, "Should return nil when all points are out of range")

}

// TestFindClosestWithField_ExactTie tests when two neighbors are equidistant.

func TestFindClosestWithField_ExactTie(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)

	points := []testPoint{

		{Time: baseTime.Add(-30 * time.Minute), High: intPtr(100)}, // 11:30 AM

		{Time: baseTime.Add(30 * time.Minute), High: intPtr(200)}, // 12:30 PM

	}

	leftBound := baseTime.Add(-1 * time.Hour)

	rightBound := baseTime.Add(1 * time.Hour)

	closest := utils.FindClosestWithField(points, baseTime, leftBound, rightBound,

		testAccessor.GetTime, testAccessor.GetHigh)

	require.NotNil(t, closest)

	// Current behavior: first found wins (iteration order)

	assert.Equal(t, int64(100), *closest.High)

}

// TestSampleByTime_ZeroDuration tests when all points have identical timestamps.

func TestSampleByTime_ZeroDuration(t *testing.T) {

	baseTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	points := []testPoint{

		{Time: baseTime, High: intPtr(100), Low: intPtr(50)},

		{Time: baseTime, High: intPtr(200), Low: intPtr(100)},

		{Time: baseTime, High: intPtr(300), Low: intPtr(150)},
	}

	// Should not panic

	sampled := utils.SampleByTime(points, 2, testAccessor)

	require.GreaterOrEqual(t, len(sampled), 1, "Should return at least 1 point")

	require.LessOrEqual(t, len(sampled), 2, "Should not return more than requested")

}
