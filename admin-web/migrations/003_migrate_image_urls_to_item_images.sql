-- Migration: Move image URLs from items.image_urls to item_images table
-- This ensures all products have their images in the correct table structure
-- IMPORTANT: The database column is 'image_url' (not 'url')

-- Step 1: Insert images from image_urls array into item_images table
-- Only for products that have image_urls but no entries in item_images
INSERT INTO item_images (item_id, image_url, display_order, is_primary)
SELECT 
    i.id as item_id,
    unnest(i.image_urls) as image_url,
    ROW_NUMBER() OVER (PARTITION BY i.id ORDER BY ordinality) - 1 as display_order,
    ROW_NUMBER() OVER (PARTITION BY i.id ORDER BY ordinality) = 1 as is_primary
FROM items i
CROSS JOIN LATERAL unnest(i.image_urls) WITH ORDINALITY
WHERE i.image_urls IS NOT NULL 
  AND array_length(i.image_urls, 1) > 0
  AND NOT EXISTS (
    SELECT 1 FROM item_images ii WHERE ii.item_id = i.id
  )
ON CONFLICT DO NOTHING;

-- Step 2: Verify the migration
-- This query shows how many products have images in each location
SELECT 
    'Products with image_urls' as category,
    COUNT(*) as count
FROM items 
WHERE image_urls IS NOT NULL AND array_length(image_urls, 1) > 0

UNION ALL

SELECT 
    'Products with item_images' as category,
    COUNT(DISTINCT item_id) as count
FROM item_images

UNION ALL

SELECT 
    'Total products' as category,
    COUNT(*) as count
FROM items;

-- Step 3: Optional - Clear image_urls after migration (uncomment if you want to clean up)
-- UPDATE items SET image_urls = NULL WHERE id IN (
--     SELECT DISTINCT item_id FROM item_images
-- );

-- Note: Run this migration after deploying the code changes
-- This ensures existing products will display images correctly
-- The 'image_url' column is the actual database column name
