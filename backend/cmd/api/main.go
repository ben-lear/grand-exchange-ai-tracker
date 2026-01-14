package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/guavi/grand-exchange-ai-tracker/internal/config"
	"github.com/guavi/grand-exchange-ai-tracker/pkg/logger"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize logger
	logger.Init(cfg.Log.Level, cfg.Log.Format)
	defer logger.Sync()

	logger.Info("Starting OSRS Grand Exchange Tracker API")
	logger.Info("Configuration loaded", "env", cfg.Server.Env)

	// TODO: Initialize database connection
	// TODO: Initialize Redis connection
	// TODO: Initialize Fiber app
	// TODO: Setup routes
	// TODO: Start scheduler for API polling
	// TODO: Start HTTP server

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")
	// TODO: Cleanup resources
}
