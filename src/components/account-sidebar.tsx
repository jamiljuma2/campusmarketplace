"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Heart, LayoutDashboard, Menu, Package, Plus, Store, UserRound, Wallet, X } from "lucide-react";

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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button type="button" className="account-menu-button" onClick={() => setOpen(true)} aria-label="Open seller navigation" aria-expanded={open}><Menu size={20} /></button>
      {open && <button type="button" className="account-drawer-backdrop" onClick={close} aria-label="Close seller navigation" />}
      <aside className={`account-sidebar${open ? " account-sidebar-open" : ""}`} aria-label="Seller navigation">
        <div className="account-sidebar-heading">
          <span className="account-sidebar-mark"><Store size={18} /></span>
          <div><strong>Seller space</strong><span>Manage your shop</span></div>
          <button type="button" className="account-drawer-close" onClick={close} aria-label="Close seller navigation"><X size={20} /></button>
        </div>
        <nav className="account-sidebar-nav">
          {items.map(({ href, label, Icon }) => {
            const active = href === "/account" ? pathname === "/account" : pathname === href.split("#")[0];
            return <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined} onClick={close}><Icon size={17} /><span>{label}</span>{label === "My listings" && <ArrowUpRight className="account-sidebar-trailing" size={14} />}</Link>;
          })}
        </nav>
        <Link href="/sell" className="btn btn-primary account-sidebar-cta" onClick={close}><Plus size={16} /> Add a listing</Link>
      </aside>
    </>
  );
}
