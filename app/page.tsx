"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("id", { ascending: true });
      if (!error && data) setBooks(data);
      setLoaded(true);
    };
    fetchBooks();
  }, []);

  const totalBooks = books.length;
  const totalAuthors = new Set(books.map((b) => b.author)).size;
  const totalCategories = new Set(books.map((b) => b.category)).size;

  const stats = [
    { label: "کل کتابیں", value: totalBooks, icon: "📚", href: "/books" },
    { label: "مصنفین", value: totalAuthors, icon: "✍️", href: "/authors" },
    { label: "زمرے", value: totalCategories, icon: "🗂️", href: "/categories" },
  ];

  return (
    <main className="min-h-screen flex bg-gray-50">
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      <aside
        className={`w-64 min-h-screen bg-blue-400 p-6 flex flex-col fixed md:static inset-y-0 right-0 z-50 transform transition-transform duration-300 ${
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

          <Link href="/" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md">
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

      <section className="flex-1 p-5 md:p-10">
        <div className="flex items-center justify-between md:hidden mb-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-bold text-emerald-800">مكتبہ الزھراء</h1>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">خوش آمدید 👋</h2>
        <p className="mt-2 text-gray-500">مكتبہ الزھراء کا مختصر جائزہ</p>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat) => (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition flex items-center gap-4"
                >
                  <span className="text-4xl">{stat.icon}</span>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-gray-500">{stat.label}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10">
              <h3 className="text-xl font-bold text-gray-800">حالیہ کتابیں</h3>

              {books.length === 0 ? (
                <p className="mt-4 text-gray-500">ابھی کوئی کتاب شامل نہیں کی گئی</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {books.slice(-5).reverse().map((book) => (
                    <div key={book.id} className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{book.title}</p>
                        <p className="text-sm text-gray-500">{book.author}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                        {book.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}