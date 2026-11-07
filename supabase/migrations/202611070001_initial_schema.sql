create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.account_kind as enum ('individual','business');
create type public.product_condition as enum ('new','like_new','good','fair','refurbished');
create type public.listing_status as enum ('draft','pending_review','active','rejected','sold','expired','suspended');
create type public.payment_status as enum ('pending','successful','failed','cancelled');
create type public.seller_role as enum ('user','admin');

create table public.counties (id uuid primary key default gen_random_uuid(), name text not null unique, created_at timestamptz not null default now());
create table public.universities (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, county_id uuid references public.counties, is_active boolean not null default true, created_at timestamptz not null default now());
create table public.campuses (id uuid primary key default gen_random_uuid(), university_id uuid not null references public.universities on delete cascade, name text not null, county_id uuid references public.counties, town text, unique(university_id,name));
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, icon text, is_active boolean not null default true, sort_order int not null default 0);
create table public.subcategories (id uuid primary key default gen_random_uuid(), category_id uuid not null references public.categories on delete cascade, name text not null, slug text not null, unique(category_id,slug));

create table public.profiles (
 id uuid primary key references auth.users on delete cascade, username text unique, full_name text, avatar_url text,
 phone text, phone_public boolean not null default false, university_id uuid references public.universities, campus_id uuid references public.campuses,
 county_id uuid references public.counties, town text, preferred_contact text not null default 'whatsapp' check (preferred_contact in ('whatsapp','phone','message')),
 account_type public.account_kind not null default 'individual', role public.seller_role not null default 'user', is_verified boolean not null default false,
 is_suspended boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.seller_stores (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references public.profiles on delete cascade,
 slug text not null unique, name text not null, description text, logo_url text, cover_url text, county_id uuid references public.counties,
 town text, is_public boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.products (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles on delete cascade,
 category_id uuid not null references public.categories, subcategory_id uuid references public.subcategories,
 title text not null check (char_length(title) between 4 and 120), slug text not null,
 description text not null check (char_length(description) between 10 and 5000), price numeric(12,2) not null check (price >= 0),
 negotiable boolean not null default false, condition public.product_condition not null, status public.listing_status not null default 'pending_review',
 university_id uuid references public.universities, campus_id uuid references public.campuses, county_id uuid references public.counties,
 town text, pickup_location text, delivery_available boolean not null default false, view_count bigint not null default 0 check (view_count>=0),
 favorite_count bigint not null default 0 check (favorite_count>=0), rejection_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 search_document tsvector generated always as (to_tsvector('simple',coalesce(title,'')||' '||coalesce(description,'')||' '||coalesce(town,''))) stored,
 unique(seller_id,slug)
);
create table public.product_images (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products on delete cascade, storage_path text not null unique, alt_text text, sort_order int not null default 0, created_at timestamptz not null default now());
create table public.favorites (user_id uuid not null references public.profiles on delete cascade, product_id uuid not null references public.products on delete cascade, created_at timestamptz not null default now(), primary key(user_id,product_id));

create table public.subscription_plans (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, price_kes numeric(12,2) not null check(price_kes>=0), listing_limit int, duration_days int not null default 30, features jsonb not null default '[]', is_active boolean not null default true, sort_order int not null default 0);
create table public.promotion_plans (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, price_kes numeric(12,2) not null check(price_kes>=0), duration_hours int not null, placement text not null default 'listing', is_active boolean not null default true);
create table public.seller_subscriptions (id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles on delete cascade, plan_id uuid not null references public.subscription_plans, starts_at timestamptz not null, expires_at timestamptz not null, status text not null check(status in ('active','expired','cancelled')), payment_id uuid, created_at timestamptz not null default now());
create table public.product_promotions (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products on delete cascade, seller_id uuid not null references public.profiles on delete cascade, plan_id uuid not null references public.promotion_plans, starts_at timestamptz not null, expires_at timestamptz not null, status text not null check(status in ('active','expired','cancelled')), payment_id uuid, created_at timestamptz not null default now());
create table public.payments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles, kind text not null check(kind in ('subscription','promotion','storefront')),
 plan_code text not null, product_id uuid references public.products, amount_kes numeric(12,2) not null check(amount_kes>0), currency text not null default 'KES' check(currency='KES'),
 internal_reference text not null unique, payhero_reference text unique, checkout_request_id text, phone_ciphertext text,
 status public.payment_status not null default 'pending', verification_status text not null default 'unverified',
 initiated_at timestamptz not null default now(), completed_at timestamptz, created_at timestamptz not null default now()
);
alter table public.seller_subscriptions add constraint seller_subscriptions_payment_fk foreign key(payment_id) references public.payments;
alter table public.product_promotions add constraint product_promotions_payment_fk foreign key(payment_id) references public.payments;
create table public.payment_events (id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments on delete cascade, event_type text not null, payload jsonb not null default '{}', created_at timestamptz not null default now());

create table public.conversations (id uuid primary key default gen_random_uuid(), product_id uuid references public.products on delete set null, created_by uuid not null default auth.uid() references public.profiles, created_at timestamptz not null default now(), unique(product_id,created_by));
create table public.conversation_participants (conversation_id uuid not null references public.conversations on delete cascade, user_id uuid not null references public.profiles on delete cascade, last_read_at timestamptz, joined_at timestamptz not null default now(), primary key(conversation_id,user_id));
create table public.messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations on delete cascade, sender_id uuid not null references public.profiles, body text not null check(char_length(body) between 1 and 4000), created_at timestamptz not null default now());
create table public.user_blocks (blocker_id uuid not null references public.profiles on delete cascade, blocked_id uuid not null references public.profiles on delete cascade, created_at timestamptz not null default now(), primary key(blocker_id,blocked_id), check(blocker_id<>blocked_id));
create table public.user_reports (id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles, target_user_id uuid references public.profiles, product_id uuid references public.products, reason text not null, details text, status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')), created_at timestamptz not null default now(), check(product_id is not null or target_user_id is not null));
create table public.product_reviews (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products, reviewer_id uuid not null references public.profiles, seller_id uuid not null references public.profiles, rating int not null check(rating between 1 and 5), body text, created_at timestamptz not null default now(), unique(product_id,reviewer_id));
create table public.advertisements (id uuid primary key default gen_random_uuid(), title text not null, image_url text, target_url text, placement text not null, starts_at timestamptz, ends_at timestamptz, is_active boolean not null default false, created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, kind text not null, title text not null, body text, href text, read_at timestamptz, created_at timestamptz not null default now());
create table public.admin_audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles, action text not null, entity_type text not null, entity_id uuid, details jsonb not null default '{}', created_at timestamptz not null default now());
create table public.platform_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
create view public.public_seller_profiles with (security_barrier=true) as
 select id,username,full_name,avatar_url,university_id,campus_id,county_id,town,account_type,is_verified,phone_public,
 case when phone_public then phone else null end as contact_phone
 from public.profiles where not is_suspended;
