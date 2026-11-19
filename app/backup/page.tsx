"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const TABLES = [
  "books",
  "authors",
  "categories",
  "customers",
  "orders",
  "invoices",
  "invoice_items",
  "suppliers",
  "supplier_books",
  "supplier_orders",
  "supplier_order_items",
  "supplier_payments",
  "expenses",
  "reviews",
  "returns",
  "stock_alerts",
];

async function fetchAll(table: string) {
  const out: unknown[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + size - 1);
    if (error) return { rows: out, error: error.message };
    if (!data) break;
    out.push(...data);
    if (data.length < size) break;
  }
  return { rows: out, error: "" };
}

export default function BackupPage() {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [last, setLast] = useState("");

  useEffect(() => {
    try {
      setLast(localStorage.getItem("maktaba-last-backup") || "");
    } catch {}
  }, []);

  const daysAgo = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : null;

  const runBackup = async () => {
    setBusy(true);
    setLog([]);
    const result: Record<string, unknown[]> = {};
    const lines: string[] = [];
    for (const t of TABLES) {
      const { rows, error } = await fetchAll(t);
      if (error) {
        lines.push(`⚠️ ${t}: چھوڑ دیا (${error})`);
      } else {
        result[t] = rows;
        lines.push(`✅ ${t}: ${rows.length} ریکارڈ`);
      }
      setLog([...lines]);
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify({ created_at: new Date().toISOString(), tables: result }, null, 1)], {
      type: "application/json",
    });
    const fileName = `maktaba-backup-${stamp}.json`;
    const file = new File([blob], fileName, { type: "application/json" });
    try {
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      const now = new Date().toISOString();
      try {
        localStorage.setItem("maktaba-last-backup", now);
      } catch {}
      setLast(now);
    } catch {
      /* صارف نے شیئر منسوخ کر دیا */
    }
    setBusy(false);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50/60 text-slate-800 font-sans">
      <header className="bg-emerald-800 text-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-base font-bold">💾 بیک اپ</h1>
          <Link href="/" className="text-xs rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 transition">
            ← ڈیش بورڈ
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-6">
        <div
          className={`rounded-xl border p-4 text-sm ${
            daysAgo === null || daysAgo >= 7 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {daysAgo === null
            ? "اس موبائل/کمپیوٹر سے ابھی تک بیک اپ نہیں لیا گیا"
            : daysAgo === 0
            ? "آخری بیک اپ: آج"
            : `آخری بیک اپ: ${daysAgo} دن پہلے${daysAgo >= 7 ? " — نیا بیک اپ لیں" : ""}`}
        </div>

        <p className="mt-4 text-xs text-slate-500 leading-relaxed">
          نیچے کا بٹن دبائیں تو کتابوں، آرڈرز، بلوں، سپلائرز، کسٹمرز اور اخراجات سمیت تمام ڈیٹا ایک فائل میں محفوظ ہو جاتا ہے۔ فائل کو واٹس ایپ پر اپنے آپ کو بھیج دیں یا گوگل ڈرائیو میں رکھ لیں۔ ہفتے میں ایک بار بیک اپ لینا بہتر ہے۔
        </p>

        <button
          onClick={runBackup}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-emerald-700 text-white py-3 text-sm font-bold hover:bg-emerald-800 transition disabled:opacity-50"
        >
          {busy ? "بیک اپ بن رہا ہے..." : "💾 ابھی بیک اپ لیں"}
        </button>

        {log.length > 0 && (
          <ul className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1">
            {log.map((l, i) => (
              <li key={i} className="text-slate-600">
                {l}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}