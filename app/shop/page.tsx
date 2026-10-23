"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Search, MessageCircle, Tag, ShoppingBag, Check } from "lucide-react";
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

export default function ShopPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data } = await supabase
        .from("books")
        .select("*")
        .order("id", { ascending: false });
      if (data) setBooks(data as Book[]);
      setLoaded(true);
    };
    fetchBooks();
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

  const handleWhatsAppOrder = (book: Book) => {
    const message = "السلام علیکم! میں یہ کتاب خریدنا چاہتا ہوں: " + book.title;
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

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 font-sans">
      {/* ہیڈر */}
      <header className="bg-emerald-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-10 w-auto rounded-md" />
            <span className="text-lg font-bold">مكتبہ الزھراء</span>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/shop" className="text-emerald-200">
              کتب
            </Link>
            <Link href="/" className="hover:text-emerald-200 transition">
              ہوم
            </Link>
            <Link href="/about" className="hover:text-emerald-200 transition">
              ہمارے بارے میں
            </Link>
            <Link href="/contact" className="hover:text-emerald-200 transition">
              رابطہ
            </Link>
            <Link href="/cart" className="relative hover:text-emerald-200 transition">
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -left-2 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ہماری کتب</h1>
          <p className="text-gray-500 mt-1">مكتبہ الزھراء کی دستیاب کتابیں — ٹوکری میں شامل کریں یا سیدھا واٹس ایپ پر آرڈر کریں</p>
        </div>

        {/* سرچ اور فلٹر */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="کتاب یا مصنف تلاش کریں..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-3 pr-10 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-gray-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition md:w-56"
          >
            <option value="">تمام زمرے</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filterAuthor}
            onChange={(e) => setFilterAuthor(e.target.value)}
            className="rounded-xl border border-gray-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition md:w-56"
          >
            <option value="">تمام مصنفین</option>
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
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 animate-pulse">
                <div className="h-40 w-full rounded-xl bg-gray-200" />
                <div className="h-4 w-3/4 bg-gray-200 rounded mt-4 mx-auto" />
                <div className="h-3 w-1/2 bg-gray-200 rounded mt-2 mx-auto" />
              </div>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">📖</span>
            <p className="text-gray-500 text-lg">کوئی کتاب نہیں ملی</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredBooks.map((book) => {
              const outOfStock = typeof book.stock === "number" && book.stock <= 0;
              return (
                <div
                  key={book.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col"
                >
                  <Link href={`/books/${book.slug || encodeURIComponent(book.title)}`} className="block">
                    <div className="h-40 w-full rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center border border-amber-200 overflow-hidden">
                      {book.image_url ? (
                        <img src={book.image_url} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="text-amber-300" size={36} />
                      )}
                    </div>

                    <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5">
                      <Tag size={10} /> {book.category}
                    </p>

                    <h3 className="mt-2 text-sm font-bold text-gray-800 line-clamp-2 leading-snug">{book.title}</h3>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-1">{book.author}</p>
                  </Link>

                  <div className="mt-3 flex items-center justify-between">
                    {book.price ? (
                      <span className="text-sm font-extrabold text-emerald-700">Rs {Number(book.price).toLocaleString()}</span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">قیمت درج نہیں</span>
                    )}
                    {outOfStock && (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-1.5 py-0.5">
                        سٹاک ختم
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddToCart(book)}
                    disabled={outOfStock}
                    className={`mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                      addedId === book.id
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {addedId === book.id ? (
                      <>
                        <Check size={14} /> ٹوکری میں شامل ہو گئی
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={14} /> ٹوکری میں شامل کریں
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleWhatsAppOrder(book)}
                    disabled={outOfStock}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] text-white py-2 text-xs font-semibold hover:bg-[#20BD5A] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <MessageCircle size={14} />
                    سیدھا واٹس ایپ پر آرڈر کریں
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* فوٹر */}
      <footer className="border-t border-gray-200 bg-white mt-10">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col items-center gap-3">
          <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-10 w-auto opacity-90" />
          <p className="text-gray-500 text-sm text-center">© 2026 مكتبہ الزھراء. جملہ حقوق محفوظ ہیں۔</p>
        </div>
      </footer>
    </main>
  );
}
