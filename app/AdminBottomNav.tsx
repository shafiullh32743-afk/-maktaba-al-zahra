"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Receipt,
  Menu,
  X,
  Bell,
  Camera,
  PackageMinus,
  PenLine,
  FolderTree,
  Users,
  Truck,
  RotateCcw,
  Star,
  Wallet,
} from "lucide-react";

// یہ نیچے والی پٹی صرف لاگ اِن شدہ ایڈمن کو، اور صرف موبائل پر نظر آتی ہے
const PUBLIC_PREFIXES = ["/login", "/shop", "/cart", "/about", "/contact"];

const mainItems = [
  { href: "/", label: "ڈیش بورڈ", icon: LayoutDashboard },
  { href: "/books", label: "کتب", icon: BookOpen },
  { href: "/orders", label: "آرڈرز", icon: ShoppingCart },
  { href: "/invoices", label: "بل", icon: Receipt },
];

const moreItems = [
  { href: "/scan", label: "بارکوڈ سکین", icon: Camera },
  { href: "/low-stock", label: "کم سٹاک", icon: PackageMinus },
  { href: "/authors", label: "مصنفین", icon: PenLine },
  { href: "/categories", label: "زمرے", icon: FolderTree },
  { href: "/customers", label: "کسٹمرز", icon: Users },
  { href: "/suppliers", label: "سپلائرز", icon: Truck },
  { href: "/returns", label: "واپسی/خراب", icon: RotateCcw },
  { href: "/reviews", label: "ریویوز", icon: Star },
  { href: "/expenses", label: "اخراجات", icon: Wallet },
];

type PushState = "checking" | "unsupported" | "denied" | "off" | "on" | "busy";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function AdminBottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pushState, setPushState] = useState<PushState>("checking");
  const [pushMessage, setPushMessage] = useState("");

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    setIsAdmin(/(^|;\s*)maktaba-auth=[^;]+/.test(document.cookie));
  }, [pathname]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // نوٹیفکیشن کی موجودہ حالت معلوم کریں
  useEffect(() => {
    if (!isAdmin) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !vapidKey) {
      setPushState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPushState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushState(sub ? "on" : "off"))
      .catch(() => setPushState("unsupported"));
  }, [isAdmin, vapidKey]);

  const enablePush = async () => {
    if (!vapidKey) return;
    setPushState("busy");
    setPushMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.ok) {
        await sub.unsubscribe();
        setPushState("off");
        setPushMessage("محفوظ نہیں ہو سکا۔ Supabase میں push_subscriptions ٹیبل بنی ہے؟");
        return;
      }
      setPushState("on");
      setPushMessage("نوٹیفکیشن آن ہو گئے");
    } catch {
      setPushState("off");
      setPushMessage("نوٹیفکیشن آن نہیں ہو سکے");
    }
  };

  const disablePush = async () => {
    setPushState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setPushState("off");
      setPushMessage("نوٹیفکیشن بند ہو گئے");
    } catch {
      setPushState("on");
    }
  };

  const handleLogout = () => {
    document.cookie = "maktaba-auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    window.location.href = "/login";
  };

  const isPublicPath = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isAdmin || isPublicPath) return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));

  return (
    <>
      {/* پٹی کے نیچے مواد چھپ نہ جائے */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition ${
                  active ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-slate-500"
          >
            <Menu size={20} />
            مزید
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" dir="rtl">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm">مزید</h3>
              <button onClick={() => setMoreOpen(false)} className="p-1 text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-[11px] font-semibold ${
                      isActive(item.href)
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Bell size={16} className="text-emerald-600" />
                  نئے آرڈر کی اطلاع
                </div>
                {pushState === "on" ? (
                  <button onClick={disablePush} className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                    بند کریں
                  </button>
                ) : (
                  <button
                    onClick={enablePush}
                    disabled={pushState !== "off"}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
                  >
                    {pushState === "busy" ? "..." : "آن کریں"}
                  </button>
                )}
              </div>
              {pushState === "on" && <p className="mt-2 text-[11px] text-emerald-600">اس فون پر نوٹیفکیشن آن ہیں</p>}
              {pushState === "unsupported" && (
                <p className="mt-2 text-[11px] text-slate-400">
                  یہاں نوٹیفکیشن دستیاب نہیں (ایپ کو ہوم سکرین پر انسٹال کریں، اور سیٹ اپ مکمل ہونا ضروری ہے)
                </p>
              )}
              {pushState === "denied" && (
                <p className="mt-2 text-[11px] text-rose-500">نوٹیفکیشن بلاک ہیں۔ فون کی سیٹنگز میں ایپ کے لیے اجازت دیں۔</p>
              )}
              {pushMessage && <p className="mt-2 text-[11px] text-slate-500">{pushMessage}</p>}
            </div>

            <button
              onClick={handleLogout}
              className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600"
            >
              لاگ آؤٹ
            </button>
          </div>
        </div>
      )}
    </>
  );
}
