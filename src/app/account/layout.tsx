import { AccountSidebar } from "@/components/account-sidebar";

export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="container account-shell">
      <AccountSidebar />
      <main className="account-main">{children}</main>
    </div>
  );
}
