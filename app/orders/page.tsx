"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, ShoppingCart, Phone, MapPin, Star, PackageMinus, Wallet, Bell } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });
    if (!error && data) setOrders(data);
    setLoaded(true);
  };

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
          return data;
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (ids: number[], newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus }).in("id", ids);
    fetchOrders();
  };

  const handleDeleteGroup = async (ids: number[]) => {
    await supabase.from("orders").delete().in("id", ids);
    fetchOrders();
  };

  // آرڈرز کو order_group کے مطابق گروپ کریں؛ جن کا order_group نہیں (پرانے آرڈرز)، وہ اپنے آپ میں الگ گروپ بنیں
  const groups: { key: string; items: any[] }[] = [];
  const groupMap: Record<string, any[]> = {};

  orders.forEach((order) => {
    const key = order.order_group || `single_${order.id}`;
    if (!groupMap[key]) {
      groupMap[key] = [];
      groups.push({ key, items: groupMap[key] });
    }
    groupMap[key].push(order);
  });

  return (
    <main className="min-h-screen flex bg-gray-50">
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden" />
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
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-white/80 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <nav className="mt-10 space-y-1.5 flex-1">
          <p className="text-white/50 text-xs font-medium px-3 mb-2">مینو</p>
          <Link href="/" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <LayoutDashboard size={19} /> ڈیش بورڈ
          </Link>
          <Link href="/books" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <BookOpen size={19} /> کتب
          </Link>
          <Link href="/authors" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <PenLine size={19} /> مصنفین
          </Link>
          <Link href="/categories" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <FolderTree size={19} /> زمرے
          </Link>
          <Link href="/orders" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md">
            <ShoppingCart size={19} /> آرڈرز
          </Link>
          <Link href="/reviews" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <Star size={19} /> ریویوز
          </Link>
          <Link href="/low-stock" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <PackageMinus size={19} /> کم سٹاک
          </Link>
          <Link href="/expenses" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <Wallet size={19} /> اخراجات
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
            <LogOut size={19} /> لاگ آؤٹ
          </button>
          <p className="text-white/50 text-xs text-center">مكتبہ الزھراء © 2026</p>
        </div>
      </aside>

      <section className="flex-1 min-w-0 p-5 md:p-10">
        <div className="flex items-center justify-between md:hidden mb-4">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm">
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-bold text-emerald-800">مكتبہ الزھراء</h1>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">آرڈرز</h2>
        <p className="mt-2 text-gray-500">موصول شدہ کتابوں کے آرڈرز دیکھیں</p>

        {newOrderAlert && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-600 text-white px-5 py-3 shadow-lg animate-pulse">
            <Bell size={20} />
            <span className="font-medium">{newOrderAlert}</span>
          </div>
        )}

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : groups.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">🛒</span>
            <p className="text-gray-500 text-lg">ابھی کوئی آرڈر موصول نہیں ہوا</p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {groups.map((group) => {
              const first = group.items[0];
              const ids = group.items.map((o) => o.id);
              const groupTotal = group.items.reduce((sum, o) => sum + (o.total_amount || o.book_price || 0), 0);
              const status = first.status;

              return (
                <div key={group.key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-gray-700 font-bold">{first.customer_name}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            status === "مکمل ہوا" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {status}
                        </span>
                        {group.items.length > 1 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                            {group.items.length} کتابیں
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-gray-500 text-sm">
                        <Phone size={14} /> {first.customer_phone}
                      </div>

                      {first.customer_address && (
                        <div className="mt-1 flex items-start gap-1 text-gray-500 text-sm">
                          <MapPin size={14} className="mt-0.5 flex-shrink-0" /> {first.customer_address}
                        </div>
                      )}

                      <div className="mt-3 space-y-1.5">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                            <span className="text-gray-800">{item.book_title}</span>
                            <span className="text-gray-500">
                              {item.quantity} × Rs {(item.book_price / (item.quantity || 1)).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm max-w-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-800">کل بل</span>
                          <span className="text-emerald-700">{groupTotal} روپے</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(ids, e.target.value)}
                        className="rounded-lg border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        <option value="نیا">نیا</option>
                        <option value="زیر عمل">زیر عمل</option>
                        <option value="مکمل ہوا">مکمل ہوا</option>
                      </select>

                      <button
                        onClick={() => handleDeleteGroup(ids)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 transition text-sm"
                      >
                        حذف کریں
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