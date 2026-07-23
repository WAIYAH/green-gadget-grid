
-- =====================================================
-- PICKUP CENTRES: physical locations where a checked-out
-- order can be collected. Backs both the Swap checkout flow
-- and the /map page (single source of truth for both).
-- =====================================================
CREATE TABLE public.pickup_centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  hours TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pickup_centres TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pickup_centres TO authenticated;
GRANT ALL ON public.pickup_centres TO service_role;
ALTER TABLE public.pickup_centres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views pickup centres" ON public.pickup_centres FOR SELECT USING (true);
CREATE POLICY "Admins manage pickup centres" ON public.pickup_centres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.pickup_centres (name, address, phone, hours) VALUES
('Green Tech Recycling Center', '123 Eco Street, Green City, GC 12345', '+1 (555) 123-4567', 'Mon-Sat: 9:00 AM - 6:00 PM'),
('E-Waste Solutions Hub', '456 Sustainable Ave, Eco Town, ET 67890', '+1 (555) 987-6543', 'Mon-Fri: 8:00 AM - 5:00 PM'),
('Tech Recycle Point', '789 Circular Road, Recycle City, RC 11223', '+1 (555) 456-7890', 'Mon-Sun: 10:00 AM - 8:00 PM');

-- =====================================================
-- ORDERS: capture which centre the customer will collect
-- from, plus a short human-readable code staff can check
-- against ID at handover time.
-- =====================================================
ALTER TABLE public.orders
  ADD COLUMN pickup_centre_id UUID REFERENCES public.pickup_centres(id),
  ADD COLUMN pickup_code TEXT;

-- New lifecycle states for pickup fulfillment (kept alongside the
-- original shipped/delivered values so existing order rows stay valid).
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'ready_for_pickup';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'picked_up';
