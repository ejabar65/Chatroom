-- Create awards/achievements table
CREATE TABLE IF NOT EXISTS awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  points_value INTEGER DEFAULT 0,
  is_rare BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_awards table to track who earned what
CREATE TABLE IF NOT EXISTS user_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  awarded_reason TEXT,
  UNIQUE(user_id, award_id)
);

-- Add karma points to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS karma_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS award_count INTEGER DEFAULT 0;

-- Create karma_history table to track karma changes
CREATE TABLE IF NOT EXISTS karma_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  post_id UUID REFERENCES homework_posts(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_awards_user ON user_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_karma_history_user ON karma_history(user_id, created_at DESC);

-- RLS policies
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE karma_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view awards"
  ON awards FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage awards"
  ON awards FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Anyone can view user awards"
  ON user_awards FOR SELECT
  USING (true);

CREATE POLICY "Admins can award"
  ON user_awards FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Anyone can view karma history"
  ON karma_history FOR SELECT
  USING (true);

CREATE POLICY "System can create karma history"
  ON karma_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update user award count
CREATE OR REPLACE FUNCTION update_user_award_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users 
    SET award_count = award_count + 1 
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users 
    SET award_count = award_count - 1 
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_award_count_trigger
AFTER INSERT OR DELETE ON user_awards
FOR EACH ROW EXECUTE FUNCTION update_user_award_count();

-- Insert default awards
INSERT INTO awards (name, description, icon, color, points_value, is_rare) VALUES
  ('First Post', 'Created your first homework post', '📝', '#3b82f6', 10, false),
  ('Helpful Helper', 'Received 10 helpful reactions', '🤝', '#10b981', 50, false),
  ('Top Contributor', 'Posted 50 helpful responses', '⭐', '#f59e0b', 100, true),
  ('Problem Solver', 'Had 5 posts marked as solved', '✅', '#8b5cf6', 75, false),
  ('Community Leader', 'Reached 1000 karma points', '👑', '#ef4444', 200, true),
  ('Early Adopter', 'One of the first 100 users', '🚀', '#06b6d4', 50, true),
  ('Streak Master', 'Posted for 7 days in a row', '🔥', '#f97316', 100, false),
  ('Knowledge Sharer', 'Helped 25 different students', '📚', '#6366f1', 150, true)
ON CONFLICT (name) DO NOTHING;