grant select on public.public_seller_profiles to anon,authenticated;

create or replace function public.activate_payment(p_payment uuid,p_payhero_reference text,p_amount numeric) returns void
language plpgsql security definer set search_path=public as $$
declare pay public.payments%rowtype; subplan public.subscription_plans%rowtype; promo public.promotion_plans%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext(p_payment::text));
  select * into pay from public.payments where id=p_payment for update;
  if not found or pay.status='successful' then return; end if;
  if pay.amount_kes<>p_amount then raise exception 'Payment amount mismatch'; end if;
  update public.payments set status='successful',verification_status='verified',payhero_reference=p_payhero_reference,completed_at=now() where id=p_payment;
  if pay.kind='subscription' then
    select * into subplan from public.subscription_plans where code=pay.plan_code;
    if not found then raise exception 'Subscription plan unavailable'; end if;
    update public.seller_subscriptions set status='expired' where seller_id=pay.user_id and status='active';
    insert into public.seller_subscriptions(seller_id,plan_id,starts_at,expires_at,status,payment_id) values(pay.user_id,subplan.id,now(),now()+make_interval(days=>subplan.duration_days),'active',pay.id);
  elsif pay.kind='promotion' then
    select * into promo from public.promotion_plans where code=pay.plan_code;
    if not found or pay.product_id is null then raise exception 'Promotion plan or product unavailable'; end if;
    if not exists(select 1 from products where id=pay.product_id and seller_id=pay.user_id and status='active') then raise exception 'Product unavailable'; end if;
    insert into public.product_promotions(product_id,seller_id,plan_id,starts_at,expires_at,status,payment_id) values(pay.product_id,pay.user_id,promo.id,now(),now()+make_interval(hours=>promo.duration_hours),'active',pay.id);
  end if;
