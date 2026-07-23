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
  _pickup_centre_ids uuid[];
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
  ('article', 'Why E-Waste Recycling Matters', 'Recycle Tips', 'Understanding the environmental impact of electronic waste.', $txt$E-waste is the fastest-growing waste stream in the world. Every year, people and businesses discard tens of millions of tonnes of electronics — smartphones, laptops, TVs, batteries, and appliances — and the volume keeps climbing as devices get cheaper and product cycles get shorter. Most of it never reaches a proper recycler.

The problem isn't just volume. Electronics contain a mix of materials that make them uniquely risky in a landfill: lead and cadmium in circuit boards, mercury in older flat-panel backlights, and brominated flame retardants in plastics. When these devices are crushed, burned, or left to degrade in the open, those substances can leach into soil and groundwater or release as toxic smoke — a serious hazard for nearby communities and ecosystems.

At the same time, e-waste is an unusually rich resource. A tonne of discarded smartphones contains far more gold per tonne than a tonne of gold ore ever pulled from the ground, along with meaningful amounts of silver, copper, palladium, and other metals. Thrown away, all of that value is lost. Recovered properly, it reduces the need for new mining — which is itself energy-intensive and environmentally destructive.

Formal recycling closes that loop safely. Certified facilities separate hazardous components for safe handling, recover metals for reuse in new products, and create legitimate jobs in the growing green economy — a stark contrast to informal recycling operations in parts of the world where workers, often without protective equipment, burn cables or use acid baths to extract metals, exposing themselves and their communities to serious health risks.

The good news: you don't need to solve this alone. Dropping devices at a certified collection point, using manufacturer take-back programs, or — even better — reselling or swapping something that still works, keeps it out of the waste stream entirely. That's the whole idea behind Triple G's pickup network: making the responsible option the easy one.$txt$, 'Triple G Team', '/images/articles/ewaste-matters.jpg', true, true, _admin_id),

  ('article', 'How to Wipe Your Data Before Recycling', 'Data Safety', 'A step-by-step guide to securely erasing personal data.', $txt$Before a phone, laptop, or tablet leaves your hands, it's worth remembering that it isn't just a device — it's a record of your life. Photos, saved passwords, banking apps, emails, and years of personal messages all live on that storage chip, and none of that disappears just because you dragged a few folders to the trash.

Here's the part most people get wrong: deleting a file doesn't erase it. It just removes the pointer that tells the operating system where to find it — the actual data sits on the drive, recoverable with widely available forensic tools, until something else happens to overwrite that physical space. On a device you're about to hand to a stranger, that's not a safe assumption to make.

The reliable approach is a full factory reset — but only after (or combined with) full-disk encryption. If a device is encrypted before it's wiped, any residual data that somehow survives is unreadable without the encryption key, which makes recovery practically useless even to someone with the right tools. Most modern smartphones encrypt by default; most laptops need it turned on deliberately.

A few things people forget: sign out of cloud accounts and remove the device from services like Find My iPhone or your Google account before resetting, since a lingering account link can lock the device for its next owner. Pull the SIM card and any removable storage. For especially sensitive drives, physical destruction is sometimes the only truly certain option.

This is also exactly why certified e-waste recyclers build data destruction into their process — verified wiping or physical destruction, with a certificate to prove it, is standard practice at any facility worth trusting with your old devices.$txt$, 'Triple G Team', '/images/articles/data-wipe-security.jpg', false, true, _admin_id),

  ('article', 'The Lifecycle of a Smartphone', 'Education', 'From raw materials to recycling, explore a phone lifecycle.', $txt$A smartphone's story starts long before it reaches a store shelf, in mines scattered across the globe pulling out lithium, cobalt, tin, tungsten, gold, and a handful of rare earth elements — extraction that's often concentrated in a small number of countries, sometimes under difficult labor and environmental conditions.

Turning those raw materials into a finished device is itself an energy-intensive process — refining metals, fabricating chips, assembling components across global supply chains. This manufacturing phase is disproportionately where a phone's environmental cost is paid: it's estimated to account for somewhere around 80% of a device's total lifetime carbon footprint, dwarfing the emissions from actually using it for a few years.

Then comes the part we're most familiar with — the use phase. Most smartphones are replaced every two to three years, often well before they've stopped working, driven by battery wear, software support cycles, or simply the appeal of something newer.

What happens next matters enormously. Landfilled or incinerated, a phone's materials are lost entirely and its hazardous components become an environmental liability. Processed by informal recyclers, it can pose serious health risks to workers. Sent to a certified recycler, valuable metals are recovered safely, but the manufacturing emissions from building a replacement still get spent. The best outcome, environmentally, is the one that skips a rebuild altogether: refurbishment and resale, which puts a working device back into use and defers — sometimes indefinitely — the need to manufacture something new.

That's the logic behind a circular economy for electronics: keeping devices and their materials in active use for as long as possible, through reuse, repair, and recycling, instead of the traditional take-make-dispose model. A swap marketplace like Triple G's plugs directly into that first, highest-impact option — connecting a phone that still works with someone who needs one, no new manufacturing required.$txt$, 'Triple G Team', '/images/articles/smartphone-lifecycle.jpg', true, true, _admin_id),

  ('video', 'Inside an E-Waste Recycling Facility', 'Behind the Scenes', 'A video tour of how gadgets are processed.', $txt$Walk into a certified e-waste recycling facility and the first stop is intake and sorting — incoming devices get categorized by type, since a laptop, a monitor, and a battery all need very different handling downstream.

Before anything gets shredded, batteries are removed by hand. This step exists for safety as much as anything else: a damaged lithium-ion battery can short-circuit and ignite, so pulling them out — and storing them separately — is one of the most important steps in the whole process.

What's left then moves through mechanical separation. Shredders break devices down into smaller fragments, and from there a combination of tools sorts the material stream: magnets pull out ferrous metals like steel, eddy current separators use induced magnetic fields to fling out non-ferrous metals like aluminum, and density-based separation splits out plastics by type.

The circuit boards — the densest concentration of value in any device — are set aside and sent to specialized smelters equipped to recover gold, silver, palladium, and copper at a scale and safety standard no informal operation can match. This is where the "urban mining" idea becomes very literal: e-waste like this yields precious metals at concentrations far higher than most traditional ore.

Throughout the process, facilities also manage genuinely hazardous materials — mercury from older LCD backlights, lead from CRT glass, and flame retardants embedded in plastics — under strict safety protocols, and workers wear protective equipment suited to each stage. Reputable operations are certified against standards like R2 or e-Stewards, which audit exactly this kind of safe handling, along with proof that any data-bearing drives were destroyed or wiped before leaving the facility.

It's a far more involved process than most people picture when they drop a laptop in a bin — and it's the reason certified recycling, even though it takes more infrastructure than tossing something in the trash, is worth seeking out.$txt$, 'Triple G Team', '/images/articles/ewaste-recycling-facility.jpg', false, true, _admin_id),

  ('article', 'Top 5 Ways to Extend Your Gadget''s Life', 'Recycle Tips', 'Simple habits that reduce e-waste before it starts.', $txt$The single most impactful thing you can do for a device's environmental footprint isn't recycling it well — it's not needing to replace it in the first place. Since manufacturing accounts for the large majority of a gadget's lifetime emissions, every extra year of use meaningfully lowers its overall impact. Here are five habits that actually move the needle.

1. Protect it physically. A case and a screen protector are unglamorous, but cracked screens and drop damage are among the most common reasons a still-functional device gets replaced early. It's the cheapest insurance you'll ever buy.

2. Mind your battery. Lithium-ion batteries degrade fastest at the extremes — sitting at 100% for long periods, or being repeatedly drained to 0%. Where possible, keeping charge roughly between 20% and 80% and avoiding extreme heat noticeably slows long-term capacity loss, which is often the real reason an "old" phone feels sluggish.

3. Keep software updated. Security patches close vulnerabilities, and many performance and battery-management improvements ship through the same updates — skipping them doesn't make a device faster, it just makes it more exposed.

4. Keep it clean. Dust buildup in charging ports, speaker grilles, and cooling vents is a quiet cause of overheating and reduced performance over time. A can of compressed air and a few minutes every few months goes a long way.

5. Repair before you replace. A worn-out battery or a cracked screen doesn't mean a device is done — it means one component is done. Battery replacements and screen repairs, whether through a manufacturer program or a trusted independent shop, are almost always cheaper than a new device and avoid the manufacturing footprint entirely. And when a device truly has reached the end of its useful life, that's exactly the moment to swap or recycle it responsibly, rather than let it sit in a drawer.$txt$, 'Triple G Team', '/images/articles/extend-gadget-life.jpg', false, true, _admin_id),

  ('article', 'Understanding CO2 Savings from Recycling', 'Education', 'How swapping and recycling gadgets reduces carbon footprint.', $txt$It's easy to think of an electronic device's environmental cost mainly in terms of the electricity it uses while running. In reality, the bigger number is usually paid before you ever turn it on — mining raw materials, refining them, manufacturing components, and shipping finished products around the world are all carbon-intensive steps baked into a device before its first use.

This is what makes recycling and reuse so effective at cutting emissions: they let some of that upstream cost be avoided or shared. Recovering aluminum through recycling, for example, is estimated to use roughly 95% less energy than producing new aluminum from raw ore — a saving that compounds across every can, laptop chassis, and frame recycled instead of freshly mined and refined. Recycled copper and precious metals show similarly large energy savings compared to virgin extraction.

Reuse goes even further. When a device is resold or swapped instead of recycled for parts, it avoids new manufacturing altogether — no fresh mining, no new assembly line run, no additional shipping footprint. Between recycling materials and simply keeping a working device in use longer, reuse generally has the larger climate benefit, precisely because it skips the most emissions-heavy phase of a product's life entirely.

None of this is abstract at the individual level, either — it adds up per device, per swap, per gadget kept a little longer instead of replaced. That's why Triple G tracks the cumulative CO2 your swaps and recycling have saved on your profile: not as a marketing number, but as a running total of manufacturing emissions that never had to happen.

Scaled across millions of users and billions of devices, these individually small decisions are exactly the kind of behavior change that circular-economy strategies rely on to meaningfully bend the electronics industry's emissions curve.$txt$, 'Triple G Team', '/images/articles/co2-savings-recycling.jpg', true, true, _admin_id),

  ('article', 'Rare Earth Metals and Why They Matter', 'Education', 'The precious materials locked inside your old devices.', $txt$Rare earth elements are a group of seventeen metals — including neodymium, dysprosium, europium, and yttrium — with unusual magnetic, luminescent, and conductive properties that make modern electronics possible. They're what make your phone's speaker and vibration motor work, what gives a display its color accuracy, and what makes hard drives and headphones function at the size we've come to expect.

Despite the name, rare earths aren't actually that rare in the Earth's crust — what's scarce is finding them in concentrations, and forms, that make extraction economically and environmentally viable. Refining them is a genuinely difficult, chemically intensive process, and production has ended up concentrated in a small number of countries, which raises real supply chain and geopolitical concerns for every industry that depends on them.

That concentration comes at an environmental cost. Rare earth mining generates toxic tailings and, because these elements often occur alongside radioactive minerals like thorium, can produce genuinely hazardous byproducts if not managed carefully — a serious burden for the communities near extraction sites.

This is exactly where e-waste recycling becomes strategically important, not just environmentally nice-to-have: recovering rare earths from discarded electronics — sometimes called urban mining — reduces pressure on new mining and helps diversify a supply chain that's currently concentrated in very few hands.

The catch is that it's technically hard. Unlike gold or copper, rare earth elements exist in tiny quantities dispersed across many small components in a device, rather than in large, easily separated chunks — which makes efficient recovery a genuinely active area of engineering research, not yet where it needs to be at scale. Every device recycled properly, though, is a step toward getting the recovery infrastructure — and the incentive to build it — there faster.$txt$, 'Triple G Team', '/images/articles/rare-earth-metals.jpg', false, true, _admin_id);

  -- ===================================================
  -- LEARNING CENTER QUIZZES — every seeded article gets a
  -- 5-question quiz so the Learning Center has a full set of
  -- graded modules to demo out of the box.
  -- ===================================================
  update public.articles set quiz_points = 25, quiz_questions = $q$[
    {"question": "What is the fastest-growing waste stream in the world?", "options": ["Plastic packaging", "Electronic waste (e-waste)", "Food waste", "Paper waste"], "correct": 1},
    {"question": "Why shouldn't e-waste go straight into a landfill?", "options": ["It has no value at all", "It can contain hazardous materials as well as recoverable ones", "It decomposes too quickly", "It is illegal to landfill any metal"], "correct": 1},
    {"question": "What does recycling e-waste primarily help recover?", "options": ["Only plastic", "Recoverable materials like metals", "Nothing of value", "Only glass"], "correct": 1},
    {"question": "Which of these is a hazardous substance commonly found in e-waste?", "options": ["Lead", "Cotton", "Rubber", "Paper"], "correct": 0},
    {"question": "What is one major benefit of buying refurbished electronics instead of new?", "options": ["It always voids the warranty", "It reduces demand for newly mined raw materials", "It has no effect on e-waste", "It is illegal in most countries"], "correct": 1}
  ]$q$::jsonb where title = 'Why E-Waste Recycling Matters';

  update public.articles set quiz_points = 20, quiz_questions = $q$[
    {"question": "Why is wiping your data important before recycling a device?", "options": ["It makes the device heavier", "It prevents your personal data from being exposed", "It voids the warranty", "It is not actually necessary"], "correct": 1},
    {"question": "What is a reliable way to erase data before recycling?", "options": ["Just delete the files normally", "Perform a full factory reset / secure wipe", "Rename the files", "Nothing, recyclers handle it automatically"], "correct": 1},
    {"question": "Why is simply deleting files not enough to protect your data?", "options": ["Deleted files can often be recovered with forensic tools until overwritten", "Deleting files erases the hard drive automatically", "Deleted files are instantly destroyed", "It has no security implications"], "correct": 0},
    {"question": "What should you do with your cloud/account sign-ins before recycling a device?", "options": ["Nothing, they don't matter", "Sign out and remove the device from your accounts (e.g. Find My, Google)", "Change your password only", "Leave them signed in for convenience"], "correct": 1},
    {"question": "Combining encryption with a factory reset helps because...", "options": ["It makes any leftover data unreadable even if recovered", "It speeds up the reset process", "It voids the recycler's certification", "It has no additional benefit"], "correct": 0}
  ]$q$::jsonb where title = 'How to Wipe Your Data Before Recycling';

  update public.articles set quiz_points = 20, quiz_questions = $q$[
    {"question": "Roughly what share of a smartphone's lifetime carbon footprint comes from manufacturing rather than daily use?", "options": ["About 80%", "About 10%", "Essentially none", "100% from the use phase"], "correct": 0},
    {"question": "Which raw materials are commonly mined to build a smartphone?", "options": ["Lithium, cobalt, and rare earth elements", "Only plastic", "Only recycled aluminum", "Only sand"], "correct": 0},
    {"question": "What is the best end-of-life pathway for a still-working smartphone, environmentally speaking?", "options": ["Landfill", "Incineration", "Refurbishment and resale to a new owner", "Leaving it in a drawer forever"], "correct": 2},
    {"question": "What best describes a 'circular economy' approach to electronics?", "options": ["Buy new, throw away, repeat", "Keep devices and materials in use for as long as possible through reuse and recycling", "Only recycle plastic parts", "Ban all electronics manufacturing"], "correct": 1},
    {"question": "How does a swap marketplace like Triple G reduce e-waste impact?", "options": ["It has no impact", "It extends a device's useful life instead of it becoming waste", "It only affects new devices", "It increases the number of devices manufactured"], "correct": 1}
  ]$q$::jsonb where title = 'The Lifecycle of a Smartphone';

  update public.articles set quiz_points = 20, quiz_questions = $q$[
    {"question": "Why are batteries typically removed first during manual disassembly?", "options": ["They're worthless", "Fire and safety risk from damaged lithium batteries", "They are too heavy", "No reason, it's random"], "correct": 1},
    {"question": "What tool helps separate ferrous metals like steel during mechanical processing?", "options": ["Magnets", "Water jets", "Lasers only", "Nothing, it's done entirely by hand"], "correct": 0},
    {"question": "Where are precious metals like gold and palladium mainly recovered from?", "options": ["Circuit boards sent to specialized smelters", "Plastic casings", "Glass screens", "Cardboard packaging"], "correct": 0},
    {"question": "What certification standards indicate a facility follows responsible e-waste recycling practices?", "options": ["R2 or e-Stewards certification", "ISO 9001 only", "No standards exist", "Any local business license"], "correct": 0},
    {"question": "Why is data destruction verification an important part of the recycling process?", "options": ["It isn't important", "It confirms personal or company data was irreversibly destroyed before parts are resold or recycled", "It only matters for gaming consoles", "It replaces the need for recycling"], "correct": 1}
  ]$q$::jsonb where title = 'Inside an E-Waste Recycling Facility';

  update public.articles set quiz_points = 20, quiz_questions = $q$[
    {"question": "What battery charging habit helps slow long-term battery degradation?", "options": ["Always keeping it at 0% or 100%", "Keeping the charge roughly between 20-80% when possible", "Charging only overnight every day", "None, charging habits don't matter"], "correct": 1},
    {"question": "Why should you keep your device's software updated?", "options": ["It has no benefit", "It improves security and can improve performance", "It always slows the device down", "It voids your warranty"], "correct": 1},
    {"question": "What is a simple physical step that helps prevent accidental damage?", "options": ["Using a protective case and screen protector", "Removing all protective coverings", "Exposing the device to extreme heat", "Never charging it"], "correct": 0},
    {"question": "Why does repairing a device instead of replacing it help the environment?", "options": ["It doesn't help at all", "It avoids the emissions and resource use of manufacturing an entirely new device", "It always costs more than a new device", "Repairs are illegal in most places"], "correct": 1},
    {"question": "What can cause overheating and reduced performance over time if ignored?", "options": ["Regularly updating apps", "Dust buildup blocking ports and vents", "Using a case", "Keeping software updated"], "correct": 1}
  ]$q$::jsonb where title = 'Top 5 Ways to Extend Your Gadget''s Life';

  update public.articles set quiz_points = 20, quiz_questions = $q$[
    {"question": "What happens to CO2 emissions when you recycle or swap a gadget instead of buying new?", "options": ["They increase", "They stay exactly the same", "They are reduced", "There is no connection"], "correct": 2},
    {"question": "What besides CO2 can recycling electronics help conserve?", "options": ["Water and energy used in manufacturing new devices", "Nothing else", "Only plastic", "Only glass"], "correct": 0},
    {"question": "Recycling aluminum instead of producing it from raw ore saves approximately how much energy?", "options": ["About 95%", "No energy savings", "About 5%", "It uses more energy"], "correct": 0},
    {"question": "Which generally has a bigger positive climate impact: reusing a device or recycling its materials?", "options": ["Recycling always has more impact", "Reusing, because it avoids new manufacturing entirely", "Neither has any impact", "They can't be compared"], "correct": 1},
    {"question": "What does Triple G track to help users see their environmental impact?", "options": ["Nothing is tracked", "Cumulative CO2 saved from swaps and recycling", "Only points balance", "Only cash balance"], "correct": 1}
  ]$q$::jsonb where title = 'Understanding CO2 Savings from Recycling';

  update public.articles set quiz_points = 25, quiz_questions = $q$[
    {"question": "Rare earth elements are primarily used in devices for...", "options": ["Making the plastic casing", "Magnets, speakers, and display components", "Packaging materials only", "Nothing, they aren't used in electronics"], "correct": 1},
    {"question": "Why are rare earth elements considered 'rare' despite not being extremely scarce in the Earth's crust?", "options": ["They are difficult and environmentally costly to extract and refine economically", "There is truly almost none on Earth", "They only exist in outer space", "They are common everywhere and easy to refine"], "correct": 0},
    {"question": "What is a major environmental concern associated with rare earth mining?", "options": ["No environmental concerns exist", "Toxic tailings and radioactive byproducts", "It only affects ocean life", "It reduces CO2 emissions"], "correct": 1},
    {"question": "Why does recycling e-waste for rare earth recovery matter?", "options": ["It has no benefit", "It reduces mining pressure and helps diversify supply chains", "It increases the need for new mining", "It is required by law everywhere"], "correct": 1},
    {"question": "What makes recycling rare earth elements from old devices technically challenging?", "options": ["They are present in large, easy-to-remove chunks", "They exist in tiny quantities dispersed throughout many small components", "They are always in dangerous liquid form", "They can only be found in batteries"], "correct": 1}
  ]$q$::jsonb where title = 'Rare Earth Metals and Why They Matter';

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
  ('Sony WH-1000XM4 Headphones', 'audio', 'Refurbished noise-cancelling headphones.', '/images/products/sony-wh-1000xm4.jpg', 1800, 120.00, 8, 'refurbished', 'available'),
  ('Refurbished iPad Air', 'tablet', 'Grade A refurbished tablet with case.', '/images/products/ipad-air.jpg', 3200, 280.00, 5, 'refurbished', 'available'),
  ('Logitech MX Master 3 Mouse', 'accessory', 'Gently used, fully tested.', '/images/products/logitech-mx-master-3.jpg', 950, 60.00, 12, 'good', 'available'),
  ('Anker PowerCore 20K', 'accessory', 'Portable power bank, like new.', '/images/products/anker-powercore-20k.jpg', 420, 25.00, 20, 'excellent', 'available'),
  ('AirPods Pro 2', 'audio', 'Refurbished with new ear tips.', '/images/products/airpods-pro-2.jpg', 2200, 160.00, 6, 'refurbished', 'available'),
  ('Dell XPS 13 Laptop', 'laptop', 'Refurbished ultrabook, 16GB RAM.', '/images/products/dell-xps-13.jpg', 15000, 650.00, 3, 'refurbished', 'available'),
  ('Samsung Galaxy Watch 5', 'wearable', 'Lightly used smartwatch.', '/images/products/galaxy-watch-5.jpg', 2600, 190.00, 7, 'good', 'available'),
  ('Kindle Paperwhite', 'reader', 'Refurbished e-reader, 8GB.', '/images/products/kindle-paperwhite.jpg', 1200, 85.00, 10, 'refurbished', 'available'),
  ('Google Nest Hub', 'smart-home', 'Refurbished smart display.', '/images/products/google-nest-hub.jpg', 1600, 95.00, 9, 'refurbished', 'available'),
  ('Refurbished Nintendo Switch', 'gaming', 'Grade A console with dock.', '/images/products/nintendo-switch.jpg', 8500, 220.00, 4, 'refurbished', 'available'),
  ('JBL Flip 6 Speaker', 'audio', 'Gently used portable speaker.', '/images/products/jbl-flip-6.jpg', 900, 55.00, 14, 'good', 'available');

  select array_agg(id) into _swap_item_ids from public.swap_items;
  select array_agg(id order by created_at) into _pickup_centre_ids from public.pickup_centres;

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
  insert into public.orders (user_id, item_id, quantity, total_amount, total_points, payment_method, status, tracking, shipping_address, pickup_centre_id, pickup_code) values
  (_user_id, _swap_item_ids[1], 1, 0, 1800, 'points', 'picked_up', 'DHL-DEMO-001', '123 Green St, Nairobi', _pickup_centre_ids[1], 'DEMO0001'),
  (_user_id, _swap_item_ids[3], 1, 0, 950, 'points', 'ready_for_pickup', 'FDX-DEMO-002', '123 Green St, Nairobi', _pickup_centre_ids[2], 'DEMO0002'),
  (_user_id, _swap_item_ids[4], 2, 0, 840, 'points', 'processing', null, '123 Green St, Nairobi', _pickup_centre_ids[3], 'DEMO0003');

  -- ===================================================
  -- NOTIFICATIONS for demo user
  -- ===================================================
  insert into public.notifications (user_id, title, body, type, link, read) values
  (_user_id, 'Gadget Approved!', 'Your iPhone 12 was approved. 750 points credited.', 'success', '/dashboard/listings', true),
  (_user_id, 'Gadget Approved!', 'Your Dell Inspiron 15 was approved. 1000 points credited.', 'success', '/dashboard/listings', true),
  (_user_id, 'Gadget Rejected', 'Your Beats Solo3 submission was rejected: condition too low.', 'warning', '/dashboard/listings', false),
  (_user_id, 'Ready for pickup!', 'Your Logitech MX Master 3 Mouse is ready to collect at E-Waste Solutions Hub. Bring code DEMO0002 with you.', 'success', '/dashboard/orders', false),
  (_user_id, 'Welcome to Triple G!', 'Thanks for joining. Start submitting gadgets to earn points.', 'info', '/dashboard', true);
end $$;
