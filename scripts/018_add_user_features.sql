-- Create user blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- Create post collections table
CREATE TABLE IF NOT EXISTS post_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_posts junction table
CREATE TABLE IF NOT EXISTS collection_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES post_collections(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES homework_posts(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, post_id)
);

-- Create user_flairs table
CREATE TABLE IF NOT EXISTS user_flairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  flair_text TEXT NOT NULL,
  flair_color TEXT DEFAULT '#3b82f6',
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

-- Add collection count to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS collection_count INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_post_collections_user ON post_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_posts_collection ON collection_posts(collection_id);
CREATE INDEX IF NOT EXISTS idx_user_flairs_user ON user_flairs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flairs_community ON user_flairs(community_id);

-- RLS policies
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flairs ENABLE ROW LEVEL SECURITY;

-- User blocks policies
CREATE POLICY "Users can create blocks"
  ON user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks"
  ON user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- Post collections policies
CREATE POLICY "Users can create own collections"
  ON post_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own and public collections"
  ON post_collections FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can update own collections"
  ON post_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON post_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Collection posts policies
CREATE POLICY "Users can add to own collections"
  ON collection_posts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM post_collections WHERE id = collection_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can view posts in public collections"
  ON collection_posts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM post_collections WHERE id = collection_id AND (user_id = auth.uid() OR is_public = true))
  );

CREATE POLICY "Users can remove from own collections"
  ON collection_posts FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM post_collections WHERE id = collection_id AND user_id = auth.uid())
  );

-- User flairs policies
CREATE POLICY "Users can create own flairs"
  ON user_flairs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view flairs"
  ON user_flairs FOR SELECT
  USING (true);

CREATE POLICY "Users can update own flairs"
  ON user_flairs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flairs"
  ON user_flairs FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update collection count
CREATE OR REPLACE FUNCTION update_collection_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users 
    SET collection_count = collection_count + 1 
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users 
    SET collection_count = collection_count - 1 
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collection_count_trigger
AFTER INSERT OR DELETE ON post_collections
FOR EACH ROW EXECUTE FUNCTION update_collection_count();
