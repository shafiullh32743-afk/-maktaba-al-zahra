import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { effectivePrice, isOnSale } from "@/lib/sale";
import { SITE_URL } from "@/lib/social";

// فیس بک / انسٹاگرام شاپ (Meta Commerce Manager) کے لیے کتابوں کی فہرست (CSV)
// پتہ: https://آپ-کی-سائٹ/api/facebook-feed
export const revalidate = 3600; // ہر گھنٹے بعد تازہ

const esc = (v: unknown) => {
  const s = String(v ?? "").replace(/\r?\n/g, " ").trim();
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const money = (n: number) => `${n.toFixed(2)} PKR`;

export async function GET() {
  const { data, error } = await supabase.from("books_public").select("*").limit(5000);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const head = ["id", "title", "description", "availability", "condition", "price", "sale_price", "link", "image_link", "brand"];
  const rows: string[] = [head.join(",")];

  for (const b of data || []) {
    const price = Number(b.price) || 0;
    if (!b.title || price <= 0 || !b.image_url) continue; // میٹا کو تصویر اور قیمت لازمی چاہییں
    const link = `${SITE_URL}/books/${b.slug || encodeURIComponent(b.title)}`;
    const desc = (b.description && String(b.description).trim()) || `${b.title}${b.author ? " — " + b.author : ""}`;
    const inStock = (Number(b.stock) || 0) > 0;
    rows.push(
      [
        b.id,
        b.title,
        desc.slice(0, 4900),
        inStock ? "in stock" : "out of stock",
        "new",
        money(price),
        isOnSale(b) ? money(effectivePrice(b)) : "",
        link,
        b.image_url,
        b.author || "Maktaba Al-Zahra",
      ]
        .map(esc)
        .join(",")
    );
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}