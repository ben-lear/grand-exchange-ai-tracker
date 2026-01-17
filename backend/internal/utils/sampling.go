// Package utils provides shared utilities for the OSRS Grand Exchange tracker.
package utils

import "time"

// TimeAccessor provides type-agnostic access to timeseries point fields.
// Used by SampleByTime to work with any timeseries point type.
type TimeAccessor[T any] struct {
	GetTime func(T) time.Time
	GetHigh func(T) *int64
	GetLow  func(T) *int64
	SetHigh func(*T, *int64)
	SetLow  func(*T, *int64)
}

// SampleByTime reduces a slice of time-ordered points to targetPoints using
// Voronoi partitioning on the time axis. Points are selected based on proximity
// to evenly-spaced target times. Missing high/low values are filled from
// nearest neighbors within their time zone.
//
// The algorithm:
// 1. Calculate evenly-spaced target times across the time span
// 2. Partition the time axis into Voronoi cells (each point belongs to closest target)
// 3. Select the point closest to each target time within its cell
// 4. Fill missing high/low values from neighbors within the cell's time bounds.
//
//nolint:gocognit,gocyclo,revive // Algorithm complexity is inherent to Voronoi sampling with neighbor-filling.
func SampleByTime[T any](points []T, targetPoints int, accessor TimeAccessor[T]) []T {
	if len(points) <= targetPoints {
		return points
	}

	// Special case: if sampling to 1 point, return the first point
	if targetPoints == 1 {
		result := make([]T, 1)
		result[0] = points[0]
		return result
	}

	// Calculate time-based sampling: evenly spaced on the time axis, not array index axis
	startTime := accessor.GetTime(points[0])
	endTime := accessor.GetTime(points[len(points)-1])
	totalDuration := endTime.Sub(startTime)

	// Calculate the time interval between sample points
	timeStep := totalDuration / time.Duration(targetPoints-1)

	sampled := make([]T, 0, targetPoints)

	// First pass: select points at evenly-spaced time intervals
	// Each target time "owns" points in a zone bounded by midpoints to adjacent targets
	// Points are assigned to the target time they are closest to (Voronoi partitioning)
	// If a zone has no points, that sample is skipped
	currentIdx := 0
	for i := 0; i < targetPoints; i++ {
		targetTime := startTime.Add(time.Duration(i) * timeStep)

		// Define the ownership zone for this target time as the Voronoi cell
		// A point belongs to this zone if it's closer to targetTime than to any other target
		var leftBound, rightBound time.Time
		if i > 0 {
			prevTarget := startTime.Add(time.Duration(i-1) * timeStep)
			leftBound = prevTarget.Add(targetTime.Sub(prevTarget) / 2)
		} else {
			// First target owns everything from start
			leftBound = startTime
		}
		if i < targetPoints-1 {
			nextTarget := startTime.Add(time.Duration(i+1) * timeStep)
			rightBound = targetTime.Add(nextTarget.Sub(targetTime) / 2)
		} else {
			// Last target owns everything to end
			rightBound = endTime.Add(1) // One nanosecond past end to ensure inclusivity
		}

		// Advance to the ownership zone
		for currentIdx < len(points) && accessor.GetTime(points[currentIdx]).Before(leftBound) {
			currentIdx++
		}

		// Find the closest point to targetTime within the ownership zone
		bestIdx := -1
		var bestDist time.Duration

		// Check all points in the ownership zone
		for checkIdx := currentIdx; checkIdx < len(points); checkIdx++ {
			pointTime := accessor.GetTime(points[checkIdx])

			// Check if point is within the ownership zone
			// Left bound is inclusive, right bound is exclusive
			if pointTime.Before(leftBound) {
				continue
			}
			if !pointTime.Before(rightBound) {
				// Point is at or after right bound - belongs to next zone
				break
			}

			dist := pointTime.Sub(targetTime)
			if dist < 0 {
				dist = -dist
			}

			if bestIdx == -1 || dist < bestDist {
				bestDist = dist
				bestIdx = checkIdx
			}
		}

		// If no point found in ownership zone, skip this target sample
		if bestIdx == -1 {
			continue
		}

		sampled = append(sampled, points[bestIdx])
		// Move past the selected point for next iteration
		currentIdx = bestIdx + 1
	}

	// Second pass: fill missing HIGH or LOW values (not both) from neighbors
	// Only process points that were actually sampled
	for i := 0; i < len(sampled); i++ {
		point := &sampled[i]

		high := accessor.GetHigh(*point)
		low := accessor.GetLow(*point)

		// Skip if both values are present (nothing to fill)
		if high != nil && low != nil {
			continue
		}

		// Skip if both values are missing (point should have been skipped in first pass)
		if high == nil && low == nil {
			continue
		}

		currentTime := accessor.GetTime(*point)

		// Determine the time-based search range (neighbors closer in time to this sample)
		var leftTime, rightTime time.Time
		if i > 0 {
			prevTime := accessor.GetTime(sampled[i-1])
			leftTime = prevTime.Add(currentTime.Sub(prevTime) / 2)
		} else {
			leftTime = startTime
		}
		if i < len(sampled)-1 {
			nextTime := accessor.GetTime(sampled[i+1])
			rightTime = currentTime.Add(nextTime.Sub(currentTime) / 2)
		} else {
			rightTime = endTime
		}

		// Fill missing AvgHighPrice
		if high == nil {
			if neighbor := FindClosestWithField(points, currentTime, leftTime, rightTime,
				accessor.GetTime, accessor.GetHigh); neighbor != nil {
				accessor.SetHigh(point, accessor.GetHigh(*neighbor))
			}
		}

		// Fill missing AvgLowPrice
		if low == nil {
			if neighbor := FindClosestWithField(points, currentTime, leftTime, rightTime,
				accessor.GetTime, accessor.GetLow); neighbor != nil {
				accessor.SetLow(point, accessor.GetLow(*neighbor))
			}
		}
	}

	return sampled
}

// FindClosestWithField finds the nearest point with a non-nil field value
// within the specified time range. Returns nil if no valid neighbor exists.
//
//nolint:revive // 6 args is acceptable for a generic utility; grouping would reduce clarity.
func FindClosestWithField[T any](
	points []T,
	centerTime, leftTime, rightTime time.Time,
	getTime func(T) time.Time,
	getField func(T) *int64,
) *T {
	var closestDuration time.Duration
	var closest *T
	first := true

	for i := range points {
		pointTime := getTime(points[i])
		if pointTime.Before(leftTime) || pointTime.After(rightTime) {
			continue
		}
		if getField(points[i]) != nil {
			timeDiff := pointTime.Sub(centerTime)
			if timeDiff < 0 {
				timeDiff = -timeDiff
			}
			if first || timeDiff < closestDuration {
				closestDuration = timeDiff
				closest = &points[i]
				first = false
			}
		}
	}
	return closest
}
