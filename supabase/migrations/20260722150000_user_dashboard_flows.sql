
-- =====================================================
-- AUTO TIER: keep profiles.tier in sync with points
-- (thresholds match the tiers shown across the dashboard UI)
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_profile_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.tier := CASE
    WHEN NEW.points >= 10000 THEN 'Platinum'
    WHEN NEW.points >= 5000 THEN 'Gold'
    WHEN NEW.points >= 1000 THEN 'Silver'
    ELSE 'Bronze'
  END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_tier
BEFORE INSERT OR UPDATE OF points ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_profile_tier();

-- Re-sync any existing rows (e.g. seed data) against the new rule.
UPDATE public.profiles SET points = points;

-- =====================================================
-- GADGET APPROVAL: also credit CO2 impact + notify user.
-- (Re-defines the function created in 20260722100200.)
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
  _co2 NUMERIC;
  _name TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve gadgets';
  END IF;

  SELECT user_id, points_value, name INTO _user_id, _points, _name
  FROM public.gadgets
  WHERE id = _gadget_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gadget not found or not pending';
  END IF;

  _co2 := _points * 0.05;

  UPDATE public.gadgets SET status = 'approved' WHERE id = _gadget_id;
  UPDATE public.profiles SET points = points + _points, co2_saved = co2_saved + _co2 WHERE id = _user_id;

  INSERT INTO public.transactions (user_id, type, amount, points, description, reference_id, status)
  VALUES (_user_id, 'earning', 0, _points, 'Gadget approved reward: ' || _name, _gadget_id, 'completed');

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (_user_id, 'Gadget approved!', _name || ' was approved — ' || _points || ' points credited.', 'success', '/dashboard/listings');
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_gadget(_gadget_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _name TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject gadgets';
  END IF;

  SELECT user_id, name INTO _user_id, _name FROM public.gadgets WHERE id = _gadget_id AND status = 'pending';

  UPDATE public.gadgets SET status = 'rejected' WHERE id = _gadget_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gadget not found or not pending';
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (_user_id, 'Gadget rejected', _name || ' was not approved for recycling credit.', 'warning', '/dashboard/listings');
END;
$$;

-- =====================================================
-- SWAP CENTER: atomic points/cash redemption of a swap_items
-- catalog item. Creates the order + ledger entry + notification.
-- =====================================================
CREATE OR REPLACE FUNCTION public.redeem_swap_item(_item_id UUID, _quantity INTEGER, _payment_method TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _item RECORD;
  _order_id UUID;
  _cost_points INTEGER;
  _cost_cash NUMERIC;
  _new_stock INTEGER;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Must be authenticated'; END IF;
  IF _quantity < 1 THEN RAISE EXCEPTION 'Quantity must be at least 1'; END IF;
  IF _payment_method NOT IN ('points', 'cash') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;

  SELECT * INTO _item FROM public.swap_items WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;
  IF _item.stock < _quantity THEN RAISE EXCEPTION 'Not enough stock'; END IF;

  _cost_points := _item.points_price * _quantity;
  _cost_cash := _item.cash_price * _quantity;

  IF _payment_method = 'points' THEN
    IF (SELECT points FROM public.profiles WHERE id = _uid) < _cost_points THEN
      RAISE EXCEPTION 'Not enough points';
    END IF;
    UPDATE public.profiles SET points = points - _cost_points WHERE id = _uid;
  END IF;

  _new_stock := _item.stock - _quantity;
  UPDATE public.swap_items SET
    stock = _new_stock,
    status = CASE WHEN _new_stock <= 0 THEN 'out' WHEN _new_stock <= 3 THEN 'low' ELSE status END
  WHERE id = _item_id;

  INSERT INTO public.orders (user_id, item_id, quantity, total_amount, total_points, payment_method, status)
  VALUES (
    _uid, _item_id, _quantity,
    CASE WHEN _payment_method = 'cash' THEN _cost_cash ELSE 0 END,
    CASE WHEN _payment_method = 'points' THEN _cost_points ELSE 0 END,
    _payment_method, 'processing'
  )
  RETURNING id INTO _order_id;

  INSERT INTO public.transactions (user_id, type, amount, points, description, reference_id, status)
  VALUES (
    _uid,
    CASE WHEN _payment_method = 'points' THEN 'redemption' ELSE 'purchase' END,
    CASE WHEN _payment_method = 'cash' THEN _cost_cash ELSE 0 END,
    CASE WHEN _payment_method = 'points' THEN -_cost_points ELSE 0 END,
    'Swap: ' || _item.name, _order_id, 'completed'
  );

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (_uid, 'Order placed', 'Your order for ' || _item.name || ' is now processing.', 'success', '/dashboard/orders');

  RETURN _order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_swap_item(UUID, INTEGER, TEXT) TO authenticated;

-- =====================================================
-- REWARDS: atomic points redemption from the rewards catalog.
-- =====================================================
CREATE OR REPLACE FUNCTION public.redeem_reward(_reward_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _reward RECORD;
  _redemption_id UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Must be authenticated'; END IF;

  SELECT * INTO _reward FROM public.rewards WHERE id = _reward_id AND active = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reward not found'; END IF;
  IF _reward.stock <= 0 THEN RAISE EXCEPTION 'Reward out of stock'; END IF;
  IF (SELECT points FROM public.profiles WHERE id = _uid) < _reward.points_cost THEN
    RAISE EXCEPTION 'Not enough points';
  END IF;

  UPDATE public.profiles SET points = points - _reward.points_cost WHERE id = _uid;
  UPDATE public.rewards SET stock = stock - 1 WHERE id = _reward_id;

  INSERT INTO public.redemptions (user_id, reward_id, points_spent, status)
  VALUES (_uid, _reward_id, _reward.points_cost, 'pending')
  RETURNING id INTO _redemption_id;

  INSERT INTO public.transactions (user_id, type, amount, points, description, reference_id, status)
  VALUES (_uid, 'redemption', 0, -_reward.points_cost, 'Redeemed: ' || _reward.name, _redemption_id, 'completed');

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (_uid, 'Reward redeemed', 'You redeemed ' || _reward.name || '.', 'success', '/dashboard/rewards');

  RETURN _redemption_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_reward(UUID) TO authenticated;
