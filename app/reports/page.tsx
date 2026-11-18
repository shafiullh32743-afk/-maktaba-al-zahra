"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface OrderRow {
  book_title: string;
  book_price: number;
  cost_price: number;
  quantity: number;
  created_at: string;
}
interface InvoiceRow {
  id: number;
  subtotal: number;
  total_amount: number;
  created_at: string;
}
interface InvoiceItemRow {
  invoice_id: number;
  book_id: number | null;
  item_title?: string | null;
  quantity: number;
  total_price: number;
}
interface BookRow {
  id: number;
  title: string;
  author?: string | null;
  cost_price?: number | null;
}
interface ExpenseRow {
  id: number;
  title: string;
  amount: number;
  expense_date: string;
}
interface SupplierRow {
  id: string | number;
  name: string;
}
interface LinkRow {
  supplier_id: string | number;
  book_id: number;
}
interface Agg {
  key: string;
  qty: number;
  revenue: number;
  cost: number;
}

const monthNamesUr = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

function escapeHtml(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// سپابیس کی 1000 قطاروں کی حد سے بچنے کے لیے صفحہ در صفحہ پڑھیں
async function fetchAll<T>(table: string, select: string): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + size - 1);
    if (error || !data) break;
    out.push(...(data as unknown as T[]));
    if (data.length < size) break;
  }
  return out;
}

