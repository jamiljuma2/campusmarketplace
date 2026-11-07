-- Indexes for the marketplace's frequent seller, browse, and inbox queries.
-- Partial indexes keep the active and moderation indexes compact.

create index if not exists products_seller_recent_idx
  on public.products (seller_id, created_at desc);

create index if not exists products_seller_status_idx
  on public.products (seller_id, status);

create index if not exists products_active_price_idx
  on public.products (price, created_at desc)
  where status = 'active';

create index if not exists products_active_condition_recent_idx
  on public.products (condition, created_at desc)
  where status = 'active';

create index if not exists products_pending_review_recent_idx
  on public.products (created_at)
  where status = 'pending_review';

create index if not exists favorites_user_recent_idx
  on public.favorites (user_id, created_at desc)
  include (product_id);

create index if not exists favorites_product_idx
  on public.favorites (product_id);

create index if not exists subscriptions_seller_active_expiry_idx
  on public.seller_subscriptions (seller_id, expires_at desc)
  where status = 'active';

create index if not exists promotions_active_recent_idx
  on public.product_promotions (starts_at desc, expires_at, plan_id)
  where status = 'active';

create index if not exists conversation_participants_user_recent_idx
  on public.conversation_participants (user_id, joined_at desc)
  include (conversation_id);

create index if not exists payment_events_payment_recent_idx
  on public.payment_events (payment_id, created_at desc);

create index if not exists categories_active_order_idx
  on public.categories (sort_order, name)
  where is_active;

create index if not exists universities_active_name_idx
  on public.universities (name)
  where is_active;