end $$;
revoke all on function public.activate_payment(uuid,text,numeric) from public,anon,authenticated;
grant execute on function public.activate_payment(uuid,text,numeric) to service_role;

create or replace function public.expire_paid_services() returns void language sql security definer set search_path=public as $$
 update public.seller_subscriptions set status='expired' where status='active' and expires_at<=now();
 update public.product_promotions set status='expired' where status='active' and expires_at<=now();
$$;
revoke all on function public.expire_paid_services() from public,anon,authenticated;
create or replace function public.increment_product_view(p_product uuid) returns void language sql security definer set search_path=public as $$ update public.products set view_count=view_count+1 where id=p_product and status='active'; $$;
revoke all on function public.increment_product_view(uuid) from public,anon,authenticated;
grant execute on function public.increment_product_view(uuid) to service_role;

create index products_active_recent_idx on public.products(status,created_at desc) where status='active';
create index products_category_price_idx on public.products(category_id,price) where status='active';
create index products_location_idx on public.products(university_id,campus_id,county_id) where status='active';
create index products_search_idx on public.products using gin(search_document);
create index products_title_trgm_idx on public.products using gin(title gin_trgm_ops);
create index product_images_product_sort_idx on public.product_images(product_id,sort_order);
create index payments_user_created_idx on public.payments(user_id,created_at desc);
create index subscriptions_expiry_idx on public.seller_subscriptions(expires_at) where status='active';
create index promotions_expiry_idx on public.product_promotions(expires_at) where status='active';
create index messages_thread_idx on public.messages(conversation_id,created_at desc);
create index notifications_unread_idx on public.notifications(user_id,created_at desc) where read_at is null;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin' and not is_suspended) $$;
create or replace function public.is_seller_public(p_seller uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id=p_seller and not is_suspended) $$;
create or replace function public.has_storefront_plan() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from seller_subscriptions s join subscription_plans p on p.id=s.plan_id where s.seller_id=auth.uid() and s.status='active' and s.expires_at>now() and p.code in ('pro','business')) $$;
revoke all on function public.has_storefront_plan() from public,anon;
grant execute on function public.has_storefront_plan() to authenticated;
create or replace function public.is_conversation_member(p_conversation uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from conversation_participants where conversation_id=p_conversation and user_id=auth.uid()) $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.update_product_favorite_count() returns trigger language plpgsql security definer set search_path=public as $$
begin if tg_op='INSERT' then update products set favorite_count=favorite_count+1 where id=new.product_id; return new; else update products set favorite_count=greatest(0,favorite_count-1) where id=old.product_id; return old; end if; end $$;
create trigger favorite_count_added after insert on public.favorites for each row execute procedure public.update_product_favorite_count();
create trigger favorite_count_removed after delete on public.favorites for each row execute procedure public.update_product_favorite_count();

