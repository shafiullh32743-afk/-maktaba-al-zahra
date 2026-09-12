"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, ShoppingCart, Star, Check, Trash2, PackageMinus, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filter, setFilter] = useState<"pending" | "approved">("pending");

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("id", { ascending: false });
    if (!error && data) setReviews(data);
    setLoaded(true);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (id: number) => {
    await supabase.from("reviews").update({ approved: true }).eq("id", id);
    fetchReviews();
  };

  const handleReject = async (id: number) => {
    await supabase.from("reviews").delete().eq("id", id);
    fetchReviews();
  };

  const pendingReviews = reviews.filter((r) => !r.approved);
  const approvedReviews = reviews.filter((r) => r.approved);
  const visibleReviews = filter === "pending" ? pendingReviews : approvedReviews;

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
          <Link href="/reviews" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md">
            <Star size={19} />
            ریویوز
            {pendingReviews.length > 0 && (
              <span className="mr-auto bg-white text-emerald-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingReviews.length}
              </span>
            )}
          </Link>
                    <Link href="/low-stock" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <PackageMinus size={19} />
            کم سٹاک
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

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">ریویوز</h2>
        <p className="mt-2 text-gray-500">نئے ریویوز کی منظوری دیں</p>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "pending"
                ? "bg-emerald-700 text-white"
                : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            زیر التوا ({pendingReviews.length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "approved"
                ? "bg-emerald-700 text-white"
                : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            منظور شدہ ({approvedReviews.length})
          </button>
        </div>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : visibleReviews.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">⭐</span>
            <p className="text-gray-500 text-lg">
              {filter === "pending" ? "کوئی نیا ریویو نہیں" : "ابھی کوئی ریویو منظور نہیں کیا گیا"}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-lg font-bold text-gray-800">{review.book_title}</h3>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={
                          star <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-2 text-gray-700 font-medium text-sm">{review.customer_name}</p>
                <p className="mt-2 text-gray-600">{review.comment}</p>

                {filter === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-emerald-700 hover:bg-emerald-100 transition text-sm font-medium"
                    >
                      <Check size={16} />
                      منظور کریں
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-red-600 hover:bg-red-100 transition text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      مسترد کریں
                    </button>
                  </div>
                )}

                {filter === "approved" && (
                  <div className="mt-4">
                    <button
                      onClick={() => handleReject(review.id)}
                      className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-red-600 hover:bg-red-100 transition text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      حذف کریں
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}