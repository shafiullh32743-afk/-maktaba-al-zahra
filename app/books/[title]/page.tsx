"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function BookDetailPage() {
  const params = useParams();
  const [book, setBook] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("maktaba-books");
    if (saved) {
      const books = JSON.parse(saved);
      const decodedTitle = decodeURIComponent(params.title as string);
      const found = books.find((b: any) => b.title === decodedTitle);
      setBook(found || null);
    }
    setLoaded(true);
  }, [params.title]);

  return (
    <main className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-white border-r border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-800">مكتبہ الزھراء</h1>

        <nav className="mt-10 space-y-2">
          <Link href="/" className="block p-3 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
            ڈیش بورڈ
          </Link>
          <Link href="/books" className="block p-3 rounded-xl bg-emerald-700 text-white font-bold shadow-sm">
            کتب
          </Link>
          <Link href="/authors" className="block p-3 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
            مصنفین
          </Link>
          <Link href="/categories" className="block p-3 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
            زمرے
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <section className="flex-1 p-10">
        <Link href="/books" className="text-emerald-700 hover:underline">
          ← واپس کتب کی فہرست
        </Link>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : !book ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">😕</span>
            <p className="text-gray-500 text-lg">یہ کتاب نہیں ملی</p>
          </div>
        ) : (
          <div className="mt-8 max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm p-10">
            <div className="h-56 w-full rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="text-8xl">📚</span>
            </div>

            <h2 className="mt-6 text-3xl font-bold text-gray-800">{book.title}</h2>
            <p className="mt-3 text-gray-500 text-lg">{book.author}</p>

            <span className="mt-4 inline-block rounded-full bg-emerald-50 px-4 py-1 text-emerald-700">
              زمرہ: {book.category}
            </span>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-gray-500">
                یہ کتاب مكتبہ الزھراء کے ذخیرے میں محفوظ ہے۔ مزید تفصیلات جلد شامل کی جائیں گی۔
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}