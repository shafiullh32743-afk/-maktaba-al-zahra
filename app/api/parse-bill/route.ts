import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROMPT = `You are reading a purchase invoice/bill from a book supplier (Pakistan). The text may be Urdu, Arabic or English, printed or handwritten.
Extract every purchased book line. Return ONLY valid JSON, no explanation, in exactly this shape:
{"supplier_name":"","invoice_no":"","invoice_date":"","bill_total":0,"items":[{"title":"","author":"","quantity":0,"unit_price":0}]}
Rules:
- Keep book titles and author names exactly in the original language/script as written. Do not translate.
- quantity: whole number of copies purchased. unit_price: purchase rate PER COPY in rupees. If only a line total is shown, divide it by quantity.
- If the author is not written on the bill, use an empty string.
- Use Western digits (0-9) for all numbers. Do not include currency symbols.
- Skip rows that are not books (totals, discount, freight, previous balance, headings).
- If a value is unreadable, use 0 or "".`;

export async function POST(request: Request) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    if (!geminiKey && !claudeKey) {
      return NextResponse.json({ ok: false, error: "key_missing" }, { status: 500 });
    }
    const body = await request.json();
    const mediaType = String(body?.mediaType || "");
    const data = String(body?.data || "");
    if (!data) return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });

    const isPdf = mediaType === "application/pdf";
    const okImage = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mediaType);
    if (!isPdf && !okImage) return NextResponse.json({ ok: false, error: "bad_type" }, { status: 400 });

    let text = "";

    if (geminiKey) {
      // گوگل جیمنی (مفت سطح، کارڈ کے بغیر)
      const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: mediaType, data } }, { text: PROMPT }] }],
          generationConfig: { temperature: 0, responseMimeType: "application/json" },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        return NextResponse.json({ ok: false, error: "ai_failed", detail: t.slice(0, 300) }, { status: 502 });
      }
      const json = await res.json();
      text = (json?.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("");
    } else {
      const fileBlock = isPdf
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
        : { type: "image", source: { type: "base64", media_type: mediaType, data } };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": claudeKey as string, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
          max_tokens: 6000,
          messages: [{ role: "user", content: [fileBlock, { type: "text", text: PROMPT }] }],
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        return NextResponse.json({ ok: false, error: "ai_failed", detail: t.slice(0, 300) }, { status: 502 });
      }
      const json = await res.json();
      text = (json?.content || []).map((c: { text?: string }) => c.text || "").join("");
    }

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < 0) return NextResponse.json({ ok: false, error: "parse_failed" }, { status: 502 });

    const parsed = JSON.parse(text.slice(start, end + 1));
    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .map((it: Record<string, unknown>) => ({
        title: String(it.title ?? "").trim(),
        author: String(it.author ?? "").trim(),
        quantity: Math.max(0, Math.round(Number(it.quantity) || 0)),
        unit_price: Math.max(0, Number(it.unit_price) || 0),
      }))
      .filter((it: { title: string }) => it.title);

    return NextResponse.json({
      ok: true,
      supplier_name: String(parsed.supplier_name ?? ""),
      invoice_no: String(parsed.invoice_no ?? ""),
      bill_total: Number(parsed.bill_total) || 0,
      items,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}