"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  FolderTree,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Star,
  PackageMinus,
  Wallet,
  Users,
  Receipt,
  Truck,
  RotateCcw,
  Plus,
  Trash2,
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
    setLoaded(false);
    const { data: returnsData } = await supabase
      .from("book_returns")
      .select("*")
      .order("id", { ascending: false });
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

  const menuItems = [
    { href: "/", label: "ڈیش بورڈ", icon: LayoutDashboard },
    { href: "/books", label: "کتب", icon: BookOpen },
    { href: "/authors", label: "مصنفین", icon: PenLine },
    { href: "/categories", label: "زمرے", icon: FolderTree },
    { href: "/orders", label: "آرڈرز", icon: ShoppingCart },
    { href: "/customers", label: "کسٹمرز", icon: Users },
    { href: "/invoices", label: "بل / انوائس", icon: Receipt },
    { href: "/suppliers", label: "سپلائرز", icon: Truck },
    { href: "/returns", label: "واپسی/خراب", icon: RotateCcw, active: true },
    { href: "/reviews", label: "ریویوز", icon: Star },
    { href: "/low-stock", label: "کم سٹاک", icon: PackageMinus },
    { href: "/expenses", label: "اخراجات", icon: Wallet },
  ];

  return (
    <main dir="rtl" className="min-h-screen flex bg-slate-50/60 font-sans">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar - مصنفین والے صفحے کی طرح */}
      <aside
        className={`w-60 min-h-screen md:h-screen md:sticky md:top-0 border-l border-slate-200 bg-white p-4 flex flex-col fixed inset-y-0 right-0 z-50 flex-shrink-0 transform transition-transform duration-300 shadow-sm ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
              <BookOpen className="text-white" size={17} />
            </div>
            <h1 className="text-base font-bold text-slate-800">مكتبہ الزھراء</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 space-y-1 flex-1 overflow-y-auto pl-1">
          <p className="text-slate-400 text-[11px] font-semibold px-2 mb-1">مینو</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  item.active
                    ? "bg-emerald-50 text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={16} className={item.active ? "text-emerald-600" : "text-slate-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
          <button
            onClick={() => {
              document.cookie = "maktaba-auth=; path=/; max-age=0";
              window.location.href = "/login";
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut size={16} className="text-slate-400" />
            لاگ آؤٹ
          </button>
          <p className="text-slate-400 text-[10px] text-center">مكتبہ الزھراء © 2026</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div className="flex items-center justify-between md:hidden mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-bold text-slate-800">مكتبہ الزھراء</h1>
        </div>

        {/* Title & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">واپسی / خراب کتب 🔄</h2>
            <p className="text-xs text-slate-500 mt-0.5">خراب یا واپس شدہ کتب کا تفصیلی ریکارڈ</p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-xs"
          >
            <Plus size={15} />
            <span>نیا ریکارڈ شامل کریں</span>
          </button>
        </div>

        {/* Returns List / Cards Grid */}
        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 rounded-xl border border-slate-200 bg-white p-4 animate-pulse" />
            ))}
          </div>
        ) : returns.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <span className="text-4xl mb-2 block">📦</span>
            <p className="text-xs text-slate-500">ابھی کوئی ریکارڈ موجود نہیں</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {returns.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-2" title={getBookTitle(r.book_id)}>
                      {getBookTitle(r.book_id)}
                      <span className="text-slate-400 font-normal mr-1">× {r.quantity}</span>
                    </h3>

                    <button
                      onClick={() => setConfirmDeleteId(r.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-md transition"
                      title="حذف کریں"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-600 font-semibold">
                      {reasonLabels[r.reason] || r.reason}
                    </span>
                    {r.customer_id && (
                      <span className="text-[11px] text-slate-500">
                        کسٹمر: {getCustomerName(r.customer_id)}
                      </span>
                    )}
                  </div>

                  {r.condition_notes && (
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                      {r.condition_notes}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {new Date(r.created_at).toLocaleDateString("ur-PK")}
                  </span>
                  {r.refund_amount ? (
                    <span className="font-bold text-rose-600">
                      Rs {Number(r.refund_amount).toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-full max-w-sm shadow-xl text-center relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800">ریکارڈ حذف کریں؟</h3>
            <p className="text-slate-500 text-xs mt-1.5">کیا آپ واقعی یہ ریکارڈ حذف کرنا چاہتے ہیں؟</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 rounded-lg bg-rose-600 text-white py-1.5 text-xs font-semibold hover:bg-rose-700 transition"
              >
                حذف کریں
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-lg border border-slate-200 text-slate-600 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-full max-w-md shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4">نیا ریکارڈ شامل کریں</h3>
            {saveError && (
              <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">
                {saveError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">کتاب منتخب کریں</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">کتاب منتخب کریں</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">کسٹمر (اختیاری)</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">کوئی کسٹمر منتخب نہیں</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">تعداد</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">وجہ</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="damaged">خراب</option>
                  <option value="customer_return">کسٹمر کی واپسی</option>
                  <option value="defective">خرابی/نقص</option>
                  <option value="other">دیگر</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">حالت کی تفصیل (اختیاری)</label>
                <textarea
                  placeholder="مزید تفصیل درج کریں..."
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">رقم واپس کی گئی (اختیاری)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restoreStock}
                  onChange={(e) => setRestoreStock(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-600 text-[11px]">
                  یہ کتاب دوبارہ قابلِ فروخت ہے (سٹاک میں شامل کریں)
                </span>
              </label>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {saving ? "محفوظ ہو رہا ہے..." : "شامل کریں"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}