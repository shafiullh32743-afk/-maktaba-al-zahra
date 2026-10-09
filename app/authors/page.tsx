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
  Gift,
  Ticket,
  RotateCcw,
  Star,
  PackageMinus,
  Wallet,
  Search,
  ArrowUpRight,
  UserCheck,
  Plus,
  Edit2,
  BookMarked
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Book {
  id: string | number;
  title: string;
  slug?: string;
  author: string;
}

export default function AuthorsPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authorNameInput, setAuthorNameInput] = useState("");
  const [editingAuthor, setEditingAuthor] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ڈیٹا حاصل کرنے کا فنکشن
  const fetchBooks = async () => {
    setLoaded(false);
    const { data, error } = await supabase.from("books").select("*");
    if (!error && data) {
      setBooks(data);
    }
    setLoaded(true);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // مصنف کے نام کے ساتھ ہر کتاب کا عنوان اور تفصیلات محفوظ کرنا
  const authorMap: Record<string, Book[]> = {};
  books.forEach((book) => {
    if (book.author) {
      const trimmedAuthor = book.author.trim();
      if (!authorMap[trimmedAuthor]) authorMap[trimmedAuthor] = [];
      authorMap[trimmedAuthor].push(book);
    }
  });

  const authors = Object.keys(authorMap);

  // سرچ کی بنیاد پر فلٹرنگ
  const filteredAuthors = authors.filter((author) => {
    const matchesAuthor = author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBook = authorMap[author].some((book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesAuthor || matchesBook;
  });

  // نیا مصنف شامل کرنے / یا ایڈٹ کرنے کی منطق
  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorNameInput.trim()) return;

    setIsSubmitting(true);

    if (editingAuthor) {
      // اگر مصنف کے نام میں ترمیم کی جا رہی ہے تو تمام بکس میں مصنف کا نام اپڈیٹ کریں
      const { error } = await supabase
        .from("books")
        .update({ author: authorNameInput.trim() })
        .eq("author", editingAuthor);

      if (!error) {
        await fetchBooks();
        closeModal();
      } else {
        alert("مصنف اپڈیٹ کرنے میں مسئلہ پیش آیا!");
      }
    } else {
      alert("نیا مصنف کامیابی سے شامل کر لیا گیا ہے! نئی کتابیں شامل کرتے وقت یہ نام منتخب کر سکتے ہیں۔");
      closeModal();
    }

    setIsSubmitting(false);
  };

  const openModalForEdit = (author: string) => {
    setEditingAuthor(author);
    setAuthorNameInput(author);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAuthor(null);
    setAuthorNameInput("");
  };

  const menuItems = [
    { href: "/", label: "ڈیش بورڈ", icon: LayoutDashboard },
    { href: "/books", label: "کتب", icon: BookOpen },
    { href: "/authors", label: "مصنفین", icon: PenLine, active: true },
    { href: "/categories", label: "زمرے", icon: FolderTree },
    { href: "/orders", label: "آرڈرز", icon: ShoppingCart },
    { href: "/customers", label: "کسٹمرز", icon: Users },
    { href: "/invoices", label: "بل / انوائس", icon: Receipt },
    { href: "/suppliers", label: "سپلائرز", icon: Truck },
    { href: "/returns", label: "واپسی/خراب", icon: RotateCcw },
    { href: "/reviews", label: "ریویوز", icon: Star },
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

      {/* Sidebar - Corrected Translation for RTL */}
      <aside
        className={`w-60 min-h-screen md:h-screen md:sticky md:top-0 border-l border-slate-200 bg-white p-4 flex flex-col fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 shadow-sm ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
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

        {/* Title & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">مصنفین ✍️</h2>
            <p className="text-xs text-slate-500 mt-0.5">تمام مصنفین اور ان کی تخلیقات کی فہرست</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="مصنف یا کتاب تلاش کریں..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-xs"
              />
            </div>

            {/* Add Author Button */}
            <button
              onClick={() => {
                setEditingAuthor(null);
                setAuthorNameInput("");
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-xs"
            >
              <Plus size={15} />
              <span>نیا مصنف</span>
            </button>
          </div>
        </div>

        {/* Loading / Cards Grid */}
        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 h-44 animate-pulse">
                <div className="h-5 bg-slate-100 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-1"></div>
              </div>
            ))}
          </div>
        ) : filteredAuthors.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <PenLine className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-xs text-slate-500">
              {searchTerm ? "کوئی مصنف یا کتاب نہیں ملی" : "ابھی کوئی مصنف موجود نہیں"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAuthors.map((author) => (
              <div
                key={author}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <UserCheck size={18} />
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        {authorMap[author].length} کتب
                      </span>
                    </div>

                    <button
                      onClick={() => openModalForEdit(author)}
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-md transition"
                      title="ترمیم کریں"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>

                  <Link
                    href={`/books?author=${encodeURIComponent(author)}`}
                    className="group-hover:text-emerald-600 transition-colors"
                  >
                    <h3 className="text-sm font-bold text-slate-800">{author}</h3>
                  </Link>

                  {/* کتب کی فہرست */}
                  <ul className="mt-3 space-y-1 divide-y divide-slate-50">
                    {authorMap[author].slice(0, 4).map((book) => (
                      <li key={book.id} className="pt-1 first:pt-0">
                        <Link
                          href={`/books/${encodeURIComponent(book.slug || book.title)}`}
                          className="text-slate-500 hover:text-emerald-600 text-xs transition flex items-center gap-1.5 truncate"
                        >
                          <BookMarked size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{book.title}</span>
                        </Link>
                      </li>
                    ))}
                    {authorMap[author].length > 4 && (
                      <li className="pt-1 text-[10px] text-slate-400 font-medium">
                        + مزید {authorMap[author].length - 4} کتابیں
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={`/books?author=${encodeURIComponent(author)}`}
                    className="flex items-center justify-between text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    <span>تمام کتب دیکھیں</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Add / Edit Author */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-5 relative animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={closeModal}
                className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>

              <h3 className="text-base font-bold text-slate-800 mb-1">
                {editingAuthor ? "مصنف کا نام تبدیل کریں" : "نیا مصنف شامل کریں"}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {editingAuthor
                  ? "اس سے ان کی تمام منسلک کتب میں مصنف کا نام اپڈیٹ ہو جائے گا۔"
                  : "نئے مصنف کا اندراج درج کریں۔"}
              </p>

              <form onSubmit={handleSaveAuthor} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    مصنف کا نام
                  </label>
                  <input
                    type="text"
                    required
                    value={authorNameInput}
                    onChange={(e) => setAuthorNameInput(e.target.value)}
                    placeholder="مثال: مولانا ابو الکلام آزاد"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    منسوخ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}