"use client";

import { useState, useEffect, useCallback } from "react";
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
  Phone,
  MapPin,
  Star,
  PackageMinus,
  Wallet,
  Bell,
  Trash2,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface OrderItem {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  book_title: string;
  book_price: number;
  quantity: number;
  total_amount?: number;
  status: string;
  stock_deducted?: boolean | null;
  delivery_charge?: number | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  order_group?: string;
  created_at?: string;
}

interface OrderGroup {
  key: string;
  items: OrderItem[];
}

const COURIERS = ["TCS", "Leopards", "M&P", "Trax", "PostEx", "BlueEx", "Pakistan Post", "دستی / خود پہنچایا"];

// پاکستانی نمبر کو واٹس ایپ کے فارمیٹ (92...) میں بدلیں
function toWhatsappNumber(phone?: string) {
  let digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("920")) digits = "92" + digits.slice(3);
  else if (digits.startsWith("0")) digits = "92" + digits.slice(1);
  else if (digits.length === 10 && digits.startsWith("3")) digits = "92" + digits;
  return digits;
}

export default function OrdersPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<"ur" | "en">("ur");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;
      if (data) setOrders(data as OrderItem[]);
    } catch (err) {
      console.error("Error fetching orders:", err);
      showNotification(lang === "ur" ? "آرڈرز لوڈ کرنے میں ناکامی ہوئی" : "Failed to load orders", "error");
    } finally {
      setLoaded(true);
    }
  }, [lang]);

  const playNotificationSound = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAACAgICAgICAgIA="
    );
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("id", { ascending: false });

      if (data) {
        setOrders((prevOrders) => {
          if (prevOrders.length > 0 && data.length > prevOrders.length) {
            const newest = data[0];
            playNotificationSound();
            setNewOrderAlert(
              lang === "ur"
                ? `نیا آرڈر: ${newest.book_title} — ${newest.customer_name}`
                : `New Order: ${newest.book_title} — ${newest.customer_name}`
            );
            setTimeout(() => setNewOrderAlert(null), 6000);
          }
          return data as OrderItem[];
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchOrders, lang]);

  // آرڈر کی کتابوں کا سٹاک کم (direction = -1) یا واپس شامل (direction = 1) کریں
  const adjustStock = async (rows: OrderItem[], direction: 1 | -1) => {
    let missing = 0;
    const doneIds: number[] = [];
    for (const row of rows) {
      const { data: found } = await supabase.from("books").select("id, stock").eq("title", row.book_title).limit(1);
      const book = found?.[0];
      if (!book) {
        missing++;
        continue;
      }
      const current = Number(book.stock) || 0;
      const qty = Number(row.quantity) || 0;
      const next = direction === -1 ? Math.max(0, current - qty) : current + qty;
      const { error } = await supabase.from("books").update({ stock: next }).eq("id", book.id);
      if (error) throw error;
      doneIds.push(row.id);
    }
    if (doneIds.length > 0) {
      await supabase.from("orders").update({ stock_deducted: direction === -1 }).in("id", doneIds);
    }
    return { missing, done: doneIds.length };
  };

  const handleStatusChange = async (ids: number[], newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .in("id", ids);

      if (error) throw error;

      // سٹاک کا خودکار حساب: "مکمل ہوا" پر کمی، اس سے واپس جانے پر دوبارہ اضافہ
      const group = orders.filter((o) => ids.includes(o.id));
      let message = lang === "ur" ? "سٹیٹس اپ ڈیٹ ہو گیا ہے" : "Status updated successfully";
      let type: "success" | "error" = "success";

      if (group.length > 0 && !("stock_deducted" in group[0])) {
        message =
          lang === "ur"
            ? "سٹیٹس بدل گیا، مگر سٹاک کے خودکار حساب کے لیے پہلے SQL چلائیں"
            : "Status updated; run the SQL first for automatic stock";
        type = "error";
      } else if (newStatus === "مکمل ہوا") {
        const todo = group.filter((o) => !o.stock_deducted);
        if (todo.length > 0) {
          const r = await adjustStock(todo, -1);
          message =
            lang === "ur"
              ? `مکمل ہوا — ${r.done} کتب کا سٹاک کم ہو گیا${r.missing > 0 ? `، ${r.missing} کتب نام سے نہیں ملیں (ان کا سٹاک نہیں گھٹا)` : ""}`
              : `Completed — stock reduced for ${r.done} item(s)${r.missing > 0 ? `, ${r.missing} not found by title` : ""}`;
          if (r.missing > 0) type = "error";
        }
      } else {
        const back = group.filter((o) => o.stock_deducted);
        if (back.length > 0) {
          const r = await adjustStock(back, 1);
          message =
            lang === "ur"
              ? `سٹیٹس بدل گیا — ${r.done} کتب کا سٹاک واپس شامل ہو گیا`
              : `Status updated — stock restored for ${r.done} item(s)`;
        }
      }

      showNotification(message, type);
      fetchOrders();
    } catch (err) {
      console.error("Error updating status:", err);
      showNotification(lang === "ur" ? "سٹیٹس اپ ڈیٹ کرنے میں ناکامی ہوئی" : "Failed to update status", "error");
    }
  };

  // ڈیلیوری چارجز اور کورئیر / ٹریکنگ نمبر
  const [shipEdit, setShipEdit] = useState<Record<string, { courier: string; tracking: string; delivery: string }>>({});
  const [shipBusy, setShipBusy] = useState<string | null>(null);

  const groupDelivery = (items: OrderItem[]) => items.reduce((sum, o) => sum + (Number(o.delivery_charge) || 0), 0);

  const saveShipping = async (group: OrderGroup) => {
    const edit = shipEdit[group.key];
    if (!edit) return;
    const ids = group.items.map((o) => o.id);
    setShipBusy(group.key);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ courier_name: edit.courier.trim() || null, tracking_number: edit.tracking.trim() || null })
        .in("id", ids);
      if (error) throw error;

      const newDel = parseFloat(edit.delivery);
      const oldDel = groupDelivery(group.items);
      if (!isNaN(newDel) && newDel >= 0 && newDel !== oldDel) {
        const holder =
          group.items.find((o) => (Number(o.delivery_charge) || 0) > 0) || [...group.items].sort((a, b) => a.id - b.id)[0];
        const otherRows = oldDel - (Number(holder.delivery_charge) || 0);
        const delta = newDel - oldDel;
        const { error: e2 } = await supabase
          .from("orders")
          .update({
            delivery_charge: newDel - otherRows,
            total_amount: (Number(holder.total_amount) || Number(holder.book_price) || 0) + delta,
          })
          .eq("id", holder.id);
        if (e2) throw e2;
      }
      setShipEdit((prev) => {
        const next = { ...prev };
        delete next[group.key];
        return next;
      });
      showNotification(lang === "ur" ? "ڈیلیوری کی معلومات محفوظ ہو گئیں" : "Delivery info saved");
      fetchOrders();
    } catch (err) {
      console.error(err);
      showNotification(lang === "ur" ? "محفوظ نہیں ہو سکا (کیا SQL چلائی ہے؟)" : "Could not save (did you run the SQL?)", "error");
    }
    setShipBusy(null);
  };

  const sendTrackingMessage = (first: OrderItem) => {
    const courier = first.courier_name || "";
    const tracking = first.tracking_number || "";
    const text =
      `السلام علیکم *${first.customer_name}*!\n` +
      `مکتبۃ الزھراء کی طرف سے: آپ کا آرڈر روانہ کر دیا گیا ہے۔\n\n` +
      (courier ? `کورئیر: *${courier}*\n` : "") +
      (tracking ? `ٹریکنگ نمبر: *${tracking}*\n` : "") +
      `\nجزاک اللہ خیراً\n*مکتبۃ الزھراء* — 0305-5232889`;
    const number = toWhatsappNumber(first.customer_phone);
    const url = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleDeleteGroup = async (ids: number[]) => {
    if (!confirm(lang === "ur" ? "کیا آپ واقعی اس آرڈر کو حذف کرنا چاہتے ہیں؟" : "Are you sure you want to delete this order?")) return;

    try {
      const { error } = await supabase.from("orders").delete().in("id", ids);
      if (error) throw error;

      showNotification(lang === "ur" ? "آرڈر حذف کر دیا گیا" : "Order deleted successfully");
      fetchOrders();
    } catch (err) {
      console.error("Error deleting order:", err);
      showNotification(lang === "ur" ? "آرڈر حذف کرنے میں مسئلہ آیا" : "Error deleting order", "error");
    }
  };

  const handleLogout = async () => {
    document.cookie = "maktaba-auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const t = {
    ur: {
      welcomeBanner: "مكتبہ الزھراء میں خوش آمدید — آن لائن اسلامک بک سٹور",
      menu: "مینو",
      dashboard: "ڈیش بورڈ",
      books: "کتب",
      authors: "مصنفین",
      categories: "زمرے",
      ordersMenu: "آرڈرز",
      customers: "کسٹمرز",
      bills: "بل / انوائس",
      suppliers: "سپلائرز",
      returns: "واپسی/خراب",
      reviews: "ریویوز",
      lowStock: "کم سٹاک",
      expenses: "اخراجات",
      logout: "لاگ آؤٹ",
      title: "آرڈر مینجمنٹ 🛒",
      subtitle: "آن لائن موصول شدہ آرڈرز کا تفصیلی ریکارڈ",
      totalOrders: "کل آرڈرز",
      noOrders: "کوئی آرڈر موصول نہیں ہوا",
      booksCount: "کتب",
      totalAmount: "کل رقم:",
      statusNew: "نیا (New)",
      statusProcessing: "زیر عمل (Processing)",
      statusCompleted: "مکمل ہوا (Completed)",
      deleteTitle: "آرڈر حذف کریں",
    },
    en: {
      welcomeBanner: "Welcome to Maktaba Al-Zahra — Online Islamic Book Store",
      menu: "Menu",
      dashboard: "Dashboard",
      books: "Books",
      authors: "Authors",
      categories: "Categories",
      ordersMenu: "Orders",
      customers: "Customers",
      bills: "Bills / Invoices",
      suppliers: "Suppliers",
      returns: "Returns",
      reviews: "Reviews",
      lowStock: "Low Stock",
      expenses: "Expenses",
      logout: "Logout",
      title: "Order Management 🛒",
      subtitle: "Detailed record of online received orders",
      totalOrders: "Total Orders",
      noOrders: "No orders received yet",
      booksCount: "books",
      totalAmount: "Total Amount:",
      statusNew: "New",
      statusProcessing: "Processing",
      statusCompleted: "Completed",
      deleteTitle: "Delete Order",
    },
  }[lang];

  const menuItems = [
    { href: "/", label: t.dashboard, icon: LayoutDashboard },
    { href: "/books", label: t.books, icon: BookOpen },
    { href: "/authors", label: t.authors, icon: PenLine },
    { href: "/categories", label: t.categories, icon: FolderTree },
    { href: "/orders", label: t.ordersMenu, icon: ShoppingCart, active: true },
    { href: "/customers", label: t.customers, icon: Users },
    { href: "/invoices", label: t.bills, icon: Receipt },
    { href: "/suppliers", label: t.suppliers, icon: Truck },
    { href: "/returns", label: t.returns, icon: RotateCcw },
    { href: "/reviews", label: t.reviews, icon: Star },
    { href: "/low-stock", label: t.lowStock, icon: PackageMinus },
    { href: "/expenses", label: t.expenses, icon: Wallet },
  ];

  const groups: OrderGroup[] = [];
  const groupMap: Record<string, OrderItem[]> = {};

  orders.forEach((order) => {
    const key = order.order_group || `single_${order.id}`;
    if (!groupMap[key]) {
      groupMap[key] = [];
      groups.push({ key, items: groupMap[key] });
    }
    groupMap[key].push(order);
  });

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

      {toast && (
        <div
          className={`fixed top-14 left-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white font-medium text-xs transition-all animate-bounce ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

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
          } z-50 flex-shrink-0 transform transition-transform duration-300 shadow-sm ${
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
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut size={16} className="text-slate-400" />
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

          {/* Title & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{t.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.subtitle}</p>
            </div>

            <div className={`flex items-center gap-3 border px-3.5 py-2 rounded-xl shadow-xs ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <PackageCheck className="text-emerald-600" size={18} />
              <div>
                <p className="text-[10px] text-slate-400 font-medium">{t.totalOrders}</p>
                <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{groups.length}</p>
              </div>
            </div>
          </div>

          {newOrderAlert && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-600 text-white px-4 py-3 shadow-md animate-pulse text-xs">
              <Bell size={18} className="text-amber-300" />
              <span className="font-semibold">{newOrderAlert}</span>
            </div>
          )}

          <datalist id="courier-list">
            {COURIERS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          {!loaded ? (
            <div className="grid grid-cols-1 gap-3.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-32 rounded-xl border p-4 animate-pulse ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className={`rounded-xl border p-12 text-center shadow-xs ${darkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500"}`}>
              <span className="text-4xl mb-2 block">🛒</span>
              <p className="text-xs">{t.noOrders}</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {groups.map((group) => {
                const first = group.items[0];
                const ids = group.items.map((o) => o.id);
                const groupTotal = group.items.reduce(
                  (sum, o) => sum + (o.total_amount || o.book_price || 0),
                  0
                );
                const status = first.status;

                return (
                  <div
                    key={group.key}
                    className={`rounded-xl border p-4 shadow-xs transition-all ${
                      darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{first.customer_name}</h3>

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                              status === "مکمل ہوا"
                                ? darkMode ? "bg-emerald-950/60 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : status === "زیر عمل"
                                ? darkMode ? "bg-blue-950/60 text-blue-300 border-blue-800" : "bg-blue-50 text-blue-700 border-blue-200"
                                : darkMode ? "bg-amber-950/60 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {status}
                          </span>

                          {group.items.length > 1 && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${darkMode ? "bg-purple-950/60 text-purple-300 border-purple-800" : "bg-purple-50 text-purple-700 border-purple-100"}`}>
                              {group.items.length} {t.booksCount}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5" dir="ltr">
                            <Phone size={13} className="text-emerald-500" />
                            <span className={darkMode ? "text-slate-300" : "text-slate-600"}>{first.customer_phone}</span>
                          </div>

                          {first.customer_address && (
                            <div className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-emerald-500 shrink-0" />
                              <span className={darkMode ? "text-slate-300" : "text-slate-600"}>{first.customer_address}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between border rounded-lg px-3 py-1.5 text-xs ${
                                darkMode ? "bg-slate-800/60 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-100 text-slate-700"
                              }`}
                            >
                              <span className="font-semibold">{item.book_title}</span>
                              <span className="text-slate-400">
                                {item.quantity} × Rs {(item.book_price / (item.quantity || 1)).toFixed(0)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-1">
                          <div className={`inline-flex items-center gap-3 border px-3 py-1 rounded-lg text-xs ${darkMode ? "bg-emerald-950/40 border-emerald-900 text-emerald-300" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                            <span className={`font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{t.totalAmount}</span>
                            <span className="font-bold">
                              Rs {groupTotal.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {(() => {
                          const shipAvailable = "tracking_number" in first;
                          const ed = shipEdit[group.key] ?? {
                            courier: first.courier_name || "",
                            tracking: first.tracking_number || "",
                            delivery: String(groupDelivery(group.items)),
                          };
                          const inputCls = `rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                            darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                          }`;
                          if (!shipAvailable) {
                            return (
                              <p className="text-[11px] text-amber-600">
                                ڈیلیوری / ٹریکنگ کے لیے پہلے Supabase میں orders.sql چلائیں۔
                              </p>
                            );
                          }
                          return (
                            <div className={`rounded-lg border p-2.5 ${darkMode ? "border-slate-800 bg-slate-800/40" : "border-slate-100 bg-slate-50/60"}`}>
                              <p className={`text-[11px] font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                                🚚 ڈیلیوری اور کورئیر
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  list="courier-list"
                                  value={ed.courier}
                                  onChange={(e) => setShipEdit((prev) => ({ ...prev, [group.key]: { ...ed, courier: e.target.value } }))}
                                  placeholder="کورئیر (TCS وغیرہ)"
                                  className={`${inputCls} w-36`}
                                />
                                <input
                                  value={ed.tracking}
                                  onChange={(e) => setShipEdit((prev) => ({ ...prev, [group.key]: { ...ed, tracking: e.target.value } }))}
                                  placeholder="ٹریکنگ نمبر"
                                  dir="ltr"
                                  className={`${inputCls} w-40`}
                                />
                                <input
                                  type="number"
                                  min={0}
                                  value={ed.delivery}
                                  onChange={(e) => setShipEdit((prev) => ({ ...prev, [group.key]: { ...ed, delivery: e.target.value } }))}
                                  placeholder="ڈیلیوری چارجز"
                                  className={`${inputCls} w-28`}
                                />
                                <button
                                  onClick={() => saveShipping(group)}
                                  disabled={shipBusy === group.key || !shipEdit[group.key]}
                                  className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-40"
                                >
                                  {shipBusy === group.key ? "..." : "محفوظ کریں"}
                                </button>
                                {first.tracking_number && (
                                  <button
                                    onClick={() => sendTrackingMessage(first)}
                                    className="rounded-lg bg-[#25D366] text-white px-3 py-1.5 text-xs font-semibold hover:bg-[#20BD5A] transition"
                                  >
                                    💬 ٹریکنگ گاہک کو بھیجیں
                                  </button>
                                )}
                              </div>
                              <p className="mt-1 text-[10px] text-slate-400">
                                ڈیلیوری چارجز بدلنے پر آرڈر کی کل رقم بھی خود بدل جاتی ہے۔
                              </p>
                            </div>
                          );
                        })()}
                      </div>

                      <div className={`flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(ids, e.target.value)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                            darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        >
                          <option value="نیا">{t.statusNew}</option>
                          <option value="زیر عمل">{t.statusProcessing}</option>
                          <option value="مکمل ہوا">{t.statusCompleted}</option>
                        </select>

                        <button
                          onClick={() => handleDeleteGroup(ids)}
                          className={`p-1.5 rounded-md transition ${darkMode ? "text-slate-400 hover:text-rose-400 hover:bg-slate-800" : "text-slate-400 hover:text-rose-600 hover:bg-slate-50"}`}
                          title={t.deleteTitle}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}