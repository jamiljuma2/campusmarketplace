-- Broaden the listing taxonomy while keeping "Other" as a catch-all for any
-- legal item that does not fit a named category.
insert into public.categories(name, slug, icon, sort_order) values
  ('Furniture', 'furniture', 'sofa', 9),
  ('Clothing & Shoes', 'clothing-shoes', 'shirt', 10),
  ('Home & Kitchen', 'home-kitchen', 'lamp', 11),
  ('Appliances', 'appliances', 'plug', 12),
  ('Phones & Accessories', 'phones-accessories', 'smartphone', 13),
  ('Computers & Tablets', 'computers-tablets', 'laptop', 14),
  ('TVs & Audio', 'tvs-audio', 'headphones', 15),
  ('Gaming', 'gaming', 'gamepad-2', 16),
  ('Bikes & Transport', 'bikes-transport', 'bike', 17),
  ('Musical Instruments', 'musical-instruments', 'music-2', 18),
  ('Toys & Hobbies', 'toys-hobbies', 'puzzle', 19),
  ('Food & Groceries', 'food-groceries', 'shopping-basket', 20)
on conflict (slug) do nothing;
