-- =====================================================
-- SEED DATA — runs automatically on `supabase db reset`
-- =====================================================

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  _admin_id uuid := gen_random_uuid();
  _user_id uuid := gen_random_uuid();
  _instance_id uuid := '00000000-0000-0000-0000-000000000000';
  _swap_item_ids uuid[];
  _gadget_id uuid;
begin
  -- ===================================================
  -- DEMO USERS (auth.users + auth.identities)
  -- handle_new_user() trigger auto-creates profiles + default 'user' role
  -- ===================================================
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
  (
    _instance_id, _admin_id, 'authenticated', 'authenticated', 'admin@tripleG.com',
    crypt('admin123', gen_salt('bf')), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Admin User"}',
    now(), now(), '', '', '', ''
  ),
  (
    _instance_id, _user_id, 'authenticated', 'authenticated', 'user@tripleG.com',
    crypt('user123', gen_salt('bf')), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Demo User"}',
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
  (gen_random_uuid(), _admin_id, _admin_id::text, jsonb_build_object('sub', _admin_id::text, 'email', 'admin@tripleG.com'), 'email', now(), now(), now()),
  (gen_random_uuid(), _user_id, _user_id::text, jsonb_build_object('sub', _user_id::text, 'email', 'user@tripleG.com'), 'email', now(), now(), now());

  -- Promote admin@tripleG.com to admin role (keeps default 'user' role too)
  insert into public.user_roles (user_id, role) values (_admin_id, 'admin');

  -- Give the demo user a starting balance / stats
  update public.profiles set points = 7250, tier = 'Gold', co2_saved = 42.5 where id = _user_id;
  update public.profiles set points = 500, tier = 'Bronze' where id = _admin_id;

  -- ===================================================
  -- ARTICLES (awareness content) — 6+
  -- ===================================================
  insert into public.articles (type, title, category, description, content, author, thumbnail, featured, published, created_by) values
  ('article', 'Why E-Waste Recycling Matters', 'Recycle Tips', 'Understanding the environmental impact of electronic waste.', 'Full article content about e-waste recycling importance...', 'Triple G Team', '/placeholder.svg', true, true, _admin_id),
  ('article', 'How to Wipe Your Data Before Recycling', 'Data Safety', 'A step-by-step guide to securely erasing personal data.', 'Full article content about data wiping...', 'Triple G Team', '/placeholder.svg', false, true, _admin_id),
  ('article', 'The Lifecycle of a Smartphone', 'Education', 'From raw materials to recycling, explore a phone lifecycle.', 'Full article content about smartphone lifecycle...', 'Triple G Team', '/placeholder.svg', true, true, _admin_id),
  ('video', 'Inside an E-Waste Recycling Facility', 'Behind the Scenes', 'A video tour of how gadgets are processed.', 'Video transcript...', 'Triple G Team', '/placeholder.svg', false, true, _admin_id),
  ('article', 'Top 5 Ways to Extend Your Gadget''s Life', 'Recycle Tips', 'Simple habits that reduce e-waste before it starts.', 'Full article content about extending device life...', 'Triple G Team', '/placeholder.svg', false, true, _admin_id),
  ('article', 'Understanding CO2 Savings from Recycling', 'Education', 'How swapping and recycling gadgets reduces carbon footprint.', 'Full article content about CO2 savings...', 'Triple G Team', '/placeholder.svg', true, true, _admin_id),
  ('article', 'Rare Earth Metals and Why They Matter', 'Education', 'The precious materials locked inside your old devices.', 'Full article content about rare earth metals...', 'Triple G Team', '/placeholder.svg', false, true, _admin_id);

  -- ===================================================
  -- LEARNING CENTER QUIZZES — attach a quiz to a few seeded articles
  -- so the Learning Center has something to demo out of the box.
  -- ===================================================
  update public.articles set quiz_points = 25, quiz_questions = '[
    {"question": "What is the fastest-growing waste stream in the world?", "options": ["Plastic packaging", "Electronic waste (e-waste)", "Food waste", "Paper waste"], "correct": 1},
    {"question": "Why shouldn''t e-waste go straight into a landfill?", "options": ["It has no value at all", "It can contain hazardous materials as well as recoverable ones", "It decomposes too quickly", "It is illegal to landfill any metal"], "correct": 1},
    {"question": "What does recycling e-waste primarily help recover?", "options": ["Only plastic", "Recoverable materials like metals", "Nothing of value", "Only glass"], "correct": 1}
  ]'::jsonb where title = 'Why E-Waste Recycling Matters';

  update public.articles set quiz_points = 20, quiz_questions = '[
    {"question": "Why is wiping your data important before recycling a device?", "options": ["It makes the device heavier", "It prevents your personal data from being exposed", "It voids the warranty", "It is not actually necessary"], "correct": 1},
    {"question": "What is a reliable way to erase data before recycling?", "options": ["Just delete the files normally", "Perform a full factory reset / secure wipe", "Rename the files", "Nothing, recyclers handle it automatically"], "correct": 1}
  ]'::jsonb where title = 'How to Wipe Your Data Before Recycling';

  update public.articles set quiz_points = 20, quiz_questions = '[
    {"question": "What happens to CO2 emissions when you recycle or swap a gadget instead of buying new?", "options": ["They increase", "They stay exactly the same", "They are reduced", "There is no connection"], "correct": 2},
    {"question": "What besides CO2 can recycling electronics help conserve?", "options": ["Water and energy used in manufacturing new devices", "Nothing else", "Only plastic", "Only glass"], "correct": 0}
  ]'::jsonb where title = 'Understanding CO2 Savings from Recycling';

  -- ===================================================
  -- ANNOUNCEMENTS — 4+
  -- ===================================================
  insert into public.announcements (title, body, audience, pinned, published_at, created_by) values
  ('Welcome to Triple G!', 'We''re excited to launch our local sustainability platform. Start swapping and recycling today.', 'all', true, now(), _admin_id),
  ('New Reward Tiers Live', 'Bronze, Silver, Gold and Platinum tiers are now active — earn more as you recycle more.', 'all', false, now() - interval '2 days', _admin_id),
  ('Scheduled Maintenance', 'The platform will be briefly unavailable this weekend for upgrades.', 'all', false, now() - interval '5 days', _admin_id),
  ('Holiday Pickup Schedule', 'Gadget pickup points will have adjusted hours over the holidays.', 'all', false, now() - interval '10 days', _admin_id);

  -- ===================================================
  -- REWARDS (catalog) — 8+
  -- ===================================================
  insert into public.rewards (name, description, image_url, points_cost, category, stock, active) values
  ('$10 Gift Card', 'Redeemable at partner electronics stores.', '/placeholder.svg', 1000, 'gift-card', 50, true),
  ('$25 Gift Card', 'Redeemable at partner electronics stores.', '/placeholder.svg', 2400, 'gift-card', 30, true),
  ('Reusable Eco Tote Bag', 'Triple G branded canvas tote.', '/placeholder.svg', 300, 'merch', 100, true),
  ('Bluetooth Earbuds', 'Refurbished, tested and certified.', '/placeholder.svg', 3500, 'electronics', 15, true),
  ('Solar Power Bank', '10,000mAh solar-assisted charging.', '/placeholder.svg', 2800, 'electronics', 20, true),
  ('Tree Planting Donation', 'We plant a tree in your name.', '/placeholder.svg', 500, 'donation', 999, true),
  ('Premium Tier Upgrade (1 month)', 'Unlock premium perks for 30 days.', '/placeholder.svg', 1500, 'perk', 999, true),
  ('Refurbished Tablet', 'Grade A refurbished 10" tablet.', '/placeholder.svg', 9000, 'electronics', 5, true),
  ('Triple G T-Shirt', 'Organic cotton, unisex fit.', '/placeholder.svg', 800, 'merch', 60, true);

  -- ===================================================
  -- SWAP ITEMS (catalog) — 10+
  -- ===================================================
  insert into public.swap_items (name, category, description, image_url, points_price, cash_price, stock, condition, status) values
  ('Sony WH-1000XM4 Headphones', 'audio', 'Refurbished noise-cancelling headphones.', '/placeholder.svg', 1800, 120.00, 8, 'refurbished', 'available'),
  ('Refurbished iPad Air', 'tablet', 'Grade A refurbished tablet with case.', '/placeholder.svg', 3200, 280.00, 5, 'refurbished', 'available'),
  ('Logitech MX Master 3 Mouse', 'accessory', 'Gently used, fully tested.', '/placeholder.svg', 950, 60.00, 12, 'good', 'available'),
  ('Anker PowerCore 20K', 'accessory', 'Portable power bank, like new.', '/placeholder.svg', 420, 25.00, 20, 'excellent', 'available'),
  ('AirPods Pro 2', 'audio', 'Refurbished with new ear tips.', '/placeholder.svg', 2200, 160.00, 6, 'refurbished', 'available'),
  ('Dell XPS 13 Laptop', 'laptop', 'Refurbished ultrabook, 16GB RAM.', '/placeholder.svg', 15000, 650.00, 3, 'refurbished', 'available'),
  ('Samsung Galaxy Watch 5', 'wearable', 'Lightly used smartwatch.', '/placeholder.svg', 2600, 190.00, 7, 'good', 'available'),
  ('Kindle Paperwhite', 'reader', 'Refurbished e-reader, 8GB.', '/placeholder.svg', 1200, 85.00, 10, 'refurbished', 'available'),
  ('Google Nest Hub', 'smart-home', 'Refurbished smart display.', '/placeholder.svg', 1600, 95.00, 9, 'refurbished', 'available'),
  ('Refurbished Nintendo Switch', 'gaming', 'Grade A console with dock.', '/placeholder.svg', 8500, 220.00, 4, 'refurbished', 'available'),
  ('JBL Flip 6 Speaker', 'audio', 'Gently used portable speaker.', '/placeholder.svg', 900, 55.00, 14, 'good', 'available');

  select array_agg(id) into _swap_item_ids from public.swap_items;

  -- ===================================================
  -- GADGETS (submitted by demo user) — 5+
  -- ===================================================
  insert into public.gadgets (user_id, name, category, brand, model, condition, description, image_url, weight_kg, points_value, cash_value, status) values
  (_user_id, 'iPhone 12', 'smartphone', 'Apple', 'iPhone 12', 'good', 'Minor scratches on back, screen is flawless.', '/placeholder.svg', 0.16, 750, 75.00, 'approved'),
  (_user_id, 'Dell Inspiron 15', 'laptop', 'Dell', 'Inspiron 15 3000', 'fair', 'Works fine, battery health at 70%.', '/placeholder.svg', 1.8, 1000, 100.00, 'approved'),
  (_user_id, 'Samsung Galaxy Tab A', 'tablet', 'Samsung', 'Galaxy Tab A8', 'excellent', 'Barely used, comes with original box.', '/placeholder.svg', 0.5, 1500, 150.00, 'pending'),
  (_user_id, 'Fitbit Versa 2', 'smartwatch', 'Fitbit', 'Versa 2', 'good', 'Includes charger, minor wear on band.', '/placeholder.svg', 0.04, 600, 60.00, 'pending'),
  (_user_id, 'Beats Solo3', 'headphones', 'Beats', 'Solo3 Wireless', 'poor', 'Cracked headband but functional.', '/placeholder.svg', 0.2, 125, 12.50, 'rejected'),
  (_user_id, 'Google Pixel 6a', 'smartphone', 'Google', 'Pixel 6a', 'excellent', 'Like new condition, unlocked.', '/placeholder.svg', 0.18, 1000, 100.00, 'sold');

  -- ===================================================
  -- TRANSACTIONS for demo user
  -- ===================================================
  insert into public.transactions (user_id, type, amount, points, description, status) values
  (_user_id, 'earning', 0, 750, 'Gadget approved reward: iPhone 12', 'completed'),
  (_user_id, 'earning', 0, 1000, 'Gadget approved reward: Dell Inspiron 15', 'completed'),
  (_user_id, 'redemption', 0, -500, 'Redeemed: Tree Planting Donation', 'completed'),
  (_user_id, 'purchase', 120.00, -1800, 'Order: Sony WH-1000XM4 Headphones', 'completed'),
  (_user_id, 'payout', 50.00, 0, 'Cash payout to bank account', 'completed');

  -- ===================================================
  -- ORDERS for demo user
  -- ===================================================
  insert into public.orders (user_id, item_id, quantity, total_amount, total_points, payment_method, status, tracking, shipping_address) values
  (_user_id, _swap_item_ids[1], 1, 0, 1800, 'points', 'delivered', 'DHL-DEMO-001', '123 Green St, Nairobi'),
  (_user_id, _swap_item_ids[3], 1, 0, 950, 'points', 'shipped', 'FDX-DEMO-002', '123 Green St, Nairobi'),
  (_user_id, _swap_item_ids[4], 2, 0, 840, 'points', 'processing', null, '123 Green St, Nairobi');

  -- ===================================================
  -- NOTIFICATIONS for demo user
  -- ===================================================
  insert into public.notifications (user_id, title, body, type, link, read) values
  (_user_id, 'Gadget Approved!', 'Your iPhone 12 was approved. 750 points credited.', 'success', '/dashboard/listings', true),
  (_user_id, 'Gadget Approved!', 'Your Dell Inspiron 15 was approved. 1000 points credited.', 'success', '/dashboard/listings', true),
  (_user_id, 'Gadget Rejected', 'Your Beats Solo3 submission was rejected: condition too low.', 'warning', '/dashboard/listings', false),
  (_user_id, 'Order Shipped', 'Your Logitech MX Master 3 Mouse order has shipped.', 'info', '/dashboard/orders', false),
  (_user_id, 'Welcome to Triple G!', 'Thanks for joining. Start submitting gadgets to earn points.', 'info', '/dashboard', true);
end $$;
