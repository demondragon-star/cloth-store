-- Migration: Fix Product Deletion CASCADE
-- Purpose: Allow CASCADE deletes when products are removed while preserving protection against manual removal of last category
-- Date: 2026-02-12
-- 
-- Problem: The validate_product_has_category() trigger prevents deletion of the last category from a product,
-- which inadvertently blocks CASCADE deletes when products are removed.
--
-- Solution: Modify the trigger to detect CASCADE deletes by checking if the parent product still exists.
-- If the product doesn't exist, allow the deletion (CASCADE). If it exists, enforce the validation (manual deletion).
--
-- Rollback: To rollback, restore the original function from migration 001_create_product_categories.sql

-- Step 1: Replace the trigger function with CASCADE detection logic
CREATE OR REPLACE FUNCTION validate_product_has_category()
RETURNS TRIGGER AS $
DECLARE
    remaining_count INTEGER;
    product_exists BOOLEAN;
BEGIN
    -- Check if the parent product still exists
    -- If it doesn't exist, this is a CASCADE delete from product deletion
    SELECT EXISTS(SELECT 1 FROM items WHERE id = OLD.product_id) INTO product_exists;
    
    -- If product doesn't exist, allow the CASCADE delete
    IF NOT product_exists THEN
        RETURN OLD;
    END IF;
    
    -- Product exists, so this is a manual category removal
    -- Count remaining categories for this product after deletion
    SELECT COUNT(*) INTO remaining_count
    FROM product_categories
    WHERE product_id = OLD.product_id
    AND id != OLD.id;
    
    -- If this is the last category, prevent deletion
    IF remaining_count = 0 THEN
        RAISE EXCEPTION 'Cannot remove the last category from a product. Each product must have at least one category.';
    END IF;
    
    RETURN OLD;
END;
$ LANGUAGE plpgsql;

-- Note: The trigger 'ensure_product_has_category' already references this function,
-- so no trigger recreation is needed. The updated function will be used automatically.

-- Verification:
-- 1. Test CASCADE delete: Delete a product and verify all product_categories entries are removed
-- 2. Test manual protection: Try to manually delete the last category from a product and verify it's blocked
-- 3. Test idempotency: Run this migration multiple times and verify no errors occur

