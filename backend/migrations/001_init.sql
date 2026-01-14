-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    item_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    icon_url TEXT,
    members BOOLEAN DEFAULT false,
    buy_limit INTEGER,
    high_alch INTEGER,
    low_alch INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create current_prices table
CREATE TABLE IF NOT EXISTS current_prices (
    item_id INTEGER PRIMARY KEY REFERENCES items(item_id) ON DELETE CASCADE,
    high_price BIGINT,
    high_price_time TIMESTAMP WITH TIME ZONE,
    low_price BIGINT,
    low_price_time TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create price_history table (partitioned by month)
CREATE TABLE IF NOT EXISTS price_history (
    id BIGSERIAL,
    item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    high_price BIGINT,
    low_price BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_item_id ON items(item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_item_timestamp ON price_history(item_id, timestamp DESC);

-- Function to create monthly partitions automatically
CREATE OR REPLACE FUNCTION create_price_history_partition()
RETURNS TRIGGER AS $$
DECLARE
    partition_date TEXT;
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    partition_date := TO_CHAR(NEW.timestamp, 'YYYY_MM');
    partition_name := 'price_history_' || partition_date;
    start_date := TO_CHAR(DATE_TRUNC('month', NEW.timestamp), 'YYYY-MM-DD');
    end_date := TO_CHAR(DATE_TRUNC('month', NEW.timestamp) + INTERVAL '1 month', 'YYYY-MM-DD');
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = partition_name
    ) THEN
        EXECUTE FORMAT(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF price_history FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create partitions
CREATE TRIGGER create_price_history_partition_trigger
BEFORE INSERT ON price_history
FOR EACH ROW
EXECUTE FUNCTION create_price_history_partition();

-- Create initial partition for current month
DO $$
DECLARE
    current_month TEXT;
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    current_month := TO_CHAR(CURRENT_DATE, 'YYYY_MM');
    partition_name := 'price_history_' || current_month;
    start_date := TO_CHAR(DATE_TRUNC('month', CURRENT_DATE), 'YYYY-MM-DD');
    end_date := TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month', 'YYYY-MM-DD');
    
    EXECUTE FORMAT(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF price_history FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END $$;
