CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'comment', 'reaction', 'follow', 'badge', 'award', 'mention', 'dm'
  title TEXT NOT NULL,
  content TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- References for different notification types
  related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  related_post_id UUID REFERENCES homework_posts(id) ON DELETE CASCADE,
  related_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by_sender BOOLEAN DEFAULT FALSE,
  deleted_by_recipient BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_dm_sender_id ON direct_messages(sender_id);
CREATE INDEX idx_dm_recipient_id ON direct_messages(recipient_id);
CREATE INDEX idx_dm_created_at ON direct_messages(created_at DESC);

-- DM conversations view helper
CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_content TEXT,
  unread_count_user1 INTEGER DEFAULT 0,
  unread_count_user2 INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- AI auto-tags for posts
CREATE TABLE IF NOT EXISTS post_auto_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES homework_posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.0, -- 0.00 to 1.00
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(post_id, tag)
);

CREATE INDEX idx_post_auto_tags_post_id ON post_auto_tags(post_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_auto_tags ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Direct messages policies
CREATE POLICY "Users can view messages they sent or received"
  ON direct_messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON direct_messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- DM conversations policies
CREATE POLICY "Users can view conversations they're part of"
  ON dm_conversations FOR SELECT
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

CREATE POLICY "System can manage conversations"
  ON dm_conversations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Post auto-tags policies
CREATE POLICY "Anyone can view auto-tags"
  ON post_auto_tags FOR SELECT
  USING (true);

CREATE POLICY "System can manage auto-tags"
  ON post_auto_tags FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_content TEXT,
  p_link TEXT,
  p_related_user_id UUID DEFAULT NULL,
  p_related_post_id UUID DEFAULT NULL,
  p_related_comment_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, content, link,
    related_user_id, related_post_id, related_comment_id
  ) VALUES (
    p_user_id, p_type, p_title, p_content, p_link,
    p_related_user_id, p_related_post_id, p_related_comment_id
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
