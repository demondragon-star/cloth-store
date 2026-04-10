-- =============================================================================
-- Migration: Performance Optimizations for Admin Data Grids & RLS
-- =============================================================================

-- 1. Orders table indexes for fast filtering and sorting
-- Admin web extensively queries orders by status and date
CREATE INDEX IF NOT EXISTS idx_orders_status ON  orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 2. Items table indexes for product catalog grids
-- Admin web filters products by activity and stock levels
CREATE INDEX IF NOT EXISTS idx_items_is_active ON items(is_active);
CREATE INDEX IF NOT EXISTS idx_items_stock_quantity ON items(stock_quantity);

-- 3. Helper Function to optimize Admin Check Policies
-- Using a SECURITY DEFINER function bypasses RLS on the profiles table
-- which avoids recursive RLS checks and speeds up queries significantly.
CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (is_admin = true OR role IN ('admin', 'owner', 'staff'))
  );
$$;

-- Apply optimized function to support chats policies
DROP POLICY IF EXISTS "Admins see all chats" ON support_chats;
CREATE POLICY "Admins see all chats"
    ON support_chats FOR SELECT USING (is_admin_or_staff());

DROP POLICY IF EXISTS "Admins update all chats" ON support_chats;
CREATE POLICY "Admins update all chats"
    ON support_chats FOR UPDATE USING (is_admin_or_staff());

-- Apply optimized function to support messages policies
DROP POLICY IF EXISTS "Admins see all messages" ON support_messages;
CREATE POLICY "Admins see all messages"
    ON support_messages FOR SELECT USING (is_admin_or_staff());

DROP POLICY IF EXISTS "Admins insert messages" ON support_messages;
CREATE POLICY "Admins insert messages"
    ON support_messages FOR INSERT WITH CHECK (is_admin_or_staff());

DROP POLICY IF EXISTS "Admins update messages" ON support_messages;
CREATE POLICY "Admins update messages"
    ON support_messages FOR UPDATE USING (is_admin_or_staff());

-- Apply optimized function to orders admin policies
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE USING (is_admin_or_staff());

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT USING (is_admin_or_staff());
