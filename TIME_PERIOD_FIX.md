# Time Period Conversion Fix (CORRECTED)

## Problem Identified

The backend's `periodToTimeseriesSource` function was using timesteps that were too coarse for shorter time periods, resulting in graphs with insufficient data points.

**Critical Understanding:** The Wiki API `/timeseries` endpoint returns **UP TO 365 data points** regardless of the timestep parameter. The timestep (5m, 1h, 6h, 24h) determines the **bucket size**, not the number of points returned.

### Wiki API Timeseries Behavior
| Timestep | Bucket Size | Max Coverage (365 buckets) |
|----------|-------------|----------------------------|
| 5m       | 5 minutes   | 1.3 days                  |
| 1h       | 1 hour      | 15.2 days                 |
| 6h       | 6 hours     | 91.2 days                 |
| 24h      | 24 hours    | 365 days                  |

### Previous Mapping (Incorrect - Used Coarse Timesteps)
| Period | Old Timestep | Actual Points | Target Points | Status |
|--------|--------------|---------------|---------------|--------|
| 1h     | 5m          | 12            | 60            | ✗ TOO FEW |
| 12h    | 6h          | 2             | 120           | ✗ TOO FEW |
| 24h    | 6h          | 4             | 120           | ✗ TOO FEW |
| 3d     | 24h         | 3             | 120           | ✗ TOO FEW |
| 7d     | daily (24h) | 7             | 120           | ✗ TOO FEW |
| 30d    | daily (24h) | 30            | 120           | ✗ TOO FEW |
| 90d    | daily (24h) | 90            | 120           | ✗ TOO FEW |
| 1y     | daily (24h) | 365           | 120           | ✓ OK |
| all    | daily (24h) | 365+          | 120           | ✓ OK |

## Solution

Strategy: **Use the finest timestep that can cover the full period** to maximize data points within the Wiki API's 365-point limit.

### New Mapping (Optimal Granularity)
| Period | New Timestep | Expected Points | Target | Status |
|--------|--------------|-----------------|---------|--------|
| 1h     | 5m          | 13              | 60     | △ Best available (limited by API) |
| 12h    | 5m          | 145             | 120    | ✓ Sufficient |
| 24h    | 5m          | 289             | 120    | ✓ Sufficient |
| 3d     | 1h          | 73              | 120    | △ Best available (5m only covers 1.3d) |
| 7d     | 1h          | 169             | 120    | ✓ Sufficient |
| 30d    | 6h          | 121             | 120    | ✓ Sufficient |
| 90d    | 6h          | 361             | 120    | ✓ Sufficient |
| 1y     | 24h         | 365             | 120    | ✓ Sufficient |
| all    | 24h         | 365             | 120    | ✓ Sufficient |

**Note:** 
- 1h and 3d periods cannot achieve the ideal 60/120 points due to Wiki API limitations
- Frontend chart library (Recharts) will interpolate between points for smooth rendering
- This is the maximum granularity possible given the API constraints

## Changes Made

### 1. Updated `periodToTimeseriesSource()` Function
**File:** [backend/internal/services/price_service.go](backend/internal/services/price_service.go)

Changed timestep mapping to use finest granularity that covers each period:

```go
func periodToTimeseriesSource(period models.TimePeriod) timeseriesSource {
	// Choose timestep based on Wiki API behavior:
	// - Wiki API returns UP TO 365 data points per timestep
	// - Select finest timestep that covers the full period
	// - 5m covers 1.3d, 1h covers 15.2d, 6h covers 91.2d, 24h covers 365d
	switch period {
	case models.Period1Hour:
		return timeseriesSource{timestep: "5m"} // 13 points
	case models.Period12Hours:
		return timeseriesSource{timestep: "5m"} // 145 points
	case models.Period24Hours:
		return timeseriesSource{timestep: "5m"} // 289 points
	case models.Period3Days:
		return timeseriesSource{timestep: "1h"} // 73 points (5m only covers 1.3d)
	case models.Period7Days:
		return timeseriesSource{timestep: "1h"} // 169 points
	case models.Period30Days:
		return timeseriesSource{timestep: "6h"} // 121 points
	case models.Period90Days:
		return timeseriesSource{timestep: "6h"} // 361 points
	case models.Period1Year:
		return timeseriesSource{timestep: "24h"} // 365 points
	case models.PeriodAll:
		return timeseriesSource{timestep: "24h"} // 365 points (best available)
	default:
		return timeseriesSource{timestep: "24h"}
	}
}
```
	default:
		return timeseriesSource{timestep: "5m"}
	}
}
```

### 2. Updated Default Sampling Logic
**File:** [backend/internal/services/price_service.go](backend/internal/services/price_service.go)

Adjusted `getDefaultMaxPoints()` to reflect achievable point counts:

```go
// getDefaultMaxPoints returns the target number of points for each time period
// Note: Some periods cannot achieve ideal targets due to Wiki API 365-point limit
func getDefaultMaxPoints(period models.TimePeriod) int {
	switch period {
	case models.Period1Hour:
		return 13 // Limited by 5m timestep coverage (1.3 days max)
	case models.Period3Days:
		return 73 // Limited by 1h timestep coverage (15.2 days max)
	default:
		return 120 // Target for all other periods
	}
}
```

## Impact

### Benefits
1. **Consistent Data Quality:** All graphs now have smooth, evenly distributed data points
2. **Better Granularity:** Shorter periods (1h, 12h, 24h) now have sufficient detail
3. **Maintained Performance:** Sampling reduces data transfer while preserving visual quality
4. **Future-Proof:** Using finest granularity allows for easy adjustment of target point counts

### Performance Considerations
- The 5m timestep table will be queried more frequently
- Sampling is performed efficiently in the repository layer
- Caching helps mitigate increased database load
- For very long periods (1y, all), sampling from 100k+ points to 120 is more CPU-intensive but still acceptable

## Testing Recommendations

1. **Visual Testing:** Check all time period graphs on the frontend to verify smooth curves
2. **Performance Testing:** Monitor database query times for the 5m table
3. **Data Accuracy:** Verify that sampled data preserves the overall trend and key price movements
4. **Edge Cases:** Test items with sparse data (few trades) to ensure graphs still render properly

## Rollback Plan

If issues arise, the previous coarse-grained approach can be restored by reverting the changes to `periodToTimeseriesSource()` and removing the default sampling logic.

## Next Steps

1. Deploy backend changes
2. Monitor application performance and user feedback
3. Consider adding interpolation for the 1h period if 12 raw points sampled to 60 appears too sparse
4. Evaluate if 5m data retention policy needs adjustment based on storage usage
