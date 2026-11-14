import Link from "next/link";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ProductCard, type Product } from "@/components/product-card";

export const dynamic = "force-dynamic";

type Search = {
  q?: string;
  category?: string;
  condition?: string;
  sort?: string;
  min?: string;
  max?: string;
  page?: string;
};

export default async function Marketplace({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const searchTerm = params.q?.trim() || "";
  const page = Math.max(1, Math.min(1000, Number(params.page) || 1));
  let products: Product[] = [];
  let message = "";
  let viewerId: string | null = null;

  if (!hasSupabase) {
    message = "Connect Supabase to browse live listings.";
  } else {
    try {
      const db = await createClient();
      const { data: { user } } = await db.auth.getUser();
      viewerId = user?.id ?? null;
      const makeQuery = () => {
        let query = db.from("products")
          .select("id,seller_id,title,slug,price,condition,town,created_at,product_images(storage_path,alt_text),categories!inner(name)")
          .eq("status", "active");
        if (params.category) query = query.eq("categories.name", params.category);
        if (params.condition) query = query.eq("condition", params.condition);
        if (params.min && Number.isFinite(Number(params.min))) query = query.gte("price", Number(params.min));
        if (params.max && Number.isFinite(Number(params.max))) query = query.lte("price", Number(params.max));
        return query.order(
          params.sort === "low" || params.sort === "high" ? "price" : "created_at",
          { ascending: params.sort === "low" || params.sort === "oldest" },
        );
      };

      const from = (page - 1) * 24;
      const to = page * 24 - 1;
      // Prefer a complete, case-insensitive title match so an exact product name
      // doesn't get buried among broader description or location matches.
      const exactTitle = searchTerm
        ? await makeQuery().ilike("title", searchTerm.replace(/[\\%_]/g, "\\$&")).range(from, to)
        : null;
      const result = exactTitle?.error || !exactTitle?.data?.length
        ? await (searchTerm
          ? makeQuery().textSearch("search_document", searchTerm, { type: "websearch", config: "simple" })
          : makeQuery()).range(from, to)
        : exactTitle;
      const { data, error } = result;
      if (error) message = "Listings could not be loaded. Please try again.";
      else products = (data || []) as Product[];
    } catch {
      message = "Connect Supabase to browse live listings.";
    }
  }

  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    query.set("page", String(nextPage));
    return `/marketplace?${query.toString()}`;
  };
  const activeFilterCount = [params.category, params.condition, params.min, params.max]
    .filter(Boolean).length;

  return (
    <div className="container marketplace-page" style={{ paddingTop: 34 }}>
      <div className="marketplace-heading">
        <h1>{params.q ? `Results for “${params.q}”` : params.category || "Explore listings"}</h1>
        <span className="muted" style={{ fontSize: 13 }}>{products.length} items shown</span>
      </div>

      <form className="card marketplace-filters" action="/marketplace">
        {params.q && <input type="hidden" name="q" value={params.q} />}
        <details className="marketplace-filter-details">
          <summary>
            <span className="marketplace-filter-title"><SlidersHorizontal size={17} /> Filters{activeFilterCount > 0 && <span className="marketplace-filter-count">{activeFilterCount}</span>}</span>
            <ChevronDown className="marketplace-filter-chevron" size={18} />
          </summary>
          <div className="marketplace-filter-fields">
            <label>Category
              <input className="field" name="category" defaultValue={params.category} placeholder="e.g. Electronics" />
            </label>
            <label>Condition
              <select className="field" name="condition" defaultValue={params.condition || ""}>
                <option value="">Any condition</option>
                {["new", "like_new", "good", "fair", "refurbished"].map((condition) => (
                  <option key={condition} value={condition}>{condition.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <fieldset className="marketplace-price-filter">
              <legend>Price (KSh)</legend>
              <div>
                <input className="field" type="number" min="0" name="min" placeholder="Min" defaultValue={params.min} aria-label="Minimum price" />
                <input className="field" type="number" min="0" name="max" placeholder="Max" defaultValue={params.max} aria-label="Maximum price" />
              </div>
            </fieldset>
            <label>Sort by
              <select className="field" name="sort" defaultValue={params.sort || "newest"}>
                <option value="newest">Newest</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </label>
            <div className="marketplace-filter-actions">
              <button className="btn btn-primary">Apply filters</button>
              <Link href={params.q ? `/marketplace?q=${encodeURIComponent(params.q)}` : "/marketplace"} className="muted">Clear filters</Link>
            </div>
          </div>
        </details>
      </form>

      {products.length ? (
        <>
          <div className="marketplace-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14 }}>
            {products.map((product) => <ProductCard key={product.id} product={product} viewerId={viewerId} />)}
          </div>
          <div className="marketplace-pagination">
            {page > 1 ? <Link className="btn btn-secondary" href={pageHref(page - 1)}>Previous</Link> : <span />}
            <span className="muted" style={{ fontSize: 13 }}>Page {page}</span>
            {products.length === 24 ? <Link className="btn btn-secondary" href={pageHref(page + 1)}>Next</Link> : <span />}
          </div>
        </>
      ) : (
        <div className="card marketplace-empty-state">
          <h2>{message || "No listings found"}</h2>
          <p className="muted">Adjust your filters or try a different search.</p>
          <Link href="/marketplace" className="btn btn-secondary">Clear filters</Link>
        </div>
      )}
    </div>
  );
}
