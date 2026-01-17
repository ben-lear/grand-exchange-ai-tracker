package utils

import (
	"fmt"
)

// ParseNullableBool parses a query parameter as a nullable bool.
func ParseNullableBool(value string) *bool {
	if value == "" {
		return nil
	}

	if value == "true" || value == "1" {
		result := true
		return &result
	}

	if value == "false" || value == "0" {
		result := false
		return &result
	}

	return nil
}

// FormatGPValue formats a gold piece value for display.
func FormatGPValue(value int64) string {
	if value >= 1000000 {
		return fmt.Sprintf("%.1fM", float64(value)/1000000)
	}
	if value >= 1000 {
		return fmt.Sprintf("%.1fK", float64(value)/1000)
	}
	return fmt.Sprintf("%d", value)
}
