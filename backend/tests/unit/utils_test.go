package unit

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap/zapcore"

	"github.com/guavi/osrs-ge-tracker/internal/utils"
)

// TestNewLogger_InfoLevel tests logger creation with info level
func TestNewLogger_InfoLevel(t *testing.T) {
	logger, err := utils.NewLogger(utils.LogConfig{
		Level:       "info",
		Environment: "development",
		OutputPaths: []string{"stdout"},
	})
	require.NoError(t, err)
	require.NotNil(t, logger)
	defer logger.Sync()

	assert.True(t, logger.Core().Enabled(zapcore.InfoLevel))
	assert.True(t, logger.Core().Enabled(zapcore.WarnLevel))
	assert.True(t, logger.Core().Enabled(zapcore.ErrorLevel))
}

// TestNewLogger_DebugLevel tests logger creation with debug level
func TestNewLogger_DebugLevel(t *testing.T) {
	logger, err := utils.NewLogger(utils.LogConfig{
		Level:       "debug",
		Environment: "development",
		OutputPaths: []string{"stdout"},
	})
	require.NoError(t, err)
	require.NotNil(t, logger)
	defer logger.Sync()

	assert.True(t, logger.Core().Enabled(zapcore.DebugLevel))
	assert.True(t, logger.Core().Enabled(zapcore.InfoLevel))
}

// TestNewLogger_WarnLevel tests logger creation with warn level
func TestNewLogger_WarnLevel(t *testing.T) {
	logger, err := utils.NewLogger(utils.LogConfig{
		Level:       "warn",
		Environment: "development",
		OutputPaths: []string{"stdout"},
	})
	require.NoError(t, err)
	require.NotNil(t, logger)
	defer logger.Sync()

	assert.False(t, logger.Core().Enabled(zapcore.DebugLevel))
	assert.False(t, logger.Core().Enabled(zapcore.InfoLevel))
	assert.True(t, logger.Core().Enabled(zapcore.WarnLevel))
	assert.True(t, logger.Core().Enabled(zapcore.ErrorLevel))
}

// TestNewLogger_ErrorLevel tests logger creation with error level
func TestNewLogger_ErrorLevel(t *testing.T) {
	logger, err := utils.NewLogger(utils.LogConfig{
		Level:       "error",
		Environment: "development",
		OutputPaths: []string{"stdout"},
	})
	require.NoError(t, err)
	require.NotNil(t, logger)
	defer logger.Sync()

	assert.False(t, logger.Core().Enabled(zapcore.InfoLevel))
	assert.False(t, logger.Core().Enabled(zapcore.WarnLevel))
	assert.True(t, logger.Core().Enabled(zapcore.ErrorLevel))
}

// TestNewLogger_InvalidLevel tests logger with invalid level defaults to info
func TestNewLogger_InvalidLevel(t *testing.T) {
	logger, err := utils.NewLogger(utils.LogConfig{
		Level:       "invalid-level",
		Environment: "development",
		OutputPaths: []string{"stdout"},
	})
	require.NoError(t, err)
	require.NotNil(t, logger)
	defer logger.Sync()

	// Should default to info level
	assert.True(t, logger.Core().Enabled(zapcore.InfoLevel))
	assert.False(t, logger.Core().Enabled(zapcore.DebugLevel))
}

// TestNewLogger_ProductionEnvironment tests production logger configuration
func TestNewLogger_ProductionEnvironment(t *testing.T) {
	logger, err := utils.NewLogger(utils.LogConfig{
		Level:       "info",
		Environment: "production",
		OutputPaths: []string{"stdout"},
	})
	require.NoError(t, err)
	require.NotNil(t, logger)
	defer logger.Sync()

	assert.True(t, logger.Core().Enabled(zapcore.InfoLevel))
}

// TestNewLogger_DevelopmentEnvironment tests development logger configuration
func TestNewLogger_DevelopmentEnvironment(t *testing.T) {
	logger, err := utils.NewLogger(utils.LogConfig{
		Level:       "info",
		Environment: "development",
		OutputPaths: []string{"stdout"},
	})
	require.NoError(t, err)
	require.NotNil(t, logger)
	defer logger.Sync()

	assert.True(t, logger.Core().Enabled(zapcore.InfoLevel))
}

