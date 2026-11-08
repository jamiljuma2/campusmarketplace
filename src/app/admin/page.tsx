import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Bell, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, LayoutDashboard, ListChecks, Settings, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/env";
import { kes, dateLabel } from "@/lib/format";
import { moderateProduct } from "./actions";

export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  if (!hasSupabase) return <div className="container" style={{ padding: 60 }}>Supabase is required.</div>;

  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await db.from("profiles").select("role,full_name,username").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const admin = createAdminClient();
  const [{ count: users }, { count: products }, { count: active }, { count: pending }, { count: subscriptions }, { data: payments }, queueResult] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("products").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    admin.from("seller_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active").gt("expires_at", new Date().toISOString()),
    admin.from("payments").select("amount_kes,status,kind,created_at,internal_reference").order("created_at", { ascending: false }).limit(100),
    admin.from("products").select("id,title,price,created_at,seller_id").eq("status", "pending_review").order("created_at").limit(30),
  ]);

  const confirmed = (payments || []).filter((payment) => payment.status === "successful");
  const revenue = confirmed.reduce((total, payment) => total + Number(payment.amount_kes), 0);
  const { data: queue, error: queueError } = queueResult;
  const sellerIds = [...new Set((queue || []).map((product) => product.seller_id))];
  const { data: sellers, error: sellersError } = sellerIds.length
    ? await admin.from("profiles").select("id,full_name,username").in("id", sellerIds)
    : { data: [], error: null };
  const sellerById = new Map((sellers || []).map((seller) => [seller.id, seller]));
  const { error, success } = await searchParams;
  const stats = [
    { label: "Total users", value: users || 0, icon: Users, tone: "admin-stat-green" },
    { label: "Total listings", value: products || 0, icon: ClipboardList, tone: "admin-stat-purple" },
    { label: "Active listings", value: active || 0, icon: CheckCircle2, tone: "admin-stat-blue" },
    { label: "Awaiting review", value: pending || 0, icon: ListChecks, tone: "admin-stat-orange" },
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand"><ShieldCheck size={22} /> CampusMarket</Link>
        <div className="admin-sidebar-label">Workspace</div>
        <nav className="admin-sidebar-nav">
          <a className="active" href="#overview"><LayoutDashboard size={17} /> Dashboard</a>
          <a href="#review-queue"><ListChecks size={17} /> Listings <span>{pending || 0}</span></a>
          <a href="#payments"><CircleDollarSign size={17} /> Payments</a>
          <a href="#users"><Users size={17} /> Users <span>{users || 0}</span></a>
          <a href="#analytics"><BarChart3 size={17} /> Analytics</a>
        </nav>
        <div className="admin-sidebar-label">System</div>
        <nav className="admin-sidebar-nav">
          <a href="#settings"><Settings size={17} /> Settings</a>
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-avatar">{(profile.full_name || profile.username || "A").slice(0, 1).toUpperCase()}</div>
          <div><strong>{profile.full_name || profile.username || "Administrator"}</strong><span>Administrator</span></div>
        </div>
      </aside>

      <main className="admin-main" id="overview">
        <div className="admin-topbar">
          <div className="admin-search"><span>⌕</span><input aria-label="Search dashboard" placeholder="Search dashboard" /></div>
          <div className="admin-topbar-actions"><Bell size={18} /><span className="admin-online-dot" /><span className="admin-user-label">Admin account</span></div>
        </div>

        <div className="admin-heading">
          <div><div className="muted" style={{ fontSize: 13 }}>Overview</div><h1>Smart dashboard. Clear data. Fast decisions. 📊</h1></div>
          <Link href="/marketplace" className="btn btn-secondary">View marketplace <ChevronRight size={16} /></Link>
        </div>

        {success && <div role="status" className="admin-alert admin-alert-success">{success}</div>}
        {error && <div role="alert" className="admin-alert admin-alert-error">{error}</div>}

        <section className="admin-stat-grid">
          {stats.map(({ label, value, icon: Icon, tone }) => <div className={`admin-stat-card ${tone}`} key={label}><div className="admin-stat-icon"><Icon size={18} /></div><div className="muted">{label}</div><strong>{value}</strong><small>Live platform count</small></div>)}
        </section>

        <section className="admin-content-grid" id="analytics">
          <div className="admin-panel">
            <div className="admin-panel-heading"><div><h2>Listing analytics</h2><p className="muted">Current marketplace inventory</p></div><BarChart3 size={19} className="muted" /></div>
            <div className="admin-bars" aria-label="Listing analytics">
              {[["Active", active || 0, "bar-green"], ["Review", pending || 0, "bar-orange"], ["All listings", products || 0, "bar-dark"], ["Subscriptions", subscriptions || 0, "bar-blue"]].map(([label, value, tone]) => <div className="admin-bar-item" key={String(label)}><div className="admin-bar-track"><div className={`admin-bar ${tone}`} style={{ height: `${Math.max(14, Math.min(100, Number(value) / Math.max(1, Number(products)) * 100))}%` }} /></div><span>{label}</span><strong>{value}</strong></div>)}
            </div>
          </div>
          <div className="admin-panel admin-reminders">
            <div className="admin-panel-heading"><div><h2>Reminders</h2><p className="muted">What needs attention</p></div><Bell size={19} className="muted" /></div>
            <div className="admin-reminder"><ListChecks size={18} /><div><strong>{pending || 0} listing{pending === 1 ? "" : "s"} awaiting review</strong><span>Approve or reject seller submissions</span></div><a href="#review-queue">Open <ChevronRight size={15} /></a></div>
            <div className="admin-reminder"><CircleDollarSign size={18} /><div><strong>{kes(revenue)} confirmed revenue</strong><span>From successful payment records</span></div></div>
          </div>
        </section>

        <section className="admin-panel admin-queue-panel" id="review-queue">
          <div className="admin-panel-heading"><div><h2>Listings awaiting review</h2><p className="muted">Review, approve, or reject seller submissions before publication.</p></div><span className="admin-count-pill">{pending || 0} pending</span></div>
          {queueError || sellersError ? <p role="alert" className="admin-error-text">Review queue could not be loaded. Please refresh and try again.</p> : queue?.length ? <div className="admin-queue-list">{queue.map((product) => <div key={product.id} className="admin-queue-row"><div className="admin-queue-item-main"><div className="admin-listing-mark"><ClipboardList size={17} /></div><div><Link href={`/product/${product.id}`} style={{ fontWeight: 700 }}>{product.title}</Link><div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{kes(Number(product.price))} · {dateLabel(product.created_at)} · {sellerById.get(product.seller_id)?.full_name || sellerById.get(product.seller_id)?.username || "Seller"}</div></div></div><div className="admin-queue-actions"><form action={moderateProduct}><input type="hidden" name="id" value={product.id} /><input type="hidden" name="action" value="active" /><button type="submit" className="btn btn-primary">Approve</button></form><form action={moderateProduct}><input type="hidden" name="id" value={product.id} /><input type="hidden" name="action" value="rejected" /><input name="reason" required placeholder="Reason" className="field" /><button type="submit" className="btn btn-secondary">Reject</button></form></div></div>)}</div> : <div className="admin-empty"><CheckCircle2 size={26} /><p>No listings are awaiting review.</p></div>}
        </section>

        <section className="admin-panel" id="payments">
          <div className="admin-panel-heading"><div><h2>Recent payment records</h2><p className="muted">Latest successful and pending transactions</p></div><Link href="#payments" className="muted">View all <ChevronRight size={15} /></Link></div>
          <div className="admin-payment-list">{payments?.slice(0, 8).map((payment, index) => <div className="admin-payment-row" key={index}><div className="admin-payment-icon"><CircleDollarSign size={16} /></div><div><strong>{payment.kind}</strong><span>{payment.internal_reference} · {dateLabel(payment.created_at)}</span></div><span className={`admin-payment-status status-${payment.status}`}>{payment.status}</span><strong>{kes(Number(payment.amount_kes))}</strong></div>)}</div>
        </section>
      </main>
    </div>
  );
}
