-- Grant admin permissions to the specified email
-- This will be executed after a user signs up with this email

-- Function to automatically grant admin to specific email
CREATE OR REPLACE FUNCTION grant_admin_to_specific_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Using LOWER() for case-insensitive email comparison
  IF LOWER(NEW.email) = 'steven.c.7333@menifeeusd.org' THEN
    NEW.is_admin = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically grant admin on user creati
-- Also update existing user if they already exist
-- Using LOWER() for case-insensitive email comparison
UPDATE users 
SET is_admin = TRUE 
WHERE LOWER(email) = 'steven.c.7333@menifeeusd.org';
