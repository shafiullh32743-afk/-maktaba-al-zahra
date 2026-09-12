"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, ShoppingCart, Star, PackageMinus, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LowStockPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("stock", { ascending: true });
    if (!error && data) setBooks(data);
    setLoaded(true);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const lowStockBooks = books.filter((b) => (b.stock ?? 0) < 3);

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
          <Link href="/low-stock" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md">
            <PackageMinus size={19} />
            کم سٹاک
            {lowStockBooks.length > 0 && (
              <span className="mr-auto bg-white text-emerald-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {lowStockBooks.length}
              </span>
            )}
          </Link>
                    <Link href="/expenses" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
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

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">کم سٹاک والی کتابیں</h2>
        <p className="mt-2 text-gray-500">وہ کتابیں جن کی تعداد 3 سے کم ہے</p>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : lowStockBooks.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">✅</span>
            <p className="text-gray-500 text-lg">فی الحال کوئی کتاب کم سٹاک میں نہیں</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lowStockBooks.map((book) => (
              <div
                key={book.id}
                className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-gray-800">{book.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-bold ${
                      (book.stock ?? 0) === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {book.stock ?? 0} باقی
                  </span>
                </div>

                <p className="mt-2 text-gray-500 text-sm">{book.author}</p>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">{book.category}</span>
                  {book.price ? (
                    <span className="font-bold text-emerald-700">Rs {book.price}</span>
                  ) : null}
                </div>

                <Link
                  href="/books"
                  className="mt-4 block text-center rounded-lg bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 transition text-sm"
                >
                  کتب میں دیکھیں
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}