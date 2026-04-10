-- Migration: Fix Product Deletion While Preserving Order History
-- Purpose: Allow products to be deleted without affecting historical order data
-- Date: 2026-02-12

-- ============================================
-- STEP 1: Remove the problematic trigger
-- ============================================

DROP TRIGGER IF EXISTS ensure_product_has_category ON product_categories;

-- ============================================
-- STEP 2: Update Foreign Key Constraints
-- ============================================

-- Update order_items to preserve history (SET NULL)
-- This means when a product is deleted, order history is preserved
ALTER TABLE IF EXISTS order_items DROP CONSTRAINT IF EXISTS order_items_item_id_fkey;
ALTER TABLE IF EXISTS order_items 
ADD CONSTRAINT order_items_item_id_fkey 
FOREIGN KEY (item_id) 
REFERENCES items(id) 
ON DELETE SET NULL;

-- Update cart_items to CASCADE (clean up when product deleted)
ALTER TABLE IF EXISTS cart_items DROP CONSTRAINT IF EXISTS cart_items_item_id_fkey;
ALTER TABLE IF EXISTS cart_items 
ADD CONSTRAINT cart_items_item_id_fkey 
FOREIGN KEY (item_id) 
REFERENCES items(id) 
ON DELETE CASCADE;

-- Update wishlist to CASCADE (clean up when product deleted)
ALTER TABLE IF EXISTS wishlist DROP CONSTRAINT IF EXISTS wishlist_item_id_fkey;
ALTER TABLE IF EXISTS wishlist 
ADD CONSTRAINT wishlist_item_id_fkey 
FOREIGN KEY (item_id) 
REFERENCES items(id) 
ON DELETE CASCADE;

-- Update product_categories to CASCADE
ALTER TABLE IF EXISTS product_categories DROP CONSTRAINT IF EXISTS product_categories_product_id_fkey;
ALTER TABLE IF EXISTS product_categories 
ADD CONSTRAINT product_categories_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES items(id) 
ON DELETE CASCADE;

-- Update item_images to CASCADE
ALTER TABLE IF EXISTS item_images DROP CONSTRAINT IF EXISTS item_images_item_id_fkey;
ALTER TABLE IF EXISTS item_images 
ADD CONSTRAINT item_images_item_id_fkey 
FOREIGN KEY (item_id) 
REFERENCES items(id) 
ON DELETE CASCADE;

-- ============================================
-- STEP 3: Add helpful index
-- ============================================

CREATE INDEX IF NOT EXISTS idx_order_items_null_item_id 
ON order_items(id) 
WHERE item_id IS NULL;

-- ============================================
-- STEP 4: Create view for orders with deleted products
-- ============================================

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

