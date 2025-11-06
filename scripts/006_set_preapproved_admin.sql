-- Set specific user as pre-approved admin
UPDATE users 
SET is_admin = true 
WHERE id = '83b6a3e3-0ba7-4a59-81e1-48f4c4c42637';

-- Verify the update
SELECT id, email, is_admin 
FROM users 
WHERE id = '83b6a3e3-0ba7-4a59-81e1-48f4c4c42637';
