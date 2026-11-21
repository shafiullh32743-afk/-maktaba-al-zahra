"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Search, MessageCircle, Tag, ShoppingBag, ShoppingCart, Check, Star, MapPin, Phone, X, Globe, Moon, Sun } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { addToCart, getCartCount } from "@/lib/cart";
import { effectivePrice, isOnSale, salePercent } from "@/lib/sale";

interface Book {
  id: string;
  title: string;
  slug?: string;
  author: string;
  category: string;
  price?: number;
  sale_price?: number | null;
  sale_ends_at?: string | null;
  stock?: number;
  image_url?: string;
 weight?: number;
  views?: number;
}

interface Review {
  id: number;
  book_title: string;
  customer_name: string;
  rating: number;
  comment: string;
  approved: boolean;
}

export default function ShopPage() {
  const [lang, setLang] = useState<"ur" | "en">("ur");
  const [darkMode, setDarkMode] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("default");
  const [onlySale, setOnlySale] = useState(false);

  // سٹاک آنے پر اطلاع کے لیے
  const [alertBook, setAlertBook] = useState<string | null>(null);
  const [alertPhone, setAlertPhone] = useState("");
  const [alertBusy, setAlertBusy] = useState(false);
  const [alertDone, setAlertDone] = useState(false);

  // ریویو لکھنے کے لیے
  const [reviewBookTitle, setReviewBookTitle] = useState<string | null>(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("maktaba-dark-mode");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("maktaba-dark-mode", darkMode ? "true" : "false");
  }, [darkMode]);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data } = await supabase
        .from("books_public")
        .select("*")
        .order("id", { ascending: false });
      if (data) setBooks(data as Book[]);
      setLoaded(true);
    };
    const fetchReviews = async () => {
      const { data } = await supabase.from("reviews").select("*").eq("approved", true);
      if (data) setReviews(data as Review[]);
    };
    fetchBooks();
    fetchReviews();
  }, []);

  useEffect(() => {
    const refresh = () => setCartCount(getCartCount());
    refresh();
    window.addEventListener("maktaba-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("maktaba-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const t = {
    ur: {
      navBooks: "کتب",
      navHome: "ہوم",
      navAbout: "ہمارے بارے میں",
      navContact: "رابطہ",
      waFloating: "واٹس ایپ پر رابطہ کریں",
      heading: "ہماری کتب",
      subHeading: "مكتبہ الزھراء کی دستیاب کتابیں — ٹوکری میں شامل کریں یا سیدھا واٹس ایپ پر آرڈر کریں اور اگر مطلوبہ كتاب نظر نہ آئے تو واٹس ایپ پر رابطہ كریں 03055232889",
      searchPlaceholder: "کتاب یا مصنف تلاش کریں...",
      allCategories: "تمام زمرے",
      allAuthors: "تمام مصنفین",
      noBooks: "کوئی کتاب نہیں ملی",
      priceNotSet: "قیمت درج نہیں",
      outOfStock: "سٹاک ختم",
      addedToCart: "ٹوکری میں شامل ہو گئی",
      addToCart: "ٹوکری میں شامل کریں",
      orderOnWhatsApp: "سیدھا واٹس ایپ پر آرڈر کریں",
      writeReview: "ریویو لکھیں",
      footerDesc: "آن لائن اسلامک بک سٹور جہاں تمام دینی، علمی وادبی کتب مناسب قیمت پر دستیاب ہیں۔",
      address: "پتہ",
      addressDetails: "مکتبہ الزہراء، نزد جامعہ الحسنین فیصل آباد، پاکستان",
      contactLabel: "رابطہ",
      waMessage: "واٹس ایپ پر پیغام بھیجیں",
      copyright: "© 2026 مكتبہ الزھراء. جملہ حقوق محفوظ ہیں۔",
      reviewModalTitle: "ریویو لکھیں",
      bookLabel: "کتاب",
      yourName: "آپ کا نام",
      rating: "ریٹنگ",
      comment: "تبصرہ",
      sendReview: "ریویو بھیجیں",
      sending: "بھیجا جا رہا ہے...",
      thankYou: "شکریہ! آپ کا ریویو موصول ہو گیا",
      pendingApproval: "منظوری کے بعد یہ دوسرے گاہکوں کو نظر آئے گا",
      ok: "ٹھیک ہے",
      newBooks: "🆕 نئی آنے والی کتب",
      popularBooks: "🔥 مقبول کتب",
      notifyMe: "سٹاک آنے پر اطلاع دیں",
      notifyTitle: "سٹاک آنے پر اطلاع",
      notifyHint: "اپنا واٹس ایپ / فون نمبر لکھیں، کتاب آتے ہی ہم رابطہ کریں گے",
      notifyPhone: "فون نمبر",
      notifySend: "نوٹ کریں",
      notifyDone: "شکریہ! کتاب آتے ہی آپ سے رابطہ کیا جائے گا",
      trackOrder: "آرڈر کی حالت",
    },
    en: {
      navBooks: "Books",
      navHome: "Home",
      navAbout: "About",
      navContact: "Contact",
      waFloating: "Contact on WhatsApp",
      heading: "Our Books",
      subHeading: "Available books at Maktaba Al-Zahra — add to cart or order directly on WhatsApp",
      searchPlaceholder: "Search book or author...",
      allCategories: "All Categories",
      allAuthors: "All Authors",
      noBooks: "No books found",
      priceNotSet: "Price Not Set",
      outOfStock: "Out of Stock",
      addedToCart: "Added to Cart",
      addToCart: "Add to Cart",
      orderOnWhatsApp: "Order Directly on WhatsApp",
      writeReview: "Write a Review",
      footerDesc: "Online Islamic bookstore offering religious and literary books at affordable prices.",
      address: "Address",
      addressDetails: "Maktaba Al-Zahra, Near Jamia Al-Hasanain, Faisalabad, Pakistan",
      contactLabel: "Contact",
      waMessage: "Send a WhatsApp message",
      copyright: "© 2026 Maktaba Al-Zahra. All rights reserved.",
      reviewModalTitle: "Write a Review",
      bookLabel: "Book",
      yourName: "Your Name",
      rating: "Rating",
      comment: "Comment",
      sendReview: "Submit Review",
      sending: "Sending...",
      thankYou: "Thank you! Your review has been received",
      pendingApproval: "It will be visible to other customers after approval",
      ok: "OK",
      newBooks: "🆕 New Arrivals",
      popularBooks: "🔥 Popular Books",
      notifyMe: "Notify me when available",
      notifyTitle: "Back-in-stock alert",
      notifyHint: "Enter your WhatsApp / phone number and we will contact you when it arrives",
      notifyPhone: "Phone number",
      notifySend: "Save",
      notifyDone: "Thank you! We will contact you when the book arrives",
      trackOrder: "Track Order",
    },
  }[lang];

  const categories = Array.from(new Set(books.map((b) => b.category).filter(Boolean)));
  const authors = Array.from(new Set(books.map((b) => b.author).filter(Boolean))).sort();

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.author || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || b.category === filterCategory;
    const matchesAuthor = !filterAuthor || b.author === filterAuthor;
    return matchesSearch && matchesCategory && matchesAuthor;
  });

  const getBookRating = (title: string) => {
    const bookReviews = reviews.filter((r) => r.book_title === title);
    if (bookReviews.length === 0) return null;
    const avg = bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length;
    return { avg: avg.toFixed(1), count: bookReviews.length };
  };

  const handleWhatsAppOrder = (book: Book) => {
    const message = "السلام علیکم! میں یہ کتاب خریدنا چاہتا ہوں مجھے اس كے بارے میں مزید معلومات مل سكتی ہیں؟: " + book.title;
    const url = "https://wa.me/923055232889?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  };

  const handleAddToCart = (book: Book) => {
        addToCart({
      id: book.id,
      title: book.title,
      author: book.author,
      price: effectivePrice(book) || book.price,
      slug: book.slug,
      image_url: book.image_url,
      weight: book.weight,
    });
    setAddedId(book.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const openReviewModal = (title: string) => {
    setReviewBookTitle(title);
    setReviewName("");
    setReviewRating(5);
    setReviewComment("");
    setReviewSuccess(false);
  };

  const closeReviewModal = () => setReviewBookTitle(null);

  const openAlert = (title: string) => {
    setAlertBook(title);
    setAlertPhone("");
    setAlertDone(false);
  };

  const submitAlert = async () => {
    const phone = alertPhone.replace(/[^0-9+]/g, "");
    if (!alertBook || phone.length < 10) return;
    setAlertBusy(true);
    await supabase.from("stock_alerts").insert({ book_title: alertBook, phone });
    setAlertBusy(false);
    setAlertDone(true);
  };

  const saleList = books.filter((b) => isOnSale(b) && !(typeof b.stock === "number" && b.stock <= 0)).slice(0, 10);
  const shownBooks = (() => {
    const arr = filteredBooks.filter((b) => !onlySale || isOnSale(b));
    if (sortBy === "priceAsc") arr.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    else if (sortBy === "priceDesc") arr.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    else if (sortBy === "popular") arr.sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (sortBy === "name") arr.sort((a, b) => a.title.localeCompare(b.title, "ur"));
    return arr;
  })();
  const showHighlights = !search && !filterCategory && !filterAuthor;
  const newBooksList = books.filter((b) => !(typeof b.stock === "number" && b.stock <= 0)).slice(0, 8);
  const popularList = [...books]
    .filter((b) => (b.views || 0) > 0 && !(typeof b.stock === "number" && b.stock <= 0))
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 8);

  const renderStrip = (title: string, list: Book[]) =>
    list.length === 0 ? null : (
      <div className="mb-8">
        <h2 className={`text-lg font-bold mb-3 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{title}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {list.map((b) => (
            <Link
              key={b.id}
              href={`/books/${b.slug || encodeURIComponent(b.title)}`}
              className={`snap-start shrink-0 w-32 rounded-xl border p-2 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <div className={`h-32 w-full rounded-lg overflow-hidden flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-amber-50"}`}>
                {b.image_url ? (
                  <img src={b.image_url} alt={b.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="text-amber-300" size={28} />
                )}
              </div>
              <p className={`mt-2 text-[11px] font-bold line-clamp-2 leading-snug ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{b.title}</p>
              {b.price ? (
                <p className="mt-1 text-[11px] font-extrabold text-emerald-500">
                  Rs {effectivePrice(b).toLocaleString()}
                  {isOnSale(b) && <span className="ms-1 text-[9px] font-semibold text-gray-400 line-through">{Number(b.price).toLocaleString()}</span>}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    );

  const handleSubmitReview = async () => {
    if (!reviewBookTitle || reviewName.trim() === "" || reviewComment.trim() === "") return;
    setReviewSubmitting(true);
    await supabase.from("reviews").insert({
      book_title: reviewBookTitle,
      customer_name: reviewName,
      rating: reviewRating,
      comment: reviewComment,
      approved: false,
    });
    setReviewSubmitting(false);
    setReviewSuccess(true);
  };

  return (
    <main dir={lang === "ur" ? "rtl" : "ltr"} className={`min-h-screen font-sans transition-colors ${darkMode ? "bg-gray-950" : "bg-gray-50"}`}>
      {/* فلوٹنگ واٹس ایپ بٹن */}
      <a
        href="https://wa.me/923055232889"
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-6 ${lang === "ur" ? "left-6" : "right-6"} z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-lg transition transform hover:scale-105 flex items-center justify-center group`}
        title={t.waFloating}
      >
        <MessageCircle size={24} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-semibold pr-0 group-hover:pr-2">
          {t.waFloating}
        </span>
      </a>

      {/* ہیڈر */}
      <header className={`sticky top-0 z-30 shadow-md text-white ${darkMode ? "bg-gray-900" : "bg-gradient-to-l from-emerald-800 to-teal-700"}`}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-10 w-auto rounded-md" />
            <span className="text-lg font-bold">مكتبہ الزھراء</span>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/track" className="hover:text-emerald-200 transition">
              {t.trackOrder}
            </Link>
            <Link href="/shop" className="text-emerald-200">
              {t.navBooks}
            </Link>
                        <Link href="/about" className="hover:text-emerald-200 transition">
              {t.navAbout}
            </Link>
            <Link href="/contact" className="hover:text-emerald-200 transition">
              {t.navContact}
            </Link>
                              <Link
                  href="/cart"
                                   className={`relative flex items-center justify-center rounded-lg transition p-2 ${
                    darkMode ? "bg-orange-500/20 hover:bg-orange-500/30" : "bg-orange-50 hover:bg-orange-100"
                  }`}
                >
                  <ShoppingCart size={16} className="text-orange-500" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center justify-center rounded-lg transition p-1.5 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-emerald-700 hover:bg-emerald-600"}`}
              title={darkMode ? "لائٹ موڈ" : "ڈارک موڈ"}
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={() => setLang(lang === "ur" ? "en" : "ur")}
              className={`flex items-center gap-1 rounded-lg transition px-2 py-1 text-xs font-bold ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-emerald-700 hover:bg-emerald-600"}`}
            >
              <Globe size={14} />
              {lang === "ur" ? "EN" : "اردو"}
            </button>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 py-8">
        {/* نمایاں بینر */}
        <div className={`relative overflow-hidden rounded-3xl p-6 md:p-10 mb-5 ${darkMode ? "bg-gradient-to-br from-emerald-950 to-gray-900 text-white" : "bg-gradient-to-br from-emerald-700 via-teal-600 to-sky-600 text-white shadow-[0_10px_40px_rgba(16,185,129,0.25)]"}`}>
          <div className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 right-10 w-64 h-64 rounded-full bg-amber-300/20 blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="max-w-xl">
              <h1 className="text-2xl md:text-4xl font-extrabold leading-snug">{t.heading}</h1>
              <p className="mt-2 text-sm md:text-base text-white/85 leading-relaxed">{t.subHeading}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => { setOnlySale(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-white text-rose-600 px-4 py-2 text-xs font-extrabold shadow-md hover:scale-105 transition">
                  🔥 {lang === "ur" ? "سیل والی کتب" : "Books on sale"}{saleList.length > 0 ? ` (${books.filter((b) => isOnSale(b)).length})` : ""}
                </button>
                <Link href="/track" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/30 px-4 py-2 text-xs font-bold hover:bg-white/25 transition">
                  📦 {t.trackOrder}
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-center shrink-0">
              {[
                [books.length, lang === "ur" ? "کتب" : "Books"],
                [categories.length, lang === "ur" ? "زمرے" : "Categories"],
                [authors.length, lang === "ur" ? "مصنفین" : "Authors"],
              ].map(([n, l]) => (
                <div key={String(l)} className="rounded-2xl bg-white/15 border border-white/20 px-4 py-3 backdrop-blur">
                  <p className="text-xl md:text-2xl font-extrabold">{n}</p>
                  <p className="text-[11px] text-white/80">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* اعتماد کی پٹی */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
          {[
            ["🚚", lang === "ur" ? "پورے پاکستان میں ترسیل" : "Nationwide delivery"],
            ["💵", lang === "ur" ? "کیش آن ڈلیوری" : "Cash on delivery"],
            ["✅", lang === "ur" ? "اصل اور معتبر کتب" : "Genuine books"],
            ["💬", lang === "ur" ? "واٹس ایپ پر فوری مدد" : "WhatsApp support"],
          ].map(([ic, tx]) => (
            <div key={String(tx)} className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-[11px] md:text-xs font-semibold ${darkMode ? "bg-gray-900 border-gray-800 text-gray-300" : "bg-white border-gray-100 text-gray-600 shadow-[0_2px_12px_rgba(15,23,42,0.05)]"}`}>
              <span className="text-base">{ic}</span>
              {tx}
            </div>
          ))}
        </div>

        {/* سرچ اور فلٹر */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${lang === "ur" ? "right-3" : "left-3"}`} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition ${lang === "ur" ? "pr-10" : "pl-10"} ${
                darkMode ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white border-gray-200 text-gray-900"
              }`}
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition md:w-56 ${
              darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            <option value="">{t.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filterAuthor}
            onChange={(e) => setFilterAuthor(e.target.value)}
            className={`rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition md:w-56 ${
              darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            <option value="">{t.allAuthors}</option>
            {authors.map((author) => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>
        </div>

        {/* زمروں کے چپس + ترتیب */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["", ...categories].map((cat) => (
              <button
                key={cat || "all"}
                onClick={() => setFilterCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
                  filterCategory === cat
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : darkMode
                    ? "bg-gray-900 border-gray-700 text-gray-300"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-emerald-50"
                }`}
              >
                {cat || t.allCategories}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlySale((v) => !v)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold border transition ${onlySale ? "bg-rose-500 border-rose-500 text-white" : darkMode ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-rose-500 hover:bg-rose-50"}`}
            >
              🔥 {lang === "ur" ? "صرف سیل" : "Sale only"}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${darkMode ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-700"}`}
            >
              <option value="default">{lang === "ur" ? "ترتیب: نئی پہلے" : "Sort: Newest"}</option>
              <option value="popular">{lang === "ur" ? "مقبول پہلے" : "Most popular"}</option>
              <option value="priceAsc">{lang === "ur" ? "قیمت: کم سے زیادہ" : "Price: low to high"}</option>
              <option value="priceDesc">{lang === "ur" ? "قیمت: زیادہ سے کم" : "Price: high to low"}</option>
              <option value="name">{lang === "ur" ? "نام کے مطابق" : "By name"}</option>
            </select>
            <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              {shownBooks.length} {lang === "ur" ? "کتب" : "books"}
            </span>
          </div>
        </div>

        {loaded && showHighlights && (
          <>
            {renderStrip(lang === "ur" ? "🔥 سیل — خاص رعایت" : "🔥 On Sale", saleList)}
            {renderStrip(t.newBooks, newBooksList)}
            {renderStrip(t.popularBooks, popularList)}
          </>
        )}

        {/* کتابوں کی گرڈ */}
        {!loaded ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`rounded-2xl border p-4 animate-pulse ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
                <div className={`h-40 w-full rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-200"}`} />
                <div className={`h-4 w-3/4 rounded mt-4 mx-auto ${darkMode ? "bg-gray-800" : "bg-gray-200"}`} />
                <div className={`h-3 w-1/2 rounded mt-2 mx-auto ${darkMode ? "bg-gray-800" : "bg-gray-200"}`} />
              </div>
            ))}
          </div>
        ) : shownBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">📖</span>
            <p className={darkMode ? "text-gray-400 text-lg" : "text-gray-500 text-lg"}>{t.noBooks}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {shownBooks.map((book) => {
              const outOfStock = typeof book.stock === "number" && book.stock <= 0;
              const rating = getBookRating(book.title);
              return (
                <div
                  key={book.id}
                  className={`relative rounded-3xl border p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col ${
                    darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100 shadow-[0_2px_16px_rgba(15,23,42,0.06)]"
                  }`}
                >
                  {isOnSale(book) && (
                    <span className="absolute top-2.5 right-2.5 z-10 rounded-full bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 shadow-md shadow-rose-500/30">
                      🔥 -{salePercent(book)}%
                    </span>
                  )}
                  <Link href={`/books/${book.slug || encodeURIComponent(book.title)}`} className="block">
                    <div className={`h-40 w-full rounded-2xl flex items-center justify-center border overflow-hidden ${
                      darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" : "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"
                    }`}>
                      {book.image_url ? (
                        <img src={book.image_url} alt={book.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                      ) : (
                        <BookOpen className="text-amber-300" size={36} />
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-md px-2 py-0.5 border ${
                        darkMode ? "text-emerald-400 bg-emerald-950 border-emerald-800" : "text-emerald-700 bg-emerald-50 border-emerald-100"
                      }`}>
                        <Tag size={10} /> {book.category}
                      </p>
                      {rating && (
                        <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          {rating.avg} ({rating.count})
                        </p>
                      )}
                    </div>

                    <h3 className={`mt-2 text-sm font-bold line-clamp-2 leading-snug ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{book.title}</h3>
                    <p className={`mt-1 text-xs line-clamp-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{book.author}</p>
                  </Link>

                  <div className="mt-3 flex items-center justify-between">
                    {book.price ? (
                      <span className="flex items-baseline gap-1.5">
                        <span className={`text-sm font-extrabold ${isOnSale(book) ? "text-rose-500" : "text-emerald-500"}`}>Rs {effectivePrice(book).toLocaleString()}</span>
                        {isOnSale(book) && (
                          <>
                            <span className="text-[11px] text-gray-400 line-through">{Number(book.price).toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-white bg-rose-500 rounded-full px-1.5 py-0.5">-{salePercent(book)}%</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className={`text-xs italic ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{t.priceNotSet}</span>
                    )}
                    {outOfStock && (
                      <span className="text-[10px] font-semibold text-rose-500 bg-rose-950 border border-rose-800 rounded-md px-1.5 py-0.5">
                        {t.outOfStock}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddToCart(book)}
                    disabled={outOfStock}
                    className={`mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                      addedId === book.id
                        ? "bg-emerald-600 text-white"
                        : darkMode
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {addedId === book.id ? (
                      <>
                        <Check size={14} /> {t.addedToCart}
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={14} /> {t.addToCart}
                      </>
                    )}
                  </button>

                  {outOfStock && (
                    <button
                      onClick={() => openAlert(book.title)}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 text-white py-2 text-xs font-semibold hover:bg-amber-600 transition"
                    >
                      🔔 {t.notifyMe}
                    </button>
                  )}

                  <button
                    onClick={() => handleWhatsAppOrder(book)}
                    disabled={outOfStock}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] text-white py-2 text-xs font-semibold hover:bg-[#20BD5A] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <MessageCircle size={14} />
                    {t.orderOnWhatsApp}
                  </button>

                  <button
                    onClick={() => openReviewModal(book.title)}
                    className={`mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition ${
                      darkMode ? "bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Star size={13} />
                    {t.writeReview}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* فوٹر */}
      <footer className={`border-t mt-10 ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
        <div className={`max-w-6xl mx-auto px-5 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm ${lang === "ur" ? "text-right" : "text-left"}`}>
          <div className="flex flex-col items-center md:items-start text-center md:text-right">
            <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-10 w-auto opacity-90 mb-3" />
            <p className={`text-[13px] leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t.footerDesc}</p>
          </div>

          <div className="text-center md:text-right">
            <h4 className={`font-bold mb-2 flex items-center justify-center md:justify-start gap-1.5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
              <MapPin size={15} className="text-emerald-600" /> {t.address}
            </h4>
            <p className={`text-[13px] leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t.addressDetails}</p>
          </div>

          <div className="text-center md:text-right">
            <h4 className={`font-bold mb-2 flex items-center justify-center md:justify-start gap-1.5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
              <Phone size={15} className="text-emerald-600" /> {t.contactLabel}
            </h4>
            <a href="tel:+923055232889" dir="ltr" className={`text-[13px] hover:text-emerald-600 transition block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              0305-5232889
            </a>
            <a
              href="https://wa.me/923055232889"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] text-[13px] font-semibold hover:underline mt-1 inline-block"
            >
              {t.waMessage}
            </a>
          </div>
        </div>
        <div className={`border-t py-4 ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
          <p className={`text-xs text-center ${darkMode ? "text-gray-600" : "text-gray-400"}`}>{t.copyright}</p>
        </div>
      </footer>

      {/* سٹاک آنے پر اطلاع کا موڈل */}
      {alertBook && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAlertBook(null)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-sm p-5 ${darkMode ? "bg-gray-900" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-bold text-sm ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{t.notifyTitle}</h3>
              <button onClick={() => setAlertBook(null)} className={darkMode ? "text-gray-500" : "text-gray-400"}>
                <X size={18} />
              </button>
            </div>
            {alertDone ? (
              <div className="py-6 text-center">
                <Check className="mx-auto text-emerald-600 mb-2" size={32} />
                <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{t.notifyDone}</p>
                <button onClick={() => setAlertBook(null)} className="mt-4 rounded-lg bg-emerald-700 text-white text-xs font-semibold px-4 py-2">
                  {t.ok}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{alertBook}</p>
                <p className={`text-[11px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{t.notifyHint}</p>
                <input
                  type="tel"
                  dir="ltr"
                  value={alertPhone}
                  onChange={(e) => setAlertPhone(e.target.value)}
                  placeholder="03XXXXXXXXX"
                  className={`w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                    darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
                  }`}
                />
                <button
                  onClick={submitAlert}
                  disabled={alertBusy || alertPhone.replace(/[^0-9+]/g, "").length < 10}
                  className="w-full rounded-lg bg-emerald-700 text-white text-sm font-semibold py-2.5 hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  {alertBusy ? t.sending : t.notifySend}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ریویو لکھنے کا موڈل */}
      {reviewBookTitle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeReviewModal}>
          <div
            className={`rounded-2xl shadow-xl w-full max-w-sm p-5 ${darkMode ? "bg-gray-900" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-bold text-sm ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{t.reviewModalTitle}</h3>
              <button onClick={closeReviewModal} className={darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}>
                <X size={18} />
              </button>
            </div>

            {reviewSuccess ? (
              <div className="py-6 text-center">
                <Check className="mx-auto text-emerald-600 mb-2" size={32} />
                <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{t.thankYou}</p>
                <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{t.pendingApproval}</p>
                <button
                  onClick={closeReviewModal}
                  className="mt-4 rounded-lg bg-emerald-700 text-white text-xs font-semibold px-4 py-2 hover:bg-emerald-800 transition"
                >
                  {t.ok}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t.bookLabel}: {reviewBookTitle}</p>

                <div>
                  <label className={`block mb-1 text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t.yourName}</label>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className={`w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                      darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t.rating}</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setReviewRating(s)}>
                        <Star
                          size={22}
                          className={s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block mb-1 text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t.comment}</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className={`w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                      darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
                    }`}
                  />
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting || reviewName.trim() === "" || reviewComment.trim() === ""}
                  className="w-full rounded-lg bg-emerald-700 text-white text-sm font-semibold py-2.5 hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  {reviewSubmitting ? t.sending : t.sendReview}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}