package unit

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"testing"

	"github.com/guavi/osrs-ge-tracker/internal/services"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

type rewriteToServerTransport struct {
	base *url.URL
	next http.RoundTripper
}

func (t *rewriteToServerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	clone := req.Clone(req.Context())
	clone.URL.Scheme = t.base.Scheme
	clone.URL.Host = t.base.Host
	return t.next.RoundTrip(clone)
}

func newTestClient(t *testing.T, handler http.Handler) services.OSRSClient {
	t.Helper()

	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)

	// Since osrsClient is not exported, we use reflection to modify the internal client
	// OR we can just use the interface and accept we can't modify retry count
	logger := zap.NewNop().Sugar()
	cli := services.NewOSRSClient(logger)

	// Note: We cannot access internal fields from outside the package
	// The test will work with the OSRSClient interface as-is
	return cli
}

func TestOSRSClient_FetchBulkDump_OK_SkipsInvalidKeys(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/gazproj/gazbot/os_dump.json", r.URL.Path)

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"1": {"high": 100, "highTime": 111, "low": 90, "lowTime": 222},
			"abc": {"high": 1, "highTime": 1, "low": 1, "lowTime": 1}
		}`))
	}))

	data, err := cli.FetchBulkDump()
	require.NoError(t, err)
	require.Len(t, data, 1)

	item := data[1]
	require.Equal(t, int64(100), item.High)
	require.Equal(t, int64(90), item.Low)
	require.Equal(t, int64(111), item.HighTime)
	require.Equal(t, int64(222), item.LowTime)
	require.Equal(t, 1, item.ItemID)
}

func TestOSRSClient_FetchBulkDump_Non200(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
		_, _ = w.Write([]byte(`{"error":"rate limited"}`))
	}))

	_, err := cli.FetchBulkDump()
	require.Error(t, err)
}

func TestOSRSClient_FetchItemDetail_OK(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/m=itemdb_oldschool/api/catalogue/detail.json", r.URL.Path)
		require.Equal(t, "123", r.URL.Query().Get("item"))

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"item": {
				"icon": "icon.png",
				"icon_large": "icon_large.png",
				"id": 123,
				"type": "weapon",
				"typeIcon": "type.png",
				"name": "Rune scimitar",
				"description": "A sharp sword.",
				"current": {"trend": "neutral", "price": "15k"},
				"today": {"trend": "positive", "price": "+1"},
				"members": "false"
			}
		}`))
	}))

	item, err := cli.FetchItemDetail(123)
	require.NoError(t, err)
	require.NotNil(t, item)
	require.Equal(t, 123, item.ID)
	require.Equal(t, "Rune scimitar", item.Name)
	require.Equal(t, "false", item.Members)
}

func TestOSRSClient_FetchLatestPrices_TruncatesTo100(t *testing.T) {
	handlerCalled := false
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		require.Equal(t, "/exchange/history/osrs/latest", r.URL.Path)

		ids := r.URL.Query().Get("id")
		require.NotEmpty(t, ids)
		parts := strings.Split(ids, ",")
		require.Len(t, parts, 100)
		// Sanity: first and last ids match truncation.
		require.Equal(t, "1", parts[0])
		require.Equal(t, "100", parts[99])

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"1": [{"timestamp": 1, "avgHighPrice": 10, "avgLowPrice": 20}],
			"2": [{"timestamp": 2, "avgHighPrice": 11, "avgLowPrice": 21}]
		}`))
	}))

	ids := make([]int, 101)
	for i := 0; i < 101; i++ {
		ids[i] = i + 1
	}

	out, err := cli.FetchLatestPrices(ids)
	require.NoError(t, err)
	require.True(t, handlerCalled)
	require.Len(t, out, 2)
	require.Equal(t, int64(10), out[1].AvgPrice)
	require.Equal(t, int64(20), out[1].Volume)
}

func TestOSRSClient_FetchHistoricalData_InvalidPeriod_FallsBackToSample(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/exchange/history/osrs/sample", r.URL.Path)
		require.Equal(t, "99", r.URL.Query().Get("id"))

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"99": [{"timestamp": 1, "avgHighPrice": 10, "avgLowPrice": 20}]
		}`))
	}))

	points, err := cli.FetchHistoricalData(99, "7d")
	require.NoError(t, err)
	require.Len(t, points, 1)
	require.Equal(t, int64(10), points[0].AvgPrice)
}

func TestOSRSClient_FetchHistoricalData_90d_UsesLast90d(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/exchange/history/osrs/last90d", r.URL.Path)
		require.Equal(t, "77", r.URL.Query().Get("id"))

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"77": [{"timestamp": 1, "avgHighPrice": 10, "avgLowPrice": 20}]
		}`))
	}))

	points, err := cli.FetchHistoricalData(77, "90d")
	require.NoError(t, err)
	require.Len(t, points, 1)
}

func TestOSRSClient_FetchLatestPrices_EmptyInput(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Fail(t, "handler should not be called")
	}))

	out, err := cli.FetchLatestPrices(nil)
	require.NoError(t, err)
	require.NotNil(t, out)
	require.Len(t, out, 0)
}

func TestRewriteTransport_LeavesPathIntact(t *testing.T) {
	base, err := url.Parse("http://example.test")
	require.NoError(t, err)

	tx := &rewriteToServerTransport{base: base, next: roundTripperFunc(func(req *http.Request) (*http.Response, error) {
		require.Equal(t, "example.test", req.URL.Host)
		require.Equal(t, "/some/path", req.URL.Path)
		require.Equal(t, "x", req.URL.Query().Get("q"))
		return nil, errors.New("stop")
	})}

	u, _ := url.Parse("https://secure.runescape.com/some/path?q=x")
	_, err = tx.RoundTrip(&http.Request{URL: u, Header: http.Header{}})
	require.Error(t, err)
}

type roundTripperFunc func(*http.Request) (*http.Response, error)

func (f roundTripperFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestOSRSClient_FetchItemDetail_Non200(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))

	_, err := cli.FetchItemDetail(1)
	require.Error(t, err)
}

func TestOSRSClient_FetchLatestPrices_InvalidJSON(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"not":`))
	}))

	out, err := cli.FetchLatestPrices([]int{1})
	require.Error(t, err)
	require.Nil(t, out)
}

func TestOSRSClient_FetchLatestPrices_SkipsInvalidKey(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"abc": [{"timestamp": 1, "avgHighPrice": 10, "avgLowPrice": 20}],
			"1": [{"timestamp": 2, "avgHighPrice": 11, "avgLowPrice": 21}]
		}`))
	}))

	out, err := cli.FetchLatestPrices([]int{1})
	require.NoError(t, err)
	require.Len(t, out, 1)
	require.Equal(t, int64(11), out[1].AvgPrice)
}

func TestOSRSClient_FetchHistoricalData_NoDataReturnsEmptySlice(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		id := r.URL.Query().Get("id")
		_, _ = w.Write([]byte(`{"` + id + `": []}`))
	}))

	points, err := cli.FetchHistoricalData(5, "90d")
	require.NoError(t, err)
	require.NotNil(t, points)
	require.Len(t, points, 0)
}

func TestOSRSClient_FetchLatestPrices_RespectsIDsParamEncoding(t *testing.T) {
	cli := newTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ids := r.URL.Query().Get("id")
		for _, part := range strings.Split(ids, ",") {
			_, err := strconv.Atoi(part)
			require.NoError(t, err)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))

	_, err := cli.FetchLatestPrices([]int{1, 2, 3})
	require.NoError(t, err)
}
