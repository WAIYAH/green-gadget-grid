
-- =====================================================
-- STATUS ENUMS
-- Converts free-text status columns to constrained enums.
-- =====================================================

CREATE TYPE public.gadget_status AS ENUM ('pending', 'approved', 'sold', 'rejected');
CREATE TYPE public.order_status AS ENUM ('processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.swap_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

ALTER TABLE public.gadgets
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.gadget_status USING status::public.gadget_status,
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.orders
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.order_status USING status::public.order_status,
  ALTER COLUMN status SET DEFAULT 'processing';

ALTER TABLE public.swaps
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.swap_status USING status::public.swap_status,
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.tickets
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.ticket_status USING status::public.ticket_status,
  ALTER COLUMN status SET DEFAULT 'open';

ALTER TABLE public.payouts
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.payout_status USING status::public.payout_status,
  ALTER COLUMN status SET DEFAULT 'pending';
