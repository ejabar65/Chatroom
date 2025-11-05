-- Create storage bucket for homework images
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework', 'homework', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Anyone can view homework images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'homework');

CREATE POLICY "Users can upload homework images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'homework');

CREATE POLICY "Users can update own homework images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'homework' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'homework' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own homework images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'homework' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete any homework images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'homework' AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
