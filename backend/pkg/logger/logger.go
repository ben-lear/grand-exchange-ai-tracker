package logger

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var log *zap.Logger

func Init(level, format string) {
	var config zap.Config

	if format == "json" {
		config = zap.NewProductionConfig()
	} else {
		config = zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	// Set log level
	switch level {
	case "debug":
		config.Level = zap.NewAtomicLevelAt(zapcore.DebugLevel)
	case "info":
		config.Level = zap.NewAtomicLevelAt(zapcore.InfoLevel)
	case "warn":
		config.Level = zap.NewAtomicLevelAt(zapcore.WarnLevel)
	case "error":
		config.Level = zap.NewAtomicLevelAt(zapcore.ErrorLevel)
	default:
		config.Level = zap.NewAtomicLevelAt(zapcore.InfoLevel)
	}

	var err error
	log, err = config.Build()
	if err != nil {
		panic(err)
	}
}

func Sync() {
	if log != nil {
		_ = log.Sync()
	}
}

func Debug(msg string, fields ...interface{}) {
	log.Sugar().Debugw(msg, fields...)
}

func Info(msg string, fields ...interface{}) {
	log.Sugar().Infow(msg, fields...)
}

func Warn(msg string, fields ...interface{}) {
	log.Sugar().Warnw(msg, fields...)
}

func Error(msg string, fields ...interface{}) {
	log.Sugar().Errorw(msg, fields...)
}

func Fatal(msg string, fields ...interface{}) {
	log.Sugar().Fatalw(msg, fields...)
}
