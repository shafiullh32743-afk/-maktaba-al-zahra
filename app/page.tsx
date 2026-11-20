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
  TrendingUp,
  Boxes,
  ArrowUpRight,
  Sun,
  Moon,
  Globe,
  ShoppingBag,
  Download,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getCartCount } from "@/lib/cart";


const PALETTE = ["#34d399", "#38bdf8", "#fbbf24", "#a78bfa", "#fb7185", "#cbd5e1"];

const shortNum = (n: number) =>
  n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : n >= 1000 ? Math.round(n / 1000) + "k" : String(Math.round(n));

const smoothPath = (pts: [number, number][]) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
};

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  const w = 90;
  const h = 28;
  const pts: [number, number][] = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, h - 3 - (v / max) * (h - 8)]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="overflow-visible" aria-hidden>
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function Donut({ data, size = 112, center }: { data: { label: string; value: number }[]; size?: number; center?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 38;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} dir="ltr">
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        <circle cx={50} cy={50} r={r} fill="none" stroke="#e2e8f0" strokeOpacity={0.6} strokeWidth={13} />
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.value / total) * c;
            const el = (
              <circle
                key={d.label}
                cx={50}
                cy={50}
                r={r}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={13}
                strokeDasharray={`${Math.max(0, len - 1.5)} ${c - Math.max(0, len - 1.5)}`}
                strokeDashoffset={-acc}
              >
                <title>{`${d.label}: ${Math.round(d.value).toLocaleString("en-US")}`}</title>
              </circle>
            );
            acc += len;
            return el;
          })}
      </svg>
      {center && <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-500">{center}</div>}
    </div>
  );
}

