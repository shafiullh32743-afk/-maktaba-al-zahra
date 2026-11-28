import { ImageResponse } from "next/og";
import { supabase } from "@/lib/supabaseClient";
import { effectivePrice, isOnSale, salePercent } from "@/lib/sale";

// فیس بک / واٹس ایپ کے لیے کتاب کی شیئر تصویر (1200×630): پوری سرورق تصویر، صاف اور بغیر کٹے
// پتہ: /api/og?id=کتاب_کا_نمبر
export const revalidate = 86400;

const W = 1200;
const H = 630;

async function coverDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/jpeg";
    if (!/png|jpe?g|gif/i.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  let book: any = null;
  if (Number.isFinite(id) && id > 0) {
    const { data } = await supabase.from("books_public").select("*").eq("id", id).limit(1);
    book = data && data[0] ? data[0] : null;
  }

  const cover = book?.image_url ? await coverDataUri(book.image_url) : null;
  const price = book && Number(book.price) > 0 ? Number(book.price) : 0;
  const sale = book ? isOnSale(book) : false;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a2f2c 0%, #0f5750 60%, #14706a 100%)",
          color: "#ffffff",
          padding: "0 70px",
        }}
      >
        {/* سرورق: پوری تصویر، contain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 430,
            height: 560,
            background: "#f6f1e3",
            borderRadius: 26,
            padding: 16,
            boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          }}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} width={398} height={528} style={{ objectFit: "contain" }} alt="" />
          ) : (
            <div style={{ display: "flex", fontSize: 64, color: "#0f5750", fontWeight: 800 }}>BOOK</div>
          )}
        </div>

        {/* دائیں طرف معلومات (لاطینی حروف، تاکہ ہر جگہ درست نظر آئے) */}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 70, flex: 1 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#e6c878", fontWeight: 700 }}>
            MAKTABA AL-ZAHRA
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#bfe3dc", marginTop: 8 }}>Islamic Books • Faisalabad</div>
          <div style={{ display: "flex", width: 90, height: 5, background: "#e6c878", borderRadius: 3, marginTop: 28, marginBottom: 28 }} />

          {price > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {sale && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", background: "#e11d48", color: "#fff", fontSize: 30, fontWeight: 800, padding: "6px 20px", borderRadius: 999 }}>
                    {`-${salePercent(book)}% OFF`}
                  </div>
                  <div style={{ display: "flex", fontSize: 30, color: "#9fc9c1", marginLeft: 18, textDecoration: "line-through" }}>
                    {`Rs ${price.toLocaleString("en-US")}`}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", fontSize: 92, fontWeight: 800, marginTop: sale ? 10 : 0, color: sale ? "#fde68a" : "#ffffff" }}>
                {`Rs ${(sale ? effectivePrice(book) : price).toLocaleString("en-US")}`}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", marginTop: 34, fontSize: 28, color: "#d7efe9" }}>
            <div style={{ display: "flex" }}>Delivery all over Pakistan</div>
            <div style={{ display: "flex", marginTop: 10 }}>WhatsApp: 0305 5232889</div>
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 22, color: "#9fc9c1" }}>maktaba-al-zahra-books.vercel.app</div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800" },
    }
  );
}