// TestNewLogger_CustomOutputPaths tests logger with custom output paths
func TestNewLogger_CustomOutputPaths(t *testing.T) {
	logger, err := utils.NewLogger(utils.LogConfig{
		Level:       "info",
		Environment: "development",
		OutputPaths: []string{"stdout", "stderr"},
	})
	require.NoError(t, err)
	require.NotNil(t, logger)
	defer logger.Sync()

	assert.True(t, logger.Core().Enabled(zapcore.InfoLevel))
}

// TestNewLogger_EmptyOutputPaths tests logger with empty output paths uses defaults
func TestNewLogger_EmptyOutputPaths(t *testing.T) {
	logger, err := utils.NewLogger(utils.LogConfig{
		Level:       "info",
		Environment: "development",
		OutputPaths: []string{},
	})
	require.NoError(t, err)
	require.NotNil(t, logger)
	defer logger.Sync()
}

// TestNewDefaultLogger tests default logger creation
func TestNewDefaultLogger(t *testing.T) {
	logger, err := utils.NewDefaultLogger()
	require.NoError(t, err)
	require.NotNil(t, logger)
	defer logger.Sync()

	assert.True(t, logger.Core().Enabled(zapcore.InfoLevel))
	assert.False(t, logger.Core().Enabled(zapcore.DebugLevel))
}

// TestNewProductionLogger tests production logger creation
func TestNewProductionLogger(t *testing.T) {
	logger, err := utils.NewProductionLogger()
	require.NoError(t, err)
	require.NotNil(t, logger)
	defer logger.Sync()

	assert.True(t, logger.Core().Enabled(zapcore.InfoLevel))
}

// TestWithRequestID tests adding request ID to logger context
func TestWithRequestID(t *testing.T) {
	logger, err := utils.NewDefaultLogger()
	require.NoError(t, err)
	defer logger.Sync()

	requestID := "test-request-id-12345"
	contextLogger := utils.WithRequestID(logger, requestID)

	require.NotNil(t, contextLogger)
	assert.NotEqual(t, logger, contextLogger) // Should be a new logger instance
}

// TestWithItemID tests adding item ID to logger context
func TestWithItemID(t *testing.T) {
	logger, err := utils.NewDefaultLogger()
	require.NoError(t, err)
	defer logger.Sync()

	itemID := 12345
	contextLogger := utils.WithItemID(logger, itemID)

	require.NotNil(t, contextLogger)
	assert.NotEqual(t, logger, contextLogger)
}

// TestWithError tests adding error to logger context
func TestWithError(t *testing.T) {
	logger, err := utils.NewDefaultLogger()
	require.NoError(t, err)
	defer logger.Sync()

	testErr := assert.AnError
	contextLogger := utils.WithError(logger, testErr)

	require.NotNil(t, contextLogger)
	assert.NotEqual(t, logger, contextLogger)
}

// TestWithMultipleContexts tests chaining multiple context additions
func TestWithMultipleContexts(t *testing.T) {
	logger, err := utils.NewDefaultLogger()
	require.NoError(t, err)
	defer logger.Sync()

	contextLogger := utils.WithRequestID(logger, "request-123")
	contextLogger = utils.WithItemID(contextLogger, 456)
	contextLogger = utils.WithError(contextLogger, assert.AnError)

	require.NotNil(t, contextLogger)
}

// TestLoggerMiddlewareFields tests HTTP middleware field creation
func TestLoggerMiddlewareFields(t *testing.T) {
	fields := utils.LoggerMiddlewareFields("GET", "/api/items", 200, 150)

	require.Len(t, fields, 4)

	// Verify field types and values
	assert.Equal(t, "method", fields[0].Key)
	assert.Equal(t, "GET", fields[0].String)

	assert.Equal(t, "path", fields[1].Key)
	assert.Equal(t, "/api/items", fields[1].String)

	assert.Equal(t, "status", fields[2].Key)
	assert.Equal(t, int64(200), fields[2].Integer)

	assert.Equal(t, "duration_ms", fields[3].Key)
	assert.Equal(t, int64(150), fields[3].Integer)
}

