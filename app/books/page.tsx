"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, ShoppingCart, Upload, MessageCircle, Star, MessageSquarePlus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// عارضی ڈیلیوری فارمولا — بعد میں پاکستان پوسٹ کی اصل ریٹ لسٹ کے مطابق بدل دیا جائے گا
function calculateDeliveryCharge(weight: number) {
  if (weight <= 1) return 225;
  const extraKg = Math.ceil(weight - 1);
  return 225 + extraKg * 100;
}

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
  const [newPrice, setNewPrice] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderBookTitle, setOrderBookTitle] = useState("");
  const [orderBookPrice, setOrderBookPrice] = useState(0);
  const [orderBookWeight, setOrderBookWeight] = useState(1);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderName, setOrderName] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [orderAddress, setOrderAddress] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBookTitle, setReviewBookTitle] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

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

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("approved", true);
    if (data) setReviews(data);
  };

  useEffect(() => {
    fetchBooks();
    fetchReviews();
  }, []);

  const getBookRating = (title: string) => {
    const bookReviews = reviews.filter((r) => r.book_title === title);
    if (bookReviews.length === 0) return null;
    const avg = bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length;
    return { avg: avg.toFixed(1), count: bookReviews.length };
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.includes(search);
    const matchesCategory = filterCategory ? book.category === filterCategory : true;
    const matchesAuthor = filterAuthor ? book.author === filterAuthor : true;
    return matchesSearch && matchesCategory && matchesAuthor;
  });

  const existingCategories = Array.from(new Set(books.map((b) => b.category)));
  const existingAuthors = Array.from(new Set(books.map((b) => b.author)));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddBook = async () => {
    if (newTitle.trim() === "") return;
    setUploading(true);

    const finalCategory =
      newCategory === "__new__" ? customCategory.trim() : newCategory;

    let imageUrl = existingImageUrl;

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("book-covers")
        .upload(fileName, imageFile);

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("book-covers")
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    const bookData = {
      title: newTitle,
      author: newAuthor || "مكتبہ الزھراء",
      category: finalCategory || "عمومی",
      image_url: imageUrl,
      price: parseFloat(newPrice) || 0,
      weight: parseFloat(newWeight) || 1,
    };

    if (editingId) {
      await supabase.from("books").update(bookData).eq("id", editingId);
    } else {
      await supabase.from("books").insert(bookData);
    }

    setNewTitle("");
    setNewAuthor("");
    setNewCategory("");
    setCustomCategory("");
    setNewPrice("");
    setNewWeight("");
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setUploading(false);
    setShowModal(false);
    fetchBooks();
  };

  const handleEditClick = (book: any) => {
    setEditingId(book.id);
    setNewTitle(book.title);
    setNewAuthor(book.author);
    setNewCategory(book.category);
    setNewPrice(book.price?.toString() || "");
    setNewWeight(book.weight?.toString() || "");
    setExistingImageUrl(book.image_url || null);
    setImagePreview(book.image_url || null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDeleteBook = async (id: number) => {
    await supabase.from("books").delete().eq("id", id);
    fetchBooks();
  };

  const handleOrderClick = (book: any) => {
    setOrderBookTitle(book.title);
    setOrderBookPrice(book.price || 0);
    setOrderBookWeight(book.weight || 1);
    setOrderQuantity(1);
    setOrderName("");
    setOrderPhone("");
    setOrderAddress("");
    setOrderSuccess(false);
    setShowOrderModal(true);
  };

  const totalBookPrice = orderBookPrice * orderQuantity;
  const totalWeight = orderBookWeight * orderQuantity;
  const deliveryCharge = calculateDeliveryCharge(totalWeight);
  const totalBill = totalBookPrice + deliveryCharge;

  const sendToWhatsApp = () => {
    const message = `السلام علیکم، میں نے آرڈر کیا ہے:

📚 کتاب: ${orderBookTitle}
🔢 تعداد: ${orderQuantity}
👤 نام: ${orderName}
📞 فون: ${orderPhone}
📍 پتہ: ${orderAddress}

💰 کتاب کی قیمت: ${totalBookPrice} روپے
🚚 ڈیلیوری چارجز: ${deliveryCharge} روپے
💵 کل بل: ${totalBill} روپے`;

    const whatsappUrl = `https://wa.me/923055232889?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
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
      book_price: totalBookPrice,
      delivery_charge: deliveryCharge,
      total_amount: totalBill,
      quantity: orderQuantity,
    });

    setOrderSubmitting(false);
    setOrderSuccess(true);
  };

  const handleReviewClick = (title: string) => {
    setReviewBookTitle(title);
    setReviewName("");
    setReviewRating(5);
    setReviewComment("");
    setReviewSuccess(false);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (reviewName.trim() === "" || reviewComment.trim() === "") return;
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
          <Link href="/reviews" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <Star size={19} />
            ریویوز
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
              setNewPrice("");
              setNewWeight("");
              setImageFile(null);
              setImagePreview(null);
              setExistingImageUrl(null);
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

            {filteredBooks.map((book) => {
              const ratingInfo = getBookRating(book.title);
              return (
                <div
                  key={book.id}
                  className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
                >
                  <div className="h-40 w-full rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center border border-amber-200 overflow-hidden">
                    {book.image_url ? (
                      <img
                        src={book.image_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl">📚</span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-gray-800 line-clamp-2">{book.title}</h3>
                  <p className="mt-2 text-gray-500 text-sm">{book.author}</p>

                  {ratingInfo && (
                    <div className="mt-2 flex items-center gap-1">
                      <Star size={15} className="fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-gray-700">{ratingInfo.avg}</span>
                      <span className="text-xs text-gray-400">({ratingInfo.count} ریویوز)</span>
                    </div>
                  )}

                  <p className="mt-3 inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-medium text-emerald-700">
                    {book.category}
                  </p>

                  {book.price ? (
                    <div className="mt-3 inline-flex items-baseline gap-1 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 px-4 py-1.5 shadow-sm">
                      <span className="text-xs font-medium text-emerald-600">Rs</span>
                      <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">
                        {Number(book.price).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-gray-400 italic">قیمت درج نہیں</p>
                  )}

                  <button
                    onClick={() => handleOrderClick(book)}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 transition font-medium"
                  >
                    <ShoppingCart size={16} />
                    آرڈر کریں
                  </button>

                  <button
                    onClick={() => handleReviewClick(book.title)}
                    className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 transition font-medium text-sm"
                  >
                    <MessageSquarePlus size={15} />
                    ریویو دیں
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
              );
            })}
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800">
              {editingId ? "کتاب میں ترمیم کریں" : "نئی کتاب شامل کریں"}
            </h3>

            <label className="mt-5 block">
              <span className="text-sm text-gray-600">کتاب کی تصویر (اختیاری)</span>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-emerald-400 transition cursor-pointer relative">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="h-32 mx-auto rounded-lg object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400 py-4">
                    <Upload size={24} />
                    <span className="text-sm">تصویر منتخب کرنے کے لیے کلک کریں</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </label>

            <input
              type="text"
              placeholder="کتاب کا نام"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="mt-5 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <input
              type="text"
              placeholder="مصنف / ناشر"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <div className="mt-3 flex gap-3">
              <input
                type="number"
                placeholder="قیمت (روپے)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />

              <input
                type="number"
                step="0.1"
                placeholder="وزن (کلوگرام)"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

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
                disabled={uploading}
                className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition disabled:opacity-60"
              >
                {uploading ? "محفوظ ہو رہا ہے..." : editingId ? "محفوظ کریں" : "شامل کریں"}
              </button>

              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setNewTitle("");
                  setNewAuthor("");
                  setNewCategory("");
                  setCustomCategory("");
                  setNewPrice("");
                  setNewWeight("");
                  setImageFile(null);
                  setImagePreview(null);
                  setExistingImageUrl(null);
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

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">تعداد (نسخے)</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                      className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-gray-800">{orderQuantity}</span>
                    <button
                      onClick={() => setOrderQuantity(orderQuantity + 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">کتاب کی قیمت ({orderQuantity} × {orderBookPrice})</span>
                    <span className="font-medium text-gray-800">{totalBookPrice} روپے</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ڈیلیوری چارجز</span>
                    <span className="font-medium text-gray-800">{deliveryCharge} روپے</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-bold text-gray-800">کل بل</span>
                    <span className="font-bold text-emerald-700 text-lg">{totalBill} روپے</span>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="آپ کا نام"
                  value={orderName}
                  onChange={(e) => setOrderName(e.target.value)}
                  className="mt-4 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
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

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleSubmitOrder}
                    disabled={orderSubmitting}
                    className="w-full rounded-xl bg-amber-500 text-white py-3 hover:bg-amber-600 transition disabled:opacity-60"
                  >
                    {orderSubmitting ? "بھیجا جا رہا ہے..." : "آرڈر بھیجیں"}
                  </button>

                  <button
                    onClick={() => {
                      if (orderName.trim() === "" || orderPhone.trim() === "") return;
                      sendToWhatsApp();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white py-3 hover:bg-[#20BD5A] transition font-medium"
                  >
                    <MessageCircle size={18} />
                    WhatsApp پر آرڈر بھیجیں
                  </button>

                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="w-full rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition"
                  >
                    منسوخ کریں
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            {reviewSuccess ? (
              <div className="text-center py-6">
                <span className="text-5xl">✅</span>
                <h3 className="text-xl font-bold text-gray-800 mt-4">ریویو موصول ہو گیا</h3>
                <p className="text-gray-500 mt-2">
                  آپ کا ریویو منظوری کے بعد نظر آئے گا۔ شکریہ!
                </p>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="mt-6 w-full rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition"
                >
                  ٹھیک ہے
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-800">ریویو دیں</h3>
                <p className="text-gray-500 text-sm mt-1">{reviewBookTitle}</p>

                <div className="mt-5">
                  <span className="text-sm text-gray-600">ریٹنگ</span>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="transition"
                      >
                        <Star
                          size={30}
                          className={
                            star <= reviewRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="آپ کا نام"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="mt-4 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />

                <textarea
                  placeholder="اپنا تبصرہ لکھیں..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
                />

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting}
                    className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition disabled:opacity-60"
                  >
                    {reviewSubmitting ? "بھیجا جا رہا ہے..." : "ریویو بھیجیں"}
                  </button>

                  <button
                    onClick={() => setShowReviewModal(false)}
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