import Link from "next/link";
import { redirect } from "next/navigation";
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

  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const admin = createAdminClient();
  const [
    { count: users },
    { count: products },
    { count: active },
    { count: pending },
    { count: subscriptions },
    { data: payments },
    queueResult,
  ] = await Promise.all([
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

  return (
    <div className="container" style={{ paddingTop: 35 }}>
      <Link href="/account" className="muted" style={{ fontSize: 13 }}>← Seller dashboard</Link>
      <h1 style={{ fontSize: 30 }}>Administration</h1>
      {success && <div role="status" style={{ background: "#e9f3dd", padding: 12, borderRadius: 8, color: "var(--green)", margin: "15px 0", fontSize: 13 }}>{success}</div>}
      {error && <div role="alert" style={{ color: "#963a35" }}>{error}</div>}
      <div className="admin-stats" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
        {[["Users", users || 0], ["Listings", products || 0], ["Active listings", active || 0], ["Awaiting review", pending || 0], ["Active subscriptions", subscriptions || 0]].map(([label, count]) => (
          <div className="card" key={String(label)} style={{ padding: 16 }}>
            <div className="muted" style={{ fontSize: 12 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{count}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <div className="muted" style={{ fontSize: 12 }}>Confirmed gross payments (latest 100 records)</div>
        <div style={{ fontSize: 28, fontWeight: 850, color: "var(--green)", marginTop: 5 }}>{kes(revenue)}</div>
      </div>
      <h2 style={{ fontSize: 19, marginTop: 32 }}>Listings awaiting review</h2>
      <div className="card" style={{ padding: "4px 18px" }}>
        {queueError || sellersError ? (
          <p role="alert" style={{ color: "#963a35", fontSize: 13 }}>Review queue could not be loaded. Please refresh and try again.</p>
        ) : queue?.length ? (
          queue.map((product) => (
            <div key={product.id} className="admin-queue-row" style={{ padding: "16px 0", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
              <div className="admin-queue-item-main">
                <Link href={`/product/${product.id}`} style={{ fontWeight: 700 }}>{product.title}</Link>
                <div className="muted" style={{ fontSize: 12, marginTop: 5 }}>
                  {kes(Number(product.price))} · {dateLabel(product.created_at)} · {sellerById.get(product.seller_id)?.full_name || sellerById.get(product.seller_id)?.username || "Seller"}
                </div>
              </div>
              <div className="admin-queue-actions" style={{ display: "flex", gap: 8 }}>
                <form action={moderateProduct}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="action" value="active" />
                  <button type="submit" className="btn btn-primary" style={{ fontSize: 12, padding: "8px 11px" }}>Approve listing</button>
                </form>
                <form action={moderateProduct}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="action" value="rejected" />
                  <input name="reason" required placeholder="Reason" className="field" style={{ width: 120, padding: 8, fontSize: 12 }} />
                  <button type="submit" className="btn btn-secondary" style={{ fontSize: 12, padding: "8px 11px" }}>Reject listing</button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>No listings are awaiting review.</p>
        )}
      </div>
      <h2 style={{ fontSize: 19, marginTop: 32 }}>Recent payment records</h2>
      <div className="card" style={{ padding: "4px 18px" }}>
        {payments?.slice(0, 12).map((payment, index) => (
          <div key={index} className="admin-payment-row" style={{ padding: "12px 0", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>{payment.internal_reference} · {payment.kind} · <span style={{ textTransform: "capitalize" }}>{payment.status}</span></span>
            <strong>{kes(Number(payment.amount_kes))}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
