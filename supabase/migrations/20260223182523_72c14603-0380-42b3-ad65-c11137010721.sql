
-- Create storage bucket for chat media (images, documents, audio, video)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to chat-media
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media'
  AND auth.uid() IS NOT NULL
);

-- Allow anyone to view chat media (public bucket)
CREATE POLICY "Anyone can view chat media"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete own chat media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-media'
  AND auth.uid() IS NOT NULL
);
