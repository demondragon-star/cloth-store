-- Migration: Fix Product Deletion CASCADE (Alternative Approach)
-- Purpose: Remove the problematic trigger and handle validation at application level
-- Date: 2026-02-12
-- 
-- Problem: The validate_product_has_category() trigger prevents CASCADE deletes when products are removed.
-- Solution: Drop the trigger entirely and enforce the "at least one category" rule in application code only.
--
-- This is safer and more maintainable than trying to detect CASCADE vs manual deletes in the trigger.

-- Step 1: Drop the trigger (but keep the function for potential future use)
DROP TRIGGER IF EXISTS ensure_product_has_category ON product_categories;

-- Step 2: Comment out the trigger for documentation
-- The trigger is now disabled. The "at least one category" validation
-- is enforced in the application layer through the updateProductCategories,
-- removeProductCategory, and addProductCategory functions.

-- Step 3: Verification
-- After running this migration:
-- 1. Products can be deleted (CASCADE will work)
-- 2. Application code still prevents removing the last category manually
-- 3. No database-level blocking of valid operations

-- Note: If you need to re-enable the trigger in the future, run:
-- CREATE TRIGGER ensure_product_has_category
-- BEFORE DELETE ON product_categories
-- FOR EACH ROW
-- EXECUTE FUNCTION validate_product_has_category();

