-- Ensure item_images table exists with correct schema
-- This migration is idempotent and safe to run multiple times

-- Create item_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS item_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_item_images_item_id ON item_images(item_id);
CREATE INDEX IF NOT EXISTS idx_item_images_display_order ON item_images(item_id, display_order);
CREATE INDEX IF NOT EXISTS idx_item_images_is_primary ON item_images(item_id, is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_images
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to item_images" ON item_images;
DROP POLICY IF EXISTS "Allow authenticated users to manage item_images" ON item_images;

-- Allow public read access
CREATE POLICY "Allow public read access to item_images"
    ON item_images FOR SELECT
    USING (true);

-- Allow authenticated users to insert/update/delete (for admin operations)
CREATE POLICY "Allow authenticated users to manage item_images"
    ON item_images FOR ALL
    USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_item_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_item_images_updated_at ON item_images;
CREATE TRIGGER update_item_images_updated_at
    BEFORE UPDATE ON item_images
    FOR EACH ROW
    EXECUTE FUNCTION update_item_images_updated_at();

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'item_images'
ORDER BY ordinal_position;
