"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function BooksPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderBookTitle, setOrderBookTitle] = useState("");
  const [orderName, setOrderName] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [orderAddress, setOrderAddress] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data) {
      setBooks(data);
    }
    setLoaded(true);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.includes(search);
    const matchesCategory = filterCategory ? book.category === filterCategory : true;
    const matchesAuthor = filterAuthor ? book.author === filterAuthor : true;
    return matchesSearch && matchesCategory && matchesAuthor;
  });

  const existingCategories = Array.from(new Set(books.map((b) => b.category)));
  const existingAuthors = Array.from(new Set(books.map((b) => b.author)));

  const handleAddBook = async () => {
    if (newTitle.trim() === "") return;

    const finalCategory =
      newCategory === "__new__" ? customCategory.trim() : newCategory;

    if (editingId) {
      await supabase
        .from("books")
        .update({
          title: newTitle,
          author: newAuthor || "مكتبہ الزھراء",
          category: finalCategory || "عمومی",
        })
        .eq("id", editingId);
    } else {
      await supabase.from("books").insert({
        title: newTitle,
        author: newAuthor || "مكتبہ الزھراء",
        category: finalCategory || "عمومی",
      });
    }

    setNewTitle("");
    setNewAuthor("");
    setNewCategory("");
    setCustomCategory("");
    setEditingId(null);
    setShowModal(false);
    fetchBooks();
  };

  const handleEditClick = (book: any) => {
    setEditingId(book.id);
    setNewTitle(book.title);
    setNewAuthor(book.author);
    setNewCategory(book.category);
    setShowModal(true);
  };

  const handleDeleteBook = async (id: number) => {
    await supabase.from("books").delete().eq("id", id);
    fetchBooks();
  };

  const handleOrderClick = (title: string) => {
    setOrderBookTitle(title);
    setOrderName("");
    setOrderPhone("");
    setOrderAddress("");
    setOrderSuccess(false);
    setShowOrderModal(true);
  };

  const handleSubmitOrder = async () => {
    if (orderName.trim() === "" || orderPhone.trim() === "") return;
    setOrderSubmitting(true);

    await supabase.from("orders").insert({
      book_title: orderBookTitle,
      customer_name: orderName,
      customer_phone: orderPhone,
      customer_address: orderAddress,
      status: "نیا",
    });

    setOrderSubmitting(false);
    setOrderSuccess(true);
  };

  const hasActiveFilters = search || filterCategory || filterAuthor;

  return (
    <main className="min-h-screen flex bg-gray-50">
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      <aside
        className={`w-64 min-h-screen bg-blue-400 p-6 flex flex-col fixed md:static inset-y-0 right-0 z-50 transform transition-transform duration-300 ${
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
          <Link href="/books" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md">
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

      <section className="flex-1 p-5 md:p-10 w-full">
        <div className="flex items-center justify-between md:hidden mb-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-bold text-emerald-800">مكتبہ الزھراء</h1>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">ہماری کتب</h2>
            <p className="mt-2 text-gray-500">مكتبہ الزھراء کی کتب</p>
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setNewTitle("");
              setNewAuthor("");
              setNewCategory("");
              setShowModal(true);
            }}
            className="rounded-xl px-5 py-3 bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm w-full md:w-auto"
          >
            + کتاب شامل کریں
          </button>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="کتاب تلاش کریں..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition md:w-56"
          >
            <option value="">تمام زمرے</option>
            {existingCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filterAuthor}
            onChange={(e) => setFilterAuthor(e.target.value)}
            className="rounded-xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition md:w-56"
          >
            <option value="">تمام مصنفین</option>
            {existingAuthors.map((author) => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">
              {filteredBooks.length} نتائج ملے
            </span>
            <button
              onClick={() => {
                setSearch("");
                setFilterCategory("");
                setFilterAuthor("");
              }}
              className="text-sm text-emerald-700 hover:text-emerald-900 underline"
            >
              فلٹرز صاف کریں
            </button>
          </div>
        )}

        {!loaded ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
                <div className="h-40 w-full rounded-xl bg-gray-200" />
                <div className="h-5 w-3/4 bg-gray-200 rounded mt-5 mx-auto" />
                <div className="h-4 w-1/2 bg-gray-200 rounded mt-3 mx-auto" />
                <div className="h-8 w-full bg-gray-200 rounded-lg mt-5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredBooks.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <span className="text-6xl mb-4">📖</span>
                <p className="text-gray-500 text-lg">کوئی کتاب نہیں ملی</p>
                <p className="text-gray-400 text-sm mt-1">
                  کوئی مختلف نام تلاش کریں یا نئی کتاب شامل کریں
                </p>
              </div>
            )}

            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="h-40 w-full rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center border border-amber-200">
                  <span className="text-6xl">📚</span>
                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-800 line-clamp-2">{book.title}</h3>
                <p className="mt-2 text-gray-500 text-sm">{book.author}</p>

                <p className="mt-3 inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-medium text-emerald-700">
                  {book.category}
                </p>

                <button
                  onClick={() => handleOrderClick(book.title)}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 transition font-medium"
                >
                  <ShoppingCart size={16} />
                  آرڈر کریں
                </button>

                <div className="mt-2 w-full flex gap-2">
                  <Link
                    href={`/books/${encodeURIComponent(book.title)}`}
                    className="flex-1 rounded-lg bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 transition text-center"
                  >
                    تفصیل دیکھیں
                  </Link>

                  <button
                    onClick={() => handleEditClick(book)}
                    className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700 hover:bg-amber-100 transition"
                  >
                    ترمیم
                  </button>

                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 transition"
                  >
                    حذف کریں
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800">
              {editingId ? "کتاب میں ترمیم کریں" : "نئی کتاب شامل کریں"}
            </h3>

            <input
              type="text"
              placeholder="کتاب کا نام"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="mt-5 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              autoFocus
            />

            <input
              type="text"
              placeholder="مصنف / ناشر"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
            >
              <option value="">زمرہ منتخب کریں</option>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__new__">+ نیا زمرہ شامل کریں</option>
            </select>

            {newCategory === "__new__" && (
              <input
                type="text"
                placeholder="نئے زمرے کا نام لکھیں"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                autoFocus
              />
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAddBook}
                className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition"
              >
                {editingId ? "محفوظ کریں" : "شامل کریں"}
              </button>

              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setNewTitle("");
                  setNewAuthor("");
                  setNewCategory("");
                  setCustomCategory("");
                }}
                className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition"
              >
                منسوخ کریں
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            {orderSuccess ? (
              <div className="text-center py-6">
                <span className="text-5xl">✅</span>
                <h3 className="text-xl font-bold text-gray-800 mt-4">آرڈر موصول ہو گیا</h3>
                <p className="text-gray-500 mt-2">
                  ہم جلد آپ سے رابطہ کریں گے۔ شکریہ!
                </p>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="mt-6 w-full rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition"
                >
                  ٹھیک ہے
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-800">آرڈر کریں</h3>
                <p className="text-gray-500 text-sm mt-1">{orderBookTitle}</p>

                <input
                  type="text"
                  placeholder="آپ کا نام"
                  value={orderName}
                  onChange={(e) => setOrderName(e.target.value)}
                  className="mt-5 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  autoFocus
                />

                <input
                  type="tel"
                  placeholder="فون نمبر"
                  value={orderPhone}
                  onChange={(e) => setOrderPhone(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />

                <textarea
                  placeholder="مکمل پتہ"
                  value={orderAddress}
                  onChange={(e) => setOrderAddress(e.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
                />

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSubmitOrder}
                    disabled={orderSubmitting}
                    className="flex-1 rounded-xl bg-amber-500 text-white py-3 hover:bg-amber-600 transition disabled:opacity-60"
                  >
                    {orderSubmitting ? "بھیجا جا رہا ہے..." : "آرڈر بھیجیں"}
                  </button>

                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition"
                  >
                    منسوخ کریں
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}