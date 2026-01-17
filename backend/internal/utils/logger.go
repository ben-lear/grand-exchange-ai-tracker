package utils

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// LogConfig contains logging configuration.
type LogConfig struct {
	Level       string // debug, info, warn, error
	Environment string // development, production
	OutputPaths []string
}

// NewLogger creates a new Zap logger with the given configuration.
func NewLogger(config LogConfig) (*zap.Logger, error) {
	// Parse log level
	level := zapcore.InfoLevel
	if err := level.UnmarshalText([]byte(config.Level)); err != nil {
		level = zapcore.InfoLevel
	}

	// Configure based on environment
	var zapConfig zap.Config
	if config.Environment == "production" {
		zapConfig = zap.NewProductionConfig()
		zapConfig.EncoderConfig.TimeKey = "timestamp"
		zapConfig.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	} else {
		zapConfig = zap.NewDevelopmentConfig()
		zapConfig.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	zapConfig.Level = zap.NewAtomicLevelAt(level)

	// Set output paths
	if len(config.OutputPaths) > 0 {
		zapConfig.OutputPaths = config.OutputPaths
	}

	// Build logger
	logger, err := zapConfig.Build(
		zap.AddCallerSkip(0),
		zap.AddStacktrace(zapcore.ErrorLevel),
	)
	if err != nil {
		return nil, err
	}

	return logger, nil
}

// NewDefaultLogger creates a logger with default settings.
func NewDefaultLogger() (*zap.Logger, error) {
	return NewLogger(LogConfig{
		Level:       "info",
		Environment: "development",
		OutputPaths: []string{"stdout"},
	})
}

// NewProductionLogger creates a production-ready logger.
func NewProductionLogger() (*zap.Logger, error) {
	return NewLogger(LogConfig{
		Level:       "info",
		Environment: "production",
		OutputPaths: []string{"stdout"},
	})
}

// WithRequestID adds a request ID to the logger context.
func WithRequestID(logger *zap.Logger, requestID string) *zap.Logger {
	return logger.With(zap.String("requestId", requestID))
}

// WithItemID adds an item ID to the logger context.
func WithItemID(logger *zap.Logger, itemID int) *zap.Logger {
	return logger.With(zap.Int("itemId", itemID))
}

// WithError adds an error to the logger context.
func WithError(logger *zap.Logger, err error) *zap.Logger {
	return logger.With(zap.Error(err))
}

// LoggerMiddlewareFields creates fields for HTTP middleware logging.
func LoggerMiddlewareFields(method, path string, statusCode int, duration int64) []zapcore.Field {
	return []zapcore.Field{
		zap.String("method", method),
		zap.String("path", path),
		zap.Int("status", statusCode),
		zap.Int64("duration_ms", duration),
	}
}
