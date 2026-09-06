"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, PenLine, FolderTree } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function CategoriesPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase.from("books").select("*");
      if (!error && data) setBooks(data);
      setLoaded(true);
    };
    fetchBooks();
  }, []);

  const categoryCounts: Record<string, number> = {};
  books.forEach((book) => {
    categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
  });

  const categories = Object.keys(categoryCounts);

  return (
    <main className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-blue-400 p-6 flex flex-col">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
            <BookOpen className="text-white" size={20} />
          </div>
          <h1 className="text-lg font-bold text-white">مكتبہ الزھراء</h1>
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
          <Link href="/categories" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md">
            <FolderTree size={19} />
            زمرے
          </Link>
        </nav>

        <div className="border-t border-white/20 pt-4">
          <p className="text-white/50 text-xs text-center">مكتبہ الزھراء © 2026</p>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 p-10">
        <h2 className="text-3xl font-bold text-gray-900">زمرہ جات</h2>
        <p className="mt-2 text-gray-500">کتب کو زمرے کے لحاظ سے دیکھیں</p>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : categories.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">🗂️</span>
            <p className="text-gray-500 text-lg">ابھی کوئی زمرہ موجود نہیں</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition">
                <span className="text-4xl">📂</span>
                <h3 className="mt-4 text-xl font-bold text-gray-800">{cat}</h3>
                <p className="mt-2 text-emerald-700 text-sm">{categoryCounts[cat]} کتابیں</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}