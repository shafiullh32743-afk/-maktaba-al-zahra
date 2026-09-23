"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, ShoppingCart,
  Star, PackageMinus, Wallet, Users, Receipt, Truck, Gift, Ticket, RotateCcw,
  Plus, Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Book {
  id: number;
  title: string;
  stock?: number;
}

interface Customer {
  id: number;
  name: string;
}

interface Return {
  id: number;
  book_id: number;
  customer_id: number | null;
  quantity: number;
  reason: string;
  condition_notes?: string;
  refund_amount?: number;
  created_at: string;
}

const reasonLabels: Record<string, string> = {
  damaged: "خراب",
  customer_return: "کسٹمر کی واپسی",
  defective: "خرابی/نقص",
  other: "دیگر",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("damaged");
  const [conditionNotes, setConditionNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [restoreStock, setRestoreStock] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchData = async () => {
    const { data: returnsData } = await supabase.from("book_returns").select("*").order("id", { ascending: false });
    if (returnsData) setReturns(returnsData as Return[]);

    const { data: booksData } = await supabase.from("books").select("id, title, stock");
    if (booksData) setBooks(booksData as Book[]);

    const { data: customersData } = await supabase.from("customers").select("id, name");
    if (customersData) setCustomers(customersData as Customer[]);

    setLoaded(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getBookTitle = (id: number) => books.find((b) => b.id === id)?.title || "نامعلوم کتاب";
  const getCustomerName = (id: number | null) => (id ? customers.find((c) => c.id === id)?.name : null) || "—";

  const resetForm = () => {
    setSelectedBookId("");
    setSelectedCustomerId("");
    setQuantity("1");
    setReason("damaged");
    setConditionNotes("");
    setRefundAmount("");
    setRestoreStock(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!selectedBookId || !quantity || parseInt(quantity) <= 0) return;
    setSaving(true);
    setSaveError(null);

    const bookId = parseInt(selectedBookId);
    const qty = parseInt(quantity);

    const returnData = {
      book_id: bookId,
      customer_id: selectedCustomerId ? parseInt(selectedCustomerId) : null,
      quantity: qty,
      reason,
      condition_notes: conditionNotes.trim() || null,
      refund_amount: refundAmount ? parseFloat(refundAmount) : null,
    };

    const { error } = await supabase.from("book_returns").insert(returnData);

    if (error) {
      setSaveError(`محفوظ نہیں ہو سکا: ${error.message}`);
      setSaving(false);
      return;
    }

    // اگر کتاب دوبارہ قابل فروخت حالت میں ہے تو سٹاک میں واپس شامل کریں
    if (restoreStock) {
      const book = books.find((b) => b.id === bookId);
      if (book) {
        await supabase.from("books").update({ stock: (book.stock || 0) + qty }).eq("id", bookId);
      }
    }

    setSaving(false);
    setShowModal(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    await supabase.from("book_returns").delete().eq("id", id);
    setConfirmDeleteId(null);
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
          <Link href="/loyalty" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Gift size={19} /> لائلٹی پوائنٹس</Link>
          <Link href="/coupons" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Ticket size={19} /> کوپنز</Link>
          <Link href="/returns" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md"><RotateCcw size={19} /> واپسی/خراب</Link>
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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">واپسی / خراب کتابیں</h2>
            <p className="mt-2 text-gray-500">خراب یا واپس شدہ کتابوں کا ریکارڈ</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm w-full md:w-auto">
            <Plus size={18} /> نیا ریکارڈ شامل کریں
          </button>
        </div>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : returns.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">📦</span>
            <p className="text-gray-500 text-lg">ابھی کوئی ریکارڈ موجود نہیں</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {returns.map((r) => (
              <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-800">{getBookTitle(r.book_id)} <span className="text-gray-400 font-normal">× {r.quantity}</span></p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 font-medium">{reasonLabels[r.reason] || r.reason}</span>
                    {r.customer_id && <span className="text-xs text-gray-500">کسٹمر: {getCustomerName(r.customer_id)}</span>}
                  </div>
                  {r.condition_notes && <p className="mt-1 text-sm text-gray-500">{r.condition_notes}</p>}
                  <p className="mt-1 text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("ur-PK")}</p>
                </div>
                <div className="flex items-center gap-3">
                  {r.refund_amount ? <span className="font-bold text-red-700">Rs {Number(r.refund_amount).toLocaleString()}</span> : null}
                  <button onClick={() => setConfirmDeleteId(r.id)} className="rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 transition"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <span className="text-5xl">⚠️</span>
            <h3 className="text-lg font-bold text-gray-800 mt-4">کیا آپ واقعی یہ ریکارڈ حذف کرنا چاہتے ہیں؟</h3>
            <div className="mt-6 flex gap-3">
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 rounded-xl bg-red-600 text-white py-3 hover:bg-red-700 transition">ہاں، حذف کریں</button>
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition">منسوخ کریں</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800">نیا ریکارڈ شامل کریں</h3>
            {saveError && <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{saveError}</div>}

            <label className="mt-5 block">
              <span className="text-xs text-gray-500">کتاب منتخب کریں</span>
              <select value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
                <option value="">کتاب منتخب کریں</option>
                {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </label>

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">کسٹمر (اختیاری)</span>
              <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
                <option value="">کوئی کسٹمر منتخب نہیں</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">تعداد</span>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </label>

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">وجہ</span>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
                <option value="damaged">خراب</option>
                <option value="customer_return">کسٹمر کی واپسی</option>
                <option value="defective">خرابی/نقص</option>
                <option value="other">دیگر</option>
              </select>
            </label>

            <textarea placeholder="حالت کی تفصیل (اختیاری)" value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} rows={2} className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none" />

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">رقم واپس کی گئی (اختیاری)</span>
              <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </label>

            <label className="mt-4 flex items-center gap-2">
              <input type="checkbox" checked={restoreStock} onChange={(e) => setRestoreStock(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-gray-600">یہ کتاب دوبارہ قابلِ فروخت ہے (سٹاک میں شامل کریں)</span>
            </label>

            <div className="mt-6 flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition disabled:opacity-60">{saving ? "محفوظ ہو رہا ہے..." : "شامل کریں"}</button>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition">منسوخ کریں</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