// TestLoggerMiddlewareFields_DifferentMethods tests various HTTP methods
func TestLoggerMiddlewareFields_DifferentMethods(t *testing.T) {
	methods := []string{"GET", "POST", "PUT", "DELETE", "PATCH"}

	for _, method := range methods {
		fields := utils.LoggerMiddlewareFields(method, "/api/test", 200, 100)
		assert.Equal(t, method, fields[0].String)
	}
}

// TestLoggerMiddlewareFields_DifferentStatusCodes tests various HTTP status codes
func TestLoggerMiddlewareFields_DifferentStatusCodes(t *testing.T) {
	statusCodes := []int{200, 201, 400, 404, 500}

	for _, code := range statusCodes {
		fields := utils.LoggerMiddlewareFields("GET", "/api/test", code, 100)
		assert.Equal(t, int64(code), fields[2].Integer)
	}
}

// TestGenerateRequestID tests request ID generation
func TestGenerateRequestID(t *testing.T) {
	requestID := utils.GenerateRequestID()

	assert.NotEmpty(t, requestID)
	assert.Len(t, requestID, 36) // UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
}

// TestGenerateRequestID_Uniqueness tests that generated IDs are unique
func TestGenerateRequestID_Uniqueness(t *testing.T) {
	id1 := utils.GenerateRequestID()
	id2 := utils.GenerateRequestID()
	id3 := utils.GenerateRequestID()

	assert.NotEqual(t, id1, id2)
	assert.NotEqual(t, id2, id3)
	assert.NotEqual(t, id1, id3)
}

// TestFormatDuration tests duration formatting
func TestFormatDuration(t *testing.T) {
	start := time.Now().Add(-150 * time.Millisecond)
	duration := utils.FormatDuration(start)

	// Should be approximately 150ms (allow some variance)
	assert.GreaterOrEqual(t, duration, int64(140))
	assert.LessOrEqual(t, duration, int64(200))
}

// TestFormatDuration_Immediate tests duration for immediate call
func TestFormatDuration_Immediate(t *testing.T) {
	start := time.Now()
	duration := utils.FormatDuration(start)

	// Should be close to 0 but might be a few milliseconds
	assert.GreaterOrEqual(t, duration, int64(0))
	assert.LessOrEqual(t, duration, int64(10))
}

// TestFormatDuration_LongDuration tests duration for longer periods
func TestFormatDuration_LongDuration(t *testing.T) {
	start := time.Now().Add(-2 * time.Second)
	duration := utils.FormatDuration(start)

	// Should be approximately 2000ms
	assert.GreaterOrEqual(t, duration, int64(1900))
	assert.LessOrEqual(t, duration, int64(2100))
}

// TestMeasureTime tests time measurement function
func TestMeasureTime(t *testing.T) {
	done := utils.MeasureTime("test-operation")

	// Do some work
	time.Sleep(10 * time.Millisecond)

	// Call the returned function to complete measurement
	done()

	// Function should not panic or error
}

// TestParseNullableBool_EmptyString tests parsing empty string
func TestParseNullableBool_EmptyString(t *testing.T) {
	result := utils.ParseNullableBool("")
	assert.Nil(t, result)
}

// TestParseNullableBool_True tests parsing true values
func TestParseNullableBool_True(t *testing.T) {
	testCases := []string{"true", "1"}

	for _, tc := range testCases {
		result := utils.ParseNullableBool(tc)
		require.NotNil(t, result)
		assert.True(t, *result)
	}
}

// TestParseNullableBool_False tests parsing false values
func TestParseNullableBool_False(t *testing.T) {
	testCases := []string{"false", "0"}

	for _, tc := range testCases {
		result := utils.ParseNullableBool(tc)
		require.NotNil(t, result)
		assert.False(t, *result)
	}
}

// TestParseNullableBool_InvalidValues tests parsing invalid values
func TestParseNullableBool_InvalidValues(t *testing.T) {
	testCases := []string{"yes", "no", "TRUE", "FALSE", "invalid", "2", "-1"}

	for _, tc := range testCases {
		result := utils.ParseNullableBool(tc)
		assert.Nil(t, result, "Expected nil for input: %s", tc)
	}
}