function DonutCard({
  title,
  data,
  card,
  strong,
  muted,
  empty,
}: {
  title: string;
  data: { label: string; value: number }[];
  card: string;
  strong: string;
  muted: string;
  empty: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={`rounded-3xl border p-5 ${card}`}>
      <h3 className={`text-sm font-bold mb-4 ${strong}`}>{title}</h3>
      {total === 0 ? (
        <p className={`text-xs py-8 text-center ${muted}`}>{empty}</p>
      ) : (
        <div className="flex items-center gap-4">
          <Donut data={data} center={"Rs " + shortNum(total)} />
          <ul className="flex-1 min-w-0 space-y-2">
            {data.map((d, i) => (
              <li key={d.label} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 min-w-0">
                  <i className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className={`truncate ${muted}`}>{d.label}</span>
                </span>
                <b className={strong}>{Math.round((d.value / total) * 100)}%</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AreaChart({ days, salesLabel, profitLabel }: { days: { day: number; revenue: number; profit: number }[]; salesLabel: string; profitLabel: string }) {
  const W = 640;
  const H = 190;
  const padL = 34;
  const padB = 22;
  const padT = 10;
  const max = Math.max(1, ...days.map((d) => Math.max(d.revenue, d.profit)));
  const x = (i: number) => padL + (i / (days.length - 1)) * (W - padL - 6);
  const y = (v: number) => padT + (1 - Math.max(0, v) / max) * (H - padT - padB);
  const sPts: [number, number][] = days.map((d, i) => [x(i), y(d.revenue)]);
  const pPts: [number, number][] = days.map((d, i) => [x(i), y(d.profit)]);
  const area = (pts: [number, number][]) => `${smoothPath(pts)} L${pts[pts.length - 1][0]},${H - padB} L${pts[0][0]},${H - padB} Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        {grid.map((g) => (
          <g key={g}>
            <line x1={padL} x2={W - 6} y1={y(max * g)} y2={y(max * g)} stroke="#e2e8f0" strokeDasharray="3 4" />
            <text x={padL - 6} y={y(max * g) + 3} textAnchor="end" fontSize={9} fill="#94a3b8">
              {shortNum(max * g)}
            </text>
          </g>
        ))}
        <path d={area(sPts)} fill="url(#gSales)" />
        <path d={smoothPath(sPts)} fill="none" stroke="#10b981" strokeWidth={2.2} strokeLinecap="round" />
        <path d={area(pPts)} fill="url(#gProfit)" />
        <path d={smoothPath(pPts)} fill="none" stroke="#0ea5e9" strokeWidth={2} strokeLinecap="round" />
        {days.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.revenue)} r={7} fill="transparent">
              <title>{`${d.day}: ${salesLabel} ${Math.round(d.revenue).toLocaleString("en-US")} • ${profitLabel} ${Math.round(d.profit).toLocaleString("en-US")}`}</title>
            </circle>
            {(i === 0 || i === days.length - 1 || i % 5 === 0) && (
              <text x={x(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#94a3b8">
                {d.day}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function Ring({ value, max, size = 120 }: { value: number; max: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} dir="ltr">
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        <circle cx={50} cy={50} r={r} fill="none" stroke="#e2e8f0" strokeOpacity={0.7} strokeWidth={10} />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={pct >= 1 ? "#10b981" : "#38bdf8"}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-slate-700">{Math.round(pct * 100)}%</div>
    </div>
  );
}

export default function DashboardPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<"ur" | "en">("ur");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [books, setBooks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [supplierList, setSupplierList] = useState<any[]>([]);
  const [supOrders, setSupOrders] = useState<any[]>([]);
  const [supPays, setSupPays] = useState<any[]>([]);
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [targetAmt, setTargetAmt] = useState(0);
  const [backupDays, setBackupDays] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // ایڈمن کی جانچ: لاگ ان کوکی موجود ہو تو مالی اعداد و شمار نظر آئیں گے
    setIsAdmin(/(^|;\s*)maktaba-auth=[^;]+/.test(document.cookie));
  }, []);

  useEffect(() => {
    try {
      setTargetAmt(Number(localStorage.getItem("maktaba-target")) || 0);
      const lb = localStorage.getItem("maktaba-last-backup");
      setBackupDays(lb ? Math.floor((Date.now() - new Date(lb).getTime()) / 86400000) : null);
    } catch {}
  }, []);

  useEffect(() => {
    // عام گاہکوں کے لیے ٹوکری میں موجود اشیا کی تعداد
    const refresh = () => setCartCount(getCartCount());
    refresh();
    window.addEventListener("maktaba-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("maktaba-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: booksData } = await supabase
        .from("books")
        .select("*")
        .order("id", { ascending: true });
      if (booksData) setBooks(booksData);

      const { data: ordersData } = await supabase.from("orders").select("*");
      if (ordersData) setOrders(ordersData);

      const { data: invoicesData } = await supabase.from("invoices").select("*");
      if (invoicesData) setInvoices(invoicesData);

      const { data: invoiceItemsData } = await supabase.from("invoice_items").select("invoice_id, book_id, item_title, quantity, total_price");
      if (invoiceItemsData) setInvoiceItems(invoiceItemsData);

      const { data: expensesData } = await supabase.from("expenses").select("*");
      if (expensesData) setExpenses(expensesData);

      // باقی ماڈیولز: کوئی ٹیبل نہ ہو تو خاموشی سے چھوڑ دیں
      const safe = async (table: string, setter: (rows: any[]) => void) => {
        try {
          const { data, error } = await supabase.from(table).select("*");
          if (!error && data) setter(data);
        } catch {}
      };
      await Promise.all([
        safe("customers", setCustomersList),
        safe("suppliers", setSupplierList),
        safe("supplier_orders", setSupOrders),
        safe("supplier_payments", setSupPays),
        safe("returns", setReturnsList),
        safe("reviews", setReviewsList),
        safe("stock_alerts", (rows) => setAlertCount(rows.length)),
      ]);

      setLoaded(true);
    };
    fetchAll();
  }, []);

  const now = new Date();
  // فروخت کے تمام اندراجات: آرڈرز اور بل (انوائسز) دونوں سے
  const costByBook = new Map<any, number>(books.map((b) => [b.id, Number(b.cost_price) || 0]));
  const invoiceCostMap = new Map<any, number>();
  invoiceItems.forEach((it) => {
    const c = (it.quantity || 0) * (costByBook.get(it.book_id) || 0);
    invoiceCostMap.set(it.invoice_id, (invoiceCostMap.get(it.invoice_id) || 0) + c);
  });
  const saleEntries: { date: Date; revenue: number; cost: number }[] = [
    ...orders.map((o) => ({
      date: new Date(o.created_at || Date.now()),
      revenue: o.book_price || 0,
      cost: o.cost_price || 0,
    })),
    ...invoices.map((inv) => ({
      date: new Date(inv.created_at || Date.now()),
      revenue: Number(inv.total_amount) || 0,
      cost: invoiceCostMap.get(inv.id) || 0,
    })),
  ];
  const thisMonthOrders = saleEntries.filter((o) => {
    const d = o.date;
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.revenue, 0);
  const thisMonthCost = thisMonthOrders.reduce((sum, o) => sum + o.cost, 0);
  const thisMonthExpenseTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthProfit = thisMonthRevenue - thisMonthCost - thisMonthExpenseTotal;

  // ہر مہینے کا نفع: فروخت - لاگت - اخراجات
  const monthNamesUr = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
  const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthlyMap: Record<string, { year: number; month: number; revenue: number; cost: number; expense: number }> = {};
  const getMonthEntry = (d: Date) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthlyMap[key]) {
      monthlyMap[key] = { year: d.getFullYear(), month: d.getMonth(), revenue: 0, cost: 0, expense: 0 };
    }
    return monthlyMap[key];
  };
  getMonthEntry(now);
  saleEntries.forEach((o) => {
    const d = o.date;
    if (isNaN(d.getTime())) return;
    const m = getMonthEntry(d);
    m.revenue += o.revenue;
    m.cost += o.cost;
  });
  expenses.forEach((e) => {
    const d = new Date(e.expense_date);
    if (isNaN(d.getTime())) return;
    getMonthEntry(d).expense += e.amount || 0;
  });
  const monthlyStats = Object.values(monthlyMap)
    .sort((x, y) => y.year * 12 + y.month - (x.year * 12 + x.month))
    .map((m) => ({ ...m, profit: m.revenue - m.cost - m.expense }));

  const totalStockValue = books.reduce((sum, b) => sum + (b.price || 0) * (b.stock || 0), 0);
  const totalBooks = books.length;
  const totalAuthors = new Set(books.map((b) => b.author)).size;
  const totalCategories = new Set(books.map((b) => b.category)).size;


  // --- اضافی اعداد و شمار ڈیش بورڈ کے لیے ---
  const todayKey = now.toDateString();
  const todaySales =
    orders.filter((o) => new Date(o.created_at || 0).toDateString() === todayKey).reduce((s, o) => s + (Number(o.book_price) || 0), 0) +
    invoices.filter((i) => new Date(i.created_at || 0).toDateString() === todayKey).reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const duesTotal = invoices
    .filter((i) => i.payment_status !== "paid")
    .reduce((s, i) => s + Math.max(0, (Number(i.total_amount) || 0) - (Number(i.amount_paid) || 0)), 0);
  const orderGroups = (() => {
    const map = new Map<string, any[]>();
    orders.forEach((o) => {
      const key = String(o.order_group ?? o.id);
      const arr = map.get(key) || [];
      arr.push(o);
      map.set(key, arr);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b[0].created_at || 0).getTime() - new Date(a[0].created_at || 0).getTime()
    );
  })();
  const newOrderCount = orderGroups.filter((g) => g[0].status === "نیا").length;
  const lowStockBooks = books
    .filter((b) => (Number(b.stock) || 0) <= ((Number(b.price) || 0) >= 1000 ? 2 : 3))
    .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0));
  const chartMonths = [...monthlyStats].slice(0, 6).reverse();
  const chartMax = Math.max(1, ...chartMonths.map((m) => m.revenue));
  const L = (ur: string, en: string) => (lang === "ur" ? ur : en);
  const money = (n: number) => "Rs " + Math.round(n).toLocaleString("en-US");
  const dateText = now.toLocaleDateString(lang === "ur" ? "ur-PK" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const statusStyle = (s: string) =>
    s === "مکمل ہوا"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : s === "زیر عمل"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-sky-50 text-sky-700 ring-sky-200";
  const card = darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-100 shadow-[0_2px_14px_rgba(15,23,42,0.05)]";
  const muted = darkMode ? "text-slate-400" : "text-slate-400";
  const strong = darkMode ? "text-white" : "text-slate-900";

  // --- گراف اور تجزیے کے لیے ---
  const dayKey = (d: Date) => d.toDateString();
  const dailyMap = new Map<string, { revenue: number; cost: number }>();
  saleEntries.forEach((e) => {
    if (isNaN(e.date.getTime())) return;
    const k = dayKey(e.date);
    const cur = dailyMap.get(k) || { revenue: 0, cost: 0 };
    cur.revenue += e.revenue;
    cur.cost += e.cost;
    dailyMap.set(k, cur);
  });
  const orderCountByDay = new Map<string, number>();
  orderGroups.forEach((g) => {
    const k = dayKey(new Date(g[0].created_at || 0));
    orderCountByDay.set(k, (orderCountByDay.get(k) || 0) + 1);
  });
  const days30 = Array.from({ length: 30 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - idx));
    const v = dailyMap.get(dayKey(d)) || { revenue: 0, cost: 0 };
    return { day: d.getDate(), revenue: v.revenue, profit: v.revenue - v.cost, orders: orderCountByDay.get(dayKey(d)) || 0 };
  });
  const last7 = days30.slice(-7);

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastM = monthlyMap[`${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`];
  const lastMonthRevenue = lastM ? lastM.revenue : 0;
  const lastMonthProfit = lastM ? lastM.revenue - lastM.cost - lastM.expense : 0;
  const growth = (cur: number, prev: number) => (prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100);
  const salesGrowth = growth(thisMonthRevenue, lastMonthRevenue);
  const profitGrowth = growth(thisMonthProfit, lastMonthProfit);

  const inThisMonth = (v: any) => {
    const d = new Date(v || 0);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const monthOrders = orders.filter((o) => inThisMonth(o.created_at));
  const monthInvoices = invoices.filter((i) => inThisMonth(i.created_at));
  const onlineRevenue = monthOrders.reduce((s, o) => s + (Number(o.book_price) || 0), 0);
  const shopRevenue = monthInvoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const monthTxCount = new Set(monthOrders.map((o) => String(o.order_group ?? o.id))).size + monthInvoices.length;
  const avgTx = monthTxCount > 0 ? thisMonthRevenue / monthTxCount : 0;

  const bookTitleById = new Map<any, string>(books.map((b) => [b.id, b.title]));
  const monthInvoiceIds = new Set(monthInvoices.map((i) => i.id));
  const topMap = new Map<string, { qty: number; revenue: number }>();
  const addTop = (title: string, qty: number, revenue: number) => {
    if (!title) return;
    const cur = topMap.get(title) || { qty: 0, revenue: 0 };
    cur.qty += qty;
    cur.revenue += revenue;
    topMap.set(title, cur);
  };
  monthOrders.forEach((o) => addTop(o.book_title, Number(o.quantity) || 0, Number(o.book_price) || 0));
  invoiceItems
    .filter((it) => monthInvoiceIds.has(it.invoice_id))
    .forEach((it) => addTop(bookTitleById.get(it.book_id) || it.item_title || "", Number(it.quantity) || 0, Number(it.total_price) || 0));
  const topBooks = Array.from(topMap.entries())
    .map(([title, v]) => ({ title, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const topMaxQty = Math.max(1, ...topBooks.map((b) => b.qty));

  const topN = (entries: { label: string; value: number }[], n: number, otherLabel: string) => {
    const sorted = entries.filter((e) => e.value > 0).sort((a, b) => b.value - a.value);
    const head5 = sorted.slice(0, n);
    const rest = sorted.slice(n).reduce((s, e) => s + e.value, 0);
    return rest > 0 ? [...head5, { label: otherLabel, value: rest }] : head5;
  };
  const expMap = new Map<string, number>();
  thisMonthExpenses.forEach((e) => expMap.set(e.title || "—", (expMap.get(e.title || "—") || 0) + (Number(e.amount) || 0)));
  const expenseSlices = topN(Array.from(expMap.entries()).map(([label, value]) => ({ label, value })), 4, lang === "ur" ? "دیگر" : "Other");
  const catMap = new Map<string, number>();
  books.forEach((b) => catMap.set(b.category || "—", (catMap.get(b.category || "—") || 0) + (Number(b.price) || 0) * (Number(b.stock) || 0)));
  const categorySlices = topN(Array.from(catMap.entries()).map(([label, value]) => ({ label, value })), 4, lang === "ur" ? "دیگر" : "Other");
  const collected = invoices.reduce((s, i) => s + (Number(i.amount_paid) || 0), 0);
  const collectSlices = [
    { label: lang === "ur" ? "وصول شدہ" : "Collected", value: collected },
    { label: lang === "ur" ? "بقایا" : "Dues", value: duesTotal },
  ].filter((x) => x.value > 0);
  const sourceSlices = [
    { label: lang === "ur" ? "آن لائن آرڈرز" : "Online orders", value: onlineRevenue },
    { label: lang === "ur" ? "دکان / بل" : "Shop bills", value: shopRevenue },
  ].filter((x) => x.value > 0);

  // --- پورے کاروبار کا جائزہ ---
  const customerName = new Map<any, string>(customersList.map((c) => [c.id, c.name]));
  const spendMap = new Map<string, number>();
  orderGroups.forEach((g) => {
    const nm = String(g[0].customer_name || "").trim();
    if (!nm) return;
    const tot = Number((g.find((r: any) => r.total_amount) || g[0]).total_amount) || 0;
    spendMap.set(nm, (spendMap.get(nm) || 0) + tot);
  });
  invoices.forEach((i) => {
    const nm = customerName.get(i.customer_id);
    if (!nm) return;
    spendMap.set(nm, (spendMap.get(nm) || 0) + (Number(i.total_amount) || 0));
  });
  const topCustomers = Array.from(spendMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const topCustMax = Math.max(1, ...topCustomers.map((c) => c.total));

  const supplierBalances = supplierList
    .map((sp) => {
      const received = supOrders.filter((o) => o.supplier_id === sp.id).reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
      const mine = supPays.filter((p) => p.supplier_id === sp.id);
      const charges = mine.filter((p) => p.kind === "charge").reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const paid = mine.filter((p) => p.kind !== "charge").reduce((s, p) => s + (Number(p.amount) || 0), 0);
      return { name: sp.name as string, balance: received + charges - paid };
    })
    .filter((x) => Math.round(x.balance) > 0)
    .sort((a, b) => b.balance - a.balance);
  const payableTotal = supplierBalances.reduce((s, x) => s + x.balance, 0);

  const weekdayNames = lang === "ur" ? ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdaySums = [0, 0, 0, 0, 0, 0, 0];
  const cutoff90 = Date.now() - 90 * 86400000;
  saleEntries.forEach((e) => {
    if (isNaN(e.date.getTime()) || e.date.getTime() < cutoff90) return;
    weekdaySums[e.date.getDay()] += e.revenue;
  });
  const weekdayMax = Math.max(1, ...weekdaySums);
  const bestDay = weekdaySums.indexOf(Math.max(...weekdaySums));

  const reviewsPending = reviewsList.filter((r) => r.is_approved === false || r.approved === false || r.status === "pending").length;
  const returnsThisMonth = returnsList.filter((r) => inThisMonth(r.created_at)).length;
  const unpaidInvoiceCount = invoices.filter((i) => i.payment_status !== "paid").length;
  const booksNoCost = books.filter((b) => !(Number(b.cost_price) > 0)).length;
  const booksNoPrice = books.filter((b) => !(Number(b.price) > 0)).length;

  const ago = (d: Date) => {
    const m = Math.floor((Date.now() - d.getTime()) / 60000);
    if (isNaN(m)) return "";
    if (m < 1) return lang === "ur" ? "ابھی" : "now";
    if (m < 60) return `${m} ${lang === "ur" ? "منٹ پہلے" : "min ago"}`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ${lang === "ur" ? "گھنٹے پہلے" : "h ago"}`;
    const dd = Math.floor(h / 24);
    return `${dd} ${lang === "ur" ? "دن پہلے" : "d ago"}`;
  };

  const attention = [
    newOrderCount > 0 && { icon: "🛒", text: lang === "ur" ? `${newOrderCount} نئے آرڈرز پر کارروائی باقی ہے` : `${newOrderCount} new orders waiting`, href: "/orders", tone: "bg-sky-50 text-sky-700 border-sky-100" },
    duesTotal > 0 && { icon: "💰", text: lang === "ur" ? `گاہکوں سے وصولی: ${money(duesTotal)} (${unpaidInvoiceCount} بل)` : `Dues to collect: ${money(duesTotal)}`, href: "/invoices", tone: "bg-rose-50 text-rose-600 border-rose-100" },
    payableTotal > 0 && { icon: "🚚", text: lang === "ur" ? `سپلائرز کو ادائیگی: ${money(payableTotal)}` : `Owed to suppliers: ${money(payableTotal)}`, href: "/suppliers", tone: "bg-amber-50 text-amber-700 border-amber-100" },
    lowStockBooks.length > 0 && { icon: "📦", text: lang === "ur" ? `${lowStockBooks.length} کتابوں کا سٹاک کم یا ختم` : `${lowStockBooks.length} books low/out of stock`, href: "/low-stock", tone: "bg-orange-50 text-orange-700 border-orange-100" },
    alertCount > 0 && { icon: "🔔", text: lang === "ur" ? `${alertCount} گاہکوں نے کتاب آنے پر اطلاع مانگی ہے` : `${alertCount} back-in-stock requests`, href: "/low-stock", tone: "bg-violet-50 text-violet-700 border-violet-100" },
    reviewsPending > 0 && { icon: "⭐", text: lang === "ur" ? `${reviewsPending} ریویوز منظوری کے منتظر` : `${reviewsPending} reviews awaiting approval`, href: "/reviews", tone: "bg-yellow-50 text-yellow-700 border-yellow-100" },
    booksNoPrice > 0 && { icon: "🏷️", text: lang === "ur" ? `${booksNoPrice} کتابوں کی فروخت قیمت درج نہیں` : `${booksNoPrice} books have no sale price`, href: "/books", tone: "bg-slate-50 text-slate-600 border-slate-200" },
    booksNoCost > 0 && { icon: "🧮", text: lang === "ur" ? `${booksNoCost} کتابوں کی خرید قیمت درج نہیں (نفع غلط آ سکتا ہے)` : `${booksNoCost} books have no cost price`, href: "/books", tone: "bg-slate-50 text-slate-600 border-slate-200" },
    (backupDays === null || backupDays >= 7) && { icon: "💾", text: backupDays === null ? (lang === "ur" ? "بیک اپ ابھی نہیں لیا" : "No backup taken yet") : (lang === "ur" ? `آخری بیک اپ ${backupDays} دن پہلے لیا تھا` : `Last backup ${backupDays} days ago`), href: "/backup", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  ].filter(Boolean) as { icon: string; text: string; href: string; tone: string }[];

  const activity = [
    ...orderGroups.slice(0, 6).map((g) => ({
      date: new Date(g[0].created_at || 0),
      icon: "🛒",
      title: `${lang === "ur" ? "آن لائن آرڈر" : "Online order"} — ${g[0].customer_name || "—"}`,
      sub: money(Number((g.find((r: any) => r.total_amount) || g[0]).total_amount) || 0),
      href: "/orders",
    })),
    ...[...invoices]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 6)
      .map((i) => ({
        date: new Date(i.created_at || 0),
        icon: "🧾",
        title: `${lang === "ur" ? "بل" : "Bill"} #${i.id}${customerName.get(i.customer_id) ? " — " + customerName.get(i.customer_id) : ""}`,
        sub: money(Number(i.total_amount) || 0),
        href: "/invoices",
      })),
    ...[...expenses]
      .sort((a, b) => new Date(b.created_at || b.expense_date || 0).getTime() - new Date(a.created_at || a.expense_date || 0).getTime())
      .slice(0, 4)
      .map((e) => ({
        date: new Date(e.created_at || e.expense_date || 0),
        icon: "💸",
        title: `${lang === "ur" ? "خرچہ" : "Expense"} — ${e.title || ""}`,
        sub: money(Number(e.amount) || 0),
        href: "/expenses",
      })),
    ...[...returnsList]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 3)
      .map((r) => ({
        date: new Date(r.created_at || 0),
        icon: "↩️",
        title: lang === "ur" ? "واپسی / خراب مال" : "Return / damaged",
        sub: "",
        href: "/returns",
      })),
  ]
    .filter((e) => !isNaN(e.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  const changeTarget = () => {
    const v = window.prompt(lang === "ur" ? "اس مہینے کی فروخت کا ہدف (روپے) لکھیں:" : "Monthly sales target (Rs):", targetAmt ? String(targetAmt) : "");
    if (v === null) return;
    const n = Math.max(0, Number(v.replace(/[^0-9.]/g, "")) || 0);
    setTargetAmt(n);
    try {
      localStorage.setItem("maktaba-target", String(n));
    } catch {}
  };

  const handleLogout = async () => {
    document.cookie = "maktaba-auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const t = {
    ur: {
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
      sales: "فروخت",
      cost: "لاگت",
      expenseLabel: "اخراجات",
    },
    en: {
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
      sales: "Sales",
      cost: "Cost",
      expenseLabel: "Expenses",
    },
  }[lang];

  const menuItems = [
    { href: "/", label: t.dashboard, icon: LayoutDashboard, active: true, badge: 0 },
    { href: "/books", label: t.books, icon: BookOpen, badge: 0 },
    { href: "/authors", label: t.authors, icon: PenLine, badge: 0 },
    { href: "/categories", label: t.categories, icon: FolderTree, badge: 0 },
    { href: "/orders", label: t.orders, icon: ShoppingCart, badge: newOrderCount },
    { href: "/customers", label: t.customers, icon: Users, badge: 0 },
    { href: "/invoices", label: t.bills, icon: Receipt, badge: 0 },
    { href: "/suppliers", label: t.suppliers, icon: Truck, badge: 0 },
    { href: "/returns", label: t.returns, icon: RotateCcw, badge: 0 },
    { href: "/reviews", label: t.reviews, icon: Star, badge: 0 },
    { href: "/low-stock", label: t.lowStock, icon: PackageMinus, badge: lowStockBooks.length },
    { href: "/expenses", label: t.expenses, icon: Wallet, badge: 0 },
    { href: "/reports", label: L("رپورٹس", "Reports"), icon: TrendingUp, badge: 0 },
    { href: "/backup", label: L("بیک اپ", "Backup"), icon: Download, badge: 0 },
  ];

  const quickActions = [
    { href: "/invoices", label: L("نیا بل", "New Bill"), icon: Plus, tone: "bg-emerald-50 text-emerald-600" },
    { href: "/orders", label: L("آرڈرز", "Orders"), icon: ShoppingCart, tone: "bg-sky-50 text-sky-600" },
    { href: "/books", label: L("کتب", "Books"), icon: BookOpen, tone: "bg-violet-50 text-violet-600" },
    { href: "/suppliers", label: L("سپلائرز", "Suppliers"), icon: Truck, tone: "bg-amber-50 text-amber-600" },
    { href: "/reports", label: L("رپورٹس", "Reports"), icon: TrendingUp, tone: "bg-teal-50 text-teal-600" },
    { href: "/expenses", label: L("اخراجات", "Expenses"), icon: Wallet, tone: "bg-rose-50 text-rose-500" },
  ];

  const kpis = [
    { label: L("آج کی فروخت", "Today's Sales"), value: money(todaySales), icon: ShoppingBag, tone: "text-emerald-600 bg-emerald-50", href: "/invoices", spark: last7.map((d) => d.revenue), color: "#34d399" },
    { label: L("نئے آرڈرز", "New Orders"), value: String(newOrderCount), icon: ShoppingCart, tone: "text-sky-600 bg-sky-50", href: "/orders", spark: last7.map((d) => d.orders), color: "#38bdf8" },
    { label: L("وصول طلب بقایا", "Dues to Collect"), value: money(duesTotal), icon: Receipt, tone: "text-rose-500 bg-rose-50", href: "/invoices", spark: null, color: "#fb7185" },
    { label: L("کم سٹاک کتب", "Low Stock"), value: String(lowStockBooks.length), icon: PackageMinus, tone: "text-amber-600 bg-amber-50", href: "/low-stock", spark: null, color: "#fbbf24" },
  ];

  const modules = [
    { href: "/books", icon: BookOpen, tone: "bg-emerald-50 text-emerald-600", label: t.books, value: String(totalBooks), sub: `${lowStockBooks.length} ${L("کم سٹاک", "low")}` },
    { href: "/authors", icon: PenLine, tone: "bg-violet-50 text-violet-600", label: t.authors, value: String(totalAuthors), sub: "" },
    { href: "/categories", icon: FolderTree, tone: "bg-amber-50 text-amber-600", label: t.categories, value: String(totalCategories), sub: "" },
    { href: "/orders", icon: ShoppingCart, tone: "bg-sky-50 text-sky-600", label: t.orders, value: String(orderGroups.length), sub: `${newOrderCount} ${L("نئے", "new")}` },
    { href: "/customers", icon: Users, tone: "bg-teal-50 text-teal-600", label: t.customers, value: String(customersList.length), sub: "" },
    { href: "/invoices", icon: Receipt, tone: "bg-rose-50 text-rose-500", label: t.bills, value: String(invoices.length), sub: `${unpaidInvoiceCount} ${L("غیر ادا", "unpaid")}` },
    { href: "/suppliers", icon: Truck, tone: "bg-orange-50 text-orange-600", label: t.suppliers, value: String(supplierList.length), sub: payableTotal > 0 ? money(payableTotal) : "" },
    { href: "/returns", icon: RotateCcw, tone: "bg-slate-100 text-slate-600", label: t.returns, value: String(returnsList.length), sub: `${returnsThisMonth} ${L("اس مہینے", "this month")}` },
    { href: "/reviews", icon: Star, tone: "bg-yellow-50 text-yellow-600", label: t.reviews, value: String(reviewsList.length), sub: reviewsPending > 0 ? `${reviewsPending} ${L("منتظر", "pending")}` : "" },
    { href: "/expenses", icon: Wallet, tone: "bg-pink-50 text-pink-500", label: t.expenses, value: money(thisMonthExpenseTotal), sub: L("اس مہینے", "this month") },
    { href: "/reports", icon: TrendingUp, tone: "bg-cyan-50 text-cyan-600", label: L("رپورٹس", "Reports"), value: "PDF", sub: L("نفع / مصنف / سپلائر", "profit reports") },
    { href: "/backup", icon: Download, tone: "bg-lime-50 text-lime-600", label: L("بیک اپ", "Backup"), value: backupDays === null ? "—" : backupDays === 0 ? L("آج", "Today") : `${backupDays}${L(" دن", "d")}`, sub: L("آخری بیک اپ", "last backup") },
  ];

  const counters = [
    { label: L("سٹاک کی مالیت", "Stock Value"), value: money(totalStockValue), icon: Boxes, href: "/books", tone: "text-blue-600 bg-blue-50" },
    { label: t.books, value: String(totalBooks), icon: BookOpen, href: isAdmin ? "/books" : "/shop", tone: "text-emerald-600 bg-emerald-50" },
    { label: t.authors, value: String(totalAuthors), icon: PenLine, href: isAdmin ? "/authors" : "/shop", tone: "text-violet-600 bg-violet-50" },
    { label: t.categories, value: String(totalCategories), icon: FolderTree, href: isAdmin ? "/categories" : "/shop", tone: "text-amber-600 bg-amber-50" },
  ];

  const GrowthBadge = ({ value }: { value: number | null }) =>
    value === null ? null : (
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          value >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
        }`}
        dir="ltr"
      >
        {value >= 0 ? "▲" : "▼"} {Math.abs(Math.round(value))}%
      </span>
    );

  const sectionTitle = `text-sm font-bold ${strong}`;

  // --- آج کا خلاصہ اور سٹاک کی صحت ---
  const todayV = dailyMap.get(dayKey(now)) || { revenue: 0, cost: 0 };
  const todayOrdersN = orderCountByDay.get(dayKey(now)) || 0;
  const todayExpense = expenses
    .filter((e) => new Date(e.expense_date || e.created_at || 0).toDateString() === dayKey(now))
    .reduce((s2, e) => s2 + (Number(e.amount) || 0), 0);
  const yV = dailyMap.get(dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) || { revenue: 0, cost: 0 };
  const invUnits = books.reduce((s2, b) => s2 + (Number(b.stock) || 0), 0);
  const invCost = books.reduce((s2, b) => s2 + (Number(b.cost_price) || 0) * (Number(b.stock) || 0), 0);
  const invSale = books.reduce((s2, b) => s2 + (Number(b.price) || 0) * (Number(b.stock) || 0), 0);
  const cutoff60 = Date.now() - 60 * 86400000;
  const soldRecent = new Set<string>();
  orders.forEach((o) => {
    if (new Date(o.created_at || 0).getTime() >= cutoff60 && o.book_title) soldRecent.add(String(o.book_title));
  });
  const invDate = new Map<any, number>(invoices.map((i) => [i.id, new Date(i.created_at || 0).getTime()]));
  invoiceItems.forEach((it) => {
    if ((invDate.get(it.invoice_id) || 0) >= cutoff60) {
      const nm = it.book_id != null ? bookTitleById.get(it.book_id) : it.item_title;
      if (nm) soldRecent.add(String(nm));
    }
  });
  const slowBooks = books
    .filter((b) => (Number(b.stock) || 0) > 0 && !soldRecent.has(String(b.title)))
    .sort((a2, b2) => (Number(b2.stock) || 0) * (Number(b2.cost_price) || Number(b2.price) || 0) - (Number(a2.stock) || 0) * (Number(a2.cost_price) || Number(a2.price) || 0));
  const slowValue = slowBooks.reduce((s2, b) => s2 + (Number(b.stock) || 0) * (Number(b.cost_price) || 0), 0);
  const stockHealthPct = books.length > 0 ? Math.round((books.filter((b) => (Number(b.stock) || 0) > 3).length / books.length) * 100) : 0;
  const linkCls = "text-xs font-semibold text-emerald-600 hover:underline";

  return (
    <main
      dir={lang === "ur" ? "rtl" : "ltr"}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-gradient-to-b from-emerald-50/70 via-slate-50 to-slate-50 text-slate-800"
      }`}
    >
      <div className="flex flex-1">
        {isAdmin && mobileMenuOpen && (
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" />
        )}

        {/* سائیڈ بار */}
        {isAdmin && (
          <aside
            className={`w-64 min-h-screen md:h-screen md:sticky md:top-0 ${
              darkMode ? "bg-slate-900 border-slate-800" : "bg-white/90 border-slate-100"
            } border-x p-4 flex flex-col fixed inset-y-0 ${lang === "ur" ? "right-0" : "left-0"} z-50 flex-shrink-0 transform transition-transform duration-300 shadow-xl md:shadow-none ${
              mobileMenuOpen ? "translate-x-0" : lang === "ur" ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.jpg" alt="logo" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-emerald-200" />
                <div>
                  <h1 className={`text-base font-bold leading-tight ${strong}`}>مكتبہ الزھراء</h1>
                  <p className="text-[10px] text-slate-400">{L("ایڈمن پینل", "Admin Panel")}</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <nav className="mt-6 space-y-0.5 flex-1 overflow-y-auto">
              <p className="text-slate-400 text-[10px] font-bold tracking-wider px-3 mb-2">{t.menu}</p>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${
                      item.active
                        ? darkMode
                          ? "bg-emerald-900/40 text-emerald-300"
                          : "bg-emerald-50 text-emerald-700"
                        : darkMode
                        ? "text-slate-300 hover:bg-slate-800"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={17} className={item.active ? "text-emerald-500" : "text-slate-300"} />
                      {item.label}
                    </span>
                    {item.badge > 0 && (
                      <span className="bg-rose-100 text-rose-600 text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className={`border-t ${darkMode ? "border-slate-800" : "border-slate-100"} pt-3 mt-2`}>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl w-full text-[13px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut size={17} className="text-slate-300" />
                {t.logout}
              </button>
              <p className="text-slate-400 text-[10px] text-center mt-2">مكتبہ الزھراء © 2026</p>
            </div>
          </aside>
        )}

        <section className="flex-1 p-4 md:p-8 max-w-7xl mx-auto min-w-0 w-full pb-24 md:pb-8">
          {isAdmin ? (
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setMobileMenuOpen(true)} className={`md:hidden p-2 rounded-2xl border ${card}`}>
                  <Menu size={20} />
                </button>
                <div className="min-w-0">
                  <h2 className={`text-xl md:text-2xl font-extrabold ${strong}`}>{L("خوش آمدید 👋", "Welcome 👋")}</h2>
                  <p suppressHydrationWarning className="text-xs mt-0.5 text-slate-400">{dateText}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2.5 rounded-2xl border transition ${card} text-slate-400 hover:text-emerald-600`}
                  title={darkMode ? "Light" : "Dark"}
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  onClick={() => setLang(lang === "ur" ? "en" : "ur")}
                  className={`px-3 py-2.5 rounded-2xl border transition text-xs font-bold flex items-center gap-1.5 ${card} text-slate-400 hover:text-emerald-600`}
                >
                  <Globe size={15} />
                  {lang === "ur" ? "EN" : "اردو"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
              <Link href="/" className="flex items-center gap-2.5">
                <img src="/logo.jpg" alt="مكتبہ الزھراء" className="w-9 h-9 rounded-lg object-cover" />
                <h1 className="text-sm md:text-base font-bold text-slate-800">مكتبہ الزھراء</h1>
              </Link>
              <nav className="flex items-center gap-3 md:gap-4 text-xs font-semibold text-slate-600">
                <Link href="/shop" className="hover:text-emerald-600 transition">کتب</Link>
                <Link href="/about" className="hover:text-emerald-600 transition">ہمارے بارے میں</Link>
                <Link href="/contact" className="hover:text-emerald-600 transition">رابطہ</Link>
                <Link href="/cart" className="relative flex items-center justify-center rounded-lg bg-orange-50 hover:bg-orange-100 transition p-2">
                  <ShoppingCart size={17} className="text-orange-500" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </nav>
            </div>
          )}

          {!loaded ? (
            <div className="space-y-4 animate-pulse">
              <div className={`h-44 rounded-3xl ${darkMode ? "bg-slate-900" : "bg-white"}`} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-28 rounded-3xl ${darkMode ? "bg-slate-900" : "bg-white"}`} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {isAdmin && (
                <>
                  {/* مرکزی کارڈ */}
                  <div
                    className={`relative overflow-hidden rounded-3xl p-5 md:p-7 border ${
                      darkMode
                        ? "bg-gradient-to-br from-emerald-950 to-slate-900 border-slate-800 text-white"
                        : "bg-gradient-to-br from-emerald-100/80 via-teal-50 to-sky-50 border-emerald-100 text-emerald-950 shadow-[0_6px_24px_rgba(16,185,129,0.10)]"
                    }`}
                  >
                    <div className="absolute -top-20 -left-16 w-60 h-60 rounded-full bg-white/50 blur-2xl" />
                    <div className="absolute -bottom-24 right-6 w-64 h-64 rounded-full bg-sky-200/30 blur-2xl" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold opacity-70">
                            {L("اس مہینے کا خالص نفع", "Net Profit This Month")} — {(lang === "ur" ? monthNamesUr : monthNamesEn)[now.getMonth()]}
                          </p>
                          <p className="mt-2 text-3xl md:text-5xl font-extrabold tracking-tight" dir="ltr">
                            {thisMonthProfit < 0 ? "-" : ""}
                            {money(Math.abs(thisMonthProfit))}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-1.5 opacity-80">
                              {L("پچھلے مہینے کے مقابلے میں نفع", "Profit vs last month")} <GrowthBadge value={profitGrowth} />
                            </span>
                            <span className="flex items-center gap-1.5 opacity-80">
                              {L("فروخت", "Sales")} <GrowthBadge value={salesGrowth} />
                            </span>
                          </div>
                        </div>
                        <span className="p-3 rounded-2xl bg-white/70 text-emerald-600 shadow-sm">
                          <TrendingUp size={22} />
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-2.5">
                        {[
                          [t.sales, money(thisMonthRevenue)],
                          [t.cost, money(thisMonthCost)],
                          [t.expenseLabel, money(thisMonthExpenseTotal)],
                          [L("لین دین", "Transactions"), String(monthTxCount)],
                          [L("اوسط بل", "Avg. Sale"), money(avgTx)],
                        ].map(([label, val]) => (
                          <div key={label} className={`rounded-2xl p-3 ${darkMode ? "bg-white/5" : "bg-white/70 shadow-sm"}`}>
                            <p className="text-[11px] opacity-60">{label}</p>
                            <p className="mt-0.5 text-sm font-bold" dir="ltr">
                              {val}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* توجہ طلب + ماہانہ ہدف */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className={`lg:col-span-2 rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={sectionTitle}>{L("🔔 توجہ طلب کام", "🔔 Needs Attention")}</h3>
                        <span className="text-[11px] text-slate-400">{attention.length} {L("اشارے", "items")}</span>
                      </div>
                      {attention.length === 0 ? (
                        <p className="text-xs py-6 text-center text-slate-400">✅ {L("سب کچھ ٹھیک ہے، کوئی کام باقی نہیں", "All clear — nothing pending")}</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {attention.map((a, i) => (
                            <Link key={i} href={a.href} className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-xs font-semibold hover:-translate-y-0.5 transition-all ${a.tone}`}>
                              <span className="text-base">{a.icon}</span>
                              <span className="leading-snug">{a.text}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`rounded-3xl border p-5 flex flex-col items-center justify-between text-center ${card}`}>
                      <div className="w-full flex items-center justify-between">
                        <h3 className={sectionTitle}>{L("🎯 ماہانہ ہدف", "🎯 Monthly Target")}</h3>
                        <button onClick={changeTarget} className="text-[11px] font-semibold text-emerald-600 hover:underline">
                          {targetAmt > 0 ? L("بدلیں", "Edit") : L("مقرر کریں", "Set")}
                        </button>
                      </div>
                      {targetAmt > 0 ? (
                        <>
                          <div className="my-3">
                            <Ring value={thisMonthRevenue} max={targetAmt} />
                          </div>
                          <p className="text-[11px] text-slate-400" dir="ltr">
                            {money(thisMonthRevenue)} / {money(targetAmt)}
                          </p>
                          <p className="text-[11px] mt-1 text-slate-500">
                            {thisMonthRevenue >= targetAmt
                              ? L("🎉 ہدف پورا ہو گیا!", "🎉 Target reached!")
                              : `${L("باقی", "Remaining")}: ${money(targetAmt - thisMonthRevenue)}`}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 py-8 leading-relaxed">
                          {L("اس مہینے کی فروخت کا ہدف مقرر کریں اور ترقی کا دائرہ دیکھیں", "Set a sales target and track progress")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* چار خانے */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {kpis.map((k) => {
                      const Icon = k.icon;
                      return (
                        <Link
                          key={k.label}
                          href={k.href}
                          className={`group rounded-3xl border p-4 hover:-translate-y-0.5 transition-all ${card}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`p-2.5 rounded-2xl ${k.tone}`}>
                              <Icon size={18} />
                            </span>
                            {k.spark ? <Sparkline values={k.spark} color={k.color} /> : <ArrowUpRight size={15} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />}
                          </div>
                          <p className={`mt-3 text-xl md:text-2xl font-extrabold ${strong}`} dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>
                            {k.value}
                          </p>
                          <p className="text-xs mt-0.5 text-slate-400">{k.label}</p>
                        </Link>
                      );
                    })}
                  </div>

                  {/* فوری کام */}
                  <div>
                    <h3 className={`${sectionTitle} mb-3`}>{L("فوری کام", "Quick Actions")}</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {quickActions.map((a) => {
                        const Icon = a.icon;
                        return (
                          <Link
                            key={a.href + a.label}
                            href={a.href}
                            className={`rounded-3xl border p-3.5 flex flex-col items-center gap-2 text-center hover:-translate-y-0.5 transition-all ${card}`}
                          >
                            <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${a.tone}`}>
                              <Icon size={20} />
                            </span>
                            <span className={`text-[11px] md:text-xs font-semibold ${darkMode ? "text-slate-200" : "text-slate-600"}`}>{a.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* آج کا خلاصہ */}
                  <div>
                    <h3 className={`${sectionTitle} mb-3`}>{L("آج کا خلاصہ", "Today")}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: L("آج کی فروخت", "Today's sales"), value: money(todayV.revenue), sub: yV.revenue > 0 ? L(`کل: ${money(yV.revenue)}`, `Yesterday: ${money(yV.revenue)}`) : L("کل کوئی فروخت نہیں", "None yesterday"), tone: "bg-emerald-50 text-emerald-600", icon: "💵" },
                        { label: L("آج کا نفع", "Today's profit"), value: money(todayV.revenue - todayV.cost - todayExpense), sub: L("خرچہ نکال کر", "after expenses"), tone: "bg-teal-50 text-teal-600", icon: "📈" },
                        { label: L("آج کے آن لائن آرڈرز", "Online orders today"), value: String(todayOrdersN), sub: L(`نئے: ${newOrderCount}`, `New: ${newOrderCount}`), tone: "bg-sky-50 text-sky-600", icon: "🛒" },
                        { label: L("آج کا خرچہ", "Today's expenses"), value: money(todayExpense), sub: L("دکان کے اخراجات", "shop expenses"), tone: "bg-rose-50 text-rose-500", icon: "💸" },
                      ].map((c) => (
                        <div key={c.label} className={`rounded-3xl border p-4 ${card}`}>
                          <span className={`inline-flex w-9 h-9 items-center justify-center rounded-2xl text-base ${c.tone}`}>{c.icon}</span>
                          <p className={`mt-2 text-lg font-extrabold truncate ${strong}`} dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>{c.value}</p>
                          <p className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{c.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{c.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* سٹاک کی صحت */}
                  <div className={`rounded-3xl border p-5 ${card}`}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h3 className={sectionTitle}>{L("سٹاک کی صحت اور گودام کی مالیت", "Inventory Health")}</h3>
                      <Link href="/books" className="text-[11px] font-semibold text-emerald-600">{L("کتب دیکھیں ←", "View books →")}</Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        [L("کل نسخے", "Total copies"), invUnits.toLocaleString("en-US"), "bg-sky-50 text-sky-700"],
                        [L("خرید کی مالیت", "At cost"), money(invCost), "bg-amber-50 text-amber-700"],
                        [L("فروخت کی مالیت", "At sale price"), money(invSale), "bg-emerald-50 text-emerald-700"],
                        [L("ممکنہ نفع", "Potential profit"), money(Math.max(0, invSale - invCost)), "bg-violet-50 text-violet-700"],
                      ].map(([l2, v2, tone]) => (
                        <div key={l2} className={`rounded-2xl p-3 ${tone}`}>
                          <p className="text-[11px] opacity-70">{l2}</p>
                          <p className="mt-0.5 text-sm font-extrabold truncate" dir="ltr">{v2}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-slate-500">{L("صحت مند سٹاک (3 سے زیادہ نسخے والی کتب)", "Healthy stock (more than 3 copies)")}</span>
                        <span className="font-bold text-emerald-600">{stockHealthPct}%</span>
                      </div>
                      <div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                        <div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500" style={{ width: `${stockHealthPct}%` }} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className={`text-xs font-bold mb-2 ${strong}`}>
                        {L("🐌 سست کتب — 60 دن میں نہیں بکیں", "🐌 Slow movers — not sold in 60 days")}
                        <span className="font-normal text-slate-400"> ({slowBooks.length}{slowValue > 0 ? ` • ${money(slowValue)}` : ""})</span>
                      </p>
                      {slowBooks.length === 0 ? (
                        <p className="text-[11px] text-slate-400">{L("ماشاءاللہ، ہر کتاب بک رہی ہے۔", "Everything is selling.")}</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {slowBooks.slice(0, 8).map((b) => (
                            <span key={b.id} className={`text-[11px] rounded-full px-2.5 py-1 border ${darkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                              {b.title} <span className="text-slate-400">×{Number(b.stock) || 0}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* پورا کاروبار ایک نظر میں */}
                  <div>
                    <h3 className={`${sectionTitle} mb-3`}>{L("پورا کاروبار ایک نظر میں", "Business Overview")}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {modules.map((m) => {
                        const Icon = m.icon;
                        return (
                          <Link key={m.href} href={m.href} className={`group rounded-3xl border p-4 hover:-translate-y-0.5 transition-all ${card}`}>
                            <div className="flex items-center justify-between">
                              <span className={`p-2.5 rounded-2xl ${m.tone}`}>
                                <Icon size={17} />
                              </span>
                              <ArrowUpRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <p className={`mt-3 text-lg font-extrabold truncate ${strong}`} dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>
                              {m.value}
                            </p>
                            <p className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{m.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 h-3.5 truncate">{m.sub}</p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* 30 دن کا گراف + ذریعہ */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className={`lg:col-span-2 rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={sectionTitle}>{L("پچھلے 30 دن", "Last 30 Days")}</h3>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <i className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> {t.sales}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> {L("نفع", "Profit")}
                          </span>
                        </div>
                      </div>
                      <AreaChart days={days30} salesLabel={t.sales} profitLabel={L("نفع", "Profit")} />
                    </div>
                    <DonutCard
                      title={L("فروخت کا ذریعہ (اس مہینے)", "Sales Source (this month)")}
                      data={sourceSlices}
                      card={card}
                      strong={strong}
                      muted="text-slate-400"
                      empty={L("اس مہینے ابھی فروخت نہیں", "No sales this month")}
                    />
                  </div>

                  {/* 6 مہینے + زیادہ بکنے والی کتب */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={sectionTitle}>{L("پچھلے 6 مہینے", "Last 6 Months")}</h3>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <i className="w-2.5 h-2.5 rounded-sm bg-emerald-200 inline-block" /> {t.sales}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> {L("نفع", "Profit")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-end justify-between gap-2 h-44" dir="ltr">
                        {chartMonths.map((m) => {
                          const rev = Math.max(4, (m.revenue / chartMax) * 100);
                          const prof = m.profit > 0 ? Math.max(4, (m.profit / chartMax) * 100) : 0;
                          return (
                            <div key={`${m.year}-${m.month}`} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-0">
                              <div className="w-full flex items-end justify-center gap-1 flex-1">
                                <div className="w-1/2 max-w-6 rounded-t-lg bg-emerald-200/80" style={{ height: `${rev}%` }} title={money(m.revenue)} />
                                <div
                                  className={`w-1/2 max-w-6 rounded-t-lg ${m.profit < 0 ? "bg-rose-300" : "bg-emerald-500"}`}
                                  style={{ height: m.profit < 0 ? "4%" : `${prof}%` }}
                                  title={money(m.profit)}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 truncate w-full text-center">
                                {(lang === "ur" ? monthNamesUr : monthNamesEn)[m.month].slice(0, lang === "ur" ? 6 : 3)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <h3 className={`${sectionTitle} mb-4`}>{L("اس مہینے زیادہ بکنے والی کتب", "Top Selling Books (this month)")}</h3>
                      {topBooks.length === 0 ? (
                        <p className="text-xs py-8 text-center text-slate-400">{L("اس مہینے ابھی فروخت نہیں", "No sales this month")}</p>
                      ) : (
                        <ul className="space-y-3.5">
                          {topBooks.map((b, i) => (
                            <li key={b.title}>
                              <div className="flex items-center justify-between gap-2 text-xs mb-1">
                                <span className={`truncate font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                                  {i + 1}. {b.title}
                                </span>
                                <span className="shrink-0 text-slate-400">
                                  {b.qty} {L("عدد", "pcs")}
                                </span>
                              </div>
                              <div className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${(b.qty / topMaxQty) * 100}%`, background: PALETTE[i % PALETTE.length] }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* تین ڈونٹ گراف */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DonutCard
                      title={L("اخراجات کی تقسیم (اس مہینے)", "Expenses (this month)")}
                      data={expenseSlices}
                      card={card}
                      strong={strong}
                      muted="text-slate-400"
                      empty={L("اس مہینے کوئی خرچہ نہیں", "No expenses this month")}
                    />
                    <DonutCard
                      title={L("زمروں کے لحاظ سے سٹاک مالیت", "Stock Value by Category")}
                      data={categorySlices}
                      card={card}
                      strong={strong}
                      muted="text-slate-400"
                      empty={L("سٹاک موجود نہیں", "No stock")}
                    />
                    <DonutCard
                      title={L("وصولی اور بقایا", "Collected vs Dues")}
                      data={collectSlices}
                      card={card}
                      strong={strong}
                      muted="text-slate-400"
                      empty={L("ابھی کوئی بل نہیں", "No bills yet")}
                    />
                  </div>

                  {/* ہفتے کے دن + بہترین گاہک + سپلائرز کا بقایا */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <h3 className={`${sectionTitle} mb-1`}>{L("ہفتے کے دنوں کی فروخت", "Sales by Weekday")}</h3>
                      <p className="text-[11px] text-slate-400 mb-4">
                        {L("پچھلے 90 دن", "Last 90 days")} — {L("بہترین دن", "Best day")}: <b className="text-emerald-600">{weekdaySums[bestDay] > 0 ? weekdayNames[bestDay] : "—"}</b>
                      </p>
                      <div className="flex items-end justify-between gap-1.5 h-32" dir="ltr">
                        {weekdaySums.map((v, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 min-w-0">
                            <div
                              className={`w-full max-w-7 rounded-t-lg ${i === bestDay && v > 0 ? "bg-emerald-400" : "bg-sky-200"}`}
                              style={{ height: `${Math.max(4, (v / weekdayMax) * 100)}%` }}
                              title={money(v)}
                            />
                            <span className="text-[9px] text-slate-400 truncate w-full text-center">{weekdayNames[i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={sectionTitle}>{L("🏆 بہترین گاہک", "🏆 Top Customers")}</h3>
                        <Link href="/customers" className={linkCls}>{L("سب", "All")}</Link>
                      </div>
                      {topCustomers.length === 0 ? (
                        <p className="text-xs py-8 text-center text-slate-400">{L("ابھی کوئی ریکارڈ نہیں", "No data yet")}</p>
                      ) : (
                        <ul className="space-y-3">
                          {topCustomers.map((c, i) => (
                            <li key={c.name}>
                              <div className="flex items-center justify-between gap-2 text-xs mb-1">
                                <span className={`truncate font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{i + 1}. {c.name}</span>
                                <span className="shrink-0 text-slate-400" dir="ltr">{money(c.total)}</span>
                              </div>
                              <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                <div className="h-full rounded-full" style={{ width: `${(c.total / topCustMax) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={sectionTitle}>{L("🚚 سپلائرز کا بقایا", "🚚 Supplier Payables")}</h3>
                        <Link href="/suppliers" className={linkCls}>{L("سب", "All")}</Link>
                      </div>
                      {supplierBalances.length === 0 ? (
                        <p className="text-xs py-8 text-center text-slate-400">✅ {L("کوئی بقایا نہیں", "Nothing owed")}</p>
                      ) : (
                        <>
                          <p className={`text-xl font-extrabold mb-3 ${strong}`} dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>{money(payableTotal)}</p>
                          <div className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                            {supplierBalances.slice(0, 4).map((sp) => (
                              <div key={sp.name} className="py-2 flex items-center justify-between gap-2 text-xs">
                                <span className={`truncate ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{sp.name}</span>
                                <b className="shrink-0 text-amber-600" dir="ltr">{money(sp.balance)}</b>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* حالیہ آرڈرز + کم سٹاک */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={sectionTitle}>{L("حالیہ آرڈرز", "Recent Orders")}</h3>
                        <Link href="/orders" className={linkCls}>
                          {L("سب دیکھیں", "View all")}
                        </Link>
                      </div>
                      {orderGroups.length === 0 ? (
                        <p className="text-xs py-6 text-center text-slate-400">{L("ابھی کوئی آرڈر نہیں", "No orders yet")}</p>
                      ) : (
                        <div className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                          {orderGroups.slice(0, 5).map((g, idx) => {
                            const total = (g.find((r: any) => r.total_amount) || g[0]).total_amount || 0;
                            return (
                              <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className={`text-[13px] font-semibold truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                                    {g[0].customer_name || "—"}
                                  </p>
                                  <p className="text-[11px] truncate text-slate-400">
                                    {g.length} {L("کتب", "books")} • {money(Number(total))}
                                  </p>
                                </div>
                                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset ${statusStyle(g[0].status)}`}>
                                  {g[0].status || "نیا"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={sectionTitle}>{L("کم سٹاک کتب", "Low Stock Books")}</h3>
                        <Link href="/low-stock" className={linkCls}>
                          {L("سب دیکھیں", "View all")}
                        </Link>
                      </div>
                      {lowStockBooks.length === 0 ? (
                        <p className="text-xs py-6 text-center text-slate-400">✅ {L("تمام کتب کا سٹاک مکمل ہے", "All books are in stock")}</p>
                      ) : (
                        <div className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                          {lowStockBooks.slice(0, 5).map((b) => (
                            <div key={b.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className={`text-[13px] font-semibold truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{b.title}</p>
                                <p className="text-[11px] truncate text-slate-400">{b.author}</p>
                              </div>
                              <span
                                className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset ${
                                  (Number(b.stock) || 0) === 0 ? "bg-rose-50 text-rose-500 ring-rose-200" : "bg-amber-50 text-amber-600 ring-amber-200"
                                }`}
                              >
                                {(Number(b.stock) || 0) === 0 ? L("ختم", "Out") : `${b.stock} ${L("باقی", "left")}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* حالیہ سرگرمی */}
                  <div className={`rounded-3xl border p-5 ${card}`}>
                    <h3 className={`${sectionTitle} mb-4`}>{L("🕒 حالیہ سرگرمی", "🕒 Recent Activity")}</h3>
                    {activity.length === 0 ? (
                      <p className="text-xs py-6 text-center text-slate-400">{L("ابھی کوئی سرگرمی نہیں", "No activity yet")}</p>
                    ) : (
                      <ol className="relative space-y-4 border-slate-100" style={{ borderInlineStartWidth: 2, paddingInlineStart: 18 }}>
                        {activity.map((a, i) => (
                          <li key={i} className="relative">
                            <span
                              className={`absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}
                              style={{ insetInlineStart: -31 }}
                            >
                              {a.icon}
                            </span>
                            <Link href={a.href} className="flex items-center justify-between gap-3 group">
                              <div className="min-w-0">
                                <p className={`text-[13px] font-semibold truncate group-hover:text-emerald-600 transition-colors ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{a.title}</p>
                                <p className="text-[11px] text-slate-400" dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>{a.sub}</p>
                              </div>
                              <span className="shrink-0 text-[10px] text-slate-400">{ago(a.date)}</span>
                            </Link>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* ماہانہ جدول */}
                  <div className={`rounded-3xl border overflow-hidden ${card}`}>
                    <div className="flex items-center justify-between p-5 pb-3">
                      <h3 className={sectionTitle}>{L("ہر مہینے کا نفع", "Monthly Profit")}</h3>
                      <Link href="/reports" className={linkCls}>
                        {L("تفصیلی رپورٹ", "Detailed report")}
                      </Link>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[460px]">
                        <thead>
                          <tr className={`text-[11px] ${darkMode ? "bg-slate-800/60 text-slate-400" : "bg-slate-50/80 text-slate-400"}`}>
                            <th className="text-right font-semibold px-5 py-2.5">{L("مہینہ", "Month")}</th>
                            <th className="text-right font-semibold px-3 py-2.5">{t.sales}</th>
                            <th className="text-right font-semibold px-3 py-2.5">{t.cost}</th>
                            <th className="text-right font-semibold px-3 py-2.5">{t.expenseLabel}</th>
                            <th className="text-right font-semibold px-5 py-2.5">{L("نفع", "Profit")}</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-50"}`}>
                          {monthlyStats.map((m) => (
                            <tr key={`${m.year}-${m.month}`} className={`${darkMode ? "text-slate-200 hover:bg-slate-800/40" : "text-slate-600 hover:bg-emerald-50/30"} transition-colors`}>
                              <td className="px-5 py-3 font-semibold">
                                {(lang === "ur" ? monthNamesUr : monthNamesEn)[m.month]} {m.year}
                              </td>
                              <td className="px-3 py-3 tabular-nums">{money(m.revenue)}</td>
                              <td className="px-3 py-3 tabular-nums">{money(m.cost)}</td>
                              <td className="px-3 py-3 tabular-nums">{money(m.expense)}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-block font-bold tabular-nums px-2.5 py-1 rounded-xl ${m.profit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                                  {m.profit < 0 ? "-" : ""}
                                  {money(Math.abs(m.profit))}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* گنتی کے کارڈ */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {counters
                  .filter((c) => isAdmin || c.label !== L("سٹاک کی مالیت", "Stock Value"))
                  .map((c) => {
                    const Icon = c.icon;
                    return (
                      <Link
                        key={c.label}
                        href={c.href}
                        className={`rounded-3xl border p-4 hover:-translate-y-0.5 transition-all flex items-center gap-3 ${card}`}
                      >
                        <div className={`p-3 rounded-2xl ${c.tone}`}>
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-base md:text-lg font-extrabold leading-tight truncate ${strong}`} dir="ltr">{c.value}</p>
                          <p className="text-xs text-slate-400">{c.label}</p>
                        </div>
                      </Link>
                    );
                  })}
              </div>

              {/* حالیہ کتب */}
              <div className={`rounded-3xl border p-5 ${card}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={sectionTitle}>{L("حالیہ کتب", "Recent Books")}</h3>
                  <Link href={isAdmin ? "/books" : "/shop"} className={linkCls}>
                    {L("تمام کتب دیکھیں", "View all books")}
                  </Link>
                </div>
                {books.length === 0 ? (
                  <p className="text-xs py-6 text-center text-slate-400">{L("ابھی کوئی کتاب شامل نہیں کی گئی", "No books added yet")}</p>
                ) : (
                  <div className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                    {books.slice(-5).reverse().map((book) => (
                      <div key={book.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className={`text-[13px] font-semibold truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{book.title}</p>
                          <p className="text-[11px] truncate text-slate-400">{book.author}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"}`}>
                          {book.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!isAdmin && (
            <footer className="mt-10 border-t border-slate-200 pt-6 flex flex-col items-center gap-2">
              <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-8 w-auto opacity-90" />
              <p className="text-slate-400 text-xs text-center">© 2026 مكتبہ الزھراء. جملہ حقوق محفوظ ہیں۔</p>
            </footer>
          )}
        </section>
      </div>
    </main>
  );
}