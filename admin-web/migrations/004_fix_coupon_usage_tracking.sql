-- Fix Coupon Usage Tracking
-- This migration removes the UNIQUE constraint that prevents tracking multiple uses
-- and adds proper tracking for each coupon usage instance

-- Step 1: Drop the UNIQUE constraint that prevents multiple uses
ALTER TABLE coupon_usage DROP CONSTRAINT IF EXISTS coupon_usage_coupon_id_user_id_key;

-- Step 2: Add created_at if it doesn't exist (for better tracking)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupon_usage' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE coupon_usage ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Step 3: Create a composite index for efficient querying
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_coupon_date 
ON coupon_usage(user_id, coupon_id, used_at DESC);

-- Step 4: Create a view for easy coupon usage reporting
CREATE OR REPLACE VIEW user_coupon_usage_report AS
SELECT 
    cu.id as usage_id,
    cu.user_id,
    p.email as user_email,
    p.full_name as user_name,
    c.id as coupon_id,
    c.code as coupon_code,
    c.coupon_type,
    c.discount_type,
    c.discount_value,
    cu.discount_amount,
    cu.order_id,
    o.order_number,
    o.status as order_status,
    cu.used_at,
    CASE 
        WHEN NOW() > c.valid_until THEN 'expired'
        WHEN NOW() < c.valid_from THEN 'not_yet_active'
        WHEN c.is_active = false THEN 'inactive'
        ELSE 'active'
    END as coupon_validity_status,
    c.valid_from,
    c.valid_until,
    c.usage_limit_per_user,
    (
        SELECT COUNT(*) 
        FROM coupon_usage cu2 
        WHERE cu2.user_id = cu.user_id 
        AND cu2.coupon_id = cu.coupon_id
    ) as times_used_by_user
FROM coupon_usage cu
JOIN coupons c ON cu.coupon_id = c.id
JOIN profiles p ON cu.user_id = p.id
LEFT JOIN orders o ON cu.order_id = o.id
ORDER BY cu.used_at DESC;

-- Step 5: Create function to get user's coupon usage history
CREATE OR REPLACE FUNCTION get_user_coupon_history(p_user_id UUID)
RETURNS TABLE (
    coupon_code VARCHAR,
    coupon_type VARCHAR,
    discount_amount DECIMAL,
    used_date TIMESTAMP WITH TIME ZONE,
    order_number VARCHAR,
    validity_status TEXT,
    times_used BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.code as coupon_code,
        c.coupon_type,
        cu.discount_amount,
        cu.used_at as used_date,
        o.order_number,
        CASE 
            WHEN NOW() > c.valid_until THEN 'expired'
            WHEN NOW() < c.valid_from THEN 'not_yet_active'
            WHEN c.is_active = false THEN 'inactive'
            ELSE 'active'
        END as validity_status,
        COUNT(*) OVER (PARTITION BY cu.coupon_id) as times_used
    FROM coupon_usage cu
    JOIN coupons c ON cu.coupon_id = c.id
    LEFT JOIN orders o ON cu.order_id = o.id
    WHERE cu.user_id = p_user_id
    ORDER BY cu.used_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to get coupon usage statistics
CREATE OR REPLACE FUNCTION get_coupon_usage_stats(p_coupon_id UUID)
RETURNS TABLE (
    total_uses BIGINT,
    unique_users BIGINT,
    total_discount_given DECIMAL,
    last_used TIMESTAMP WITH TIME ZONE,
    most_recent_user_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_uses,
        COUNT(DISTINCT cu.user_id)::BIGINT as unique_users,
        SUM(cu.discount_amount) as total_discount_given,
        MAX(cu.used_at) as last_used,
        (
            SELECT p.email 
            FROM coupon_usage cu2
            JOIN profiles p ON cu2.user_id = p.id
            WHERE cu2.coupon_id = p_coupon_id
            ORDER BY cu2.used_at DESC
            LIMIT 1
        ) as most_recent_user_email
    FROM coupon_usage cu
    WHERE cu.coupon_id = p_coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add comments for documentation
COMMENT ON VIEW user_coupon_usage_report IS 'Comprehensive view of all coupon usage with user and coupon details';
COMMENT ON FUNCTION get_user_coupon_history IS 'Returns coupon usage history for a specific user';
COMMENT ON FUNCTION get_coupon_usage_stats IS 'Returns usage statistics for a specific coupon';

-- Step 8: Grant permissions
GRANT SELECT ON user_coupon_usage_report TO authenticated;

