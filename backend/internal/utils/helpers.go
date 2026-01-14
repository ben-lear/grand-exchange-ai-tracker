package utils

import (
	"time"

	"github.com/google/uuid"
)

// GenerateRequestID generates a unique request ID
func GenerateRequestID() string {
	return uuid.New().String()
}

// FormatDuration formats a duration in milliseconds
func FormatDuration(start time.Time) int64 {
	return time.Since(start).Milliseconds()
}

// MeasureTime returns a function that logs the duration of an operation
func MeasureTime(name string) func() {
	start := time.Now()
	return func() {
		duration := time.Since(start)
		// This could be enhanced to use a logger
		_ = duration
	}
}
