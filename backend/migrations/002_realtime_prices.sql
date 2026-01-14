-- Real-time Prices migration (OSRS Wiki)
--
-- NOTE: This migration is intentionally additive (non-destructive).
-- It creates the new tables required by the real-time prices design while keeping
-- legacy tables (`current_prices`, `price_history`) in place for a phased cutover.
-- A later cleanup migration can drop legacy tables after the backend is switched.

-- 1) Items enrichment (metadata from /mapping)
ALTER TABLE items ADD COLUMN IF NOT EXISTS examine TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS value INTEGER;
ALTER TABLE items ADD COLUMN IF NOT EXISTS icon_name TEXT;

-- 2) price_latest (minute snapshots from /latest)
-- High volume table, partitioned by day for manageability.
CREATE TABLE IF NOT EXISTS price_latest (
    item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    high_price BIGINT,
    high_price_time TIMESTAMP WITH TIME ZONE,
    low_price BIGINT,
    low_price_time TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, observed_at)
) PARTITION BY RANGE (observed_at);

CREATE INDEX IF NOT EXISTS idx_price_latest_item_observed_at
    ON price_latest(item_id, observed_at DESC);

-- Partition helper: create daily partitions automatically.
CREATE OR REPLACE FUNCTION create_price_latest_partition()
RETURNS TRIGGER AS $$
DECLARE
    partition_date TEXT;
    partition_name TEXT;
    start_ts TIMESTAMPTZ;
    end_ts TIMESTAMPTZ;
BEGIN
    partition_date := TO_CHAR(NEW.observed_at AT TIME ZONE 'UTC', 'YYYY_MM_DD');
    partition_name := 'price_latest_' || partition_date;

    start_ts := DATE_TRUNC('day', NEW.observed_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
    end_ts := start_ts + INTERVAL '1 day';

    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = partition_name
    ) THEN
        EXECUTE FORMAT(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF price_latest FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_ts, end_ts
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'create_price_latest_partition_trigger'
    ) THEN
        CREATE TRIGGER create_price_latest_partition_trigger
        BEFORE INSERT ON price_latest
        FOR EACH ROW
        EXECUTE FUNCTION create_price_latest_partition();
    END IF;
END $$;

-- Create an initial partition for today (UTC).
DO $$
DECLARE
    partition_date TEXT;
    partition_name TEXT;
    start_ts TIMESTAMPTZ;
    end_ts TIMESTAMPTZ;
BEGIN
    partition_date := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY_MM_DD');
    partition_name := 'price_latest_' || partition_date;
    start_ts := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
    end_ts := start_ts + INTERVAL '1 day';

    EXECUTE FORMAT(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF price_latest FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_ts, end_ts
    );
END $$;

-- 3) Time-series tables (bucketed averages + volumes)
-- Populated by /timeseries on their respective cadences.

CREATE TABLE IF NOT EXISTS price_timeseries_5m (
    item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    avg_high_price BIGINT,
    avg_low_price BIGINT,
    high_price_volume BIGINT NOT NULL DEFAULT 0,
    low_price_volume BIGINT NOT NULL DEFAULT 0,
    inserted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_price_timeseries_5m_item_timestamp
    ON price_timeseries_5m(item_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_timeseries_5m_timestamp
    ON price_timeseries_5m(timestamp);

CREATE TABLE IF NOT EXISTS price_timeseries_1h (
    item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    avg_high_price BIGINT,
    avg_low_price BIGINT,
    high_price_volume BIGINT NOT NULL DEFAULT 0,
    low_price_volume BIGINT NOT NULL DEFAULT 0,
    inserted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_price_timeseries_1h_item_timestamp
    ON price_timeseries_1h(item_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_timeseries_1h_timestamp
    ON price_timeseries_1h(timestamp);

CREATE TABLE IF NOT EXISTS price_timeseries_6h (
    item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    avg_high_price BIGINT,
    avg_low_price BIGINT,
    high_price_volume BIGINT NOT NULL DEFAULT 0,
    low_price_volume BIGINT NOT NULL DEFAULT 0,
    inserted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_price_timeseries_6h_item_timestamp
    ON price_timeseries_6h(item_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_timeseries_6h_timestamp
    ON price_timeseries_6h(timestamp);

CREATE TABLE IF NOT EXISTS price_timeseries_24h (
    item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    avg_high_price BIGINT,
    avg_low_price BIGINT,
    high_price_volume BIGINT NOT NULL DEFAULT 0,
    low_price_volume BIGINT NOT NULL DEFAULT 0,
    inserted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_price_timeseries_24h_item_timestamp
    ON price_timeseries_24h(item_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_timeseries_24h_timestamp
    ON price_timeseries_24h(timestamp);

-- Long-term daily rollup table (derived from pruned 24h buckets).
CREATE TABLE IF NOT EXISTS price_timeseries_daily (
    item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    day DATE NOT NULL,
    avg_high_price BIGINT,
    avg_low_price BIGINT,
    high_price_volume BIGINT NOT NULL DEFAULT 0,
    low_price_volume BIGINT NOT NULL DEFAULT 0,
    inserted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, day)
);

CREATE INDEX IF NOT EXISTS idx_price_timeseries_daily_item_day
    ON price_timeseries_daily(item_id, day DESC);
