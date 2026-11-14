import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ProductForm } from "@/components/product-form";

export const dynamic = "force-dynamic";

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return <div className="container" style={{ padding: 60 }}>Connect Supabase to edit listings.</div>;
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/account/listings/${id}/edit`)}`);

  const [{ data: product, error }, { data: activeCategories }, { data: images }] = await Promise.all([
    db.from("products").select("id,title,description,category_id,price,condition,town,negotiable").eq("id", id).eq("seller_id", user.id).maybeSingle(),
    db.from("categories").select("id,name").eq("is_active", true).order("sort_order").order("name"),
    db.from("product_images").select("id,storage_path,alt_text").eq("product_id", id).order("sort_order"),
  ]);
  if (error || !product) notFound();

  let categories = activeCategories || [];
  if (!categories.some(category => category.id === product.category_id)) {
    const { data: currentCategory } = await db.from("categories").select("id,name").eq("id", product.category_id).maybeSingle();
    if (currentCategory) categories = [currentCategory, ...categories];
  }

  return <div className="container" style={{ maxWidth: 760, paddingTop: 30 }}>
    <Link href="/account#listings" className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13 }}><ArrowLeft size={15} /> Back to your listings</Link>
    <h1 style={{ fontSize: 30, margin: "12px 0 5px" }}>Edit listing</h1>
    <p className="muted" style={{ fontSize: 14, margin: 0 }}>Update the details and photos for “{product.title}”.</p>
    <ProductForm categories={categories} product={product} images={images || []} />
  </div>;
}
