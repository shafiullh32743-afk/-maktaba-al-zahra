"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, 
  ShoppingCart, Users, Receipt, Truck, Gift, Ticket, RotateCcw, 
  Star, PackageMinus, Wallet, Edit2, Folder, ArrowUpRight, Plus
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function CategoriesPage() {
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

  const menuItems = [
    { href: "/", label: "ڈیش بورڈ", icon: LayoutDashboard },
    { href: "/books", label: "کتب", icon: BookOpen },
    { href: "/authors", label: "مصنفین", icon: PenLine },
    { href: "/categories", label: "زمرے", icon: FolderTree, active: true },
    { href: "/orders", label: "آرڈرز", icon: ShoppingCart },
    { href: "/customers", label: "کسٹمرز", icon: Users },
    { href: "/invoices", label: "بل / انوائس", icon: Receipt },
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
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar - Clean Light Theme like Authors Page */}
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
            <h2 className="text-xl font-bold text-slate-900">زمرہ جات 🗂️</h2>
            <p className="text-xs text-slate-500 mt-0.5">تمام کتابوں کو ان کے زمرے کے لحاظ سے ترتیب دیں</p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
              کل زمرے: {categories.length}
            </span>
          </div>
        </div>

        {/* Loading / Cards Grid */}
        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 h-36 animate-pulse">
                <div className="h-5 bg-slate-100 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-2"></div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <FolderTree className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-xs text-slate-500">ابھی کوئی زمرہ موجود نہیں</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categories.map((cat) => (
              <div
                key={cat}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <Folder size={18} />
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        {categoryCounts[cat]} کتب
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setNewCategoryName(cat);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-md transition"
                      title="ترمیم کریں"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>

                  <Link
                    href={`/books?category=${encodeURIComponent(cat)}`}
                    className="group-hover:text-emerald-600 transition-colors"
                  >
                    <h3 className="text-sm font-bold text-slate-800">{cat}</h3>
                  </Link>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={`/books?category=${encodeURIComponent(cat)}`}
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

        {/* Modal for Edit Category */}
        {editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-5 relative animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => setEditingCategory(null)}
                className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>

              <h3 className="text-base font-bold text-slate-800 mb-1">
                زمرے کا نام تبدیل کریں
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                یہ نیا نام تمام متعلقہ کتابوں میں خودکار طریقے سے اپڈیٹ ہو جائے گا۔
              </p>

              <form onSubmit={handleRenameCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    زمرے کا نام
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    منسوخ
                  </button>
                  <button
                    type="submit"
                    disabled={renaming}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {renaming ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}
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