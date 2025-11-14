-- First, assign all existing posts without a community to the 'general' board
UPDATE homework_posts 
SET community_id = (SELECT id FROM communities WHERE name = 'general' LIMIT 1)
WHERE community_id IS NULL;

-- Now make community_id NOT NULL (required)
ALTER TABLE homework_posts 
ALTER COLUMN community_id SET NOT NULL;

-- Add a check constraint to ensure posts always have a community
ALTER TABLE homework_posts
ADD CONSTRAINT posts_must_have_community CHECK (community_id IS NOT NULL);
