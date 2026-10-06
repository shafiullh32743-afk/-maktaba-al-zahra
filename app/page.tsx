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
  Users,
  Receipt,
  Truck,
  Gift,
  Ticket,
  RotateCcw,
  Star,
  PackageMinus,
  Wallet,
  TrendingUp,
  Boxes,
  ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: booksData } = await supabase
        .from("books")
        .select("*")
        .order("id", { ascending: true });
      if (booksData) setBooks(booksData);

      const { data: ordersData } = await supabase.from("orders").select("*");
      if (ordersData) setOrders(ordersData);

      const { data: expensesData } = await supabase.from("expenses").select("*");
      if (expensesData) setExpenses(expensesData);

      setLoaded(true);
    };
    fetchAll();
  }, []);

  const now = new Date();
  const thisMonthOrders = orders.filter((o) => {
    const d = new Date(o.created_at || Date.now());
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + (o.book_price || 0), 0);
  const thisMonthCost = thisMonthOrders.reduce((sum, o) => sum + (o.cost_price || 0), 0);
  const thisMonthExpenseTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthProfit = thisMonthRevenue - thisMonthCost - thisMonthExpenseTotal;

  const totalStockValue = books.reduce((sum, b) => sum + (b.price || 0) * (b.stock || 0), 0);
  const totalBooks = books.length;
  const totalAuthors = new Set(books.map((b) => b.author)).size;
  const totalCategories = new Set(books.map((b) => b.category)).size;

  const stats = [
    { label: "کل کتابیں", value: totalBooks, icon: BookOpen, href: "/books", color: "text-emerald-600 bg-emerald-50" },
    { label: "مصنفین", value: totalAuthors, icon: PenLine, href: "/authors", color: "text-blue-600 bg-blue-50" },
    { label: "زمرے", value: totalCategories, icon: FolderTree, href: "/categories", color: "text-amber-600 bg-amber-50" },
  ];

  const menuItems = [
    { href: "/", label: "ڈیش بورڈ", icon: LayoutDashboard, active: true },
    { href: "/books", label: "کتب", icon: BookOpen },
    { href: "/authors", label: "مصنفین", icon: PenLine },
    { href: "/categories", label: "زمرے", icon: FolderTree },
    { href: "/orders", label: "آرڈرز", icon: ShoppingCart },
    { href: "/customers", label: "کسٹمرز", icon: Users },
    { href: "/bills", label: "بل", icon: Receipt },
    { href: "/suppliers", label: "سپلائرز", icon: Truck },
    { href: "/loyalty", label: "لائلٹی پوائنٹس", icon: Gift },
    { href: "/coupons", label: "کوپنز", icon: Ticket },
    { href: "/returns", label: "واپسی/خراب", icon: RotateCcw },
    { href: "/reviews", label: "ریویوز", icon: Star },
    { href: "/low-stock", label: "کم سٹاک", icon: PackageMinus },
    { href: "/expenses", label: "اخراجات", icon: Wallet },
  ];

  return (
    <main className="min-h-screen flex bg-slate-50/60 font-sans" dir="rtl">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar - Positioned on the Right side */}
      <aside
        className={`w-60 min-h-screen md:h-screen md:sticky md:top-0 border-r border-slate-200 bg-white p-4 flex flex-col fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 shadow-sm ${
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
            <LogOut size={16} className="text-slate-400 group-hover:text-rose-600" />
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

        {/* Dashboard Title Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">خوش آمدید 👋</h2>
          <p className="text-xs text-slate-500 mt-0.5">مكتبہ الزھراء کی تجارتی و مالی صورتحال کا خلاصہ</p>
        </div>

        {!loaded ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-xs font-medium text-slate-400 animate-pulse">لوڈ ہو رہا ہے...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top Financial Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly Profit Card */}
              <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">اس مہینے کا نفع</span>
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <TrendingUp size={16} />
                  </span>
                </div>
                <p className={`text-2xl font-bold mt-1 ${thisMonthProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  Rs {thisMonthProfit.toLocaleString()}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[10px] text-slate-400">فروخت</p>
                    <p className="font-semibold text-slate-700 mt-0.5">Rs {thisMonthRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[10px] text-slate-400">لاگت</p>
                    <p className="font-semibold text-slate-700 mt-0.5">Rs {thisMonthCost.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[10px] text-slate-400">اخراجات</p>
                    <p className="font-semibold text-slate-700 mt-0.5">Rs {thisMonthExpenseTotal.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Total Stock Value Card */}
              <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">موجودہ سٹاک کی کل مالیت</span>
                    <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Boxes size={16} />
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    Rs {totalStockValue.toLocaleString()}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 bg-blue-50/50 p-2 rounded-lg">
                  تمام کتابوں کی (قیمت × تعداد) کا مجموعہ
                </p>
              </div>
            </div>

            {/* Quick Stat Counter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${stat.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-800 leading-tight">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </Link>
                );
              })}
            </div>

            {/* Recent Books Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">حالیہ کتب</h3>
                <Link href="/books" className="text-xs font-medium text-emerald-600 hover:underline">
                  تمام کتب دیکھیں
                </Link>
              </div>

              {books.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">ابھی کوئی کتاب شامل نہیں کی گئی</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {books.slice(-5).reverse().map((book) => (
                    <div key={book.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800">{book.title}</p>
                        <p className="text-[11px] text-slate-400">{book.author}</p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {book.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}