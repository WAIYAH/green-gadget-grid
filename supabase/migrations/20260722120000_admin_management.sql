
-- =====================================================
-- FEEDBACK: widen grant so the existing "Admins manage
-- feedback" RLS policy can actually take effect for
-- UPDATE/DELETE (grant was SELECT, INSERT only).
-- =====================================================
GRANT UPDATE, DELETE ON public.feedback TO authenticated;

-- =====================================================
-- ANNOUNCEMENTS: add archived flag (admin UI supports an
-- archive action distinct from draft/scheduled/published).
-- =====================================================
ALTER TABLE public.announcements ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;

-- =====================================================
-- ADMIN USER MANAGEMENT (SECURITY DEFINER, admin-only)
-- Role changes and account deletion are privileged
-- operations kept out of direct table grants so a bug in
-- RLS policy logic can't accidentally expose them.
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id UUID, _role public.app_role, _grant BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;

  IF _grant THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Admins cannot delete their own account';
  END IF;

  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(UUID, public.app_role, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, public.app_role, BOOLEAN) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated, service_role;

-- =====================================================
-- GADGETS: allow admin delete of any gadget (submitter can
-- already delete their own; policy already covers admin via
-- has_role OR clause — nothing to change, kept here as a note).
-- =====================================================
