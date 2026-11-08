import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { siteOrigin } from "@/lib/site-url";

const staticPages: MetadataRoute.Sitemap = [
  { url: siteOrigin, changeFrequency: "daily", priority: 1 },
  { url: `${siteOrigin}/marketplace`, changeFrequency: "hourly", priority: 0.9 },
  { url: `${siteOrigin}/about`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteOrigin}/safety`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteOrigin}/contact`, changeFrequency: "monthly", priority: 0.4 },
  { url: `${siteOrigin}/privacy`, changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!hasSupabase) return staticPages;

  try {
    const db = await createClient();
    const [productsResult, storesResult] = await Promise.all([
      db.from("products")
        .select("id,updated_at")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(50000),
      db.from("seller_stores")
        .select("slug,updated_at")
        .eq("is_public", true)
        .order("updated_at", { ascending: false })
        .limit(50000),
    ]);
    if (productsResult.error || storesResult.error) return staticPages;

    const dynamicPages: MetadataRoute.Sitemap = [
      ...(productsResult.data || []).map((product) => ({
        url: `${siteOrigin}/product/${product.id}`,
        lastModified: product.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...(storesResult.data || []).map((store) => ({
        url: `${siteOrigin}/store/${encodeURIComponent(store.slug)}`,
        lastModified: store.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];

    return [...staticPages, ...dynamicPages];
  } catch {
    return staticPages;
  }
}
