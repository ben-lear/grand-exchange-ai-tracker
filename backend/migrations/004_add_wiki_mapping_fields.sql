-- Add new fields from Wiki Prices API /mapping endpoint
-- These fields provide richer metadata for items

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS examine TEXT,
ADD COLUMN IF NOT EXISTS value INTEGER,
ADD COLUMN IF NOT EXISTS icon_name TEXT;

-- Create index on icon_name for filtering/searching
CREATE INDEX IF NOT EXISTS idx_items_icon_name ON items(icon_name);
