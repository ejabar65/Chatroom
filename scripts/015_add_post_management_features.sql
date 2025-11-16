-- Add pinned posts feature
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES users(id);
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE;

-- Add locked posts feature
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES users(id);
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS lock_reason TEXT;

-- Add post flairs
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS flair_text TEXT;
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS flair_color TEXT;

-- Create post edit history table
CREATE TABLE IF NOT EXISTS post_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES homework_posts(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL REFERENCES users(id),
  title_before TEXT,
  description_before TEXT,
  subject_before TEXT,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edit_reason TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON homework_posts(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_locked ON homework_posts(is_locked);
CREATE INDEX IF NOT EXISTS idx_edit_history_post ON post_edit_history(post_id, edited_at DESC);

-- Enable RLS for edit history
ALTER TABLE post_edit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view edit history"
  ON post_edit_history FOR SELECT
  USING (true);

CREATE POLICY "Only post authors and admins can create edit history"
  ON post_edit_history FOR INSERT
  WITH CHECK (
    auth.uid() = edited_by OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