// TestFormatGPValue_SmallValues tests formatting small GP values
func TestFormatGPValue_SmallValues(t *testing.T) {
	testCases := []struct {
		input    int64
		expected string
	}{
		{0, "0"},
		{1, "1"},
		{10, "10"},
		{100, "100"},
		{999, "999"},
	}

	for _, tc := range testCases {
		result := utils.FormatGPValue(tc.input)
		assert.Equal(t, tc.expected, result)
	}
}

// TestFormatGPValue_Thousands tests formatting thousands (K)
func TestFormatGPValue_Thousands(t *testing.T) {
	testCases := []struct {
		input    int64
		expected string
	}{
		{1000, "1.0K"},
		{1500, "1.5K"},
		{10000, "10.0K"},
		{15500, "15.5K"},
		{100000, "100.0K"},
		{999999, "1000.0K"},
	}

	for _, tc := range testCases {
		result := utils.FormatGPValue(tc.input)
		assert.Equal(t, tc.expected, result)
	}
}

// TestFormatGPValue_Millions tests formatting millions (M)
func TestFormatGPValue_Millions(t *testing.T) {
	testCases := []struct {
		input    int64
		expected string
	}{
		{1000000, "1.0M"},
		{1500000, "1.5M"},
		{10000000, "10.0M"},
		{15500000, "15.5M"},
		{100000000, "100.0M"},
		{1234567890, "1234.6M"},
	}

	for _, tc := range testCases {
		result := utils.FormatGPValue(tc.input)
		assert.Equal(t, tc.expected, result)
	}
}

// TestFormatGPValue_NegativeValues tests formatting negative values
func TestFormatGPValue_NegativeValues(t *testing.T) {
	testCases := []struct {
		input    int64
		expected string
	}{
		{-1, "-1"},
		{-100, "-100"},
		{-1000, "-1000"},       // Negative values don't get formatted with K/M
		{-1000000, "-1000000"}, // Negative values don't get formatted with K/M
	}

	for _, tc := range testCases {
		result := utils.FormatGPValue(tc.input)
		assert.Equal(t, tc.expected, result)
	}
}

// TestFormatGPValue_BoundaryValues tests boundary values between K and M
func TestFormatGPValue_BoundaryValues(t *testing.T) {
	testCases := []struct {
		input    int64
		expected string
	}{
		{999, "999"},        // Just below 1K
		{1000, "1.0K"},      // Exactly 1K
		{999999, "1000.0K"}, // Just below 1M
		{1000000, "1.0M"},   // Exactly 1M
	}

	for _, tc := range testCases {
		result := utils.FormatGPValue(tc.input)
		assert.Equal(t, tc.expected, result)
	}
}

// TestLoggerLevelsHierarchy tests log level hierarchy
func TestLoggerLevelsHierarchy(t *testing.T) {
	// Debug level should enable all levels
	debugLogger, err := utils.NewLogger(utils.LogConfig{
		Level:       "debug",
		Environment: "development",
		OutputPaths: []string{"stdout"},
	})
	require.NoError(t, err)
	defer debugLogger.Sync()

	assert.True(t, debugLogger.Core().Enabled(zapcore.DebugLevel))
	assert.True(t, debugLogger.Core().Enabled(zapcore.InfoLevel))
	assert.True(t, debugLogger.Core().Enabled(zapcore.WarnLevel))
	assert.True(t, debugLogger.Core().Enabled(zapcore.ErrorLevel))

	// Error level should only enable error and fatal
	errorLogger, err := utils.NewLogger(utils.LogConfig{
		Level:       "error",
		Environment: "development",
		OutputPaths: []string{"stdout"},
	})
	require.NoError(t, err)
	defer errorLogger.Sync()

	assert.False(t, errorLogger.Core().Enabled(zapcore.DebugLevel))
	assert.False(t, errorLogger.Core().Enabled(zapcore.InfoLevel))
	assert.False(t, errorLogger.Core().Enabled(zapcore.WarnLevel))
	assert.True(t, errorLogger.Core().Enabled(zapcore.ErrorLevel))
}

// TestGenerateRequestID_Format tests UUID format
func TestGenerateRequestID_Format(t *testing.T) {
	requestID := utils.GenerateRequestID()

	// UUID format: 8-4-4-4-12 characters separated by hyphens
	assert.Regexp(t, `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`, requestID)
}
