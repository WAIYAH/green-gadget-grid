
-- =====================================================
-- GADGET APPROVAL / REJECTION (admin-only, atomic)
-- Approving a pending gadget credits its points_value to
-- the submitter's profile and logs a transaction.
-- =====================================================

CREATE OR REPLACE FUNCTION public.approve_gadget(_gadget_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _points INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve gadgets';
  END IF;

  SELECT user_id, points_value INTO _user_id, _points
  FROM public.gadgets
  WHERE id = _gadget_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gadget not found or not pending';
  END IF;

  UPDATE public.gadgets SET status = 'approved' WHERE id = _gadget_id;
  UPDATE public.profiles SET points = points + _points WHERE id = _user_id;

  INSERT INTO public.transactions (user_id, type, amount, points, description, reference_id, status)
  VALUES (_user_id, 'earning', 0, _points, 'Gadget approved reward', _gadget_id, 'completed');
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_gadget(_gadget_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject gadgets';
  END IF;

  UPDATE public.gadgets SET status = 'rejected' WHERE id = _gadget_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gadget not found or not pending';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_gadget(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_gadget(UUID) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.reject_gadget(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_gadget(UUID) TO authenticated, service_role;
