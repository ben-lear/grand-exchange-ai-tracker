package scheduler

import (
	"context"
	"sync"
	"time"

	"github.com/guavi/grand-exchange-ai-tracker/pkg/logger"
	"github.com/robfig/cron/v3"
)

// Scheduler manages all scheduled jobs
type Scheduler struct {
	cron    *cron.Cron
	jobs    map[string]cron.EntryID
	runningJobs map[string]bool
	mu      sync.RWMutex
	running bool
}

// JobFunc represents a scheduled job function
type JobFunc func(ctx context.Context) error

// New creates a new scheduler instance
func New() *Scheduler {
	return &Scheduler{
		cron: cron.New(cron.WithSeconds()),
		jobs: make(map[string]cron.EntryID),
		runningJobs: make(map[string]bool),
	}
}

// AddJob adds a new scheduled job
func (s *Scheduler) AddJob(name, schedule string, fn JobFunc) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	entryID, err := s.cron.AddFunc(schedule, func() {
		// Prevent overlapping runs of the same job
		s.mu.Lock()
		if s.runningJobs[name] {
			s.mu.Unlock()
			logger.Warn("scheduled job already running, skipping", "job", name)
			return
		}
		s.runningJobs[name] = true
		s.mu.Unlock()

		defer func() {
			s.mu.Lock()
			s.runningJobs[name] = false
			s.mu.Unlock()
		}()

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		logger.Info("starting scheduled job", "job", name)
		start := time.Now()

		if err := fn(ctx); err != nil {
			logger.Error("scheduled job failed",
				"job", name,
				"error", err,
				"duration", time.Since(start).String())
			return
		}

		logger.Info("scheduled job completed",
			"job", name,
			"duration", time.Since(start).String())
	})

	if err != nil {
		return err
	}

	s.jobs[name] = entryID
	logger.Info("scheduled job added", "job", name, "schedule", schedule)
	return nil
}

// Start starts the scheduler
func (s *Scheduler) Start() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running {
		logger.Warn("scheduler already running")
		return
	}

	s.cron.Start()
	s.running = true
	logger.Info("scheduler started", "jobs_count", len(s.jobs))
}

// Stop stops the scheduler gracefully
func (s *Scheduler) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.running {
		return
	}

	ctx := s.cron.Stop()
	<-ctx.Done()
	s.running = false
	logger.Info("scheduler stopped")
}

// IsRunning returns whether the scheduler is running
func (s *Scheduler) IsRunning() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.running
}

// GetJobCount returns the number of registered jobs
func (s *Scheduler) GetJobCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.jobs)
}
