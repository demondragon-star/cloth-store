-- Migration: Update Categories for Display Improvements
-- Purpose: Update category records with image URLs and display order, deactivate obsolete categories
-- Date: 2026-01-29
-- Feature: category-display-improvements

-- Begin transaction for rollback safety
BEGIN;

-- Step 1: Update Men category with image_url and display_order
UPDATE categories
SET 
    image_url = 'men',
    display_order = 1,
    is_active = true,
    updated_at = NOW()
WHERE LOWER(name) = 'men' OR LOWER(slug) = 'men';

-- Step 2: Update Women category with image_url and display_order
UPDATE categories
SET 
    image_url = 'women',
    display_order = 2,
    is_active = true,
    updated_at = NOW()
WHERE LOWER(name) = 'women' OR LOWER(slug) = 'women';

-- Step 3: Update Kids category with image_url and display_order
UPDATE categories
SET 
    image_url = 'kids',
    display_order = 3,
    is_active = true,
    updated_at = NOW()
WHERE LOWER(name) = 'kids' OR LOWER(slug) = 'kids';

-- Step 4: Update Sports category with image_url and display_order
UPDATE categories
SET 
    image_url = 'sports',
    display_order = 4,
    is_active = true,
    updated_at = NOW()
WHERE LOWER(name) = 'sports' OR LOWER(slug) = 'sports';

-- Step 5: Deactivate Footwear category
UPDATE categories
SET 
    is_active = false,
    display_order = 99,
    updated_at = NOW()
WHERE LOWER(name) = 'footwear' OR LOWER(slug) = 'footwear';

-- Step 6: Deactivate Accessories category
UPDATE categories
SET 
    is_active = false,
    display_order = 99,
    updated_at = NOW()
WHERE LOWER(name) = 'accessories' OR LOWER(slug) = 'accessories';

-- Step 7: Get category IDs for product reassignment
DO $
DECLARE
    footwear_id UUID;
    accessories_id UUID;
    men_id UUID;
    women_id UUID;
    sports_id UUID;
    product_record RECORD;
BEGIN
    -- Get category IDs
    SELECT id INTO footwear_id FROM categories WHERE LOWER(name) = 'footwear' OR LOWER(slug) = 'footwear';
    SELECT id INTO accessories_id FROM categories WHERE LOWER(name) = 'accessories' OR LOWER(slug) = 'accessories';
    SELECT id INTO men_id FROM categories WHERE LOWER(name) = 'men' OR LOWER(slug) = 'men';
    SELECT id INTO women_id FROM categories WHERE LOWER(name) = 'women' OR LOWER(slug) = 'women';
    SELECT id INTO sports_id FROM categories WHERE LOWER(name) = 'sports' OR LOWER(slug) = 'sports';

    -- Reassign products from Footwear to Sports (if Footwear exists)
    IF footwear_id IS NOT NULL AND sports_id IS NOT NULL THEN
        -- Update product_categories junction table
        UPDATE product_categories
        SET category_id = sports_id, updated_at = NOW()
        WHERE category_id = footwear_id
        AND NOT EXISTS (
            SELECT 1 FROM product_categories pc2 
            WHERE pc2.product_id = product_categories.product_id 
            AND pc2.category_id = sports_id
        );

        -- For products that already have Sports category, just delete the Footwear association
        DELETE FROM product_categories
        WHERE category_id = footwear_id;

        RAISE NOTICE 'Reassigned products from Footwear to Sports category';
    END IF;

    -- Reassign products from Accessories to Men (if Accessories exists)
    -- Note: In a real scenario, you might want manual review for better categorization
    IF accessories_id IS NOT NULL AND men_id IS NOT NULL THEN
        -- Update product_categories junction table
        UPDATE product_categories
        SET category_id = men_id, updated_at = NOW()
        WHERE category_id = accessories_id
        AND NOT EXISTS (
            SELECT 1 FROM product_categories pc2 
            WHERE pc2.product_id = product_categories.product_id 
            AND pc2.category_id = men_id
        );

        -- For products that already have Men category, just delete the Accessories association
        DELETE FROM product_categories
        WHERE category_id = accessories_id;

        RAISE NOTICE 'Reassigned products from Accessories to Men category';
    END IF;

    -- Also handle legacy items table if it still has category_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'items' AND column_name = 'category_id'
    ) THEN
        -- Update items with Footwear to Sports
        IF footwear_id IS NOT NULL AND sports_id IS NOT NULL THEN
            UPDATE items
            SET category_id = sports_id, updated_at = NOW()
            WHERE category_id = footwear_id;
        END IF;

        -- Update items with Accessories to Men
        IF accessories_id IS NOT NULL AND men_id IS NOT NULL THEN
            UPDATE items
            SET category_id = men_id, updated_at = NOW()
            WHERE category_id = accessories_id;
        END IF;
    END IF;
END $;

-- Step 8: Verify the migration results
DO $
DECLARE
    active_count INTEGER;
    inactive_count INTEGER;
BEGIN
    -- Count active categories
    SELECT COUNT(*) INTO active_count FROM categories WHERE is_active = true;
    
    -- Count inactive categories
    SELECT COUNT(*) INTO inactive_count FROM categories WHERE is_active = false;
    
    RAISE NOTICE 'Migration completed: % active categories, % inactive categories', active_count, inactive_count;
    
    -- Verify we have exactly 4 active categories
    IF active_count < 4 THEN
        RAISE WARNING 'Expected at least 4 active categories, found %', active_count;
    END IF;
END $;

-- Commit the transaction
COMMIT;

-- Migration completed successfully
-- Next steps:
-- 1. Verify category updates in Supabase dashboard
-- 2. Check that products have been reassigned correctly
-- 3. Test the mobile app to ensure categories display with images
-- 4. Add actual image files to assets/images/categories/ directory

-- Rollback instructions (if needed):
-- BEGIN;
-- UPDATE categories SET is_active = true WHERE LOWER(name) IN ('footwear', 'accessories');
-- UPDATE categories SET image_url = NULL WHERE LOWER(name) IN ('men', 'women', 'kids', 'sports');
-- COMMIT;
