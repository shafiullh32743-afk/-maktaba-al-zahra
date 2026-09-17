"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LayoutDashboard, BookOpen, PenLine, FolderTree, Star } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function BookDetailPage() {
  const params = useParams();
  const [book, setBook] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchBook = async () => {
      const identifier = params.title as string;

      // پہلے slug سے تلاش کریں
      let data: any = null;

      const { data: bySlug } = await supabase
        .from("books")
        .select("*")
        .eq("slug", identifier)
        .limit(1);
      if (bySlug && bySlug.length > 0) data = bySlug[0];

      if (!data) {
        const { data: byTitle } = await supabase
          .from("books")
          .select("*")
          .eq("title", identifier)
          .limit(1);
        if (byTitle && byTitle.length > 0) data = byTitle[0];
      }

      setBook(data || null);

      if (data) {
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("*")
          .eq("book_title", data.title)
          .eq("approved", true);
        if (reviewData) setReviews(reviewData);
      }

      setLoaded(true);
    };

    fetchBook();
  }, [params.title]);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <main className="min-h-screen flex bg-gray-50">
      <aside className="w-64 min-h-screen bg-blue-400 p-6 flex flex-col">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
            <BookOpen className="text-white" size={20} />
          </div>
          <h1 className="text-lg font-bold text-white">مكتبہ الزھراء</h1>
        </div>

        <nav className="mt-10 space-y-1.5 flex-1">
          <Link href="/" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <LayoutDashboard size={19} /> ڈیش بورڈ
          </Link>
          <Link href="/books" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md">
            <BookOpen size={19} /> کتب
          </Link>
          <Link href="/authors" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <PenLine size={19} /> مصنفین
          </Link>
          <Link href="/categories" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <FolderTree size={19} /> زمرے
          </Link>
        </nav>

        <p className="text-white/50 text-xs text-center mt-4">مكتبہ الزھراء © 2026</p>
      </aside>

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
            <div className="h-56 w-full rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden">
              {book.image_url ? (
                <img src={book.image_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-8xl">📚</span>
              )}
            </div>

            <h2 className="mt-6 text-3xl font-bold text-gray-800">{book.title}</h2>
            <p className="mt-3 text-gray-500 text-lg">{book.author}</p>

            {avgRating && (
              <div className="mt-3 flex items-center gap-1">
                <Star size={18} className="fill-amber-400 text-amber-400" />
                <span className="font-bold text-gray-700">{avgRating}</span>
                <span className="text-sm text-gray-400">({reviews.length} ریویوز)</span>
              </div>
            )}

            <span className="mt-4 inline-block rounded-full bg-emerald-50 px-4 py-1 text-emerald-700">
              زمرہ: {book.category}
            </span>

            {book.price ? (
              <p className="mt-4 text-2xl font-extrabold text-emerald-700">Rs {Number(book.price).toLocaleString()}</p>
            ) : null}

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-gray-500">
                یہ کتاب مكتبہ الزھراء کے ذخیرے میں محفوظ ہے۔
              </p>
            </div>

            {reviews.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-3">ریویوز</h3>
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-xl bg-gray-50 p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={14} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                          ))}
                        </div>
                        <span className="font-medium text-gray-700 text-sm">{r.customer_name}</span>
                      </div>
                      <p className="mt-2 text-gray-600 text-sm">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}