"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, PenLine, FolderTree } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

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
      <aside className="w-64 min-h-screen bg-white border-r border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-800">مكتبہ الزھراء</h1>
        <nav className="mt-10 space-y-2">
          <Link href="/" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-700 text-white font-bold shadow-sm">
            <LayoutDashboard size={20} />
            ڈیش بورڈ
          </Link>
          <Link href="/books" className="flex items-center gap-3 p-3 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
            <BookOpen size={20} />
            کتب
          </Link>
          <Link href="/authors" className="flex items-center gap-3 p-3 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
            <PenLine size={20} />
            مصنفین
          </Link>
          <Link href="/categories" className="flex items-center gap-3 p-3 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
            <FolderTree size={20} />
            زمرے
          </Link>
        </nav>
      </aside>

      <section className="flex-1 p-10">
        <h2 className="text-3xl font-bold text-gray-900">خوش آمدید 👋</h2>
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