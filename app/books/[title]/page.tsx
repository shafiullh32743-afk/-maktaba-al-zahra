"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  FolderTree,
  Star,
  ArrowRight,
  User,
  Tag,
  Share2,
  Heart,
  MessageCircle,
  Menu,
  X,
  ShoppingCart,
  PackageMinus,
  Wallet,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Book {
  id: string;
  title: string;
  slug?: string;
  author: string;
  category: string;
  price?: number;
  image_url?: string;
}

interface Review {
  id: string;
  book_title: string;
  customer_name: string;
  rating: number;
  comment: string;
  approved: boolean;
}

export default function BookDetailPage() {
  const params = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchBookAndReviews = async () => {
      const identifier = params.title as string;
      if (!identifier) return;

      const { data: books, error: bookError } = await supabase
        .from("books")
        .select("*")
        .or(`slug.eq.${identifier},title.eq.${identifier}`)
        .limit(1);

      if (bookError || !books || books.length === 0) {
        setLoaded(true);
        return;
      }

      const fetchedBook = books[0] as Book;
      setBook(fetchedBook);

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("book_title", fetchedBook.title)
        .eq("approved", true);

      if (reviewData) {
        setReviews(reviewData as Review[]);
      }

      setLoaded(true);
    };

    fetchBookAndReviews();
  }, [params.title]);

    const handleWhatsAppOrder = () => {
    if (!book) return;
    const message = "Assalam o Alaikum! Main yeh kitab khareedna chahta hoon: " + book.title;
    const url = "https://wa.me/923055232889?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  };
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <main className="min-h-screen flex bg-slate-50 font-sans" dir="ltr">
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      <aside
        className={`w-72 min-h-screen bg-[#4A90E2] p-6 flex flex-col fixed md:static inset-y-0 left-0 z-50 flex-shrink-0 transform transition-transform duration-300 shadow-xl ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-blue-400/40 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-md">
              <BookOpen className="text-white" size={22} />
            </div>
            <h1 className="text-xl font-bold tracking-wide text-white">مكتبہ الزھراء</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-white/80 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="mt-8 space-y-2 flex-1">
          <p className="text-white/70 text-xs font-medium px-3 mb-2">مینو</p>

          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition duration-200">
            <LayoutDashboard size={20} /> ڈیش بورڈ
          </Link>

          <Link href="/books" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#00C853] text-white font-semibold shadow-md transition duration-200">
            <BookOpen size={20} /> کتب
          </Link>

          <Link href="/authors" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition duration-200">
            <PenLine size={20} /> مصنفین
          </Link>

          <Link href="/categories" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition duration-200">
            <FolderTree size={20} /> زمرے
          </Link>

          <Link href="/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition duration-200">
            <ShoppingCart size={20} /> آرڈرز
          </Link>

          <Link href="/reviews" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition duration-200">
            <Star size={20} /> ریویوز
          </Link>

          <Link href="/low-stock" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition duration-200">
            <PackageMinus size={20} /> کم سٹاک
          </Link>

          <Link href="/expenses" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition duration-200">
            <Wallet size={20} /> اخراجات
          </Link>
        </nav>

        <div className="border-t border-blue-400/40 pt-4 space-y-3">
          <button
            onClick={() => {
              document.cookie = "maktaba-auth=; path=/; max-age=0";
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-white/90 hover:bg-white/10 transition duration-200"
          >
            <LogOut size={20} /> لاگ آؤٹ
          </button>

          <div className="flex items-center justify-between pt-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow">N</div>
            <p className="text-white/70 text-xs">مكتبہ الزھراء © 2026</p>
          </div>
        </div>
      </aside>

      <section className="flex-1 min-w-0 p-6 md:p-12 overflow-y-auto">
        <div className="flex items-center justify-between md:hidden mb-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-bold text-[#4A90E2]">مكتبہ الزھراء</h1>
        </div>

        <div className="w-full max-w-6xl mx-auto">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 text-[#4A90E2] hover:text-blue-700 font-medium transition-colors mb-6 bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm"
          >
            <ArrowRight size={18} /> واپس کتب کی فہرست
          </Link>

          {!loaded ? (
            <div className="mt-12 flex items-center gap-3 text-[#4A90E2]">
              <div className="w-6 h-6 border-3 border-[#4A90E2] border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium">معلومات لوڈ ہو رہی ہیں...</p>
            </div>
          ) : !book ? (
            <div className="mt-8 p-10 bg-white rounded-2xl shadow-sm border border-gray-100 text-right">
              <span className="text-7xl mb-4 block">📖</span>
              <p className="text-gray-600 text-xl font-semibold">مطلوبہ کتاب نہیں ملی</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-between order-2 lg:order-1">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-[#4A90E2] border border-blue-100">
                      <Tag size={14} /> {book.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsLiked(!isLiked)}
                        className={`p-2.5 rounded-full border transition ${
                          isLiked ? "bg-rose-50 border-rose-200 text-rose-500" : "bg-gray-50 border-gray-200 text-gray-400 hover:text-rose-500"
                        }`}
                      >
                        <Heart size={20} className={isLiked ? "fill-rose-500" : ""} />
                      </button>
                      <button
                        onClick={handleShare}
                        className="p-2.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 transition relative"
                        title="لنک کاپی کریں"
                      >
                        <Share2 size={20} />
                        {copied && (
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded shadow">
                            کاپی ہو گیا!
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  <h1 className="mt-5 text-3xl md:text-4xl font-bold text-gray-900 leading-snug text-right">{book.title}</h1>

                  <p className="mt-4 text-gray-600 flex items-center justify-start gap-2 text-lg font-medium">
                    <User size={20} className="text-[#4A90E2]" />
                    مصنف / ناشر: <span className="text-gray-800 font-semibold">{book.author}</span>
                  </p>

                  {avgRating && (
                    <div className="mt-4 flex items-center gap-1.5 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200 w-fit">
                      <Star size={18} className="fill-amber-400 text-amber-400" />
                      <span className="font-bold text-gray-800 text-base">{avgRating}</span>
                      <span className="text-xs text-gray-400">({reviews.length} ریویوز)</span>
                    </div>
                  )}

                  {book.price ? (
                    <div className="mt-6 inline-flex items-baseline gap-1.5 rounded-2xl bg-blue-50/50 border border-blue-100 px-6 py-3 shadow-sm">
                      <span className="text-base font-medium text-[#4A90E2]">Rs</span>
                      <span className="text-4xl font-extrabold text-blue-700 tracking-tight">
                        {Number(book.price).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-6 inline-block bg-blue-100 text-[#4A90E2] px-5 py-2 rounded-xl text-base font-semibold">
                      مفت دستیاب
                    </div>
                  )}

                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={handleWhatsAppOrder}
                      className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-lg shadow-md hover:shadow-lg transition"
                    >
                      <MessageCircle size={22} /> واٹس ایپ پر آرڈر کریں
                    </button>
                  </div>
                </div>

                {reviews.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 justify-start">
                      <Star size={20} className="text-amber-500 fill-amber-400" /> قارئین کی رائے
                    </h3>
                    <div className="space-y-3 max-h-56 overflow-y-auto pl-1">
                      {reviews.map((r) => (
                        <div key={r.id} className="rounded-2xl bg-slate-50 p-4 border border-slate-100 transition hover:bg-white hover:shadow-md text-right">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800 text-sm">{r.customer_name}</span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={13} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                              ))}
                            </div>
                          </div>
                          <p className="mt-2 text-gray-600 text-sm leading-normal">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 bg-gradient-to-br from-blue-50 to-blue-100/40 p-10 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-blue-50 order-1 lg:order-2">
                <div className="relative h-96 w-64 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 border border-blue-100">
                  {book.image_url ? (
                    <img
                      src={book.image_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 flex flex-col items-center justify-center text-[#4A90E2]">
                      <BookOpen size={72} />
                      <span className="mt-3 text-base font-medium">سرورق دستیاب نہیں</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}