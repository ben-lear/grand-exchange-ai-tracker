-- Cleanup migration: drop legacy price tables
--
-- The backend has been cut over to OSRS Wiki real-time prices tables:
-- - price_latest (minute snapshots)
-- - price_timeseries_* (bucketed history)
-- - price_timeseries_daily (rollups)
--
-- This migration removes the original legacy tables introduced in 001_init.sql:
-- - current_prices
-- - price_history (and its partitions/trigger)

-- Drop trigger safely (cannot use DROP TRIGGER ... ON ... if the table is missing)
DO $$
BEGIN
    IF to_regclass('public.price_history') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS create_price_history_partition_trigger ON price_history';
    END IF;
END $$;

-- Drop legacy tables (CASCADE removes monthly partitions of price_history)
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS current_prices;

-- Drop legacy partition helper
DROP FUNCTION IF EXISTS create_price_history_partition();
