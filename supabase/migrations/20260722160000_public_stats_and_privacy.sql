-- =====================================================
-- PRIVACY FIX: "Profiles are viewable by everyone" (USING true,
-- no role restriction) let the anon key read every user's email,
-- phone, and location via PostgREST. Nothing in the app actually
-- needs cross-user profile reads (every call site is either
-- admin-only, already covered by "Admins manage profiles", or
-- `.eq("id", user.id)`). Replace with an explicit own-row policy.
-- =====================================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- =====================================================
-- PUBLIC IMPACT STATS: landing page / footer show real
-- aggregate numbers (gadgets recycled, CO2 saved, users) without
-- exposing any per-row PII. SECURITY DEFINER so it can read
-- profiles/gadgets despite the tightened policy above; returns
-- only aggregate counts.
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE (gadgets_recycled BIGINT, co2_saved_kg NUMERIC, active_users BIGINT, points_distributed BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.gadgets WHERE status = 'approved') AS gadgets_recycled,
    (SELECT COALESCE(SUM(co2_saved), 0) FROM public.profiles) AS co2_saved_kg,
    (SELECT COUNT(*) FROM public.profiles) AS active_users,
    (SELECT COALESCE(SUM(points), 0) FROM public.profiles) AS points_distributed;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;

-- =====================================================
-- NEWSLETTER: footer signup previously just showed a toast with
-- no storage. Real insert-only table; anon can subscribe, only
-- admins can read the list.
-- =====================================================
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;

-- =====================================================
-- SELF ACCOUNT DELETION: DashboardSettings "Delete Account" used
-- to just fire a toast. Real, scoped to the caller's own id —
-- mirrors admin_delete_user but cannot target anyone else.
-- =====================================================
CREATE OR REPLACE FUNCTION public.self_delete_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.self_delete_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.self_delete_account() TO authenticated;
