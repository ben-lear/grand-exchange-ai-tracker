package services

import (
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

// ========== FetchBulkDump Edge Cases ==========

func TestOSRSClient_FetchBulkDump_InvalidJSON(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"1": {"high": "not a number"}}`))
	}))

	_, err := cli.FetchBulkDump()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse")
}

func TestOSRSClient_FetchBulkDump_EmptyResponse(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))

	data, err := cli.FetchBulkDump()
	require.NoError(t, err)
	assert.Empty(t, data)
}

func TestOSRSClient_FetchBulkDump_MalformedJSON(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`not valid json`))
	}))

	_, err := cli.FetchBulkDump()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse")
}

func TestOSRSClient_FetchBulkDump_MixedValidInvalidKeys(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"1": {"high": 100, "highTime": 111, "low": 90, "lowTime": 222},
			"invalid": {"high": 50, "highTime": 55, "low": 40, "lowTime": 44},
			"2": {"high": 200, "highTime": 211, "low": 190, "lowTime": 222}
		}`))
	}))

	data, err := cli.FetchBulkDump()
	require.NoError(t, err)
	assert.Len(t, data, 2)
	assert.Contains(t, data, 1)
	assert.Contains(t, data, 2)
	assert.NotContains(t, data, 0) // "invalid" should be skipped
}

func TestOSRSClient_FetchBulkDump_ErrorStatus(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
		_, _ = w.Write([]byte(`{"error": "service unavailable"}`))
	}))

	_, err := cli.FetchBulkDump()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed with status 503")
}

func TestOSRSClient_FetchBulkDump_PartialData(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"1": {"high": 100, "lowTime": 222},
			"2": {"high": 200, "highTime": 211, "low": 190, "lowTime": 222}
		}`))
	}))

	data, err := cli.FetchBulkDump()
	require.NoError(t, err)
	assert.Len(t, data, 2)
	// Item 1 should have default zero values for missing fields
	assert.Equal(t, int64(100), data[1].High)
	assert.Equal(t, int64(0), data[1].HighTime)
	assert.Equal(t, int64(0), data[1].Low)
	assert.Equal(t, int64(222), data[1].LowTime)
}

// ========== FetchItemDetail Edge Cases ==========

func TestOSRSClient_FetchItemDetail_InvalidJSON(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"item": {invalid}}`))
	}))

	_, err := cli.FetchItemDetail(123)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse")
}

func TestOSRSClient_FetchItemDetail_MissingItemField(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"error": "item not found"}`))
	}))

	item, err := cli.FetchItemDetail(999999)
	require.NoError(t, err)
	// Should return empty item detail (zero values)
	assert.Equal(t, 0, item.ID)
	assert.Equal(t, "", item.Name)
}

func TestOSRSClient_FetchItemDetail_EmptyResponse(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))

	item, err := cli.FetchItemDetail(1)
	require.NoError(t, err)
	assert.NotNil(t, item)
	// Empty item with zero values
	assert.Equal(t, 0, item.ID)
}

func TestOSRSClient_FetchItemDetail_PartialData(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"item": {
				"id": 123,
				"name": "Test Item"
			}
		}`))
	}))

	item, err := cli.FetchItemDetail(123)
	require.NoError(t, err)
	assert.Equal(t, 123, item.ID)
	assert.Equal(t, "Test Item", item.Name)
	assert.Equal(t, "", item.Icon) // Missing field should be empty
}

// ========== FetchLatestPrices Edge Cases ==========

func TestOSRSClient_FetchLatestPrices_Non200Status(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
	}))

	_, err := cli.FetchLatestPrices([]int{1, 2, 3})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed with status 400")
}

func TestOSRSClient_FetchLatestPrices_EmptyResponse(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))

	out, err := cli.FetchLatestPrices([]int{1, 2, 3})
	require.NoError(t, err)
	assert.Empty(t, out)
}

func TestOSRSClient_FetchLatestPrices_EmptyDataArrays(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"1": [],
			"2": []
		}`))
	}))

	out, err := cli.FetchLatestPrices([]int{1, 2})
	require.NoError(t, err)
	assert.Empty(t, out) // Empty arrays should be skipped
}

func TestOSRSClient_FetchLatestPrices_SingleItem(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "1", r.URL.Query().Get("id"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"1": [{"timestamp": 1234567890, "avgHighPrice": 100, "avgLowPrice": 90}]
		}`))
	}))

	out, err := cli.FetchLatestPrices([]int{1})
	require.NoError(t, err)
	assert.Len(t, out, 1)
	assert.Equal(t, int64(100), out[1].AvgPrice)
	assert.Equal(t, int64(90), out[1].Volume)
}

