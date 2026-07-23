
-- =====================================================
-- PICKUP CENTRES: real partner locations replace the demo
-- placeholders, plus optional email/website contact fields.
-- Not every real-world centre has a phone number or posted
-- hours on hand yet, so those columns become optional rather
-- than forcing placeholder data into production.
-- =====================================================
ALTER TABLE public.pickup_centres
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT;

ALTER TABLE public.pickup_centres ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.pickup_centres ALTER COLUMN hours DROP NOT NULL;

-- Update in place (rather than delete+insert) so existing orders'
-- pickup_centre_id foreign keys stay valid.
UPDATE public.pickup_centres SET
  name = 'Mazingira Green Hub',
  address = 'Uhuru Camp, along Mbagathi Way, Raila Odinga Way, Nairobi',
  phone = '+254 714 602 481',
  email = 'info@mazingiragreenhub.org',
  website = NULL,
  hours = NULL
WHERE name = 'Green Tech Recycling Center';

UPDATE public.pickup_centres SET
  name = 'Triple G Centre',
  address = 'Along Moi Avenue, Nairobi CBD',
  phone = NULL,
  email = NULL,
  website = NULL,
  hours = NULL
WHERE name = 'E-Waste Solutions Hub';

UPDATE public.pickup_centres SET
  name = 'Nakola Experts Systems',
  address = 'Ruaraka, Mathare Area, Nairobi',
  phone = NULL,
  email = NULL,
  website = 'https://nakolaexpertsystems.vercel.app/',
  hours = NULL
WHERE name = 'Tech Recycle Point';
