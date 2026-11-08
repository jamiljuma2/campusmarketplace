"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

export function SiteNav({ user, signOut }: { user: boolean; signOut: () => Promise<void> }) {
  const isAdmin = usePathname() === "/admin";

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
      {!isAdmin && <Link className="muted" href="/marketplace" style={{ fontSize: 14 }}>Explore</Link>}
      {!isAdmin && <Link href="/sell" className="btn btn-primary" style={{ padding: "10px 13px", fontSize: 13 }}><Plus size={16} /> Sell an item</Link>}
      {user ? <form action={signOut}><button className="btn btn-secondary sign-in-link" type="submit" style={{ padding: "10px 13px", fontSize: 13 }}>Sign out</button></form> : <Link href="/login" className="btn btn-secondary sign-in-link" style={{ padding: "10px 13px", fontSize: 13 }}>Sign in</Link>}
    </nav>
  );
}
