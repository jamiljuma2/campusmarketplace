import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Store } from "lucide-react";
import { kes } from "@/lib/format";

export type Product = { id:string; seller_id?:string; title:string; slug:string; price:number; condition:string; town:string|null; created_at:string; product_images?:{storage_path:string;alt_text:string|null}[]; categories?:{name:string}|{name:string}[]|null };

export function ProductCard({product,viewerId=null}:{product:Product;viewerId?:string|null}) {
  const img = product.product_images?.[0]?.storage_path;

  return (
    <div className="card product-card" style={{ overflow:"hidden" }}>
      <Link href={`/product/${product.id}`} style={{ display:"block" }}>
        <div className="product-card-image" style={{ aspectRatio:"4 / 3", background:"#f4f2df", position:"relative", overflow:"hidden" }}>
          {img ? <Image src={img} alt={product.product_images?.[0]?.alt_text || product.title} fill sizes="(max-width: 760px) 50vw, 280px" style={{ objectFit:"cover" }} /> : <div style={{ height:"100%", display:"grid", placeItems:"center", color:"#839574", fontSize:13 }} />}
          <span style={{ position:"absolute", left:10, bottom:10, background:"#ffffffed", padding:"5px 8px", fontSize:11, borderRadius:5, textTransform:"capitalize" }}>{product.condition.replaceAll("_"," ")}</span>
        </div>
        <div className="product-card-content">
          <div className="product-card-title">{product.title}</div>
          <div style={{ fontWeight:700, fontSize:18, color:"var(--green)", marginTop:8 }}>{kes(Number(product.price))}</div>
          <div className="muted" style={{ fontSize:12, display:"flex", alignItems:"center", gap:4, marginTop:9 }}><MapPin size={13}/>{product.town || "Kenya"}</div>
        </div>
      </Link>
      <div className="product-card-footer">
        {viewerId === product.seller_id
          ? <span className="product-card-owner"><Store size={14}/> Your listing</span>
          : <Link href={`/product/${product.id}`} className="product-card-action">I&apos;m interested <ArrowRight size={15}/></Link>}
      </div>
    </div>
  );
}
