"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, 
  ShoppingCart, Users, Receipt, Truck, Gift, Ticket, RotateCcw, 
  Star, PackageMinus, Wallet, Edit2, Folder, ArrowUpRight,
  Sun, Moon, Globe
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function CategoriesPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<"ur" | "en">("ur");

  const [books, setBooks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase.from("books").select("*");
      if (!error && data) setBooks(data);
      setLoaded(true);
    };
    fetchBooks();
  }, []);

  const categoryCounts: Record<string, number> = {};
  books.forEach((book) => {
    if (book.category) {
      categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
    }
  });

  const categories = Object.keys(categoryCounts);

  const handleRenameCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || newCategoryName.trim() === "") return;
    setRenaming(true);
    await supabase
      .from("books")
      .update({ category: newCategoryName.trim() })
      .eq("category", editingCategory);
    setRenaming(false);
    setEditingCategory(null);
    setNewCategoryName("");
    const { data } = await supabase.from("books").select("*");
    if (data) setBooks(data);
  };

  const t = {
    ur: {
      welcomeBanner: "مكتبہ الزھراء میں خوش آمدید — آن لائن اسلامک بک سٹور",
      heading: "زمرہ جات 🗂️",
      subHeading: "تمام کتابوں کو ان کے زمرے کے لحاظ سے ترتیب دیں",
      totalCategories: "کل زمرے",
      booksCount: "کتب",
      viewAllBooks: "تمام کتب دیکھیں",
      noCategoriesYet: "ابھی کوئی زمرہ موجود نہیں",
      renameCategory: "زمرے کا نام تبدیل کریں",
      renameDesc: "یہ نیا نام تمام متعلقہ کتابوں میں خودکار طریقے سے اپڈیٹ ہو جائے گا۔",
      categoryName: "زمرے کا نام",
      cancel: "منسوخ",
      save: "محفوظ کریں",
      saving: "محفوظ ہو رہا ہے...",
      edit: "ترمیم کریں",
      menu: "مینو",
      dashboard: "ڈیش بورڈ",
      books: "کتب",
      authors: "مصنفین",
      categories: "زمرے",
      orders: "آرڈرز",
      customers: "کسٹمرز",
      bills: "بل / انوائس",
      suppliers: "سپلائرز",
      loyalty: "لائلٹی پوائنٹس",
      coupons: "کوپنز",
      returns: "واپسی/خراب",
      reviews: "ریویوز",
      lowStock: "کم سٹاک",
      expenses: "اخراجات",
      logout: "لاگ آؤٹ",
    },
    en: {
      welcomeBanner: "Welcome to Maktaba Al-Zahra — Online Islamic Book Store",
      heading: "Categories 🗂️",
      subHeading: "Organize all books by their respective category",
      totalCategories: "Total Categories",
      booksCount: "Books",
      viewAllBooks: "View All Books",
      noCategoriesYet: "No categories available yet",
      renameCategory: "Rename Category",
      renameDesc: "This new name will automatically update across all related books.",
      categoryName: "Category Name",
      cancel: "Cancel",
      save: "Save",
      saving: "Saving...",
      edit: "Edit",
      menu: "Menu",
      dashboard: "Dashboard",
      books: "Books",
      authors: "Authors",
      categories: "Categories",
      orders: "Orders",
      customers: "Customers",
      bills: "Bills / Invoices",
      suppliers: "Suppliers",
      loyalty: "Loyalty Points",
      coupons: "Coupons",
      returns: "Returns",
      reviews: "Reviews",
      lowStock: "Low Stock",
      expenses: "Expenses",
      logout: "Logout",
    },
  }[lang];

  const menuItems = [
    { href: "/", label: t.dashboard, icon: LayoutDashboard },
    { href: "/books", label: t.books, icon: BookOpen },
    { href: "/authors", label: t.authors, icon: PenLine },
    { href: "/categories", label: t.categories, icon: FolderTree, active: true },
    { href: "/orders", label: t.orders, icon: ShoppingCart },
    { href: "/customers", label: t.customers, icon: Users },
    { href: "/invoices", label: t.bills, icon: Receipt },
    { href: "/suppliers", label: t.suppliers, icon: Truck },
    { href: "/loyalty", label: t.loyalty, icon: Gift },
    { href: "/coupons", label: t.coupons, icon: Ticket },
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
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{darkMode ? "Light" : "Dark"}</span>
          </button>

          <button
            onClick={() => setLang(lang === "ur" ? "en" : "ur")}
            className="p-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white transition flex items-center gap-1 text-[11px] px-2 font-bold"
            title="Switch Language"
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
          className={`w-60 min-h-screen md:h-screen md:sticky md:top-0 border-r border-l ${
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
            <h1 className="text-sm font-bold text-slate-800">مكتبہ الزھراء</h1>
          </div>

          {/* Title & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{t.heading}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.subHeading}</p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className={`border text-xs font-semibold px-3 py-1.5 rounded-lg ${
                darkMode ? "bg-emerald-950/50 border-emerald-800 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-700"
              }`}>
                {t.totalCategories}: {categories.length}
              </span>
            </div>
          </div>

          {/* Loading / Cards Grid */}
          {!loaded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`rounded-xl border p-4 h-36 animate-pulse ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <div className="h-5 bg-slate-200/20 rounded w-1/3 mb-3"></div>
                  <div className="h-4 bg-slate-200/20 rounded w-2/3 mb-2"></div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className={`rounded-xl border p-12 text-center shadow-xs ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <FolderTree className="mx-auto text-slate-400 mb-2" size={32} />
              <p className="text-xs text-slate-400">{t.noCategoriesYet}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className={`rounded-xl border p-4 shadow-xs transition-all flex flex-col justify-between group ${
                    darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                          <Folder size={18} />
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                        }`}>
                          {categoryCounts[cat]} {t.booksCount}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setNewCategoryName(cat);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-slate-500/10 rounded-md transition"
                        title={t.edit}
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>

                    <Link
                      href={`/books?category=${encodeURIComponent(cat)}`}
                      className="group-hover:text-emerald-500 transition-colors"
                    >
                      <h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{cat}</h3>
                    </Link>
                  </div>

                  <div className={`mt-4 pt-3 border-t ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                    <Link
                      href={`/books?category=${encodeURIComponent(cat)}`}
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

          {/* Modal for Edit Category */}
          {editingCategory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
              <div className={`rounded-xl border shadow-xl w-full max-w-md p-5 relative animate-in fade-in zoom-in-95 duration-150 ${
                darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"
              }`}>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>

                <h3 className={`text-base font-bold mb-1 ${darkMode ? "text-white" : "text-slate-800"}`}>
                  {t.renameCategory}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  {t.renameDesc}
                </p>

                <form onSubmit={handleRenameCategory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      {t.categoryName}
                    </label>
                    <input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                        darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"
                      }`}
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-400 hover:bg-slate-50/10"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={renaming}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {renaming ? t.saving : t.save}
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