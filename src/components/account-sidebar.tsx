"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Heart, LayoutDashboard, Package, Plus, Store, UserRound, Wallet } from "lucide-react";

const items = [
  { href: "/account", label: "Overview", Icon: LayoutDashboard },
  { href: "/account#listings", label: "My listings", Icon: Package },
  { href: "/account/favorites", label: "Saved items", Icon: Heart },
  { href: "/account/billing", label: "Plans & payments", Icon: Wallet },
  { href: "/account/profile", label: "Profile", Icon: UserRound },
  { href: "/account/store", label: "Storefront", Icon: Store },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="account-sidebar" aria-label="Seller navigation">
      <div className="account-sidebar-heading">
        <span className="account-sidebar-mark"><Store size={18} /></span>
        <div><strong>Seller space</strong><span>Manage your shop</span></div>
      </div>
      <nav className="account-sidebar-nav">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/account" ? pathname === "/account" : pathname === href.split("#")[0];
          return <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}><Icon size={17} /><span>{label}</span>{label === "My listings" && <ArrowUpRight className="account-sidebar-trailing" size={14} />}</Link>;
        })}
      </nav>
      <Link href="/sell" className="btn btn-primary account-sidebar-cta"><Plus size={16} /> Add a listing</Link>
    </aside>
  );
}
