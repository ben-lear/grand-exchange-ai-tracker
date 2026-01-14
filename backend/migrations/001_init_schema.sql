-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    item_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    icon_large_url TEXT,
    type VARCHAR(100),
    members BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    price INTEGER NOT NULL,
    volume INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, timestamp)
);

-- Create price_trends table
CREATE TABLE IF NOT EXISTS price_trends (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    current_price INTEGER,
    current_trend VARCHAR(20),
    today_price_change INTEGER DEFAULT 0,
    today_trend VARCHAR(20),
    day30_change VARCHAR(20),
    day30_trend VARCHAR(20),
    day90_change VARCHAR(20),
    day90_trend VARCHAR(20),
    day180_change VARCHAR(20),
    day180_trend VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id)
);

-- Create indexes
CREATE INDEX idx_items_item_id ON items(item_id);
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_price_history_item_id ON price_history(item_id);
CREATE INDEX idx_price_history_timestamp ON price_history(timestamp);
CREATE INDEX idx_price_trends_item_id ON price_trends(item_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_trends_updated_at BEFORE UPDATE ON price_trends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
