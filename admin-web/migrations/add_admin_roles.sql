-- Add role column to profiles table for admin role management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';

-- Update existing admins to have 'owner' role
UPDATE profiles SET role = 'owner' WHERE is_admin = TRUE AND role IS NULL;

-- Add check constraint for valid roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('owner', 'admin', 'staff') OR role IS NULL);

-- Comment
COMMENT ON COLUMN profiles.role IS 'Admin role: owner (full access), admin (most features), staff (limited access)';
