-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES homework_posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  allow_multiple BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll options table
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, option_id, user_id)
);

-- Add poll fields to homework_posts
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS has_poll BOOLEAN DEFAULT FALSE;
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS has_spoiler BOOLEAN DEFAULT FALSE;
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS spoiler_text TEXT;
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS content_warning TEXT;
ALTER TABLE homework_posts ADD COLUMN IF NOT EXISTS template_name TEXT;

-- Create post templates table
CREATE TABLE IF NOT EXISTS post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  template_fields JSONB NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_polls_post ON polls(post_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes(user_id);

-- RLS policies
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_templates ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Anyone can view polls"
  ON polls FOR SELECT
  USING (true);

CREATE POLICY "Post owners can create polls"
  ON polls FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM homework_posts WHERE id = post_id AND user_id = auth.uid())
  );

-- Poll options policies
CREATE POLICY "Anyone can view poll options"
  ON poll_options FOR SELECT
  USING (true);

CREATE POLICY "Poll creators can create options"
  ON poll_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls p
      JOIN homework_posts hp ON p.post_id = hp.id
      WHERE p.id = poll_id AND hp.user_id = auth.uid()
    )
  );

-- Poll votes policies
CREATE POLICY "Anyone can view poll votes"
  ON poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote on polls"
  ON poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Templates policies
CREATE POLICY "Anyone can view active templates"
  ON post_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON post_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Function to update vote count
CREATE OR REPLACE FUNCTION update_poll_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE poll_options 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.option_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE poll_options 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.option_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_poll_vote_count_trigger
AFTER INSERT OR DELETE ON poll_votes
FOR EACH ROW EXECUTE FUNCTION update_poll_vote_count();

-- Insert default templates
INSERT INTO post_templates (name, description, template_fields, category) VALUES
  (
    'Math Problem',
    'Template for math homework questions',
    '{"fields": [
      {"name": "problem", "label": "Problem Statement", "type": "textarea", "required": true},
      {"name": "subject", "label": "Math Subject", "type": "select", "options": ["Algebra", "Geometry", "Calculus", "Statistics"], "required": true},
      {"name": "difficulty", "label": "Difficulty", "type": "select", "options": ["Easy", "Medium", "Hard"], "required": false},
      {"name": "attempts", "label": "What I''ve Tried", "type": "textarea", "required": false}
    ]}'::jsonb,
    'Mathematics'
  ),
  (
    'Essay Help',
    'Template for essay and writing assignments',
    '{"fields": [
      {"name": "topic", "label": "Essay Topic", "type": "text", "required": true},
      {"name": "type", "label": "Essay Type", "type": "select", "options": ["Argumentative", "Narrative", "Descriptive", "Expository"], "required": true},
      {"name": "length", "label": "Required Length", "type": "text", "required": false},
      {"name": "draft", "label": "Current Draft", "type": "textarea", "required": false}
    ]}'::jsonb,
    'Writing'
  ),
  (
    'Science Question',
    'Template for science homework',
    '{"fields": [
      {"name": "question", "label": "Question", "type": "textarea", "required": true},
      {"name": "subject", "label": "Science Subject", "type": "select", "options": ["Biology", "Chemistry", "Physics", "Earth Science"], "required": true},
      {"name": "experiment", "label": "Experiment Details", "type": "textarea", "required": false},
      {"name": "observations", "label": "My Observations", "type": "textarea", "required": false}
    ]}'::jsonb,
    'Science'
  ),
  (
    'Code Review',
    'Template for programming help',
    '{"fields": [
      {"name": "problem", "label": "Problem Description", "type": "textarea", "required": true},
      {"name": "language", "label": "Programming Language", "type": "select", "options": ["Python", "JavaScript", "Java", "C++", "Other"], "required": true},
      {"name": "code", "label": "Your Code", "type": "textarea", "required": true},
      {"name": "error", "label": "Error Message", "type": "textarea", "required": false}
    ]}'::jsonb,
    'Programming'
  )
ON CONFLICT (name) DO NOTHING;