alter table public.profiles enable row level security;
create policy "Users and admins read full profiles" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "Users update own profile" on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id and role='user');
create policy "Users insert own profile" on public.profiles for insert with check(auth.uid()=id and role='user');
create policy "Admins manage profiles" on public.profiles for all using(public.is_admin()) with check(public.is_admin());
alter table public.counties enable row level security; create policy "Counties are public" on public.counties for select using(true);
alter table public.universities enable row level security; create policy "Active universities are public" on public.universities for select using(is_active or public.is_admin());
alter table public.campuses enable row level security; create policy "Campuses are public" on public.campuses for select using(true);
alter table public.categories enable row level security; create policy "Active categories are public" on public.categories for select using(is_active or public.is_admin());
alter table public.subcategories enable row level security; create policy "Subcategories are public" on public.subcategories for select using(true);
alter table public.seller_stores enable row level security; create policy "Public stores readable" on public.seller_stores for select using((is_public and public.is_seller_public(owner_id)) or owner_id=auth.uid() or public.is_admin()); create policy "Owner edits store" on public.seller_stores for all using(owner_id=auth.uid() or public.is_admin()) with check((owner_id=auth.uid() and public.has_storefront_plan()) or public.is_admin());
alter table public.products enable row level security; create policy "Active products public; owners see own" on public.products for select using((status='active' and public.is_seller_public(seller_id)) or seller_id=auth.uid() or public.is_admin()); create policy "Seller creates own products" on public.products for insert with check(seller_id=auth.uid() and status in ('draft','pending_review')); create policy "Seller updates own products" on public.products for update using(seller_id=auth.uid() or public.is_admin()) with check((seller_id=auth.uid() and status in ('draft','pending_review','sold','expired')) or public.is_admin()); create policy "Seller deletes own products" on public.products for delete using(seller_id=auth.uid() or public.is_admin());
alter table public.product_images enable row level security; create policy "Images follow product visibility" on public.product_images for select using(exists(select 1 from products p where p.id=product_id and (p.status='active' or p.seller_id=auth.uid() or public.is_admin()))); create policy "Seller manages own images" on public.product_images for all using(exists(select 1 from products p where p.id=product_id and (p.seller_id=auth.uid() or public.is_admin()))) with check(exists(select 1 from products p where p.id=product_id and (p.seller_id=auth.uid() or public.is_admin())));
alter table public.favorites enable row level security; create policy "Users manage own favorites" on public.favorites for all using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table public.subscription_plans enable row level security; create policy "Plans public" on public.subscription_plans for select using(is_active or public.is_admin());
alter table public.promotion_plans enable row level security; create policy "Promotion plans public" on public.promotion_plans for select using(is_active or public.is_admin());
alter table public.seller_subscriptions enable row level security; create policy "Own subscriptions readable" on public.seller_subscriptions for select using(seller_id=auth.uid() or public.is_admin());
alter table public.product_promotions enable row level security; create policy "Current promotions or own" on public.product_promotions for select using((status='active' and starts_at<=now() and expires_at>now()) or seller_id=auth.uid() or public.is_admin());
alter table public.payments enable row level security; create policy "Own payments readable" on public.payments for select using(user_id=auth.uid() or public.is_admin());
alter table public.payment_events enable row level security; create policy "Payment events admin only" on public.payment_events for select using(public.is_admin());
alter table public.conversations enable row level security; create policy "Participants access conversation" on public.conversations for select using(public.is_conversation_member(id) or public.is_admin()); create policy "Authenticated can start conversation" on public.conversations for insert with check(auth.uid() is not null and created_by=auth.uid());
alter table public.conversation_participants enable row level security; create policy "Participants view participants" on public.conversation_participants for select using(public.is_conversation_member(conversation_id) or public.is_admin()); create policy "Users add self participant" on public.conversation_participants for insert with check(user_id=auth.uid() and (exists(select 1 from conversations c where c.id=conversation_id and c.created_by=auth.uid()) or exists(select 1 from conversations c join products p on p.id=c.product_id where c.id=conversation_id and p.seller_id=auth.uid()))); create policy "Users update own participant" on public.conversation_participants for update using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table public.messages enable row level security; create policy "Conversation members access messages" on public.messages for select using(public.is_conversation_member(conversation_id) or public.is_admin()); create policy "Members send own messages" on public.messages for insert with check(sender_id=auth.uid() and public.is_conversation_member(conversation_id));
alter table public.user_blocks enable row level security; create policy "Users manage own blocks" on public.user_blocks for all using(blocker_id=auth.uid()) with check(blocker_id=auth.uid());
alter table public.user_reports enable row level security; create policy "Reporters and admins read reports" on public.user_reports for select using(reporter_id=auth.uid() or public.is_admin()); create policy "Users create reports" on public.user_reports for insert with check(reporter_id=auth.uid());
alter table public.product_reviews enable row level security; create policy "Reviews public" on public.product_reviews for select using(true); create policy "Review author creates" on public.product_reviews for insert with check(reviewer_id=auth.uid());
alter table public.advertisements enable row level security; create policy "Current ads public" on public.advertisements for select using(is_active and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now()));
alter table public.notifications enable row level security; create policy "Own notifications" on public.notifications for select using(user_id=auth.uid()); create policy "Users update own notification" on public.notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table public.admin_audit_logs enable row level security; create policy "Audit log admin read" on public.admin_audit_logs for select using(public.is_admin());
alter table public.platform_settings enable row level security; create policy "Settings admin only" on public.platform_settings for select using(public.is_admin());

