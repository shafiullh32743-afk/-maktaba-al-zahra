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
  order_group?: string;
  created_at?: string;
}

interface OrderGroup {
  key: string;
  items: OrderItem[];
}

export default function OrdersPage() {
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
      showNotification("آرڈرز لوڈ کرنے میں ناکامی ہوئی", "error");
    } finally {
      setLoaded(true);
    }
  }, []);

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
            setNewOrderAlert(`نیا آرڈر: ${newest.book_title} — ${newest.customer_name}`);
            setTimeout(() => setNewOrderAlert(null), 6000);
          }
          return data as OrderItem[];
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (ids: number[], newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .in("id", ids);

      if (error) throw error;

      showNotification("سٹیٹس اپ ڈیٹ ہو گیا ہے");
      fetchOrders();
    } catch (err) {
      console.error("Error updating status:", err);
      showNotification("سٹیٹس اپ ڈیٹ کرنے میں ناکامی ہوئی", "error");
    }
  };

  const handleDeleteGroup = async (ids: number[]) => {
    if (!confirm("کیا آپ واقعی اس آرڈر کو حذف کرنا چاہتے ہیں؟")) return;

    try {
      const { error } = await supabase.from("orders").delete().in("id", ids);
      if (error) throw error;

      showNotification("آرڈر حذف کر دیا گیا");
      fetchOrders();
    } catch (err) {
      console.error("Error deleting order:", err);
      showNotification("آرڈر حذف کرنے میں مسئلہ آیا", "error");
    }
  };

  const handleLogout = async () => {
    document.cookie = "maktaba-auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const menuItems = [
    { href: "/", label: "ڈیش بورڈ", icon: LayoutDashboard },
    { href: "/books", label: "کتب", icon: BookOpen },
    { href: "/authors", label: "مصنفین", icon: PenLine },
    { href: "/categories", label: "زمرے", icon: FolderTree },
    { href: "/orders", label: "آرڈرز", icon: ShoppingCart, active: true },
    { href: "/customers", label: "کسٹمرز", icon: Users },
    { href: "/invoices", label: "بل / انوائس", icon: Receipt },
    { href: "/suppliers", label: "سپلائرز", icon: Truck },
    { href: "/returns", label: "واپسی/خراب", icon: RotateCcw },
    { href: "/reviews", label: "ریویوز", icon: Star },
    { href: "/low-stock", label: "کم سٹاک", icon: PackageMinus },
    { href: "/expenses", label: "اخراجات", icon: Wallet },
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
    <main dir="rtl" className="min-h-screen flex bg-slate-50/60 font-sans">
      {toast && (
        <div
          className={`fixed top-5 left-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white font-medium text-xs transition-all animate-bounce ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar - تمام صفحات کے عین مطابق */}
      <aside
        className={`w-60 min-h-screen md:h-screen md:sticky md:top-0 border-l border-slate-200 bg-white p-4 flex flex-col fixed inset-y-0 right-0 z-50 flex-shrink-0 transform transition-transform duration-300 shadow-sm ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
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
            onClick={handleLogout}
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

        {/* Title & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">آرڈر مینجمنٹ 🛒</h2>
            <p className="text-xs text-slate-500 mt-0.5">آن لائن موصول شدہ آرڈرز کا تفصیلی ریکارڈ</p>
          </div>

          <div className="flex items-center gap-3 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
            <PackageCheck className="text-emerald-600" size={18} />
            <div>
              <p className="text-[10px] text-slate-400 font-medium">کل آرڈرز</p>
              <p className="text-sm font-bold text-slate-800">{groups.length}</p>
            </div>
          </div>
        </div>

        {newOrderAlert && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-600 text-white px-4 py-3 shadow-md animate-pulse text-xs">
            <Bell size={18} className="text-amber-300" />
            <span className="font-semibold">{newOrderAlert}</span>
          </div>
        )}

        {!loaded ? (
          <div className="grid grid-cols-1 gap-3.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl border border-slate-200 bg-white p-4 animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <span className="text-4xl mb-2 block">🛒</span>
            <p className="text-xs text-slate-500">کوئی آرڈر موصول نہیں ہوا</p>
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
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-800">{first.customer_name}</h3>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                            status === "مکمل ہوا"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : status === "زیر عمل"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {status}
                        </span>

                        {group.items.length > 1 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-100">
                            {group.items.length} کتب
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5" dir="ltr">
                          <Phone size={13} className="text-emerald-600" />
                          <span className="text-slate-600">{first.customer_phone}</span>
                        </div>

                        {first.customer_address && (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-emerald-600 shrink-0" />
                            <span>{first.customer_address}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs"
                          >
                            <span className="font-semibold text-slate-700">{item.book_title}</span>
                            <span className="text-slate-500">
                              {item.quantity} × Rs {(item.book_price / (item.quantity || 1)).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1">
                        <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg text-xs">
                          <span className="font-semibold text-slate-600">کل رقم:</span>
                          <span className="font-bold text-emerald-700">
                            Rs {groupTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(ids, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                      >
                        <option value="نیا">نیا (New)</option>
                        <option value="زیر عمل">زیر عمل (Processing)</option>
                        <option value="مکمل ہوا">مکمل ہوا (Completed)</option>
                      </select>

                      <button
                        onClick={() => handleDeleteGroup(ids)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-md transition"
                        title="آرڈر حذف کریں"
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
    </main>
  );
}