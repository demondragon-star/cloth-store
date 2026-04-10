-- =============================================================================
-- Migration: Fix Admin Support Policies
-- Description: Grant admins permission to manage support chats and messages.
-- =============================================================================

-- 1. Grant admins permission to manage support chats (SELECT & UPDATE)
DROP POLICY IF EXISTS "Admins see all chats" ON support_chats;
CREATE POLICY "Admins see all chats"
    ON support_chats FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin', 'owner', 'staff'))));

DROP POLICY IF EXISTS "Admins update all chats" ON support_chats;
CREATE POLICY "Admins update all chats"
    ON support_chats FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin', 'owner', 'staff'))));


-- 2. Grant admins permission to manage support messages (SELECT, INSERT, UPDATE)
DROP POLICY IF EXISTS "Admins see all messages" ON support_messages;
CREATE POLICY "Admins see all messages"
    ON support_messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin', 'owner', 'staff'))));

DROP POLICY IF EXISTS "Admins insert messages" ON support_messages;
CREATE POLICY "Admins insert messages"
    ON support_messages FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin', 'owner', 'staff'))));

DROP POLICY IF EXISTS "Admins update messages" ON support_messages;
CREATE POLICY "Admins update messages"
    ON support_messages FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin', 'owner', 'staff'))));
