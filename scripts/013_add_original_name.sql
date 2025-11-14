-- Add original_name column to users table to preserve the original name
ALTER TABLE users ADD COLUMN IF NOT EXISTS original_name TEXT;

-- Set original_name to current full_name for existing users who don't have it
UPDATE users SET original_name = full_name WHERE original_name IS NULL;

-- Make original_name required for new users
ALTER TABLE users ALTER COLUMN original_name SET NOT NULL;
