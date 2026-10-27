"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Search, MessageCircle, Tag, ShoppingBag, ShoppingCart, Check, Star, MapPin, Phone, X, Globe, Moon, Sun } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { addToCart, getCartCount } from "@/lib/cart";

interface Book {
  id: string;
  title: string;
  slug?: string;
  author: string;
  category: string;
  price?: number;
  stock?: number;
  image_url?: string;
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
        .from("books")
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
      price: book.price,
      slug: book.slug,
      image_url: book.image_url,
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
      <header className={`sticky top-0 z-30 shadow-md text-white ${darkMode ? "bg-gray-900" : "bg-emerald-800"}`}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-10 w-auto rounded-md" />
            <span className="text-lg font-bold">مكتبہ الزھراء</span>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/shop" className="text-emerald-200">
              {t.navBooks}
            </Link>
            <Link href="/" className="hover:text-emerald-200 transition">
              {t.navHome}
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
        <div className="mb-6">
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{t.heading}</h1>
          <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t.subHeading}</p>
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
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">📖</span>
            <p className={darkMode ? "text-gray-400 text-lg" : "text-gray-500 text-lg"}>{t.noBooks}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredBooks.map((book) => {
              const outOfStock = typeof book.stock === "number" && book.stock <= 0;
              const rating = getBookRating(book.title);
              return (
                <div
                  key={book.id}
                  className={`rounded-2xl border p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col ${
                    darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
                  }`}
                >
                  <Link href={`/books/${book.slug || encodeURIComponent(book.title)}`} className="block">
                    <div className={`h-40 w-full rounded-xl flex items-center justify-center border overflow-hidden ${
                      darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" : "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"
                    }`}>
                      {book.image_url ? (
                        <img src={book.image_url} alt={book.title} className="w-full h-full object-cover" />
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
                      <span className="text-sm font-extrabold text-emerald-500">Rs {Number(book.price).toLocaleString()}</span>
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
