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
  Search,
  Trash2,
  Plus,
  Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Expense {
  id: number;
  title: string;
  amount: number;
  expense_date: string;
  created_at?: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchExpenses = async () => {
    setLoaded(false);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (!error && data) setExpenses(data as Expense[]);
    setLoaded(true);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async () => {
    if (title.trim() === "" || !amount) return;
    setSaving(true);

    await supabase.from("expenses").insert({
      title: title.trim(),
      amount: parseFloat(amount),
      expense_date: expenseDate || new Date().toISOString().split("T")[0],
    });

    setTitle("");
    setAmount("");
    setExpenseDate("");
    setSaving(false);
    setShowModal(false);
    fetchExpenses();
  };

  const handleDeleteExpense = async (id: number) => {
    await supabase.from("expenses").delete().eq("id", id);
    setConfirmDeleteId(null);
    fetchExpenses();
  };

  const filteredExpenses = expenses.filter((e) => {
    const term = search.trim().toLowerCase();
    if (term === "") return true;
    return e.title.toLowerCase().includes(term);
  });

  const now = new Date();
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // پچھلے 6 مہینوں کے اخراجات
  const monthNamesUr = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
  const sixMonths = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    const total = expenses
      .filter((e) => {
        const x = new Date(e.expense_date);
        return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear();
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { label: monthNamesUr[d.getMonth()], total };
  });
  const sixMax = Math.max(1, ...sixMonths.map((m) => m.total));
  const prevMonthTotal = sixMonths[4].total;
  const changePct = prevMonthTotal > 0 ? Math.round(((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100) : null;
  const biggest = thisMonthExpenses.reduce<Expense | null>((m, e) => (!m || e.amount > m.amount ? e : m), null);
  const yearTotal = expenses
    .filter((e) => new Date(e.expense_date).getFullYear() === now.getFullYear())
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const exportCsv = () => {
    const rows = [["عنوان", "رقم", "تاریخ"]].concat(expenses.map((e) => [e.title, String(e.amount), e.expense_date]));
    const csv = "\uFEFF" + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "expenses.csv";
    a.click();
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
    { href: "/returns", label: "واپسی/خراب", icon: RotateCcw },
    { href: "/reviews", label: "ریویوز", icon: Star },
    { href: "/low-stock", label: "کم سٹاک", icon: PackageMinus },
    { href: "/expenses", label: "اخراجات", icon: Wallet, active: true },
  ];

  return (
    <main dir="rtl" className="min-h-screen flex bg-gradient-to-b from-emerald-50/70 via-slate-50 to-slate-50 font-sans">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar - مصنفین والے صفحے کے عین مطابق */}
      <aside
        className={`w-60 min-h-screen md:h-screen md:sticky md:top-0 border-l border-slate-200 bg-white p-4 flex flex-col fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 shadow-sm ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="logo" className="w-9 h-9 rounded-2xl object-cover ring-2 ring-emerald-200" />
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
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-colors ${
                  item.active
                    ? "bg-emerald-50 text-emerald-700 shadow-[0_2px_14px_rgba(15,23,42,0.05)]"
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
        <div className="flex items-center justify-between md:hidden mb-4 bg-white p-3 rounded-3xl border border-slate-100 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
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
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">اخراجات 💸</h2>
            <p className="text-xs text-slate-500 mt-0.5">ماہانہ کرایہ، بجلی اور دیگر تمام اخراجات کی تفصیلات</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="خرچہ تلاش کریں..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 rounded-xl border border-slate-100 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-[0_2px_14px_rgba(15,23,42,0.05)]"
              />
            </div>

            {/* Add Expense Button */}
            <button
              onClick={() => {
                setTitle("");
                setAmount("");
                setExpenseDate("");
                setShowModal(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 text-white text-xs font-semibold hover:opacity-90 transition shadow-[0_2px_14px_rgba(15,23,42,0.05)]"
            >
              <Plus size={15} />
              <span>نیا خرچہ</span>
            </button>
          </div>
        </div>

        {/* ماہانہ خلاصہ */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-1 rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-5 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold text-rose-500">اس مہینے کا مجموعی خرچہ</p>
            <p className="text-3xl font-extrabold text-rose-600 mt-1" dir="ltr" style={{ textAlign: "right" }}>Rs {thisMonthTotal.toLocaleString()}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
              {changePct !== null && (
                <span className={`rounded-full px-2 py-0.5 ${changePct > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-700"}`}>
                  پچھلے مہینے سے {changePct > 0 ? "▲" : "▼"} {Math.abs(changePct)}%
                </span>
              )}
              <span className="rounded-full px-2 py-0.5 bg-slate-100 text-slate-600">اس سال کل: Rs {yearTotal.toLocaleString()}</span>
            </div>
            {biggest && (
              <p className="mt-3 text-[11px] text-slate-500">
                سب سے بڑا خرچہ: <b className="text-slate-700">{biggest.title}</b> (Rs {biggest.amount.toLocaleString()})
              </p>
            )}
            <button onClick={exportCsv} className="mt-3 text-[11px] font-semibold text-emerald-600 hover:underline">⬇ تمام اخراجات ایکسل (CSV) میں</button>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold text-slate-700 mb-3">پچھلے 6 مہینوں کے اخراجات</p>
            <div className="flex items-end gap-3 h-32" dir="ltr">
              {sixMonths.map((m, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[9px] text-slate-400 mb-1">{m.total > 0 ? Math.round(m.total / 1000 * 10) / 10 + "k" : ""}</span>
                  <div
                    className={`w-full rounded-t-xl ${idx === 5 ? "bg-gradient-to-t from-rose-400 to-orange-300" : "bg-gradient-to-t from-slate-200 to-slate-100"}`}
                    style={{ height: `${Math.max(4, (m.total / sixMax) * 100)}%` }}
                  />
                  <span className="mt-1.5 text-[10px] text-slate-500">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses Grid */}
        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 rounded-3xl border border-slate-100 bg-white p-4 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredExpenses.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
                کوئی خرچہ ریکارڈ نہیں ہوا
              </div>
            )}

            {filteredExpenses.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-3xl border border-slate-100 p-4 flex flex-col justify-between shadow-[0_2px_14px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:shadow-lg transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-rose-50 border border-rose-100 text-rose-600 px-2.5 py-0.5 rounded-md text-xs font-bold">
                      Rs {e.amount.toLocaleString()}
                    </span>

                    <button
                      onClick={() => setConfirmDeleteId(e.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-md transition"
                      title="حذف کریں"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 my-2 group-hover:text-emerald-600 transition">
                    {e.title}
                  </h3>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>تاریخ: {e.expense_date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal Deletion Confirmation */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 w-full max-w-sm shadow-xl text-center relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800">خرچہ حذف کریں؟</h3>
            <p className="text-slate-500 text-xs mt-1.5">کیا آپ واقعی اس خرچے کو ریکارڈ سے ختم کرنا چاہتے ہیں؟</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleDeleteExpense(confirmDeleteId)}
                className="flex-1 rounded-xl bg-rose-600 text-white py-1.5 text-xs font-semibold hover:bg-rose-700 transition"
              >
                حذف کریں
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl border border-slate-100 text-slate-600 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 w-full max-w-md shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4">نیا خرچہ شامل کریں</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">عنوان</label>
                <input
                  type="text"
                  placeholder="عنوان (مثلاً دکان کا کرایہ، بجلی کا بل)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-100 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">رقم (روپے)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-100 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">تاریخ</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-100 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
              <button
                onClick={handleAddExpense}
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? "شامل ہو رہا ہے..." : "شامل کریں"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}