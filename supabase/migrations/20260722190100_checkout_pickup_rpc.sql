
-- =====================================================
-- CHECKOUT: redeem_swap_item now requires the customer to
-- choose one of the active pickup centres, and stamps the
-- order with a short pickup code for in-store verification.
-- =====================================================
DROP FUNCTION IF EXISTS public.redeem_swap_item(UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.redeem_swap_item(_item_id UUID, _quantity INTEGER, _payment_method TEXT, _pickup_centre_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _item RECORD;
  _centre RECORD;
  _order_id UUID;
  _cost_points INTEGER;
  _cost_cash NUMERIC;
  _new_stock INTEGER;
  _pickup_code TEXT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Must be authenticated'; END IF;
  IF _quantity < 1 THEN RAISE EXCEPTION 'Quantity must be at least 1'; END IF;
  IF _payment_method NOT IN ('points', 'cash') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;

  SELECT * INTO _centre FROM public.pickup_centres WHERE id = _pickup_centre_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Please choose a valid pickup centre'; END IF;

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

  _pickup_code := upper(substr(md5(gen_random_uuid()::text), 1, 8));

  INSERT INTO public.orders (user_id, item_id, quantity, total_amount, total_points, payment_method, status, pickup_centre_id, pickup_code)
  VALUES (
    _uid, _item_id, _quantity,
    CASE WHEN _payment_method = 'cash' THEN _cost_cash ELSE 0 END,
    CASE WHEN _payment_method = 'points' THEN _cost_points ELSE 0 END,
    _payment_method, 'processing', _pickup_centre_id, _pickup_code
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
  VALUES (
    _uid, 'Order placed',
    'Your order for ' || _item.name || ' is ready to prepare. Pick it up at ' || _centre.name || ' (code ' || _pickup_code || ') once it''s marked ready.',
    'success', '/dashboard/orders'
  );

  RETURN _order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_swap_item(UUID, INTEGER, TEXT, UUID) TO authenticated;

-- =====================================================
-- Notify the customer the moment staff mark an order ready
-- for collection, so the "message" requirement isn't limited
-- to the initial checkout toast.
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item_name TEXT;
  _centre_name TEXT;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  SELECT name INTO _item_name FROM public.swap_items WHERE id = NEW.item_id;
  SELECT name INTO _centre_name FROM public.pickup_centres WHERE id = NEW.pickup_centre_id;

  IF NEW.status = 'ready_for_pickup' THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.user_id, 'Ready for pickup!',
      coalesce(_item_name, 'Your order') || ' is ready to collect at ' || coalesce(_centre_name, 'your chosen centre') ||
      '. Bring code ' || coalesce(NEW.pickup_code, '') || ' with you.',
      'success', '/dashboard/orders'
    );
  ELSIF NEW.status = 'picked_up' THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (NEW.user_id, 'Order picked up', coalesce(_item_name, 'Your order') || ' was collected. Thanks for swapping with us!', 'success', '/dashboard/orders');
  ELSIF NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (NEW.user_id, 'Order cancelled', coalesce(_item_name, 'Your order') || ' was cancelled.', 'warning', '/dashboard/orders');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_notify_status
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();
