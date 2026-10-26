"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  FolderTree,
  Star,
  ArrowRight,
  User,
  Users,
  Receipt,
  Truck,
  Gift,
  Ticket,
  RotateCcw,
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
  Edit,
  Save,
  Trash2,
  ShoppingBag,
  Check,
  ShieldCheck,
  BadgeCheck,
  Facebook,
  Link2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { addToCart, getCartCount } from "@/lib/cart";

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

const WISHLIST_KEY = "maktaba-wishlist";

type Props = {
  initialBook: Book;
  initialReviews: Review[];
  initialRelated: Book[];
};

export default function BookDetailClient({ initialBook, initialReviews, initialRelated }: Props) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(initialBook);
  const [reviews] = useState<Review[]>(initialReviews);
  const [relatedBooks] = useState<Book[]>(initialRelated);
  const [loaded] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  // ایڈٹ اور اپ ڈیٹ کے لیے سٹیٹس (States)
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Book>>(initialBook);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // ایڈمن کی جانچ: لاگ ان کوکی موجود ہو تو ایڈٹ/ڈیلیٹ بٹن نظر آئیں گے
    setIsAdmin(/(^|;\s*)maktaba-auth=[^;]+/.test(document.cookie));
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      const list: number[] = stored ? JSON.parse(stored) : [];
      setIsLiked(list.includes(Number(initialBook.id)));
    } catch {
      // storage error handling
    }
  }, [initialBook.id]);

  useEffect(() => {
    // عام گاہکوں کے لیے ٹوکری میں موجود اشیا کی تعداد
    const refresh = () => setCartCount(getCartCount());
    refresh();
    window.addEventListener("maktaba-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("maktaba-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const handleAddToCart = () => {
    if (!book) return;
    addToCart({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      slug: book.slug,
      image_url: book.image_url,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1200);
  };

  // کتاب کی معلومات اپ ڈیٹ کرنے کا فنکشن
  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;

    setIsSaving(true);
    const { error } = await supabase
      .from("books")
      .update({
        title: editFormData.title,
        author: editFormData.author,
        category: editFormData.category,
        price: editFormData.price,
        image_url: editFormData.image_url,
      })
      .eq("id", book.id);

    setIsSaving(false);

    if (error) {
      alert("تبدیلی محفوظ کرنے میں مسئلہ آیا: " + error.message);
    } else {
      alert("کتاب کی معلومات کامیابی سے تبدیل ہو گئی ہیں!");
      setBook({ ...book, ...editFormData } as Book);
      setIsEditing(false);
    }
  };

  // کتاب ڈیلیٹ کرنے کا فنکشن
  const handleDeleteBook = async () => {
    if (!book) return;
    if (confirm("کیا آپ واقعی اس کتاب کو ڈیلیٹ کرنا چاہتے ہیں؟")) {
      const { error } = await supabase.from("books").delete().eq("id", book.id);
      if (error) {
        alert("کتاب ڈیلیٹ کرنے میں مسئلہ آیا: " + error.message);
      } else {
        alert("کتاب کامیابی سے ڈیلیٹ کر دی گئی ہے!");
        router.push("/books");
      }
    }
  };

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

  const handleFacebookShare = () => {
    const url = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(window.location.href);
    window.open(url, "_blank");
  };

  const handleWhatsAppShare = () => {
    if (!book) return;
    const message = book.title + " - " + window.location.href;
    const url = "https://wa.me/?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  };

  const toggleLike = () => {
    if (!book) return;
    const bid = Number(book.id);
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      let list: number[] = stored ? JSON.parse(stored) : [];
      if (list.includes(bid)) {
        list = list.filter((x) => x !== bid);
      } else {
        list.push(bid);
      }
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    } catch {
      // storage unavailable
    }
    setIsLiked((prev) => !prev);
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const menuItems = [
    { href: "/", label: "ڈیش بورڈ", icon: LayoutDashboard },
    { href: "/books", label: "کتب", icon: BookOpen, active: true },
    { href: "/authors", label: "مصنفین", icon: PenLine },
    { href: "/categories", label: "زمرے", icon: FolderTree },
    { href: "/orders", label: "آرڈرز", icon: ShoppingCart },
    { href: "/customers", label: "کسٹمرز", icon: Users },
    { href: "/bills", label: "بل", icon: Receipt },
    { href: "/suppliers", label: "سپلائرز", icon: Truck },
    { href: "/loyalty", label: "لائلٹی پوائنٹس", icon: Gift },
    { href: "/coupons", label: "کوپنز", icon: Ticket },
    { href: "/returns", label: "واپسی/خراب", icon: RotateCcw },
    { href: "/reviews", label: "ریویوز", icon: Star },
    { href: "/low-stock", label: "کم سٹاک", icon: PackageMinus },
    { href: "/expenses", label: "اخراجات", icon: Wallet },
  ];

  return (
    <main className="min-h-screen flex bg-slate-50/60 font-sans" dir="rtl">
      {isAdmin && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar - صرف ایڈمن کے لیے (لاگ اِن کے بعد) */}
      {isAdmin && (
        <aside
          className={`w-60 min-h-screen md:h-screen md:sticky md:top-0 border-r border-slate-200 bg-white p-4 flex flex-col fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 shadow-sm ${
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

          <nav className="mt-6 space-y-1 flex-1 overflow-y-auto pl-1">
            <p className="text-slate-400 text-[11px] font-semibold px-2 mb-1">مینو</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    item.active
                      ? "bg-emerald-50 text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} className={item.active ? "text-emerald-600" : "text-slate-400"} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

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
      )}

      <section className="flex-1 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Mobile Header - صرف ایڈمن کے لیے */}
        {isAdmin && (
          <div className="flex items-center justify-between md:hidden mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-bold text-slate-800">مكتبہ الزھراء</h1>
          </div>
        )}

        {/* عوامی (کسٹمر) ہیڈر - لاگ اِن کے بغیر دیکھنے والوں کے لیے */}
        {!isAdmin && (
          <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo.jpg" alt="مكتبہ الزھراء" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
              <h1 className="text-sm md:text-base font-bold text-slate-800">مكتبہ الزھراء</h1>
            </Link>
            <nav className="flex items-center gap-3 md:gap-4 text-xs font-semibold text-slate-600">
              <Link href="/shop" className="hover:text-emerald-600 transition">کتب</Link>
              <Link href="/" className="hover:text-emerald-600 transition">ہوم</Link>
              <Link href="/about" className="hover:text-emerald-600 transition">ہمارے بارے میں</Link>
              <Link href="/contact" className="hover:text-emerald-600 transition">رابطہ</Link>
              <Link href="/cart" className="relative hover:text-emerald-600 transition">
                <ShoppingBag size={17} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -left-2 bg-rose-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>
        )}

        <div className="w-full">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <Link
              href={isAdmin ? "/books" : "/shop"}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-xs transition"
            >
              <ArrowRight size={15} /> واپس کتب کی فہرست
            </Link>

            {book && isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition"
                >
                  <Edit size={14} />
                  {isEditing ? "منسوخ کریں" : "کتاب تبدیل کریں"}
                </button>

                <button
                  onClick={handleDeleteBook}
                  className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition"
                >
                  <Trash2 size={14} /> ڈیلیٹ کریں
                </button>
              </div>
            )}
          </div>

          {!loaded ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-xs font-medium text-slate-400 animate-pulse">معلومات لوڈ ہو رہی ہیں...</p>
            </div>
          ) : !book ? (
            <div className="p-10 bg-white rounded-xl shadow-xs border border-slate-200 text-center">
              <BookOpen className="mx-auto text-slate-300 mb-2" size={36} />
              <p className="text-sm text-slate-500 font-semibold">مطلوبہ کتاب نہیں ملی</p>
            </div>
          ) : isEditing && isAdmin ? (
            /* ایڈٹ فارم (Edit Mode) */
            <form onSubmit={handleUpdateBook} className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 space-y-4">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">کتاب کی معلومات میں تبدیلی کریں</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">کتاب کا عنوان</label>
                <input
                  type="text"
                  value={editFormData.title || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">مصنف کا نام</label>
                <input
                  type="text"
                  value={editFormData.author || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">زمرہ</label>
                  <input
                    type="text"
                    value={editFormData.category || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">قیمت (PKR)</label>
                  <input
                    type="number"
                    value={editFormData.price || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">تصویر کا لنک (Image URL)</label>
                <input
                  type="text"
                  value={editFormData.image_url || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, image_url: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs transition"
                >
                  <Save size={15} /> {isSaving ? "سیو ہو رہا ہے..." : "تبدیلی محفوظ کریں"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-lg transition"
                >
                  منسوخ کریں
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* کتاب کا مرکزی ڈسپلے کارڈ */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between order-2 lg:order-1">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-100">
                        <Tag size={12} /> {book.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={toggleLike}
                          className={`p-2 rounded-lg border transition ${
                            isLiked
                              ? "bg-rose-50 border-rose-200 text-rose-500"
                              : "bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500"
                          }`}
                        >
                          <Heart size={16} className={isLiked ? "fill-rose-500" : ""} />
                        </button>
                        <button
                          onClick={handleShare}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition relative"
                          title="لنک کاپی کریں"
                        >
                          <Share2 size={16} />
                          {copied && (
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded shadow-xs">
                              کاپی ہو گیا!
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    <h1 className="mt-4 text-2xl font-bold text-slate-900 leading-snug">{book.title}</h1>

                    <p className="mt-2 text-slate-600 flex items-center gap-2 text-sm font-medium">
                      <User size={16} className="text-blue-600" />
                      مصنف / ناشر: <span className="text-slate-800 font-semibold">{book.author}</span>
                    </p>

                    {avgRating && (
                      <div className="mt-3 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 w-fit">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-800 text-xs">{avgRating}</span>
                        <span className="text-[10px] text-slate-400">({reviews.length} ریویوز)</span>
                      </div>
                    )}

                    {book.price ? (
                      <div className="mt-5 inline-flex items-baseline gap-1 rounded-xl bg-blue-50 border border-blue-100 px-4 py-2">
                        <span className="text-xs font-semibold text-blue-500">Rs</span>
                        <span className="text-2xl font-bold text-blue-700 tracking-tight">
                          {Number(book.price).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-5 inline-block bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold">
                        مفت دستیاب
                      </div>
                    )}

                    {/* اعتماد کے بیجز */}
                    <div className="mt-5 bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <Truck size={15} className="text-blue-600 shrink-0" />
                        پاکستان بھر میں تیز ترسیل
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <ShieldCheck size={15} className="text-blue-600 shrink-0" />
                        محفوظ اور قابلِ اعتماد ادائیگی
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <BadgeCheck size={15} className="text-blue-600 shrink-0" />
                        مستند اور معتبر بک سٹور
                      </div>
                    </div>

                    {!isAdmin && (
                      <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                        <button
                          onClick={handleAddToCart}
                          className={`flex-1 font-semibold py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 text-xs shadow-xs transition ${
                            addedToCart
                              ? "bg-emerald-600 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {addedToCart ? (
                            <>
                              <Check size={16} /> ٹوکری میں شامل ہو گئی
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={16} /> ٹوکری میں شامل کریں
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleWhatsAppOrder}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 text-xs shadow-xs transition"
                        >
                          <MessageCircle size={16} /> واٹس ایپ پر آرڈر کریں
                        </button>
                      </div>
                    )}

                    {/* سوشل شیئر آئیکنز */}
                    <div className="mt-5 flex items-center gap-2.5">
                      <span className="text-[11px] font-semibold text-slate-400">شیئر کریں:</span>
                      <button
                        onClick={handleFacebookShare}
                        title="فیس بک پر شیئر کریں"
                        className="w-8 h-8 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center hover:bg-[#1877F2]/20 transition"
                      >
                        <Facebook size={15} />
                      </button>
                      <button
                        onClick={handleWhatsAppShare}
                        title="واٹس ایپ پر شیئر کریں"
                        className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366]/20 transition"
                      >
                        <MessageCircle size={15} />
                      </button>
                      <button
                        onClick={handleShare}
                        title="لنک کاپی کریں"
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
                      >
                        <Link2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* قارئین کی رائے (Reviews) */}
                  {reviews.length > 0 && (
                    <div className="mt-8 pt-5 border-t border-slate-100">
                      <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                        <Star size={15} className="text-amber-500 fill-amber-400" /> قارئین کی رائے
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto pl-1">
                        {reviews.map((r) => (
                          <div key={r.id} className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 text-xs">{r.customer_name}</span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} size={11} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                                ))}
                              </div>
                            </div>
                            <p className="mt-1 text-slate-600 text-xs">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* تصویر والا حصہ */}
                <div className="lg:col-span-5 bg-slate-50/50 p-6 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-100 order-1 lg:order-2">
                  <div className="relative h-80 w-52 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                    {book.image_url ? (
                      <img
                        src={book.image_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                        <BookOpen size={48} />
                        <span className="mt-2 text-xs font-medium">سرورق دستیاب نہیں</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* متعلقہ کتب (Related Books) */}
              {relatedBooks.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">متعلقہ کتابیں</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {relatedBooks.map((rb) => (
                      <Link
                        key={rb.id}
                        href={`/books/${rb.slug || encodeURIComponent(rb.title)}`}
                        className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs hover:border-slate-300 transition block"
                      >
                        <div className="relative h-28 w-full rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                          {rb.image_url ? (
                            <img src={rb.image_url} alt={rb.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen size={24} className="text-slate-300" />
                          )}
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-800 line-clamp-1">{rb.title}</p>
                        {rb.price ? (
                          <p className="mt-1 text-[11px] font-bold text-emerald-600">Rs {Number(rb.price).toLocaleString()}</p>
                        ) : (
                          <p className="mt-1 text-[10px] text-slate-400">مفت</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* عوامی فوٹر - صرف کسٹمرز کے لیے */}
        {!isAdmin && (
          <footer className="mt-10 pt-6 border-t border-slate-200 flex flex-col items-center gap-2.5">
            <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-9 w-auto rounded-md opacity-90" />
            <p className="text-slate-400 text-xs text-center">
              © 2026 مكتبہ الزھراء. جملہ حقوق محفوظ ہیں۔
            </p>
          </footer>
        )}
      </section>
    </main>
  );
}
