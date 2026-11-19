"use client";

import { useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface BookLite {
  id: number;
  title: string;
  author?: string;
  price?: number;
  stock?: number;
  cost_price?: number | null;
}
interface LinkLite {
  supplier_id: number | string;
  book_id: number;
}
interface Row {
  title: string;
  author: string;
  qty: string;
  cost: string;
  sale: string;
  bookId: number | null;
  matchTitle: string;
}

// نام ملانے کے لیے صفائی: اعراب، فاصلے، علامات ہٹائیں اور ملتے جلتے حروف یکساں کریں
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[ً-ٰٟۖ-ۭ]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۃة]/g, "ہ")
    .replace(/ۂ/g, "ہ")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[\s\u200c\u200d.,،؛؟!"'()\[\]\-_/\\:;]/g, "");
}

function bigrams(s: string) {
  const out = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    out.set(g, (out.get(g) || 0) + 1);
  }
  return out;
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  A.forEach((v, k) => {
    inter += Math.min(v, B.get(k) || 0);
  });
  return (2 * inter) / (a.length - 1 + (b.length - 1));
}

function findMatch(title: string, books: BookLite[]) {
  const n = normalize(title);
  let best: BookLite | null = null;
  let score = 0;
  for (const b of books) {
    const s = similarity(n, normalize(b.title));
    if (s > score) {
      score = s;
      best = b;
    }
  }
  return best && score >= 0.85 ? best : null;
}

// تصویر چھوٹی کریں تاکہ اپلوڈ تیز ہو
function compressImage(file: File, maxSide = 1800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("img"));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("ctx"));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
}

