-- Migration 005: Watchlist Shares
-- Creates table for temporary watchlist sharing with token-based access

-- Create watchlist_shares table
CREATE TABLE IF NOT EXISTS watchlist_shares (
    token VARCHAR(50) PRIMARY KEY,
    watchlist_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    access_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT token_format_check CHECK (token ~ '^[a-z]+-[a-z]+-[a-z]+$'),
    CONSTRAINT positive_access_count CHECK (access_count >= 0)
);

-- Create index for efficient cleanup of expired shares
CREATE INDEX IF NOT EXISTS idx_watchlist_shares_expires_at 
ON watchlist_shares(expires_at);

-- Create index for lookup by creation date
CREATE INDEX IF NOT EXISTS idx_watchlist_shares_created_at 
ON watchlist_shares(created_at);

-- Add comment to table
COMMENT ON TABLE watchlist_shares IS 'Temporary storage for shared watchlists with memorable token-based access';
COMMENT ON COLUMN watchlist_shares.token IS 'Memorable share token in format: adjective-adjective-noun';
COMMENT ON COLUMN watchlist_shares.watchlist_data IS 'Complete watchlist data stored as JSONB';
COMMENT ON COLUMN watchlist_shares.expires_at IS 'Expiration timestamp (default 7 days from creation)';
COMMENT ON COLUMN watchlist_shares.access_count IS 'Number of times this share has been accessed';
