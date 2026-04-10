-- Coupon System Migration
-- Creates tables for coupons and coupon usage tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(12) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  coupon_type VARCHAR(20) NOT NULL CHECK (coupon_type IN ('first_order', 'cart_value', 'party', 'general')),
  min_cart_value DECIMAL(10,2) DEFAULT 0 CHECK (min_cart_value >= 0),
  max_discount DECIMAL(10,2) CHECK (max_discount IS NULL OR max_discount > 0),
  usage_limit_per_user INTEGER DEFAULT 1 CHECK (usage_limit_per_user > 0),
  total_usage_limit INTEGER CHECK (total_usage_limit IS NULL OR total_usage_limit > 0),
  current_usage_count INTEGER DEFAULT 0 CHECK (current_usage_count >= 0),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL CHECK (valid_until > valid_from),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coupon_usage table
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL CHECK (discount_amount >= 0),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON coupons(coupon_type);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order ON coupon_usage(order_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check if user can use coupon
CREATE OR REPLACE FUNCTION can_user_use_coupon(
    p_coupon_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_usage_count INTEGER;
    v_usage_limit INTEGER;
BEGIN
    -- Get usage limit for this coupon
    SELECT usage_limit_per_user INTO v_usage_limit
    FROM coupons
    WHERE id = p_coupon_id;
    
    -- Count how many times user has used this coupon
    SELECT COUNT(*) INTO v_usage_count
    FROM coupon_usage
    WHERE coupon_id = p_coupon_id AND user_id = p_user_id;
    
    -- Return true if user hasn't reached limit
    RETURN v_usage_count < v_usage_limit;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons table
-- Allow public to read active coupons
CREATE POLICY "Public can view active coupons"
    ON coupons FOR SELECT
    USING (is_active = true);

-- Allow authenticated users to view all coupons (for admin)
CREATE POLICY "Authenticated users can view all coupons"
    ON coupons FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert coupons (admin only - enforce in app)
CREATE POLICY "Authenticated users can insert coupons"
    ON coupons FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update coupons (admin only - enforce in app)
CREATE POLICY "Authenticated users can update coupons"
    ON coupons FOR UPDATE
    TO authenticated
    USING (true);

-- Allow authenticated users to delete coupons (admin only - enforce in app)
CREATE POLICY "Authenticated users can delete coupons"
    ON coupons FOR DELETE
    TO authenticated
    USING (true);

-- RLS Policies for coupon_usage table
-- Users can view their own usage
CREATE POLICY "Users can view own coupon usage"
    ON coupon_usage FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert usage records
CREATE POLICY "Authenticated users can insert coupon usage"
    ON coupon_usage FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view all usage (admin only - enforce in app)
CREATE POLICY "Authenticated users can view all usage"
    ON coupon_usage FOR SELECT
    TO authenticated
    USING (true);

-- Add comment to tables
COMMENT ON TABLE coupons IS 'Stores discount coupons with validation rules';
COMMENT ON TABLE coupon_usage IS 'Tracks coupon usage per user and order';

-- Insert sample coupons for testing (optional - remove in production)
INSERT INTO coupons (code, description, discount_type, discount_value, coupon_type, min_cart_value, usage_limit_per_user, total_usage_limit, valid_from, valid_until, is_active)
VALUES 
    ('FIRST100', 'Save ₹100 on your first order', 'fixed', 100, 'first_order', 1500, 1, 1000, NOW(), NOW() + INTERVAL '30 days', true),
    ('SAVE50', 'Save ₹50 on any order', 'fixed', 50, 'general', 500, 1, 500, NOW(), NOW() + INTERVAL '30 days', true),
    ('CART200', 'Save ₹200 on orders above ₹3000', 'fixed', 200, 'cart_value', 3000, 1, 200, NOW(), NOW() + INTERVAL '30 days', true),
    ('PARTY20', '20% off for party season', 'percentage', 20, 'party', 1000, 1, 300, NOW(), NOW() + INTERVAL '15 days', true)
ON CONFLICT (code) DO NOTHING;
