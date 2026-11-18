"use client";

import { useState } from "react";
import Link from "next/link";

interface TrackOrder {
  date: string;
  status: string;
  courier: string | null;
  tracking: string | null;
  total: number;
  items: { title: string; quantity: number }[];
}

const statusInfo = (s: string) => {
  if (s === "مکمل ہوا") return { text: "✅ مکمل / روانہ ہو چکا", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (s === "زیر عمل") return { text: "🔄 تیاری میں ہے", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { text: "🆕 آرڈر موصول ہو گیا", cls: "bg-sky-50 text-sky-700 border-sky-200" };
};

export default function TrackPage() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<TrackOrder[] | null>(null);
  const [error, setError] = useState("");

  const search = async () => {
    setError("");
    setOrders(null);
    if (phone.replace(/\D/g, "").length < 10) {
      setError("براہِ کرم پورا فون نمبر لکھیں (مثلاً 03XXXXXXXXX)");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (json.ok) setOrders(json.orders as TrackOrder[]);
      else setError("تلاش نہیں ہو سکی، دوبارہ کوشش کریں");
    } catch {
      setError("انٹرنیٹ کا مسئلہ ہے، دوبارہ کوشش کریں");
    }
    setBusy(false);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-emerald-800 text-white">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="text-lg font-bold">مكتبہ الزھراء</span>
          <Link href="/shop" className="text-sm hover:text-emerald-200 transition">
            ← کتب
          </Link>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-gray-900">آرڈر کی حالت</h1>
        <p className="mt-1 text-sm text-gray-500">آرڈر کرتے وقت جو فون نمبر دیا تھا وہ لکھیں</p>

        <div className="mt-5 flex gap-2">
          <input
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="03XXXXXXXXX"
            className="flex-1 rounded-xl border border-gray-200 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            onClick={search}
            disabled={busy}
            className="rounded-xl bg-emerald-700 text-white px-5 font-semibold hover:bg-emerald-800 transition disabled:opacity-50"
          >
            {busy ? "..." : "تلاش کریں"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        {orders && orders.length === 0 && (
          <div className="mt-8 text-center text-gray-500">
            <p className="text-5xl mb-3">📭</p>
            <p>اس نمبر پر کوئی آرڈر نہیں ملا</p>
            <a href="https://wa.me/923055232889" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[#25D366] font-semibold">
              واٹس ایپ پر رابطہ کریں
            </a>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="mt-6 space-y-4">
            {orders.map((o, i) => {
              const st = statusInfo(o.status);
              return (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold rounded-md border px-2 py-1 ${st.cls}`}>{st.text}</span>
                    <span className="text-xs text-gray-400" dir="ltr">
                      {new Date(o.date).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-gray-800">
                    {o.items.map((it, j) => (
                      <li key={j}>
                        • {it.title} <span className="text-gray-400">× {it.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  {o.total > 0 && <p className="mt-3 text-sm font-bold text-emerald-700">کل رقم: Rs {o.total.toLocaleString()}</p>}
                  {(o.courier || o.tracking) && (
                    <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700">
                      🚚 {o.courier || "کورئیر"}
                      {o.tracking && (
                        <span className="block mt-1" dir="ltr">
                          Tracking: <b>{o.tracking}</b>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}