do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
  execute 'alter publication supabase_realtime add table public.messages';
 end if;
end $$;

insert into public.subscription_plans(code,name,price_kes,listing_limit,duration_days,features,sort_order) values
 ('free','Free Seller',0,10,30,'["10 active listings","Basic seller profile","WhatsApp contact"]',0),
 ('pro','Pro Seller',299,50,30,'["50 active listings","Seller analytics","Storefront","Featured seller badge"]',1),
 ('business','Business Seller',799,null,30,'["Unlimited listings","Business storefront","Advanced analytics","Priority support"]',2)
on conflict(code) do nothing;
insert into public.promotion_plans(code,name,price_kes,duration_hours,placement) values
 ('boost_24h','24-hour promotion',50,24,'listing'),('boost_3d','3-day promotion',100,72,'listing'),('boost_7d','7-day promotion',200,168,'listing'),('homepage_week','Homepage placement',300,168,'homepage')
on conflict(code) do nothing;
insert into public.categories(name,slug,icon,sort_order) values
 ('Electronics','electronics','smartphone',1),('Books & Stationery','books-stationery','book-open',2),('Fashion','fashion','shirt',3),('Home & Living','home-living','lamp',4),('Hostel Essentials','hostel-essentials','bed-double',5),('Sports & Outdoors','sports-outdoors','dumbbell',6),('Beauty & Personal Care','beauty','sparkles',7),('Other','other','boxes',8)
on conflict(slug) do nothing;
insert into public.counties(name) values ('Nairobi'),('Kiambu'),('Nakuru'),('Uasin Gishu'),('Kisumu'),('Nyeri'),('Embu') on conflict(name) do nothing;
insert into public.universities(name,slug,county_id) values
 ('University of Nairobi','university-of-nairobi',(select id from public.counties where name='Nairobi')),
 ('Kenyatta University','kenyatta-university',(select id from public.counties where name='Nairobi')),
 ('Jomo Kenyatta University of Agriculture and Technology','jkuat',(select id from public.counties where name='Kiambu')),
 ('Egerton University','egerton-university',(select id from public.counties where name='Nakuru')),
 ('Moi University','moi-university',(select id from public.counties where name='Uasin Gishu')),
 ('Strathmore University','strathmore-university',(select id from public.counties where name='Nairobi')),
 ('Technical University of Kenya','technical-university-of-kenya',(select id from public.counties where name='Nairobi')),
 ('Maseno University','maseno-university',(select id from public.counties where name='Kisumu')),
 ('Mount Kenya University','mount-kenya-university',(select id from public.counties where name='Kiambu')),
 ('KCA University','kca-university',(select id from public.counties where name='Nairobi')),
 ('USIU-Africa','usiu-africa',(select id from public.counties where name='Nairobi')),
 ('Dedan Kimathi University of Technology','dedan-kimathi-university',(select id from public.counties where name='Nyeri')),
 ('University of Embu','university-of-embu',(select id from public.counties where name='Embu'))
on conflict(slug) do nothing;
insert into public.platform_settings(key,value) values ('moderation', '{"auto_publish":false,"max_images":8,"max_image_mb":8}') on conflict(key) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('product-images','product-images',true,8388608,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "Public reads product image objects" on storage.objects for select using(bucket_id='product-images');
create policy "Authenticated uploads own product folder" on storage.objects for insert to authenticated with check(bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Owners update own product objects" on storage.objects for update to authenticated using(bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Owners delete own product objects" on storage.objects for delete to authenticated using(bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text);
