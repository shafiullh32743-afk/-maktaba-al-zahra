"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AuthorsPage() {
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

  const authorMap: Record<string, string[]> = {};
  books.forEach((book) => {
    if (!authorMap[book.author]) authorMap[book.author] = [];
    authorMap[book.author].push(book.title);
  });

  const authors = Object.keys(authorMap);

  return (
    <main className="min-h-screen flex bg-gray-50">
      <aside className="w-64 min-h-screen bg-white border-r border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-800">مكتبہ الزھراء</h1>
        <nav className="mt-10 space-y-2">
          <Link href="/" className="block p-3 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
            ڈیش بورڈ
          </Link>
          <Link href="/books" className="block p-3 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
            کتب
          </Link>
          <Link href="/authors" className="block p-3 rounded-xl bg-emerald-700 text-white font-bold shadow-sm">
            مصنفین
          </Link>
          <Link href="/categories" className="block p-3 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
            زمرے
          </Link>
        </nav>
      </aside>

      <section className="flex-1 p-10">
        <h2 className="text-3xl font-bold text-gray-900">مصنفین</h2>
        <p className="mt-2 text-gray-500">مصنفین اور ان کی کتب دیکھیں</p>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : authors.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">✍️</span>
            <p className="text-gray-500 text-lg">ابھی کوئی مصنف موجود نہیں</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authors.map((author) => (
              <div key={author} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition">
                <span className="text-4xl">👤</span>
                <h3 className="mt-4 text-xl font-bold text-gray-800">{author}</h3>
                <p className="mt-2 text-emerald-700 text-sm">{authorMap[author].length} کتابیں</p>
                <ul className="mt-3 space-y-1">
                  {authorMap[author].map((title) => (
                    <li key={title} className="text-gray-500 text-sm">• {title}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}