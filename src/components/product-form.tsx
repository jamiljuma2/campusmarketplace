"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ExistingProduct = {
  id: string;
  title: string;
  description: string;
  category_id: string;
  price: number;
  condition: string;
  town: string | null;
  negotiable: boolean;
};
type ExistingImage = { id: string; storage_path: string; alt_text: string | null };

async function compress(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose image files only.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Each image must be 8 MB or smaller.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image processing failed")), "image/webp", .82));
}

export function ProductForm({
  categories,
  product,
  images = [],
}: {
  categories: { id: string; name: string }[];
  product?: ExistingProduct;
  images?: ExistingImage[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keptImages = images.filter(image => !removedImages.includes(image.id));
    if (keptImages.length + files.length > 8) {
      setError("A listing can have up to 8 photos. Remove a current photo or choose fewer new ones.");
      return;
    }
    setBusy(true);
    setError("");
    const uploadedPaths: string[] = [];
    const insertedImageIds: string[] = [];

    try {
      const form = new FormData(event.currentTarget);
      const body = {
        ...(product ? { id: product.id } : {}),
        title: String(form.get("title")),
        description: String(form.get("description")),
        category_id: String(form.get("category_id")),
        price: Number(form.get("price")),
        condition: String(form.get("condition")),
        town: String(form.get("town") || "") || null,
        negotiable: form.get("negotiable") === "yes",
      };
      const response = await fetch("/api/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save this listing.");

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session expired. Please sign in again.");

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const blob = await compress(file);
        const path = `${user.id}/${result.id}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/webp", upsert: false });
        if (uploadError) throw new Error("A photo could not be uploaded. Check the storage setup and retry.");
        uploadedPaths.push(path);
        const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
        const { data: inserted, error: imageError } = await supabase.from("product_images").insert({
          product_id: result.id,
          storage_path: publicUrl,
          alt_text: file.name.slice(0, 150),
          sort_order: keptImages.length + index,
        }).select("id").single();
        if (imageError || !inserted) throw new Error("Could not save photo details.");
        insertedImageIds.push(inserted.id);
      }

      if (removedImages.length) {
        const { error: deleteError } = await supabase.from("product_images").delete().in("id", removedImages);
        if (deleteError) throw new Error("Listing saved, but a removed photo could not be updated. Please retry.");
        const removedPaths = images.filter(image => removedImages.includes(image.id)).map(image => {
          const marker = "/storage/v1/object/public/product-images/";
          const path = image.storage_path.split(marker)[1];
          return path ? decodeURIComponent(path) : null;
        }).filter((path): path is string => Boolean(path));
        if (removedPaths.length) await supabase.storage.from("product-images").remove(removedPaths);
      }

      const notice = result.status === "active" ? "Your listing is live" : result.status === "pending_review" ? "Your listing is queued for review" : "Your listing was updated";
      router.push(`/account?success=${encodeURIComponent(product && result.status === "pending_review" ? "Changes saved. Your listing is queued for review." : notice)}`);
      router.refresh();
    } catch (submitError) {
      const supabase = createClient();
      if (insertedImageIds.length) await supabase.from("product_images").delete().in("id", insertedImageIds);
      if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
      setError(submitError instanceof Error ? submitError.message : "Could not save listing.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 24, display: "grid", gap: 17, marginTop: 22 }}>
      <label style={{ fontSize: 13, fontWeight: 700 }}>Listing title
        <input name="title" required minLength={4} maxLength={120} className="field" defaultValue={product?.title} placeholder="e.g. HP EliteBook 840 G5 — 8GB RAM" style={{ marginTop: 6 }} />
      </label>
      <div className="form-two-column" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
        <label style={{ fontSize: 13, fontWeight: 700 }}>Category
          <select className="field" name="category_id" required defaultValue={product?.category_id || ""} style={{ marginTop: 6 }}>
            <option value="" disabled>Select category</option>
            {categories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 13, fontWeight: 700 }}>Condition
          <select className="field" name="condition" defaultValue={product?.condition || "good"} style={{ marginTop: 6 }}>
            {[["new", "New"], ["like_new", "Like new"], ["good", "Good"], ["fair", "Fair"], ["refurbished", "Refurbished"]].map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <label style={{ fontSize: 13, fontWeight: 700 }}>Description
        <textarea className="field" name="description" required minLength={10} maxLength={5000} rows={6} defaultValue={product?.description} placeholder="Share details, what's included, and any wear or faults..." style={{ marginTop: 6, resize: "vertical" }} />
      </label>
      <div className="form-two-column" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
        <label style={{ fontSize: 13, fontWeight: 700 }}>Price (KSh)
          <input className="field" type="number" min="0" step="1" name="price" required defaultValue={product?.price} style={{ marginTop: 6 }} />
        </label>
        <label style={{ fontSize: 13, fontWeight: 700 }}>Town / campus
          <input className="field" name="town" maxLength={100} defaultValue={product?.town || ""} placeholder="e.g. Juja, Kiambu" style={{ marginTop: 6 }} />
        </label>
      </div>
      <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" name="negotiable" value="yes" defaultChecked={product?.negotiable} /> Price is negotiable</label>

      {images.length > 0 && <fieldset className="edit-product-images">
        <legend>Current photos</legend>
        <div>{images.map(image => {
          const removed = removedImages.includes(image.id);
          return <div className={`edit-product-image${removed ? " removed" : ""}`} key={image.id}>
            <Image src={image.storage_path} alt={image.alt_text || product?.title || "Listing photo"} width={150} height={110} />
            <button type="button" onClick={() => setRemovedImages(current => removed ? current.filter(id => id !== image.id) : [...current, image.id])}>{removed ? "Keep photo" : "Remove"}</button>
          </div>;
        })}</div>
      </fieldset>}

      <label style={{ fontSize: 13, fontWeight: 700 }}>Add photos <span className="muted" style={{ fontWeight: 400 }}>Up to 8 total, max 8 MB each</span>
        <input className="field" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => setFiles(Array.from(event.target.files || []))} style={{ marginTop: 7 }} />
      </label>
      {files.length > 0 && <div className="muted" style={{ fontSize: 12 }}>{files.length} photo{files.length === 1 ? "" : "s"} selected: {files.map(file => file.name).join(", ")}</div>}
      <div className="muted" style={{ fontSize: 12 }}>{product ? "Changes to a live listing may be sent for review. Photos are resized and compressed before upload." : "Listings are reviewed before they appear publicly. Photos are resized and compressed in your browser before upload."}</div>
      {error && <div role="alert" style={{ color: "#92352f", fontSize: 13 }}>{error}</div>}
      <button disabled={busy} className="btn btn-primary" style={{ justifySelf: "start", minWidth: 180 }}>{busy ? "Saving listing…" : product ? "Save changes" : "Submit for review"}</button>
    </form>
  );
}
