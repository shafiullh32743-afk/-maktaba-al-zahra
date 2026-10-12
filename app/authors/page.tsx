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
  PackageMinus,
  Wallet,
  Search,
  ArrowUpRight,
  UserCheck,
  Plus,
  Edit2,
  BookMarked,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Book {
  id: string | number;
  title: string;
  slug?: string;
  author: string;
}

export default function AuthorsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<"ur" | "en">("ur");
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

  const authorMap: Record<string, Book[]> = {};
  books.forEach((book) => {
    if (book.author) {
      const trimmedAuthor = book.author.trim();
      if (!authorMap[trimmedAuthor]) authorMap[trimmedAuthor] = [];
      authorMap[trimmedAuthor].push(book);
    }
  });

  const authors = Object.keys(authorMap);

  const filteredAuthors = authors.filter((author) => {
    const matchesAuthor = author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBook = authorMap[author].some((book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesAuthor || matchesBook;
  });

  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorNameInput.trim()) return;

    setIsSubmitting(true);

    if (editingAuthor) {
      const { error } = await supabase
        .from("books")
        .update({ author: authorNameInput.trim() })
        .eq("author", editingAuthor);

      if (!error) {
        await fetchBooks();
        closeModal();
      } else {
        alert(lang === "ur" ? "مصنف اپڈیٹ کرنے میں مسئلہ پیش آیا!" : "Error updating author!");
      }
    } else {
      alert(lang === "ur" ? "نیا مصنف کامیابی سے شامل کر لیا گیا ہے!" : "Author added successfully!");
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

  const t = {
    ur: {
      welcomeBanner: "مكتبہ الزھراء میں خوش آمدید — آن لائن اسلامک بک سٹور",
      menu: "مینو",
      dashboard: "ڈیش بورڈ",
      books: "کتب",
      authors: "مصنفین",
      categories: "زمرے",
      orders: "آرڈرز",
      customers: "کسٹمرز",
      bills: "بل / انوائس",
      suppliers: "سپلائرز",
      returns: "واپسی/خراب",
      reviews: "ریویوز",
      lowStock: "کم سٹاک",
      expenses: "اخراجات",
      logout: "لاگ آؤٹ",
      title: "مصنفین ✍️",
      subtitle: "تمام مصنفین اور ان کی تخلیقات کی فہرست",
      searchPlaceholder: "مصنف یا کتاب تلاش کریں...",
      addAuthor: "نیا مصنف",
      booksCount: "کتب",
      moreBooks: "مزید کتابیں",
      viewAllBooks: "تمام کتب دیکھیں",
      noResults: "کوئی مصنف یا کتاب نہیں ملی",
      noAuthorsYet: "ابھی کوئی مصنف موجود نہیں",
      modalTitleEdit: "مصنف کا نام تبدیل کریں",
      modalTitleAdd: "نیا مصنف شامل کریں",
      modalDescEdit: "اس سے ان کی تمام منسلک کتب میں مصنف کا نام اپڈیٹ ہو جائے گا۔",
      modalDescAdd: "نئے مصنف کا اندراج درج کریں۔",
      authorNameLabel: "مصنف کا نام",
      authorPlaceholder: "مثال: مولانا ابو الکلام آزاد",
      cancel: "منسوخ",
      save: "محفوظ کریں",
      saving: "محفوظ ہو رہا ہے...",
    },
    en: {
      welcomeBanner: "Welcome to Maktaba Al-Zahra — Online Islamic Book Store",
      menu: "Menu",
      dashboard: "Dashboard",
      books: "Books",
      authors: "Authors",
      categories: "Categories",
      orders: "Orders",
      customers: "Customers",
      bills: "Bills / Invoices",
      suppliers: "Suppliers",
      returns: "Returns",
      reviews: "Reviews",
      lowStock: "Low Stock",
      expenses: "Expenses",
      logout: "Logout",
      title: "Authors ✍️",
      subtitle: "List of all authors and their creations",
      searchPlaceholder: "Search author or book...",
      addAuthor: "New Author",
      booksCount: "books",
      moreBooks: "more books",
      viewAllBooks: "View all books",
      noResults: "No author or book found",
      noAuthorsYet: "No authors available yet",
      modalTitleEdit: "Edit Author Name",
      modalTitleAdd: "Add New Author",
      modalDescEdit: "This will update the author's name across all their linked books.",
      modalDescAdd: "Enter the new author's name.",
      authorNameLabel: "Author Name",
      authorPlaceholder: "e.g., Allama Iqbal",
      cancel: "Cancel",
      save: "Save",
      saving: "Saving...",
    },
  }[lang];

  const menuItems = [
    { href: "/", label: t.dashboard, icon: LayoutDashboard },
    { href: "/books", label: t.books, icon: BookOpen },
    { href: "/authors", label: t.authors, icon: PenLine, active: true },
    { href: "/categories", label: t.categories, icon: FolderTree },
    { href: "/orders", label: t.orders, icon: ShoppingCart },
    { href: "/customers", label: t.customers, icon: Users },
    { href: "/invoices", label: t.bills, icon: Receipt },
    { href: "/suppliers", label: t.suppliers, icon: Truck },
    { href: "/returns", label: t.returns, icon: RotateCcw },
    { href: "/reviews", label: t.reviews, icon: Star },
    { href: "/low-stock", label: t.lowStock, icon: PackageMinus },
    { href: "/expenses", label: t.expenses, icon: Wallet },
  ];

  return (
    <main
      dir={lang === "ur" ? "rtl" : "ltr"}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50/60 text-slate-800"
      }`}
    >
      {/* اوپر کا بینر و نائٹ/لینگویج سوئچ */}
      <div className={`${darkMode ? "bg-emerald-950" : "bg-emerald-800"} text-white text-xs py-2 px-4 flex flex-col md:flex-row items-center justify-between gap-2 text-center font-medium`}>
        <div className="flex-1 text-center">
          <span>{t.welcomeBanner}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white transition flex items-center gap-1 text-[11px] px-2"
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{darkMode ? "Light" : "Dark"}</span>
          </button>

          <button
            onClick={() => setLang(lang === "ur" ? "en" : "ur")}
            className="p-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white transition flex items-center gap-1 text-[11px] px-2 font-bold"
          >
            <Globe size={14} />
            <span>{lang === "ur" ? "English" : "اردو"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`w-60 min-h-screen md:h-screen md:sticky md:top-0 border-l border-r ${
            darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          } p-4 flex flex-col fixed inset-y-0 ${
            lang === "ur" ? "right-0" : "left-0"
          } z-50 transform transition-transform duration-300 shadow-sm ${
            mobileMenuOpen
              ? "translate-x-0"
              : lang === "ur"
              ? "translate-x-full md:translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
                <BookOpen className="text-white" size={17} />
              </div>
              <h1 className={`text-base font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>مكتبہ الزھراء</h1>
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
            <p className="text-slate-400 text-[11px] font-semibold px-2 mb-1">{t.menu}</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    item.active
                      ? darkMode
                        ? "bg-emerald-900/50 text-emerald-300"
                        : "bg-emerald-50 text-emerald-700 shadow-xs"
                      : darkMode
                      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
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
          <div className={`border-t ${darkMode ? "border-slate-800" : "border-slate-100"} pt-3 mt-2 space-y-2`}>
            <button
              onClick={() => {
                document.cookie = "maktaba-auth=; path=/; max-age=0";
                window.location.href = "/login";
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-xs font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut size={16} />
              {t.logout}
            </button>
            <p className="text-slate-500 text-[10px] text-center">مكتبہ الزھراء © 2026</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 p-4 md:p-6 max-w-7xl mx-auto min-w-0">
          {/* Mobile Header */}
          <div className={`flex items-center justify-between md:hidden mb-4 p-3 rounded-xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-bold">مكتبہ الزھراء</h1>
          </div>

          {/* Title & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{t.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.subtitle}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className={`absolute ${lang === "ur" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-slate-400`} size={15} />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full ${lang === "ur" ? "pr-9 pl-3" : "pl-9 pr-3"} py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-xs ${
                    darkMode ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-800"
                  }`}
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
                <span>{t.addAuthor}</span>
              </button>
            </div>
          </div>

          {/* Loading / Cards Grid */}
          {!loaded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`rounded-xl border p-4 h-44 animate-pulse ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <div className={`h-5 rounded w-1/3 mb-3 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}></div>
                  <div className={`h-4 rounded w-2/3 mb-2 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}></div>
                  <div className={`h-3 rounded w-1/2 mb-1 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}></div>
                </div>
              ))}
            </div>
          ) : filteredAuthors.length === 0 ? (
            <div className={`rounded-xl border p-12 text-center shadow-xs ${darkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500"}`}>
              <PenLine className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-xs">
                {searchTerm ? t.noResults : t.noAuthorsYet}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAuthors.map((author) => (
                <div
                  key={author}
                  className={`rounded-xl border p-4 shadow-xs transition-all flex flex-col justify-between group ${
                    darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${darkMode ? "bg-emerald-950 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                          <UserCheck size={18} />
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                          {authorMap[author].length} {t.booksCount}
                        </span>
                      </div>

                      <button
                        onClick={() => openModalForEdit(author)}
                        className={`p-1 rounded-md transition ${darkMode ? "text-slate-400 hover:text-emerald-400 hover:bg-slate-800" : "text-slate-400 hover:text-emerald-600 hover:bg-slate-50"}`}
                        title="ترمیم کریں"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>

                    <Link
                      href={`/books?author=${encodeURIComponent(author)}`}
                      className="group-hover:text-emerald-500 transition-colors"
                    >
                      <h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{author}</h3>
                    </Link>

                    {/* کتب کی فہرست */}
                    <ul className={`mt-3 space-y-1 divide-y ${darkMode ? "divide-slate-800" : "divide-slate-50"}`}>
                      {authorMap[author].slice(0, 4).map((book) => (
                        <li key={book.id} className="pt-1 first:pt-0">
                          <Link
                            href={`/books/${encodeURIComponent(book.slug || book.title)}`}
                            className={`text-xs transition flex items-center gap-1.5 truncate ${darkMode ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-emerald-600"}`}
                          >
                            <BookMarked size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{book.title}</span>
                          </Link>
                        </li>
                      ))}
                      {authorMap[author].length > 4 && (
                        <li className="pt-1 text-[10px] text-slate-400 font-medium">
                          + {authorMap[author].length - 4} {t.moreBooks}
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className={`mt-4 pt-3 border-t ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                    <Link
                      href={`/books?author=${encodeURIComponent(author)}`}
                      className="flex items-center justify-between text-xs font-semibold text-emerald-500 hover:underline"
                    >
                      <span>{t.viewAllBooks}</span>
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
              <div className={`rounded-xl border shadow-xl w-full max-w-md p-5 relative animate-in fade-in zoom-in-95 duration-150 ${darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
                <button
                  onClick={closeModal}
                  className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>

                <h3 className="text-base font-bold mb-1">
                  {editingAuthor ? t.modalTitleEdit : t.modalTitleAdd}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  {editingAuthor ? t.modalDescEdit : t.modalDescAdd}
                </p>

                <form onSubmit={handleSaveAuthor} className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      {t.authorNameLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={authorNameInput}
                      onChange={(e) => setAuthorNameInput(e.target.value)}
                      placeholder={t.authorPlaceholder}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                        darkMode ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium ${darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isSubmitting ? t.saving : t.save}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}