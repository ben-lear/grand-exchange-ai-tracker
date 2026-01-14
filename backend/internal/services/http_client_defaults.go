package services

import "time"

// Shared HTTP client defaults.
//
// These were previously defined in the legacy OSRS client; they are now shared by
// the OSRS Wiki prices client and any future external API clients.
const (
	requestTimeout   = 30 * time.Second
	maxRetries       = 3
	retryWaitTime    = 2 * time.Second
	maxRetryWaitTime = 10 * time.Second

	// The OSRS Wiki requests a descriptive User-Agent.
	userAgent = "OSRS-GE-Tracker/1.0 (Educational Project)"
)
