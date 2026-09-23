"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, ShoppingCart,
  Star, PackageMinus, Wallet, Users, Receipt, Truck, Gift, Ticket, RotateCcw,
  Plus, Minus, Search,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Customer {
  id: number;
  name: string;
  phone?: string;
  loyalty_points?: number;
}

interface Transaction {
  id: number;
  customer_id: number;
  points_change: number;
  reason: string | null;
  created_at: string;
}

export default function LoyaltyPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pointsInput, setPointsInput] = useState("");
  const [reason, setReason] = useState("purchase");
  const [mode, setMode] = useState<"add" | "redeem">("add");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const { data: customersData } = await supabase
      .from("customers")
      .select("id, name, phone, loyalty_points")
      .order("loyalty_points", { ascending: false });
    if (customersData) setCustomers(customersData as Customer[]);

    const { data: txData } = await supabase
      .from("loyalty_transactions")
      .select("*")
      .order("id", { ascending: false })
      .limit(20);
    if (txData) setTransactions(txData as Transaction[]);

    setLoaded(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const term = search.trim().toLowerCase();
    return term === "" || c.name.toLowerCase().includes(term) || (c.phone || "").includes(term);
  });

  const getCustomerName = (id: number) => customers.find((c) => c.id === id)?.name || "نامعلوم";

  const openPointsModal = (c: Customer, actionMode: "add" | "redeem") => {
    setSelectedCustomer(c);
    setMode(actionMode);
    setPointsInput("");
    setReason(actionMode === "add" ? "purchase" : "redeemed");
    setShowModal(true);
  };

  const handleSavePoints = async () => {
    if (!selectedCustomer || !pointsInput || parseInt(pointsInput) <= 0) return;
    setSaving(true);

    const pointsValue = parseInt(pointsInput);
    const change = mode === "add" ? pointsValue : -pointsValue;
    const newTotal = Math.max(0, (selectedCustomer.loyalty_points || 0) + change);

    await supabase.from("customers").update({ loyalty_points: newTotal }).eq("id", selectedCustomer.id);
    await supabase.from("loyalty_transactions").insert({
      customer_id: selectedCustomer.id,
      points_change: change,
      reason,
    });

    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  return (
    <main className="min-h-screen flex bg-gray-50">
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden" />
      )}

      <aside className={`w-64 min-h-screen bg-blue-400 p-6 flex flex-col fixed md:static inset-y-0 right-0 z-50 flex-shrink-0 transform transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
              <BookOpen className="text-white" size={20} />
            </div>
            <h1 className="text-lg font-bold text-white">مكتبہ الزھراء</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-white/80 hover:text-white"><X size={22} /></button>
        </div>

        <nav className="mt-10 space-y-1.5 flex-1">
          <p className="text-white/50 text-xs font-medium px-3 mb-2">مینو</p>
          <Link href="/" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><LayoutDashboard size={19} /> ڈیش بورڈ</Link>
          <Link href="/books" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><BookOpen size={19} /> کتب</Link>
          <Link href="/authors" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><PenLine size={19} /> مصنفین</Link>
          <Link href="/categories" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><FolderTree size={19} /> زمرے</Link>
          <Link href="/orders" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><ShoppingCart size={19} /> آرڈرز</Link>
          <Link href="/customers" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Users size={19} /> کسٹمرز</Link>
          <Link href="/invoices" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Receipt size={19} /> رسیدیں</Link>
          <Link href="/suppliers" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Truck size={19} /> سپلائرز</Link>
          <Link href="/loyalty" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md"><Gift size={19} /> لائلٹی پوائنٹس</Link>
          <Link href="/coupons" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Ticket size={19} /> کوپنز</Link>
          <Link href="/returns" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><RotateCcw size={19} /> واپسی/خراب</Link>
          <Link href="/reviews" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Star size={19} /> ریویوز</Link>
          <Link href="/low-stock" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><PackageMinus size={19} /> کم سٹاک</Link>
          <Link href="/expenses" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Wallet size={19} /> اخراجات</Link>
        </nav>

        <div className="border-t border-white/20 pt-4 space-y-3">
          <button onClick={() => { document.cookie = "maktaba-auth=; path=/; max-age=0"; window.location.href = "/login"; }} className="flex items-center gap-3 p-3 rounded-xl w-full text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <LogOut size={19} /> لاگ آؤٹ
          </button>
          <p className="text-white/50 text-xs text-center">مكتبہ الزھراء © 2026</p>
        </div>
      </aside>

      <section className="flex-1 min-w-0 p-5 md:p-10">
        <div className="flex items-center justify-between md:hidden mb-4">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm"><Menu size={22} /></button>
          <h1 className="text-lg font-bold text-emerald-800">مكتبہ الزھراء</h1>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">لائلٹی پوائنٹس</h2>
        <p className="mt-2 text-gray-500">کسٹمرز کو پوائنٹس دیں یا وصول کریں</p>

        <div className="mt-6 relative">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="کسٹمر تلاش کریں..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-4 pr-11 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
          />
        </div>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredCustomers.map((c) => (
              <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-800">{c.name}</p>
                  {c.phone && <p className="text-sm text-gray-500" dir="ltr">{c.phone}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-bold text-amber-700">
                    <Gift size={15} /> {c.loyalty_points ?? 0} پوائنٹس
                  </div>
                  <button onClick={() => openPointsModal(c, "add")} className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-700 hover:bg-emerald-100 transition"><Plus size={16} /></button>
                  <button onClick={() => openPointsModal(c, "redeem")} className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-600 hover:bg-red-100 transition"><Minus size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {transactions.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-bold text-gray-800">حالیہ لین دین</h3>
            <div className="mt-4 space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 text-sm">
                  <span className="text-gray-700">{getCustomerName(t.customer_id)} — {t.reason || "—"}</span>
                  <span className={`font-bold ${t.points_change >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {t.points_change >= 0 ? "+" : ""}{t.points_change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-gray-800">
              {mode === "add" ? "پوائنٹس دیں" : "پوائنٹس منہا کریں"}
            </h3>
            <p className="text-gray-500 text-sm mt-1">{selectedCustomer.name}</p>

            <input
              type="number"
              placeholder="پوائنٹس کی تعداد"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              className="mt-5 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              autoFocus
            />

            <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-3 w-full rounded-xl border border-gray-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
              {mode === "add" ? (
                <>
                  <option value="purchase">خریداری پر</option>
                  <option value="bonus">بونس</option>
                  <option value="other">دیگر</option>
                </>
              ) : (
                <>
                  <option value="redeemed">استعمال شدہ</option>
                  <option value="expired">میعاد ختم</option>
                  <option value="other">دیگر</option>
                </>
              )}
            </select>

            <div className="mt-6 flex gap-3">
              <button onClick={handleSavePoints} disabled={saving} className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition disabled:opacity-60">
                {saving ? "محفوظ ہو رہا ہے..." : "تصدیق کریں"}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition">منسوخ کریں</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
