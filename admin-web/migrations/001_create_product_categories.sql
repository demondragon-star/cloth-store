-- Migration: Create Product Categories Junction Table
-- Purpose: Enable many-to-many relationship between products and categories
-- Date: 2026-01-27

-- Step 1: Create the junction table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_product_category UNIQUE(product_id, category_id)
);

-- Step 2: Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_created_at ON product_categories(created_at DESC);

-- Step 3: Migrate existing data from items table
-- This preserves existing single-category relationships
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id 
FROM items 
WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Step 4: Create function to validate at least one category exists
CREATE OR REPLACE FUNCTION validate_product_has_category()
RETURNS TRIGGER AS $$
DECLARE
    remaining_count INTEGER;
BEGIN
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
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to enforce at least one category
DROP TRIGGER IF EXISTS ensure_product_has_category ON product_categories;
CREATE TRIGGER ensure_product_has_category
BEFORE DELETE ON product_categories
FOR EACH ROW
EXECUTE FUNCTION validate_product_has_category();

-- Step 6: Create function to update timestamp
CREATE OR REPLACE FUNCTION update_product_categories_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for timestamp updates
DROP TRIGGER IF EXISTS update_product_categories_timestamp ON product_categories;
CREATE TRIGGER update_product_categories_timestamp
BEFORE UPDATE ON product_categories
FOR EACH ROW
EXECUTE FUNCTION update_product_categories_timestamp();

-- Step 8: Enable Row Level Security (RLS)
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
-- Allow public read access
CREATE POLICY "Allow public read access to product_categories"
ON product_categories FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert to product_categories"
ON product_categories FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update to product_categories"
ON product_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete from product_categories"
ON product_categories FOR DELETE
TO authenticated
USING (true);

-- Step 10: Create helper function to get product categories
CREATE OR REPLACE FUNCTION get_product_category_ids(p_product_id UUID)
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT category_id 
        FROM product_categories 
        WHERE product_id = p_product_id
        ORDER BY created_at
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 11: Create helper function to check if product is in category
CREATE OR REPLACE FUNCTION is_product_in_category(p_product_id UUID, p_category_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM product_categories 
        WHERE product_id = p_product_id 
        AND category_id = p_category_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Migration completed successfully
-- Next steps:
-- 1. Run this migration on your Supabase database
-- 2. Verify data migration completed
-- 3. Update application code to use product_categories table
