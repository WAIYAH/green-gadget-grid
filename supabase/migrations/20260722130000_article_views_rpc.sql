
-- =====================================================
-- Article view counter — any visitor (incl. anon) can bump
-- views, but only via this function, never a raw UPDATE.
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_article_views(_article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.articles SET views = views + 1 WHERE id = _article_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_article_views(UUID) TO authenticated, anon, service_role;