// ========== FetchHistoricalData Edge Cases ==========

func TestOSRSClient_FetchHistoricalData_NonExistentPeriod(t *testing.T) {
	handlerCalled := false
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		// Should fallback to sample endpoint
		require.Equal(t, "/exchange/history/osrs/sample", r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"1": [{"timestamp": 1, "avgHighPrice": 10, "avgLowPrice": 20}]}`))
	}))

	points, err := cli.FetchHistoricalData(1, "invalid-period")
	require.NoError(t, err)
	assert.True(t, handlerCalled)
	assert.Len(t, points, 1)
}

func TestOSRSClient_FetchHistoricalData_InvalidJSON(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{invalid json`))
	}))

	_, err := cli.FetchHistoricalData(1, "90d")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse")
}

func TestOSRSClient_FetchHistoricalData_Non200Status(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))

	_, err := cli.FetchHistoricalData(999999, "90d")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed with status 404")
}

func TestOSRSClient_FetchHistoricalData_ItemNotInResponse(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		// Return data for different item
		_, _ = w.Write([]byte(`{"999": [{"timestamp": 1, "avgHighPrice": 10, "avgLowPrice": 20}]}`))
	}))

	points, err := cli.FetchHistoricalData(1, "90d")
	require.NoError(t, err)
	assert.Empty(t, points)
}

// ========== FetchSampleData Edge Cases ==========

func TestOSRSClient_FetchSampleData_Success(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/exchange/history/osrs/sample", r.URL.Path)
		require.Equal(t, "123", r.URL.Query().Get("id"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"123": [
				{"timestamp": 1, "avgHighPrice": 100, "avgLowPrice": 90},
				{"timestamp": 2, "avgHighPrice": 110, "avgLowPrice": 95}
			]
		}`))
	}))

	points, err := cli.FetchSampleData(123)
	require.NoError(t, err)
	assert.Len(t, points, 2)
	assert.Equal(t, int64(100), points[0].AvgPrice)
	assert.Equal(t, int64(110), points[1].AvgPrice)
}

func TestOSRSClient_FetchSampleData_InvalidJSON(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`not valid json`))
	}))

	_, err := cli.FetchSampleData(123)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse")
}

func TestOSRSClient_FetchSampleData_EmptyData(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"123": []}`))
	}))

	points, err := cli.FetchSampleData(123)
	require.NoError(t, err)
	assert.Empty(t, points)
}

func TestOSRSClient_FetchSampleData_Non200Status(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))

	_, err := cli.FetchSampleData(123)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed with status 500")
}

func TestOSRSClient_FetchSampleData_ItemNotFound(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))

	points, err := cli.FetchSampleData(999999)
	require.NoError(t, err)
	assert.Empty(t, points)
}

// ========== FetchAllHistoricalData Edge Cases ==========

func TestOSRSClient_FetchAllHistoricalData_Success(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/exchange/history/osrs/all", r.URL.Path)
		require.Equal(t, "456", r.URL.Query().Get("id"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"456": [
				{"timestamp": 1, "avgHighPrice": 1000, "avgLowPrice": 900},
				{"timestamp": 2, "avgHighPrice": 1100, "avgLowPrice": 950},
				{"timestamp": 3, "avgHighPrice": 1200, "avgLowPrice": 1000}
			]
		}`))
	}))

	points, err := cli.FetchAllHistoricalData(456)
	require.NoError(t, err)
	assert.Len(t, points, 3)
	assert.Equal(t, int64(1000), points[0].AvgPrice)
	assert.Equal(t, int64(1100), points[1].AvgPrice)
	assert.Equal(t, int64(1200), points[2].AvgPrice)
}

func TestOSRSClient_FetchAllHistoricalData_InvalidJSON(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{broken json`))
	}))

	_, err := cli.FetchAllHistoricalData(456)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse")
}

