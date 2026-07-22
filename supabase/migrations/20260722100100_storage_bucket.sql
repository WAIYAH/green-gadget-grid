
-- =====================================================
-- STORAGE: gadget-images bucket (private)
-- RLS policies for this bucket were already created in
-- 20260722030924_1322d067-fe9f-4f7f-b0bb-c3c8ba3ebf7c.sql
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gadget-images',
  'gadget-images',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
