"use client";

import { useState, useEffect, useCallback } from "react";
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
  RotateCcw,
  Star,
  PackageMinus,
  Wallet,
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Book {
  id: string | number;
  title: string;
  author?: string;
  category?: string;
  price?: number;
  stock: number;
}

export default function LowStockPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Supabase کی طرف سے صرف وہی کتب فیچ کریں جن کا سٹاک 3 سے کم ہے
  const fetchLowStockBooks = useCallback(async () => {
    try {
      setLoaded(false);
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .lt("stock", 3)
        .order("stock", { ascending: true });

      if (!error && data) {
        setBooks(data);
      }
    } catch (err) {
      console.error("Error fetching low stock books:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchLowStockBooks();
  }, [fetchLowStockBooks]);

  const handleLogout = async () => {
    document.cookie = "maktaba-auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    await supabase.auth.signOut();
    window.location.href = "/login";
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
    { href: "/low-stock", label: "کم سٹاک", icon: PackageMinus, active: true, badge: books.length },
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

      {/* Sidebar - مصنفین والے صفحے کی طرح */}
      <aside
        className={`w-60 min-h-screen md:h-screen md:sticky md:top-0 border-l border-slate-200 bg-white p-4 flex flex-col fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 shadow-sm ${
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  item.active
                    ? "bg-emerald-50 text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={item.active ? "text-emerald-600" : "text-slate-400"} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.2">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
          <button
            onClick={handleLogout}
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

        {/* Title Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">کم سٹاک والی کتب ⚠️</h2>
            <p className="text-xs text-slate-500 mt-0.5">وہ کتب جن کا سٹاک 3 یا اس سے کم رہ گیا ہے</p>
          </div>
        </div>

        {/* Loading / Cards Grid */}
        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 h-36 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-slate-100 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-100 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <span className="text-4xl mb-2 block">✅</span>
            <p className="text-xs text-slate-500">فی الحال تمام کتب کا سٹاک مکمل ہے</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {books.map((book) => (
              <div
                key={book.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-2" title={book.title}>
                      {book.title}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                        (book.stock ?? 0) === 0
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {(book.stock ?? 0) === 0 ? "آؤٹ آف سٹاک" : `${book.stock} باقی`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-2">{book.author || "مصنف کا نام موجود نہیں"}</p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-50">
                    <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {book.category || "عام"}
                    </span>
                    {book.price ? (
                      <span className="font-bold text-emerald-700">Rs {book.price}</span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={`/books?search=${encodeURIComponent(book.title)}`}
                    className="flex items-center justify-between text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    <span>کتب مینجمنٹ میں دیکھیں</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}