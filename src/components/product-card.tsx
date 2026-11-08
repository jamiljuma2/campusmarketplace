import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { kes } from "@/lib/format";
import { MessageSellerButton } from "./message-seller-button";

export type Product = { id:string; title:string; slug:string; price:number; condition:string; town:string|null; created_at:string; product_images?:{storage_path:string;alt_text:string|null}[]; categories?:{name:string}|{name:string}[]|null };

export function ProductCard({product}:{product:Product}) {
  const img = product.product_images?.[0]?.storage_path;

  return (
    <div className="card product-card" style={{ overflow:"hidden" }}>
      <Link href={`/product/${product.id}`} style={{ display:"block" }}>
        <div className="product-card-image" style={{ height:205, background:"#f4f2df", position:"relative", overflow:"hidden" }}>
          {img ? <Image src={img} alt={product.product_images?.[0]?.alt_text || product.title} fill sizes="(max-width: 760px) 50vw, 280px" style={{ objectFit:"cover" }} /> : <div style={{ height:"100%", display:"grid", placeItems:"center", color:"#839574", fontSize:13 }} />}
          <span style={{ position:"absolute", left:10, bottom:10, background:"#ffffffed", padding:"5px 8px", fontSize:11, borderRadius:5, textTransform:"capitalize" }}>{product.condition.replaceAll("_"," ")}</span>
        </div>
        <div style={{ padding:"14px 14px 5px" }}>
          <div style={{ height:42, fontSize:14, fontWeight:600, lineHeight:1.45, overflow:"hidden" }}>{product.title}</div>
          <div style={{ fontWeight:700, fontSize:18, color:"var(--green)", marginTop:8 }}>{kes(Number(product.price))}</div>
          <div className="muted" style={{ fontSize:12, display:"flex", alignItems:"center", gap:4, marginTop:9 }}><MapPin size={13}/>{product.town || "Kenya"}</div>
        </div>
      </Link>
      <div style={{ padding:"0 14px 14px" }}>
        <MessageSellerButton productId={product.id} label="I’m interested" />
      </div>
    </div>
  );
}
