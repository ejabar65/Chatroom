-- Add is_throttled column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_throttled BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_is_throttled ON users(is_throttled);

-- Update existing users to not be throttled by default
UPDATE users SET is_throttled = FALSE WHERE is_throttled IS NULL;