const reportFontLink = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" />`;
const reportStyles = `
  body { font-family: "Noto Naskh Arabic", Arial, sans-serif; margin: 0; padding: 16px; color: #111827; background: #ffffff; direction: rtl; }
  .sheet { max-width: 700px; margin: 0 auto; padding: 18px; font-size: 14px; }
  .header { text-align: center; border-bottom: 1px dashed #94a3b8; padding-bottom: 10px; margin-bottom: 10px; }
  .header img { height: 70px; width: auto; display: block; margin: 0 auto 6px; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 3px 0; font-size: 12px; color: #374151; }
  .title { text-align: center; font-size: 18px; font-weight: 700; margin: 8px 0 12px; }
  h3 { font-size: 15px; margin: 16px 0 6px; border-bottom: 1px solid #6b7280; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { border-bottom: 1px solid #6b7280; padding: 5px 4px; text-align: right; }
  td { padding: 5px 4px; border-bottom: 1px dotted #cbd5e1; text-align: right; vertical-align: top; }
  .num { text-align: left; direction: ltr; white-space: nowrap; }
  .sum td { font-size: 14px; }
  .sum .big td { font-weight: 700; font-size: 16px; border-top: 1px solid #6b7280; border-bottom: 1px solid #6b7280; }
  .foot { text-align: center; margin-top: 18px; font-size: 10px; color: #6b7280; border-top: 1px dashed #cbd5e1; padding-top: 6px; }
`;

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [allTime, setAllTime] = useState(false);
  const [tab, setTab] = useState<"books" | "authors" | "suppliers">("books");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [items, setItems] = useState<InvoiceItemRow[]>([]);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [o, inv, it, b, e, s, l] = await Promise.all([
          fetchAll<OrderRow>("orders", "book_title, book_price, cost_price, quantity, created_at"),
          fetchAll<InvoiceRow>("invoices", "id, subtotal, total_amount, created_at"),
          fetchAll<InvoiceItemRow>("invoice_items", "invoice_id, book_id, item_title, quantity, total_price"),
          fetchAll<BookRow>("books", "id, title, author, cost_price"),
          fetchAll<ExpenseRow>("expenses", "id, title, amount, expense_date"),
          fetchAll<SupplierRow>("suppliers", "id, name"),
          fetchAll<LinkRow>("supplier_books", "supplier_id, book_id"),
        ]);
        setOrders(o);
        setInvoices(inv);
        setItems(it);
        setBooks(b);
        setExpenses(e);
        setSuppliers(s);
        setLinks(l);
      } catch {
        setError("ڈیٹا لوڈ نہیں ہو سکا");
      }
      setLoaded(true);
    })();
  }, []);

  const periodLabel = allTime
    ? "سارا ریکارڈ"
    : (() => {
        const [y, m] = month.split("-").map((x) => parseInt(x));
        return `${monthNamesUr[(m || 1) - 1]} ${y}`;
      })();

  const data = useMemo(() => {
    const inRange = (dateStr: string) => {
      if (allTime) return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === month;
    };

    const bookById = new Map<number, BookRow>();
    const bookByTitle = new Map<string, BookRow>();
    books.forEach((b) => {
      bookById.set(b.id, b);
      if (!bookByTitle.has(b.title)) bookByTitle.set(b.title, b);
    });
    const supplierName = new Map<string, string>();
    suppliers.forEach((s) => supplierName.set(String(s.id), s.name));
    const supplierOfBook = new Map<number, string>();
    links.forEach((l) => {
      if (!supplierOfBook.has(l.book_id)) supplierOfBook.set(l.book_id, supplierName.get(String(l.supplier_id)) || "نامعلوم سپلائر");
    });

    const bookAgg = new Map<string, Agg>();
    const add = (title: string, qty: number, revenue: number, cost: number) => {
      const key = title || "نامعلوم کتاب";
      const cur = bookAgg.get(key) || { key, qty: 0, revenue: 0, cost: 0 };
      cur.qty += qty;
      cur.revenue += revenue;
      cur.cost += cost;
      bookAgg.set(key, cur);
    };

    let revenue = 0;
    let cost = 0;
    let orderCount = 0;
    let invoiceCount = 0;

    orders.filter((o) => inRange(o.created_at)).forEach((o) => {
      const rev = Number(o.book_price) || 0;
      const c = Number(o.cost_price) || 0;
      revenue += rev;
      cost += c;
      orderCount++;
      add(o.book_title, Number(o.quantity) || 0, rev, c);
    });

    const itemsByInvoice = new Map<number, InvoiceItemRow[]>();
    items.forEach((it) => {
      const arr = itemsByInvoice.get(it.invoice_id) || [];
      arr.push(it);
      itemsByInvoice.set(it.invoice_id, arr);
    });
    invoices.filter((inv) => inRange(inv.created_at)).forEach((inv) => {
      invoiceCount++;
      revenue += Number(inv.total_amount) || 0;
      const subtotal = Number(inv.subtotal) || 0;
      const factor = subtotal > 0 ? (Number(inv.total_amount) || 0) / subtotal : 1;
      (itemsByInvoice.get(inv.id) || []).forEach((it) => {
        const book = it.book_id !== null ? bookById.get(it.book_id) : undefined;
        const title = book?.title || it.item_title || "نامعلوم کتاب";
        const itemCost = (Number(it.quantity) || 0) * (Number(book?.cost_price) || 0);
        cost += itemCost;
        add(title, Number(it.quantity) || 0, (Number(it.total_price) || 0) * factor, itemCost);
      });
    });

    const monthExpenses = expenses.filter((e) => inRange(e.expense_date));
    const expenseTotal = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const authorAgg = new Map<string, Agg>();
    const supplierAgg = new Map<string, Agg>();
    bookAgg.forEach((a) => {
      const book = bookByTitle.get(a.key);
      const author = (book?.author || "نامعلوم").trim() || "نامعلوم";
      const sup = (book && supplierOfBook.get(book.id)) || "بغیر سپلائر";
      [
        [authorAgg, author],
        [supplierAgg, sup],
      ].forEach(([map, key]) => {
        const m = map as Map<string, Agg>;
        const k = key as string;
        const cur = m.get(k) || { key: k, qty: 0, revenue: 0, cost: 0 };
        cur.qty += a.qty;
        cur.revenue += a.revenue;
        cur.cost += a.cost;
        m.set(k, cur);
      });
    });

    const sortByProfit = (m: Map<string, Agg>) =>
      Array.from(m.values()).sort((x, y) => y.revenue - y.cost - (x.revenue - x.cost));

    return {
      revenue,
      cost,
      expenseTotal,
      gross: revenue - cost,
      net: revenue - cost - expenseTotal,
      orderCount,
      invoiceCount,
      books: sortByProfit(bookAgg),
      authors: sortByProfit(authorAgg),
      suppliers: sortByProfit(supplierAgg),
      expenses: [...monthExpenses].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)),
    };
  }, [orders, invoices, items, books, expenses, suppliers, links, month, allTime]);

  const rowsFor = tab === "books" ? data.books : tab === "authors" ? data.authors : data.suppliers;

  const buildTable = (title: string, label: string, rows: Agg[], limit: number) => {
    const shown = rows.slice(0, limit);
    return `
      <h3>${title}</h3>
      <table>
        <thead><tr><th>${label}</th><th class="num">تعداد</th><th class="num">فروخت</th><th class="num">نفع</th></tr></thead>
        <tbody>
          ${shown
            .map(
              (r) =>
                `<tr><td>${escapeHtml(r.key)}</td><td class="num">${fmt(r.qty)}</td><td class="num">${fmt(r.revenue)}</td><td class="num">${fmt(r.revenue - r.cost)}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  };

  const buildReportInner = () => `
    <div class="sheet">
      <div class="header">
        <img src="${window.location.origin}/logo.jpg" alt="logo" />
        <h1>مكتبۃ الزھراء</h1>
        <p>نزد جامعہ الحسنین، فیصل آباد — 0305-5232889</p>
      </div>
      <div class="title">رپورٹ — ${escapeHtml(periodLabel)}</div>
      <table class="sum">
        <tr><td>کل فروخت</td><td class="num">Rs ${fmt(data.revenue)}</td></tr>
        <tr><td>کتابوں کی لاگت</td><td class="num">Rs ${fmt(data.cost)}</td></tr>
        <tr><td>مجموعی نفع</td><td class="num">Rs ${fmt(data.gross)}</td></tr>
        <tr><td>اخراجات</td><td class="num">Rs ${fmt(data.expenseTotal)}</td></tr>
        <tr class="big"><td>خالص نفع</td><td class="num">Rs ${fmt(data.net)}</td></tr>
        <tr><td>آن لائن آرڈرز / بل</td><td class="num">${data.orderCount} / ${data.invoiceCount}</td></tr>
      </table>
      ${buildTable("سب سے زیادہ نفع والی کتب (10)", "کتاب", data.books, 10)}
      ${buildTable("مصنفین کے لحاظ سے", "مصنف", data.authors, 10)}
      ${buildTable("سپلائرز کے لحاظ سے", "سپلائر", data.suppliers, 10)}
      ${
        data.expenses.length > 0
          ? `<h3>اخراجات (بڑے 15)</h3><table><tbody>${data.expenses
              .slice(0, 15)
              .map((e) => `<tr><td>${escapeHtml(e.title || "")}</td><td class="num">Rs ${fmt(Number(e.amount) || 0)}</td></tr>`)
              .join("")}</tbody></table>`
          : ""
      }
      <div class="foot">(Computer Software developed by Maktaba Al-Zahra)</div>
    </div>`;

  const printReport = () => {
    const html = `<html dir="rtl" lang="ur"><head><meta charset="UTF-8" /><title>Report ${escapeHtml(periodLabel)}</title>${reportFontLink}<style>${reportStyles}</style></head><body>${buildReportInner()}<script>window.onload=function(){var r=(document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve();r.then(function(){setTimeout(function(){window.focus();window.print();},200);});};</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  const shareReportPdf = async () => {
    setPdfBusy(true);
    let frame: HTMLIFrameElement | null = null;
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      frame = document.createElement("iframe");
      frame.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1400px;border:0;visibility:hidden;";
      document.body.appendChild(frame);
      const doc = frame.contentDocument;
      if (!doc) throw new Error("no iframe document");
      doc.open();
      doc.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8" />${reportFontLink}<style>${reportStyles}</style></head><body>${buildReportInner()}</body></html>`);
      doc.close();
      await Promise.all(
        Array.from(doc.images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) resolve();
              else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      );
      try {
        await doc.fonts.ready;
        await new Promise((r) => setTimeout(r, 300));
      } catch {}

      const canvas = await html2canvas(doc.body, { scale: 2.2, backgroundColor: "#ffffff", useCORS: true });
      const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const imgW = pageW - margin * 2;
      const ratio = imgW / canvas.width;
      const sliceH = Math.floor((pageH - margin * 2) / ratio);
      for (let y = 0, page = 0; y < canvas.height; y += sliceH, page++) {
        const part = document.createElement("canvas");
        part.width = canvas.width;
        part.height = Math.min(sliceH, canvas.height - y);
        const ctx = part.getContext("2d");
        if (!ctx) throw new Error("no canvas context");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, part.width, part.height);
        ctx.drawImage(canvas, 0, y, canvas.width, part.height, 0, 0, canvas.width, part.height);
        if (page > 0) pdf.addPage();
        pdf.addImage(part.toDataURL("image/jpeg", 0.85), "JPEG", margin, margin, imgW, part.height * ratio);
      }

      const fileName = `report-${allTime ? "all" : month}.pdf`;
      const blob = pdf.output("blob");
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `رپورٹ ${periodLabel}` });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") {
        alert("PDF نہیں بن سکی۔ براہِ کرم 'پرنٹ' کا بٹن استعمال کریں۔");
      }
    } finally {
      if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
      setPdfBusy(false);
    }
  };

  const cards = [
    { label: "کل فروخت", value: data.revenue, color: "text-slate-800" },
    { label: "کتابوں کی لاگت", value: data.cost, color: "text-slate-800" },
    { label: "اخراجات", value: data.expenseTotal, color: "text-slate-800" },
    { label: "خالص نفع", value: data.net, color: data.net >= 0 ? "text-emerald-600" : "text-rose-600" },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50/60 text-slate-800 font-sans">
      <header className="bg-emerald-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-base font-bold">📊 رپورٹس</h1>
          <Link href="/" className="text-xs rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 transition">
            ← ڈیش بورڈ
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="month"
            value={month}
            disabled={allTime}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-40"
          />
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={allTime} onChange={(e) => setAllTime(e.target.checked)} className="w-3.5 h-3.5 accent-emerald-600" />
            سارا ریکارڈ
          </label>
          <div className="flex gap-2 mr-auto">
            <button
              onClick={shareReportPdf}
              disabled={pdfBusy || !loaded}
              className="rounded-lg bg-slate-800 text-white px-3 py-2 text-xs font-semibold hover:bg-slate-900 transition disabled:opacity-40"
            >
              {pdfBusy ? "PDF بن رہی ہے..." : "PDF شیئر / ڈاؤنلوڈ"}
            </button>
            <button
              onClick={printReport}
              disabled={!loaded}
              className="rounded-lg border border-slate-300 bg-white text-slate-700 px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-40"
            >
              پرنٹ
            </button>
          </div>
        </div>

        {error && <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">{error}</div>}

        {!loaded ? (
          <div className="py-16 text-center text-xs text-slate-400">لوڈ ہو رہا ہے...</div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-2">
              {periodLabel} — {data.orderCount} آن لائن آرڈر لائنیں، {data.invoiceCount} بل
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {cards.map((c) => (
                <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <p className="text-[11px] text-slate-400">{c.label}</p>
                  <p className={`mt-1 text-base font-bold ${c.color}`} dir="ltr">
                    Rs {fmt(c.value)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-3 text-xs">
              {(
                [
                  ["books", "کتب کے لحاظ سے"],
                  ["authors", "مصنفین کے لحاظ سے"],
                  ["suppliers", "سپلائرز کے لحاظ سے"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`flex-1 py-2 rounded-lg font-semibold border transition ${
                    tab === k ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-x-auto">
              {rowsFor.length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-400">اس مدت میں کوئی فروخت نہیں</p>
              ) : (
                <table className="w-full text-xs min-w-[460px]">
                  <thead>
                    <tr className="text-slate-400 text-[11px] border-b border-slate-100">
                      <th className="text-right font-medium p-2.5">{tab === "books" ? "کتاب" : tab === "authors" ? "مصنف" : "سپلائر"}</th>
                      <th className="text-right font-medium p-2.5">تعداد</th>
                      <th className="text-right font-medium p-2.5">فروخت</th>
                      <th className="text-right font-medium p-2.5">لاگت</th>
                      <th className="text-right font-medium p-2.5">نفع</th>
                      <th className="text-right font-medium p-2.5">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rowsFor.map((r) => {
                      const profit = r.revenue - r.cost;
                      const margin = r.revenue > 0 ? (profit / r.revenue) * 100 : 0;
                      return (
                        <tr key={r.key}>
                          <td className="p-2.5 font-medium text-slate-800">{r.key}</td>
                          <td className="p-2.5 text-slate-600">{fmt(r.qty)}</td>
                          <td className="p-2.5 text-slate-600">{fmt(r.revenue)}</td>
                          <td className="p-2.5 text-slate-600">{fmt(r.cost)}</td>
                          <td className={`p-2.5 font-bold ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt(profit)}</td>
                          <td className="p-2.5 text-slate-500">{margin.toFixed(0)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              نفع = فروخت − کتاب کی خرید قیمت۔ بل کی رعایت (ڈسکاؤنٹ) فروخت میں سے تناسب سے گھٹائی گئی ہے۔ جس کتاب کی خرید قیمت درج نہیں اس کا نفع زیادہ دکھے گا۔
            </p>
          </>
        )}
      </section>
    </main>
  );
}