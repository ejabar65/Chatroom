-- Create reports table for user-generated reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES homework_posts(id) ON DELETE CASCADE,
  reported_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT report_target_check CHECK (
    (reported_user_id IS NOT NULL AND reported_post_id IS NULL AND reported_comment_id IS NULL) OR
    (reported_user_id IS NULL AND reported_post_id IS NOT NULL AND reported_comment_id IS NULL) OR
    (reported_user_id IS NULL AND reported_post_id IS NULL AND reported_comment_id IS NOT NULL)
  )
);

-- Add shadowban fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_shadowbanned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shadowbanned_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS shadowbanned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shadowban_reason TEXT;

-- Add moderator permissions for communities
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS can_moderate BOOLEAN DEFAULT FALSE;
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS can_pin_posts BOOLEAN DEFAULT FALSE;
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS can_lock_posts BOOLEAN DEFAULT FALSE;

-- Create moderator actions log
CREATE TABLE IF NOT EXISTS moderator_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES users(id),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderator_actions_mod ON moderator_actions(moderator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_shadowbanned ON users(is_shadowbanned);

-- RLS policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderator_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins and mods can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true) OR
    EXISTS (SELECT 1 FROM community_members WHERE user_id = auth.uid() AND can_moderate = true)
  );

CREATE POLICY "Admins and mods can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true) OR
    EXISTS (SELECT 1 FROM community_members WHERE user_id = auth.uid() AND can_moderate = true)
  );

CREATE POLICY "Anyone can view moderator actions"
  ON moderator_actions FOR SELECT
  USING (true);

CREATE POLICY "Admins and mods can create moderator actions"
  ON moderator_actions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true) OR
    EXISTS (SELECT 1 FROM community_members WHERE user_id = auth.uid() AND can_moderate = true)
  );

-- Update community moderator roles
UPDATE community_members 
SET can_moderate = true, can_pin_posts = true, can_lock_posts = true
WHERE role IN ('moderator', 'admin');
