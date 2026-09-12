"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, ShoppingCart, Star, PackageMinus, Wallet, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });
    if (!error && data) setExpenses(data);
    setLoaded(true);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async () => {
    if (title.trim() === "" || !amount) return;

    await supabase.from("expenses").insert({
      title,
      amount: parseFloat(amount),
      expense_date: expenseDate || new Date().toISOString().split("T")[0],
    });

    setTitle("");
    setAmount("");
    setExpenseDate("");
    setShowModal(false);
    fetchExpenses();
  };

  const handleDeleteExpense = async (id: number) => {
    await supabase.from("expenses").delete().eq("id", id);
    fetchExpenses();
  };

  const now = new Date();
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <main className="min-h-screen flex bg-gray-50">
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      <aside
        className={`w-64 min-h-screen bg-blue-400 p-6 flex flex-col fixed md:static inset-y-0 right-0 z-50 flex-shrink-0 transform transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
              <BookOpen className="text-white" size={20} />
            </div>
            <h1 className="text-lg font-bold text-white">مكتبہ الزھراء</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-white/80 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="mt-10 space-y-1.5 flex-1">
          <p className="text-white/50 text-xs font-medium px-3 mb-2">مینو</p>

          <Link href="/" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <LayoutDashboard size={19} />
            ڈیش بورڈ
          </Link>
          <Link href="/books" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <BookOpen size={19} />
            کتب
          </Link>
          <Link href="/authors" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <PenLine size={19} />
            مصنفین
          </Link>
          <Link href="/categories" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <FolderTree size={19} />
            زمرے
          </Link>
          <Link href="/orders" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <ShoppingCart size={19} />
            آرڈرز
          </Link>
          <Link href="/reviews" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <Star size={19} />
            ریویوز
          </Link>
          <Link href="/low-stock" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <PackageMinus size={19} />
            کم سٹاک
          </Link>
          <Link href="/expenses" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md">
            <Wallet size={19} />
            اخراجات
          </Link>
        </nav>

        <div className="border-t border-white/20 pt-4 space-y-3">
          <button
            onClick={() => {
              document.cookie = "maktaba-auth=; path=/; max-age=0";
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 p-3 rounded-xl w-full text-white/80 hover:bg-white/[0.15] hover:text-white transition"
          >
            <LogOut size={19} />
            لاگ آؤٹ
          </button>
          <p className="text-white/50 text-xs text-center">مكتبہ الزھراء © 2026</p>
        </div>
      </aside>

      <section className="flex-1 min-w-0 p-5 md:p-10">
        <div className="flex items-center justify-between md:hidden mb-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-bold text-emerald-800">مكتبہ الزھراء</h1>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">اخراجات</h2>
            <p className="mt-2 text-gray-500">ماہانہ کرایہ، بجلی اور دیگر اخراجات</p>
          </div>

          <button
            onClick={() => {
              setTitle("");
              setAmount("");
              setExpenseDate("");
              setShowModal(true);
            }}
            className="rounded-xl px-5 py-3 bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm"
          >
            + خرچہ شامل کریں
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">اس مہینے کے کل اخراجات</p>
          <p className="text-3xl font-extrabold text-red-800 mt-1">Rs {thisMonthTotal.toLocaleString()}</p>
        </div>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : expenses.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">💰</span>
            <p className="text-gray-500 text-lg">ابھی کوئی خرچہ شامل نہیں کیا گیا</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-gray-800">{expense.title}</p>
                  <p className="text-sm text-gray-500">{expense.expense_date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-red-700">Rs {expense.amount}</span>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-gray-800">نیا خرچہ شامل کریں</h3>

            <input
              type="text"
              placeholder="عنوان (مثلاً کرایہ، بجلی)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-5 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              autoFocus
            />

            <input
              type="number"
              placeholder="رقم (روپے)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAddExpense}
                className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition"
              >
                شامل کریں
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition"
              >
                منسوخ کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}