-- Create communities table (like subreddits)
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_members table
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Add community_id to homework_posts
ALTER TABLE homework_posts 
ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_community ON homework_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members ON community_members(community_id, user_id);

-- RLS Policies for communities
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities are viewable by everyone"
  ON communities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Community creators can update their communities"
  ON communities FOR UPDATE
  USING (auth.uid() = creator_id);

-- RLS Policies for community_members
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members are viewable by everyone"
  ON community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities 
    SET member_count = member_count - 1 
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_count_trigger
AFTER INSERT OR DELETE ON community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Function to update post count
CREATE OR REPLACE FUNCTION update_community_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.community_id IS NOT NULL THEN
    UPDATE communities 
    SET post_count = post_count + 1 
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' AND OLD.community_id IS NOT NULL THEN
    UPDATE communities 
    SET post_count = post_count - 1 
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_count_trigger
AFTER INSERT OR DELETE ON homework_posts
FOR EACH ROW EXECUTE FUNCTION update_community_post_count();

-- Create some default communities
INSERT INTO communities (name, display_name, description, creator_id)
VALUES 
  ('math', 'Math Help', 'Get help with algebra, calculus, geometry, and more', (SELECT id FROM users WHERE is_admin = true LIMIT 1)),
  ('science', 'Science Squad', 'Biology, chemistry, physics - all sciences welcome', (SELECT id FROM users WHERE is_admin = true LIMIT 1)),
  ('english', 'English & Literature', 'Essays, grammar, reading comprehension help', (SELECT id FROM users WHERE is_admin = true LIMIT 1)),
  ('history', 'History Hub', 'World history, US history, and social studies', (SELECT id FROM users WHERE is_admin = true LIMIT 1)),
  ('general', 'General Help', 'Any subject, any question - we got you', (SELECT id FROM users WHERE is_admin = true LIMIT 1))
ON CONFLICT (name) DO NOTHING;