export default function BillUpload({
  supplier,
  allBooks,
  links,
  onClose,
  onDone,
}: {
  supplier: { id: number | string; name: string };
  allBooks: BookLite[];
  links: LinkLite[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<"pick" | "reading" | "review" | "saving" | "done">("pick");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [billNo, setBillNo] = useState("");
  const [billTotal, setBillTotal] = useState(0);
  const [result, setResult] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    setStage("reading");
    try {
      let mediaType = file.type;
      let data: string;
      if (file.type === "application/pdf") {
        if (file.size > 3 * 1024 * 1024) throw new Error("PDF بڑی ہے (3MB سے کم ہو)۔ بل کی تصویر کھینچ کر اپلوڈ کریں۔");
        data = await fileToBase64(file);
      } else if (file.type.startsWith("image/")) {
        data = await compressImage(file);
        mediaType = "image/jpeg";
      } else {
        throw new Error("صرف تصویر یا PDF اپلوڈ کریں");
      }

      const res = await fetch("/api/parse-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType, data }),
      });
      let json: { ok?: boolean; error?: string; items?: { title: string; author: string; quantity: number; unit_price: number }[]; invoice_no?: string; bill_total?: number } = {};
      try {
        json = await res.json();
      } catch {
        throw new Error("سرور سے جواب نہیں ملا۔ دوبارہ کوشش کریں");
      }
      if (!json.ok) {
        if (json.error === "key_missing") throw new Error("AI کی چابی (GEMINI_API_KEY) شامل نہیں ہوئی۔ ہدایات کے مطابق چابی Vercel اور .env.local میں ڈالیں۔");
        throw new Error("بل پڑھا نہیں جا سکا۔ صاف تصویر کے ساتھ دوبارہ کوشش کریں");
      }
      const items = json.items || [];
      if (items.length === 0) throw new Error("بل میں کوئی کتاب نہیں ملی");

      setRows(
        items.map((it) => {
          const m = findMatch(it.title, allBooks);
          return {
            title: it.title,
            author: it.author || m?.author || "",
            qty: String(it.quantity || 1),
            cost: it.unit_price ? String(it.unit_price) : "",
            sale: "",
            bookId: m ? m.id : null,
            matchTitle: m ? m.title : "",
          };
        })
      );
      setBillNo(json.invoice_no || "");
      setBillTotal(Number(json.bill_total) || 0);
      setStage("review");
    } catch (e) {
      setError((e as Error).message);
      setStage("pick");
    }
  };

  const upd = (i: number, patch: Partial<Row>) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const total = rows.reduce((s, r) => s + (parseInt(r.qty) || 0) * (parseFloat(r.cost) || 0), 0);
  const validRows = rows.filter((r) => r.title.trim() && (parseInt(r.qty) || 0) > 0);

  const save = async () => {
    if (validRows.length === 0) {
      setError("کم از کم ایک کتاب کی تعداد لکھیں");
      return;
    }
    setStage("saving");
    setError("");
    let added = 0;
    let created = 0;
    try {
      const orderItems: { book_id: number; title: string; author: string | null; quantity: number; received_qty: number; unit_price: number | null }[] = [];

      for (const r of validRows) {
        const qty = parseInt(r.qty) || 0;
        const cost = parseFloat(r.cost) || 0;
        let bookId = r.bookId;

        if (bookId !== null) {
          const { data: row, error: rErr } = await supabase.from("books").select("stock").eq("id", bookId).single();
          if (rErr || !row) throw new Error(rErr?.message || "کتاب نہیں ملی: " + r.title);
          const patch: Record<string, number | string> = { stock: (Number(row.stock) || 0) + qty };
          if (cost > 0) patch.cost_price = cost;
          const { error: uErr } = await supabase.from("books").update(patch).eq("id", bookId);
          if (uErr) throw new Error(uErr.message);
          added++;
        } else {
          const { data: createdBook, error: cErr } = await supabase
            .from("books")
            .insert({
              title: r.title.trim(),
              author: r.author.trim() || "مكتبہ الزھراء",
              category: "عمومی",
              language: "اردو",
              price: parseFloat(r.sale) || 0,
              weight: 1,
              stock: qty,
              cost_price: cost,
            })
            .select("id")
            .single();
          if (cErr || !createdBook) throw new Error(cErr?.message || "کتاب نہیں بن سکی: " + r.title);
          bookId = createdBook.id as number;
          created++;
        }

        // اس سپلائر کی فہرست میں خرید قیمت کے ساتھ جوڑیں
        const hasLink = links.some((l) => String(l.supplier_id) === String(supplier.id) && l.book_id === bookId);
        if (hasLink) {
          if (cost > 0) {
            await supabase.from("supplier_books").update({ cost_price: cost }).eq("supplier_id", supplier.id).eq("book_id", bookId);
          }
        } else {
          await supabase.from("supplier_books").insert({ supplier_id: supplier.id, book_id: bookId, cost_price: cost > 0 ? cost : null });
        }

        orderItems.push({
          book_id: bookId as number,
          title: r.title.trim(),
          author: r.author.trim() || null,
          quantity: qty,
          received_qty: qty,
          unit_price: cost > 0 ? cost : null,
        });
      }

      // سپلائر کے حساب کے لیے موصول شدہ بل کا ریکارڈ
      const d = new Date();
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      const orderNo = billNo.trim() ? `BILL-${billNo.trim()}` : `BILL-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: order, error: oErr } = await supabase
        .from("supplier_orders")
        .insert({
          order_no: orderNo,
          supplier_id: supplier.id,
          status: "received",
          received_at: new Date().toISOString(),
          total_amount: total,
        })
        .select("id")
        .single();
      if (oErr || !order) throw new Error(oErr?.message || "بل کا ریکارڈ نہیں بن سکا");
      const { error: iErr } = await supabase.from("supplier_order_items").insert(orderItems.map((it) => ({ ...it, order_id: order.id })));
      if (iErr) throw new Error(iErr.message);

      setResult(`✅ ${added} موجود کتابوں کا سٹاک بڑھ گیا، ${created} نئی کتابیں بن گئیں۔ سپلائر کے حساب میں Rs ${Math.round(total).toLocaleString()} شامل ہوئے۔`);
      setStage("done");
      onDone();
    } catch (e) {
      setError("محفوظ کرتے ہوئے مسئلہ آیا: " + (e as Error).message + " — جو کتابیں پہلے محفوظ ہو چکیں ان کا سٹاک دوبارہ نہ بڑھائیں، بتا دیں۔");
      setStage("review");
    }
  };

  const inputCls = "w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3">
      <div dir="rtl" className="bg-white rounded-2xl border border-slate-200 p-5 w-full max-w-2xl shadow-xl relative max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} className="absolute left-4 top-4 text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
        <h3 className="text-base font-bold text-slate-800">📷 سپلائر کا بل اپلوڈ کریں</h3>
        <p className="text-xs text-slate-400 mt-0.5 mb-4">{supplier.name}</p>

        {error && <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">{error}</div>}

        {stage === "pick" && (
          <div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              بل کی صاف تصویر کھینچیں یا PDF چنیں۔ سسٹم خود کتابوں کے نام، مصنف، تعداد اور خرید قیمت پڑھے گا۔ آپ صرف جانچ کر محفوظ کریں گے۔
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 py-10 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
            >
              📷 بل کی تصویر / PDF چنیں
            </button>
          </div>
        )}

        {stage === "reading" && (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-slate-600 animate-pulse">بل پڑھا جا رہا ہے... (10–30 سیکنڈ)</p>
          </div>
        )}

        {(stage === "review" || stage === "saving") && (
          <div>
            <p className="text-xs text-slate-500 mb-2">
              {rows.length} کتابیں ملیں۔ غلطی ہو تو خانے میں ٹھیک کریں۔ <b className="text-emerald-700">✅ موجود</b> کتاب کا سٹاک بڑھے گا، <b className="text-sky-700">🆕 نئی</b> کتاب خود بنے گی۔
            </p>
            <div className="space-y-2.5">
              {rows.map((r, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <input className={inputCls} value={r.title} onChange={(e) => upd(i, { title: e.target.value })} placeholder="کتاب کا نام" />
                    <button onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))} className="text-rose-500 shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                    {r.bookId !== null ? (
                      <span className="text-emerald-700 truncate">✅ موجود: {r.matchTitle}</span>
                    ) : (
                      <span className="text-sky-700">🆕 نئی کتاب بنے گی</span>
                    )}
                    {r.bookId !== null ? (
                      <button onClick={() => upd(i, { bookId: null })} className="shrink-0 text-slate-500 underline">
                        یہ نئی کتاب ہے
                      </button>
                    ) : (
                      (() => {
                        const m = findMatch(r.title, allBooks);
                        return m ? (
                          <button onClick={() => upd(i, { bookId: m.id, matchTitle: m.title })} className="shrink-0 text-slate-500 underline">
                            موجود کتاب سے ملائیں
                          </button>
                        ) : null;
                      })()
                    )}
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input className={inputCls} value={r.author} onChange={(e) => upd(i, { author: e.target.value })} placeholder="مصنف" />
                    <input className={inputCls} type="number" min={0} value={r.qty} onChange={(e) => upd(i, { qty: e.target.value })} placeholder="تعداد" />
                    <input className={inputCls} type="number" min={0} value={r.cost} onChange={(e) => upd(i, { cost: e.target.value })} placeholder="خرید قیمت" />
                    {r.bookId === null ? (
                      <input className={inputCls} type="number" min={0} value={r.sale} onChange={(e) => upd(i, { sale: e.target.value })} placeholder="فروخت قیمت" />
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs flex justify-between">
              <span>کل خرید (آپ کی درج رقم)</span>
              <b>Rs {Math.round(total).toLocaleString()}</b>
            </div>
            {billTotal > 0 && Math.abs(billTotal - total) > 1 && (
              <p className="mt-1.5 text-[11px] text-amber-700">⚠️ بل پر کل رقم {Math.round(billTotal).toLocaleString()} لکھی ہے، جو اوپر کی رقم سے مختلف ہے۔ تعداد اور قیمتیں ایک بار جانچ لیں۔</p>
            )}

            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={onClose} className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium">
                منسوخ
              </button>
              <button
                onClick={save}
                disabled={stage === "saving"}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {stage === "saving" ? "محفوظ ہو رہا ہے..." : "✅ محفوظ کریں اور سٹاک میں شامل کریں"}
              </button>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-emerald-700 leading-relaxed">{result}</p>
            <button onClick={onClose} className="mt-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold px-5 py-2">
              ٹھیک ہے
            </button>
          </div>
        )}
      </div>
    </div>
  );
}