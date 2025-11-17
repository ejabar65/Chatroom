-- Create advertisements table for managing ads
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  position TEXT NOT NULL CHECK (position IN ('sidebar', 'banner', 'header')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies for advertisements
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Everyone can view active ads
CREATE POLICY "Anyone can view active advertisements"
  ON advertisements FOR SELECT
  USING (is_active = true);

-- Only admins can manage ads
CREATE POLICY "Admins can manage advertisements"
  ON advertisements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Insert Yeebs Media advertisement
INSERT INTO advertisements (title, description, image_url, link_url, position, is_active)
VALUES 
  ('Yeebs Media - Movies & Albums on CD', 'Shop our collection of movies and albums on CD. Quality entertainment delivered to your door!', '/images/94554-70468-2.jpg', 'https://yeebsmedia.vercel.app/', 'sidebar', true),
  ('Yeebs Media CD Collection', 'Discover our extensive collection of movies and music on CD. Browse now!', '/images/94554-70468-2.jpg', 'https://yeebsmedia.vercel.app/', 'banner', true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_advertisement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_advertisement_updated_at
  BEFORE UPDATE ON advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_advertisement_updated_at();
