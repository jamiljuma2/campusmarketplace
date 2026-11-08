"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, CircleDollarSign, LayoutDashboard, ListChecks, Menu, Settings, ShieldCheck, Users, X } from "lucide-react";

type AdminSidebarProps = {
  fullName?: string | null;
  username?: string | null;
  pending: number;
  users: number;
};

export function AdminSidebar({ fullName, username, pending, users }: AdminSidebarProps) {
  const [open, setOpen] = useState(false);
  const displayName = fullName || username || "Administrator";
  const initial = displayName.slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  const closeDrawer = () => setOpen(false);

  return (
    <>
      <button type="button" className="admin-menu-button" onClick={() => setOpen(true)} aria-label="Open admin navigation" aria-expanded={open}>
        <Menu size={21} />
      </button>
      {open && <button type="button" className="admin-drawer-backdrop" onClick={closeDrawer} aria-label="Close admin navigation" />}
      <aside className={`admin-sidebar${open ? " admin-sidebar-open" : ""}`} aria-label="Admin navigation">
        <div className="admin-drawer-header">
          <Link href="/admin" className="admin-brand" onClick={closeDrawer}><ShieldCheck size={22} /> CampusMarket</Link>
          <button type="button" className="admin-drawer-close" onClick={closeDrawer} aria-label="Close admin navigation"><X size={20} /></button>
        </div>
        <div className="admin-sidebar-label">Workspace</div>
        <nav className="admin-sidebar-nav">
          <a className="active" href="#overview" onClick={closeDrawer}><LayoutDashboard size={17} /> Dashboard</a>
          <a href="#review-queue" onClick={closeDrawer}><ListChecks size={17} /> Listings <span>{pending}</span></a>
          <a href="#payments" onClick={closeDrawer}><CircleDollarSign size={17} /> Payments</a>
          <a href="#users" onClick={closeDrawer}><Users size={17} /> Users <span>{users}</span></a>
          <a href="#analytics" onClick={closeDrawer}><BarChart3 size={17} /> Analytics</a>
        </nav>
        <div className="admin-sidebar-label">System</div>
        <nav className="admin-sidebar-nav">
          <a href="#settings" onClick={closeDrawer}><Settings size={17} /> Settings</a>
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-avatar">{initial}</div>
          <div><strong>{displayName}</strong><span>Administrator</span></div>
        </div>
      </aside>
    </>
  );
}
