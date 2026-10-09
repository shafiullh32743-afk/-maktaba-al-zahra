"use client";

import { useState, useEffect } from "react";
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
  Check,
  Trash2,
  PackageMinus,
  Wallet,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filter, setFilter] = useState<"pending" | "approved">("pending");

  const fetchReviews = async () => {
    setLoaded(false);
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
    { href: "/reviews", label: "ریویوز", icon: Star, active: true, badge: pendingReviews.length },
    { href: "/low-stock", label: "کم سٹاک", icon: PackageMinus },
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

      {/* Sidebar - مصنفین والے صفحے کے عین مطابق */}
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
                  <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.2">
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
            onClick={() => {
              document.cookie = "maktaba-auth=; path=/; max-age=0";
              window.location.href = "/login";
            }}
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

        {/* Title & Filter Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ریویوز ⭐</h2>
            <p className="text-xs text-slate-500 mt-0.5">قارئین کے تبصرے اور درجہ بندی (Rating) کی منظوری دیں</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilter("pending")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === "pending"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              زیر التوا ({pendingReviews.length})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === "approved"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              منظور شدہ ({approvedReviews.length})
            </button>
          </div>
        </div>

        {/* Cards Grid / Loading */}
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
        ) : visibleReviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <MessageSquare className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-xs text-slate-500">
              {filter === "pending" ? "کوئی نیا زیر التوا ریویو نہیں ہے" : "ابھی تک کوئی ریویو منظور نہیں کیا گیا"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-800 truncate max-w-[170px]" title={review.book_title}>
                      {review.book_title}
                    </h3>
                    <div className="flex items-center gap-0.5 dir-ltr">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={13}
                          className={
                            star <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit mb-2">
                    {review.customer_name}
                  </p>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    "{review.comment}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  {filter === "pending" ? (
                    <>
                      <button
                        onClick={() => handleReject(review.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition"
                      >
                        <Trash2 size={13} />
                        مسترد
                      </button>
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold transition shadow-xs"
                      >
                        <Check size={13} />
                        منظور کریں
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleReject(review.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition"
                    >
                      <Trash2 size={13} />
                      حذف کریں
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}