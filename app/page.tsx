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
  TrendingUp,
  Boxes,
  ArrowUpRight,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<"ur" | "en">("ur");

  const [books, setBooks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: booksData } = await supabase
        .from("books")
        .select("*")
        .order("id", { ascending: true });
      if (booksData) setBooks(booksData);

      const { data: ordersData } = await supabase.from("orders").select("*");
      if (ordersData) setOrders(ordersData);

      const { data: expensesData } = await supabase.from("expenses").select("*");
      if (expensesData) setExpenses(expensesData);

      setLoaded(true);
    };
    fetchAll();
  }, []);

  const now = new Date();
  const thisMonthOrders = orders.filter((o) => {
    const d = new Date(o.created_at || Date.now());
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + (o.book_price || 0), 0);
  const thisMonthCost = thisMonthOrders.reduce((sum, o) => sum + (o.cost_price || 0), 0);
  const thisMonthExpenseTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthProfit = thisMonthRevenue - thisMonthCost - thisMonthExpenseTotal;

  const totalStockValue = books.reduce((sum, b) => sum + (b.price || 0) * (b.stock || 0), 0);
  const totalBooks = books.length;
  const totalAuthors = new Set(books.map((b) => b.author)).size;
  const totalCategories = new Set(books.map((b) => b.category)).size;

  const t = {
    ur: {
      welcomeBanner: "مكتبہ الزھراء میں خوش آمدید — آن لائن اسلامک بک سٹور",
      welcomeHeading: "خوش آمدید 👋",
      subHeading: "مكتبہ الزھراء کی تجارتی و مالی صورتحال کا خلاصہ",
      menu: "مینو",
      dashboard: "ڈیش بورڈ",
      books: "کتب",
      authors: "مصنفین",
      categories: "زمرے",
      orders: "آرڈرز",
      customers: "کسٹمرز",
      bills: "بل",
      suppliers: "سپلائرز",
      loyalty: "لائلٹی پوائنٹس",
      coupons: "کوپنز",
      returns: "واپسی/خراب",
      reviews: "ریویوز",
      lowStock: "کم سٹاک",
      expenses: "اخراجات",
      logout: "لاگ آؤٹ",
      monthProfit: "اس مہینے کا نفع",
      sales: "فروخت",
      cost: "لاگت",
      expenseLabel: "اخراجات",
      totalStockValue: "موجودہ سٹاک کی کل مالیت",
      totalStockDesc: "تمام کتابوں کی (قیمت × تعداد) کا مجموعہ",
      totalBooksLabel: "کل کتابیں",
      recentBooks: "حالیہ کتب",
      viewAllBooks: "تمام کتب دیکھیں",
      noBooksYet: "ابھی کوئی کتاب شامل نہیں کی گئی",
      loading: "لوڈ ہو رہا ہے...",
    },
    en: {
      welcomeBanner: "Welcome to Maktaba Al-Zahra — Online Islamic Book Store",
      welcomeHeading: "Welcome 👋",
      subHeading: "Summary of Maktaba Al-Zahra's financial and business status",
      menu: "Menu",
      dashboard: "Dashboard",
      books: "Books",
      authors: "Authors",
      categories: "Categories",
      orders: "Orders",
      customers: "Customers",
      bills: "Bills",
      suppliers: "Suppliers",
      loyalty: "Loyalty Points",
      coupons: "Coupons",
      returns: "Returns",
      reviews: "Reviews",
      lowStock: "Low Stock",
      expenses: "Expenses",
      logout: "Logout",
      monthProfit: "This Month's Profit",
      sales: "Sales",
      cost: "Cost",
      expenseLabel: "Expenses",
      totalStockValue: "Total Stock Value",
      totalStockDesc: "Sum of all books (Price × Quantity)",
      totalBooksLabel: "Total Books",
      recentBooks: "Recent Books",
      viewAllBooks: "View All Books",
      noBooksYet: "No books added yet",
      loading: "Loading...",
    },
  }[lang];

  const stats = [
    { label: t.totalBooksLabel, value: totalBooks, icon: BookOpen, href: "/books", color: "text-emerald-600 bg-emerald-50" },
    { label: t.authors, value: totalAuthors, icon: PenLine, href: "/authors", color: "text-blue-600 bg-blue-50" },
    { label: t.categories, value: totalCategories, icon: FolderTree, href: "/categories", color: "text-amber-600 bg-amber-50" },
  ];

  const menuItems = [
    { href: "/", label: t.dashboard, icon: LayoutDashboard, active: true },
    { href: "/books", label: t.books, icon: BookOpen },
    { href: "/authors", label: t.authors, icon: PenLine },
    { href: "/categories", label: t.categories, icon: FolderTree },
    { href: "/orders", label: t.orders, icon: ShoppingCart },
    { href: "/customers", label: t.customers, icon: Users },
    { href: "/bills", label: t.bills, icon: Receipt },
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
            <h1 className="text-sm font-bold">مكتبہ الزھراء</h1>
          </div>

          {/* Dashboard Title Header */}
          <div className="mb-6">
            <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{t.welcomeHeading}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.subHeading}</p>
          </div>

          {!loaded ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-xs font-medium text-slate-400 animate-pulse">{t.loading}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Top Financial Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly Profit Card */}
                <div className={`rounded-xl border p-4 shadow-xs ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-emerald-100"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">{t.monthProfit}</span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <TrendingUp size={16} />
                    </span>
                  </div>
                  <p className={`text-2xl font-bold mt-1 ${thisMonthProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    Rs {thisMonthProfit.toLocaleString()}
                  </p>
                  <div className={`mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center text-xs ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                    <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800/60" : "bg-slate-50"}`}>
                      <p className="text-[10px] text-slate-400">{t.sales}</p>
                      <p className={`font-semibold mt-0.5 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Rs {thisMonthRevenue.toLocaleString()}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800/60" : "bg-slate-50"}`}>
                      <p className="text-[10px] text-slate-400">{t.cost}</p>
                      <p className={`font-semibold mt-0.5 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Rs {thisMonthCost.toLocaleString()}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800/60" : "bg-slate-50"}`}>
                      <p className="text-[10px] text-slate-400">{t.expenseLabel}</p>
                      <p className={`font-semibold mt-0.5 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Rs {thisMonthExpenseTotal.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Total Stock Value Card */}
                <div className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-blue-100"}`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">{t.totalStockValue}</span>
                      <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                        <Boxes size={16} />
                      </span>
                    </div>
                    <p className={`text-2xl font-bold mt-1 ${darkMode ? "text-white" : "text-slate-800"}`}>
                      Rs {totalStockValue.toLocaleString()}
                    </p>
                  </div>
                  <p className={`text-[11px] text-slate-400 mt-2 p-2 rounded-lg ${darkMode ? "bg-slate-800/50" : "bg-blue-50/50"}`}>
                    {t.totalStockDesc}
                  </p>
                </div>
              </div>

              {/* Quick Stat Counter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Link
                      key={stat.label}
                      href={stat.href}
                      className={`rounded-xl border p-3.5 shadow-xs transition-all flex items-center justify-between group ${
                        darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${stat.color}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className={`text-lg font-bold leading-tight ${darkMode ? "text-white" : "text-slate-800"}`}>{stat.value}</p>
                          <p className="text-xs text-slate-400">{stat.label}</p>
                        </div>
                      </div>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </Link>
                  );
                })}
              </div>

              {/* Recent Books Section */}
              <div className={`rounded-xl border p-4 shadow-xs ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{t.recentBooks}</h3>
                  <Link href="/books" className="text-xs font-medium text-emerald-500 hover:underline">
                    {t.viewAllBooks}
                  </Link>
                </div>

                {books.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">{t.noBooksYet}</p>
                ) : (
                  <div className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                    {books.slice(-5).reverse().map((book) => (
                      <div key={book.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <p className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{book.title}</p>
                          <p className="text-[11px] text-slate-400">{book.author}</p>
                        </div>
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                          {book.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}