func TestOSRSClient_FetchAllHistoricalData_EmptyData(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"456": []}`))
	}))

	points, err := cli.FetchAllHistoricalData(456)
	require.NoError(t, err)
	assert.Empty(t, points)
}

func TestOSRSClient_FetchAllHistoricalData_Non200Status(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
	}))

	_, err := cli.FetchAllHistoricalData(456)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed with status 403")
}

func TestOSRSClient_FetchAllHistoricalData_ItemNotFound(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))

	points, err := cli.FetchAllHistoricalData(999999)
	require.NoError(t, err)
	assert.Empty(t, points)
}

func TestOSRSClient_FetchAllHistoricalData_WrongItemInResponse(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		// Return data for different item
		_, _ = w.Write([]byte(`{"789": [{"timestamp": 1, "avgHighPrice": 100, "avgLowPrice": 90}]}`))
	}))

	points, err := cli.FetchAllHistoricalData(456)
	require.NoError(t, err)
	assert.Empty(t, points)
}

// ========== NewOSRSClient Edge Cases ==========

func TestNewOSRSClient_InitializesCorrectly(t *testing.T) {
	logger := zap.NewNop().Sugar()
	client := NewOSRSClient(logger)

	assert.NotNil(t, client)

	// Verify it implements the interface
	var _ OSRSClient = client
}

func TestNewOSRSClient_WithNilLogger(t *testing.T) {
	// Should not panic with nil logger
	client := NewOSRSClient(nil)
	assert.NotNil(t, client)
}

// ========== User-Agent and Headers ==========

func TestOSRSClient_SetsUserAgentHeader(t *testing.T) {
	handlerCalled := false
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		userAgent := r.Header.Get("User-Agent")
		assert.NotEmpty(t, userAgent)
		assert.Contains(t, userAgent, "OSRS-GE-Tracker")

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))

	_, _ = cli.FetchBulkDump()
	assert.True(t, handlerCalled)
}

// ========== Boundary Value Tests ==========

func TestOSRSClient_FetchLatestPrices_Exactly100Items(t *testing.T) {
	handlerCalled := false
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		ids := r.URL.Query().Get("id")
		parts := strings.Split(ids, ",")
		assert.Len(t, parts, 100)

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))

	ids := make([]int, 100)
	for i := 0; i < 100; i++ {
		ids[i] = i + 1
	}

	_, err := cli.FetchLatestPrices(ids)
	require.NoError(t, err)
	assert.True(t, handlerCalled)
}

func TestOSRSClient_FetchLatestPrices_Over100ItemsTruncates(t *testing.T) {
	handlerCalled := false
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		ids := r.URL.Query().Get("id")
		parts := strings.Split(ids, ",")
		assert.Len(t, parts, 100) // Should be truncated

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))

	ids := make([]int, 150)
	for i := 0; i < 150; i++ {
		ids[i] = i + 1
	}

	_, err := cli.FetchLatestPrices(ids)
	require.NoError(t, err)
	assert.True(t, handlerCalled)
}

// ========== Data Type Edge Cases ==========

func TestOSRSClient_FetchBulkDump_LargeNumbers(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"1": {
				"high": 2147483647,
				"highTime": 1234567890123,
				"low": 1000000000,
				"lowTime": 9876543210
			}
		}`))
	}))

	data, err := cli.FetchBulkDump()
	require.NoError(t, err)
	assert.Len(t, data, 1)
	assert.Equal(t, int64(2147483647), data[1].High)
	assert.Equal(t, int64(1234567890123), data[1].HighTime)
}

func TestOSRSClient_FetchBulkDump_NegativeNumbers(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"1": {
				"high": -100,
				"highTime": -50,
				"low": -200,
				"lowTime": -25
			}
		}`))
	}))

	data, err := cli.FetchBulkDump()
	require.NoError(t, err)
	assert.Len(t, data, 1)
	// Negative values should be accepted as-is
	assert.Equal(t, int64(-100), data[1].High)
	assert.Equal(t, int64(-200), data[1].Low)
}

func TestOSRSClient_FetchBulkDump_ZeroValues(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"1": {
				"high": 0,
				"highTime": 0,
				"low": 0,
				"lowTime": 0
			}
		}`))
	}))

	data, err := cli.FetchBulkDump()
	require.NoError(t, err)
	assert.Len(t, data, 1)
	assert.Equal(t, int64(0), data[1].High)
	assert.Equal(t, int64(0), data[1].Low)
}
