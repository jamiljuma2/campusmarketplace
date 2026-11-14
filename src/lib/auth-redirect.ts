import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export async function getSignedInRedirect(nextPath: string) {
  if (!hasSupabase) return null;

  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { count }] = await Promise.all([
    db.from("profiles").select("role,signup_intent").eq("id", user.id).maybeSingle(),
    db.from("products").select("id", { count: "exact", head: true }).eq("seller_id", user.id),
  ]);

  if (profile?.role === "admin") return "/admin";
  if (profile?.signup_intent === "seller" || (count ?? 0) > 0) return "/account";
  return nextPath === "/admin" ? "/marketplace" : nextPath;
}
