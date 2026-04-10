-- Migration: Fix Product Deletion While Preserving Order History
-- Purpose: Allow products to be deleted without affecting historical order data
-- Date: 2026-02-12
--
-- This migration ensures that:
-- 1. Products can be deleted successfully
-- 2. Historical order data is preserved (orders show product info even after deletion)
-- 3. Cart items are cleaned up when products are deleted
-- 4. Wishlist items are cleaned up when products are deleted
-- 5. Product images are handled properly

-- ============================================
-- STEP 1: Fix the trigger issue
-- ============================================

-- Remove the problematic trigger that blocks CASCADE deletes
DROP TRIGGER IF EXISTS ensure_product_has_category ON product_categories;

-- ============================================
-- STEP 2: Update Foreign Key Constraints
-- ============================================

-- Check and update order_items foreign key to SET NULL instead of CASCADE
-- This preserves order history even when products are deleted

DO $$
BEGIN
    -- Only update if the order_items table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'order_items'
    ) THEN
        -- Drop existing foreign key constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'order_items_item_id_fkey' 
            AND table_name = 'order_items'
        ) THEN
            ALTER TABLE order_items DROP CONSTRAINT order_items_item_id_fkey;
        END IF;

        -- Add new constraint with SET NULL
        -- This means when a product is deleted, the item_id becomes NULL
        -- but all other order data (name, price, image) is preserved
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_item_id_fkey 
        FOREIGN KEY (item_id) 
        REFERENCES items(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Updated order_items foreign key to SET NULL';
    ELSE
        RAISE NOTICE 'Skipped order_items - table does not exist';
    END IF;
END $$;

-- ============================================
-- STEP 3: Ensure CASCADE for non-order tables
-- ============================================

-- Cart items should be deleted when product is deleted (CASCADE)
DO $$
BEGIN
    -- Only update if the cart_items table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'cart_items'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'cart_items_item_id_fkey' 
            AND table_name = 'cart_items'
        ) THEN
            ALTER TABLE cart_items DROP CONSTRAINT cart_items_item_id_fkey;
        END IF;

        ALTER TABLE cart_items 
        ADD CONSTRAINT cart_items_item_id_fkey 
        FOREIGN KEY (item_id) 
        REFERENCES items(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated cart_items foreign key to CASCADE';
    ELSE
        RAISE NOTICE 'Skipped cart_items - table does not exist';
    END IF;
END $$;

-- Wishlist items should be deleted when product is deleted (CASCADE)
DO $$
BEGIN
    -- Only update if the wishlist table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'wishlist'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'wishlist_item_id_fkey' 
            AND table_name = 'wishlist'
        ) THEN
            ALTER TABLE wishlist DROP CONSTRAINT wishlist_item_id_fkey;
        END IF;

        ALTER TABLE wishlist 
        ADD CONSTRAINT wishlist_item_id_fkey 
        FOREIGN KEY (item_id) 
        REFERENCES items(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated wishlist foreign key to CASCADE';
    ELSE
        RAISE NOTICE 'Skipped wishlist - table does not exist';
    END IF;
END $$;

-- Product categories should be deleted when product is deleted (CASCADE)
-- This is already set in migration 001, but we ensure it here
DO $$
BEGIN
    -- Only update if the product_categories table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'product_categories'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'product_categories_product_id_fkey' 
            AND table_name = 'product_categories'
        ) THEN
            ALTER TABLE product_categories DROP CONSTRAINT product_categories_product_id_fkey;
        END IF;

        ALTER TABLE product_categories 
        ADD CONSTRAINT product_categories_product_id_fkey 
        FOREIGN KEY (product_id) 
        REFERENCES items(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated product_categories foreign key to CASCADE';
    ELSE
        RAISE NOTICE 'Skipped product_categories - table does not exist';
    END IF;
END $$;

-- Item images should be deleted when product is deleted (CASCADE)
DO $$
BEGIN
    -- Only update if the item_images table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'item_images'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'item_images_item_id_fkey' 
            AND table_name = 'item_images'
        ) THEN
            ALTER TABLE item_images DROP CONSTRAINT item_images_item_id_fkey;
        END IF;

        ALTER TABLE item_images 
        ADD CONSTRAINT item_images_item_id_fkey 
        FOREIGN KEY (item_id) 
        REFERENCES items(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated item_images foreign key to CASCADE';
    ELSE
        RAISE NOTICE 'Skipped item_images - table does not exist';
    END IF;
END $$;

-- ============================================
-- STEP 4: Add helpful indexes
-- ============================================

-- Index for finding orders with deleted products
CREATE INDEX IF NOT EXISTS idx_order_items_null_item_id 
ON order_items(id) 
WHERE item_id IS NULL;

-- ============================================
-- STEP 5: Create helper view for orders
-- ============================================

-- View to show orders with product deletion status
CREATE OR REPLACE VIEW order_items_with_product_status AS
SELECT 
    oi.*,
    CASE 
        WHEN oi.item_id IS NULL THEN true 
        ELSE false 
    END AS product_deleted,
    i.name AS current_product_name,
    i.is_active AS product_is_active
FROM order_items oi
LEFT JOIN items i ON oi.item_id = i.id;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify the changes
DO $$
DECLARE
    order_items_fk TEXT;
    cart_items_fk TEXT;
    wishlist_fk TEXT;
    product_categories_fk TEXT;
    item_images_fk TEXT;
BEGIN
    -- Check order_items constraint
    SELECT delete_rule INTO order_items_fk
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'order_items' AND tc.constraint_name = 'order_items_item_id_fkey';
    
    -- Check cart_items constraint
    SELECT delete_rule INTO cart_items_fk
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'cart_items' AND tc.constraint_name = 'cart_items_item_id_fkey';
    
    -- Check wishlist constraint
    SELECT delete_rule INTO wishlist_fk
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'wishlist' AND tc.constraint_name = 'wishlist_item_id_fkey';
    
    -- Check product_categories constraint
    SELECT delete_rule INTO product_categories_fk
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'product_categories' AND tc.constraint_name = 'product_categories_product_id_fkey';
    
    -- Check item_images constraint
    SELECT delete_rule INTO item_images_fk
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'item_images' AND tc.constraint_name = 'item_images_item_id_fkey';
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Migration Complete - Verification Results:';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'order_items.item_id: % (should be SET NULL)', order_items_fk;
    RAISE NOTICE 'cart_items.item_id: % (should be CASCADE)', cart_items_fk;
    RAISE NOTICE 'wishlist.item_id: % (should be CASCADE)', wishlist_fk;
    RAISE NOTICE 'product_categories.product_id: % (should be CASCADE)', product_categories_fk;
    RAISE NOTICE 'item_images.item_id: % (should be CASCADE)', item_images_fk;
    RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- SUMMARY
-- ============================================

-- After this migration:
-- ✅ Products can be deleted successfully
-- ✅ Order history is preserved (item_id becomes NULL, but name/price/image remain)
-- ✅ Cart items are automatically removed when product is deleted
-- ✅ Wishlist items are automatically removed when product is deleted
-- ✅ Product categories are automatically removed when product is deleted
-- ✅ Product images are automatically removed when product is deleted
-- ✅ No trigger blocking CASCADE deletes
