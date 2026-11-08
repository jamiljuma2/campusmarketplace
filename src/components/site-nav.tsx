"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SiteNav({ user, enabled, signOut }: { user: boolean; enabled: boolean; signOut: () => Promise<void> }) {
  const isAdmin = usePathname() === "/admin";
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(user);

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsSignedIn(Boolean(session?.user));
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.refresh();
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, [enabled, router]);

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
      {!isAdmin && <Link className="muted" href="/marketplace" style={{ fontSize: 14 }}>Explore</Link>}
      {!isAdmin && <Link href="/sell" className="btn btn-primary" style={{ padding: "10px 13px", fontSize: 13 }}><Plus size={16} /> Sell an item</Link>}
      {isSignedIn
        ? <form action={signOut}><button className="btn btn-secondary sign-in-link" type="submit" style={{ padding: "10px 13px", fontSize: 13 }}>Sign out</button></form>
        : <Link href="/login" className="btn btn-secondary sign-in-link" style={{ padding: "10px 13px", fontSize: 13 }}>Sign in</Link>}
    </nav>
  );
}
