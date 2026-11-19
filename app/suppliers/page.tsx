"use client";

import { useState, useEffect, useRef } from "react";
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
  Star,
  PackageMinus,
  Wallet,
  Users,
  Receipt,
  Truck,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BillUpload from "./BillUpload";

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface BookLite {
  cost_price?: number | null;
  id: number;
  title: string;
  author?: string;
  price?: number;
  stock?: number;
}

interface SupplierBookLink {
  supplier_id: number;
  book_id: number;
  cost_price?: number | null;
}

interface SupplierPayment {
  id: string;
  supplier_id: number | string;
  amount: number;
  kind: string; // payment = ادائیگی، charge = بقایا میں اضافہ
  note?: string | null;
  paid_at: string;
}

interface SupplierOrderItem {
  id: string;
  order_id: string;
  book_id: number | null;
  title: string;
  author?: string | null;
  quantity: number;
  received_qty?: number | null;
  unit_price?: number | null;
}

interface SupplierOrder {
  id: string;
  order_no: string;
  supplier_id: number | string;
  status: string;
  created_at: string;
  received_at?: string | null;
  total_amount?: number | null;
  supplier_order_items?: SupplierOrderItem[];
}

// آرڈر کی ایک لائن: فہرست والی کتاب یا دستی کتاب (manual میں id صفر ہوتی ہے)
type OrderLine = { b: BookLite; qty: number; manual?: boolean };

// کم سٹاک کی حد: 1000 یا زیادہ قیمت والی کتاب کے لیے 2، اس سے کم قیمت والی کے لیے 3
function isLowStock(book: BookLite) {
  const threshold = (book.price ?? 0) >= 1000 ? 2 : 3;
  return (book.stock ?? 0) <= threshold;
}

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

// آرڈر نمبر: PO-تاریخ-چار ہندسے
function generateOrderNo() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `PO-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function escapeHtml(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// بل جیسا انداز: پرنٹ / PDF کے لیے آرڈر شیٹ کے سٹائل
const orderSheetFontLink = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" />`;
const orderSheetBodyStyle = `body { font-family: "Noto Naskh Arabic", Arial, "Noto Nastaliq Urdu", sans-serif; margin: 0; padding: 16px; color: #111827; background: #ffffff; direction: ltr; }`;
const orderSheetStyles = `
  .sheet { max-width: 640px; margin: 0 auto; background: #ffffff; padding: 18px; font-size: 14px; border: 1px dashed #94a3b8; border-radius: 8px; }
  .header { text-align: center; border-bottom: 1px dashed #94a3b8; padding-bottom: 10px; margin-bottom: 10px; }
  .logo-img { height: 80px; width: auto; max-width: 100%; object-fit: contain; margin: 0 auto 6px; display: block; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #111827; }
  .header p { margin: 3px 0; font-size: 12px; color: #374151; }
  .title { text-align: center; font-size: 17px; font-weight: 700; margin: 6px 0 10px; color: #111827; }
  .meta-box { border-bottom: 1px dashed #94a3b8; padding-bottom: 8px; margin-bottom: 8px; font-size: 13px; }
  .meta-box div { display: flex; justify-content: space-between; margin-bottom: 3px; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 14px; }
  table.items th { border-bottom: 1px solid #6b7280; padding: 5px 4px; text-align: left; font-weight: 700; color: #111827; }
  table.items td { padding: 6px 4px; border-bottom: 1px dotted #cbd5e1; vertical-align: top; text-align: left; }
  .totals-box { border-top: 1px dashed #94a3b8; padding-top: 8px; font-size: 13px; }
  .grand-total { font-weight: 700; font-size: 16px; border-top: 1px solid #6b7280; border-bottom: 1px solid #6b7280; padding: 5px 0; margin-top: 5px; display: flex; justify-content: space-between; }
  .sign-row { margin-top: 44px; display: flex; justify-content: space-between; font-size: 12px; color: #374151; }
  .sign-row span { border-top: 1px solid #6b7280; padding-top: 5px; min-width: 150px; text-align: center; }
  .footer-note { text-align: center; margin-top: 16px; font-size: 10px; color: #6b7280; border-top: 1px dashed #cbd5e1; padding-top: 6px; }
`;

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // سپلائر کی کتب اور آرڈر
  const [allBooks, setAllBooks] = useState<BookLite[]>([]);
  const [links, setLinks] = useState<SupplierBookLink[]>([]);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [orderSupplier, setOrderSupplier] = useState<Supplier | null>(null);
  const [orderTab, setOrderTab] = useState<"order" | "list" | "history" | "account">("order");
  const [qtyMap, setQtyMap] = useState<Record<number, string>>({});
  const [bookSearch, setBookSearch] = useState("");
  const [showOtherSupplierBooks, setShowOtherSupplierBooks] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const [billOpen, setBillOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  // دستی کتب، محفوظ آرڈرز اور موصولی
  const [manualLines, setManualLines] = useState<{ title: string; author: string; qty: number }[]>([]);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualQty, setManualQty] = useState("1");
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderMsg, setOrderMsg] = useState("");
  const [receiveOrder, setReceiveOrder] = useState<SupplierOrder | null>(null);
  const [recvQty, setRecvQty] = useState<Record<string, string>>({});
  const [receiveBusy, setReceiveBusy] = useState(false);
  const [closeRemaining, setCloseRemaining] = useState(false);
  const [recvPrice, setRecvPrice] = useState<Record<string, string>>({});
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState("");
  const [receiveMsg, setReceiveMsg] = useState("");
  const orderStateRef = useRef<{ orderNo: string; id: string | null; sig: string }>({ orderNo: "", id: null, sig: "" });
  const chainRef = useRef<Promise<void>>(Promise.resolve());

  const fetchBooksAndLinks = async () => {
    const { data: booksData } = await supabase.from("books").select("id, title, author, price, stock, cost_price").order("title", { ascending: true });
    if (booksData) setAllBooks(booksData as BookLite[]);
    const { data: linkData, error } = await supabase.from("supplier_books").select("supplier_id, book_id, cost_price");
    if (error) {
      setLinksError("سپلائر کی کتب کا ٹیبل نہیں ملا۔ Supabase میں supplier_books ٹیبل بنائیں۔");
    } else {
      setLinksError(null);
      setLinks((linkData || []) as SupplierBookLink[]);
    }
    await fetchSupplierOrders();
    await fetchSupplierPayments();
  };

  const fetchSupplierPayments = async () => {
    const { data, error } = await supabase.from("supplier_payments").select("*").order("paid_at", { ascending: false });
    if (error) {
      setPaymentsError("حساب کا ٹیبل نہیں ملا۔ Supabase میں supplier_payments ٹیبل بنائیں۔");
    } else {
      setPaymentsError(null);
      setSupplierPayments((data || []) as SupplierPayment[]);
    }
  };

  // اس سپلائر کی کتاب کی آخری معلوم خرید قیمت
  const lastPrice = (supplierId: number | string, b: BookLite): number | null => {
    const link = links.find((l) => l.supplier_id === supplierId && l.book_id === b.id);
    const v = link?.cost_price ?? b.cost_price ?? null;
    return v !== null && v !== undefined && Number(v) > 0 ? Number(v) : null;
  };

  // سپلائر کا حساب: موصول مال کی رقم + اضافہ − ادائیگیاں
  const supplierAccount = (supplierId: number | string) => {
    const received = supplierOrders
      .filter((o) => o.supplier_id === supplierId)
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const mine = supplierPayments.filter((p) => p.supplier_id === supplierId);
    const charges = mine.filter((p) => p.kind === "charge").reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const paid = mine.filter((p) => p.kind !== "charge").reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return { received, charges, paid, balance: received + charges - paid };
  };

  const addPaymentEntry = async (kind: "payment" | "charge") => {
    if (!orderSupplier) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayMsg("رقم درست لکھیں");
      return;
    }
    setPayBusy(true);
    setPayMsg("");
    const { error } = await supabase
      .from("supplier_payments")
      .insert({ supplier_id: orderSupplier.id, amount, kind, note: payNote.trim() || null });
    if (error) {
      setPayMsg("محفوظ نہیں ہو سکا: " + error.message);
    } else {
      setPayAmount("");
      setPayNote("");
      await fetchSupplierPayments();
    }
    setPayBusy(false);
  };

  const deletePaymentEntry = async (id: string) => {
    if (!confirm("یہ اندراج حذف کریں؟")) return;
    await supabase.from("supplier_payments").delete().eq("id", id);
    await fetchSupplierPayments();
  };

  const fetchSupplierOrders = async () => {
    const { data, error } = await supabase
      .from("supplier_orders")
      .select("*, supplier_order_items(*)")
      .order("created_at", { ascending: false });
    if (error) {
      setOrdersError("آرڈرز کا ٹیبل نہیں ملا۔ Supabase میں supplier_orders اور supplier_order_items ٹیبل بنائیں۔");
    } else {
      setOrdersError(null);
      setSupplierOrders((data || []) as SupplierOrder[]);
    }
  };

  const supplierBooks = (supplierId: number) => {
    const ids = new Set(links.filter((l) => l.supplier_id === supplierId).map((l) => l.book_id));
    return allBooks.filter((b) => ids.has(b.id));
  };

  const toggleLink = async (supplierId: number, bookId: number) => {
    const exists = links.some((l) => l.supplier_id === supplierId && l.book_id === bookId);
    if (exists) {
      const { error } = await supabase.from("supplier_books").delete().eq("supplier_id", supplierId).eq("book_id", bookId);
      if (error) {
        setLinksError("ہٹایا نہیں جا سکا: " + error.message);
        return;
      }
      setLinks((prev) => prev.filter((l) => !(l.supplier_id === supplierId && l.book_id === bookId)));
    } else {
      const { error } = await supabase.from("supplier_books").insert({ supplier_id: supplierId, book_id: bookId });
      if (error) {
        setLinksError("شامل نہیں ہو سکا: " + error.message);
        return;
      }
      setLinks((prev) => [...prev, { supplier_id: supplierId, book_id: bookId }]);
    }
  };

  // تلاش میں نظر آنے والی تمام کتب ایک ساتھ شامل کریں
  const addAllVisible = async (supplierId: number, visible: BookLite[]) => {
    const existing = new Set(links.filter((l) => l.supplier_id === supplierId).map((l) => l.book_id));
    const rows = visible.filter((b) => !existing.has(b.id)).map((b) => ({ supplier_id: supplierId, book_id: b.id }));
    if (rows.length === 0) return;
    const { error } = await supabase.from("supplier_books").insert(rows);
    if (error) {
      setLinksError("شامل نہیں ہو سکیں: " + error.message);
      return;
    }
    setLinks((prev) => [...prev, ...rows]);
  };

  const openOrder = (s: Supplier, tab: "order" | "list" | "history" | "account") => {
    setOrderSupplier(s);
    setOrderTab(tab);
    setQtyMap({});
    setBookSearch("");
    setShowOtherSupplierBooks(false);
    setOrderNo(generateOrderNo());
    setManualLines([]);
    setManualTitle("");
    setManualAuthor("");
    setManualQty("1");
    setOrderMsg("");
    setReceiveOrder(null);
    setReceiveMsg("");
    setPayAmount("");
    setPayNote("");
    setPayMsg("");
    orderStateRef.current = { orderNo: "", id: null, sig: "" };
  };

  const getOrderLines = (): OrderLine[] => {
    if (!orderSupplier) return [];
    const fromList: OrderLine[] = supplierBooks(orderSupplier.id)
      .map((b) => ({ b, qty: parseInt(qtyMap[b.id] || "0", 10) || 0 }))
      .filter((x) => x.qty > 0);
    const fromManual: OrderLine[] = manualLines.filter((m) => m.title.trim() && m.qty > 0).map((m) => ({
      b: { id: 0, title: m.title, author: m.author || undefined },
      qty: m.qty,
      manual: true,
    }));
    return [...fromList, ...fromManual];
  };

  const handleAddManual = () => {
    const title = manualTitle.trim();
    const qty = parseInt(manualQty) || 0;
    if (!title || qty <= 0) {
      alert("دستی کتاب کا نام اور تعداد لکھیں");
      return;
    }
    setManualLines((prev) => [...prev, { title, author: manualAuthor.trim(), qty }]);
    setManualTitle("");
    setManualAuthor("");
    setManualQty("1");
  };

  // آرڈر کو ڈیٹا بیس میں محفوظ کریں (بھیجنے / پرنٹ پر خود بخود بھی ہوتا ہے)
  const saveOrderRecord = (lines: OrderLine[]) => {
    if (!orderSupplier || lines.length === 0) return Promise.resolve();
    const supplierId = orderSupplier.id;
    const no = orderNo;
    const sig = JSON.stringify(lines.map((x) => [x.manual ? 0 : x.b.id, x.b.title, x.qty]));
    chainRef.current = chainRef.current.then(async () => {
      const st = orderStateRef.current;
      if (st.orderNo === no && st.id && st.sig === sig) return;
      try {
        let id = st.orderNo === no ? st.id : null;
        if (!id) {
          const { data, error } = await supabase
            .from("supplier_orders")
            .insert({ order_no: no, supplier_id: supplierId, status: "pending" })
            .select("id")
            .single();
          if (error || !data) throw new Error(error?.message || "آرڈر نہیں بن سکا");
          id = data.id as string;
          orderStateRef.current = { orderNo: no, id, sig: "" };
        } else {
          const { error } = await supabase.from("supplier_order_items").delete().eq("order_id", id);
          if (error) throw new Error(error.message);
        }
        const rows = lines.map((x) => ({
          order_id: id,
          book_id: x.manual ? null : x.b.id,
          title: x.b.title,
          author: x.b.author || null,
          quantity: x.qty,
          unit_price: x.manual ? null : lastPrice(supplierId, x.b),
        }));
        const { error: itemsErr } = await supabase.from("supplier_order_items").insert(rows);
        if (itemsErr) throw new Error(itemsErr.message);
        orderStateRef.current = { orderNo: no, id, sig };
        setOrderMsg("✅ آرڈر محفوظ ہو گیا — \"پرانے آرڈرز\" میں نظر آئے گا");
        await fetchSupplierOrders();
      } catch (e) {
        setOrderMsg("آرڈر محفوظ نہیں ہو سکا: " + (e as Error).message);
      }
    });
    return chainRef.current;
  };

  // مال آنے پر: ہر کتاب کی موصول تعداد سٹاک میں جمع کریں
  const openReceive = (o: SupplierOrder) => {
    setReceiveOrder(o);
    setReceiveMsg("");
    const map: Record<string, string> = {};
    const priceMap: Record<string, string> = {};
    setCloseRemaining(false);
    (o.supplier_order_items || []).forEach((it) => {
      map[it.id] = String(Math.max(0, it.quantity - (Number(it.received_qty) || 0)));
      const book = allBooks.find((b) => b.id === it.book_id);
      const price = it.unit_price ?? (book ? lastPrice(o.supplier_id, book) : null);
      priceMap[it.id] = price ? String(price) : "";
    });
    setRecvQty(map);
    setRecvPrice(priceMap);
  };

  const confirmReceive = async () => {
    if (!receiveOrder) return;
    setReceiveBusy(true);
    setReceiveMsg("");
    try {
      // دوبارہ شامل ہونے سے بچاؤ: تازہ حالت اور پہلے سے آئی تعداد ڈیٹا بیس سے دیکھیں
      const { data: freshOrder } = await supabase
        .from("supplier_orders")
        .select("status, total_amount")
        .eq("id", receiveOrder.id)
        .single();
      if (freshOrder?.status === "received") {
        setReceiveMsg("یہ آرڈر پہلے ہی مکمل موصول ہو چکا ہے");
        setReceiveBusy(false);
        await fetchSupplierOrders();
        return;
      }
      const { data: freshItems } = await supabase
        .from("supplier_order_items")
        .select("id, quantity, received_qty")
        .eq("order_id", receiveOrder.id);
      const freshMap = new Map<string, { received_qty?: number | null }>(
        (freshItems || []).map(
          (x: { id: string; received_qty?: number | null }) => [x.id, x] as [string, { received_qty?: number | null }]
        )
      );

      const items = receiveOrder.supplier_order_items || [];
      const anyQty = items.some((it) => (parseInt(recvQty[it.id] ?? "0") || 0) > 0);
      if (!anyQty && !closeRemaining) {
        setReceiveMsg("کم از کم ایک کتاب کی تعداد لکھیں");
        setReceiveBusy(false);
        return;
      }

      let addedTotal = 0;
      let allDone = true;
      for (const it of items) {
        const base = Number(freshMap.get(it.id)?.received_qty) || 0;
        const qty = parseInt(recvQty[it.id] ?? "0") || 0;
        const priceRaw = parseFloat(recvPrice[it.id] ?? "");
        const price = isNaN(priceRaw) || priceRaw < 0 ? 0 : priceRaw;
        addedTotal += qty * price;

        if (it.book_id !== null && qty > 0) {
          const { data: row, error: readErr } = await supabase.from("books").select("stock").eq("id", it.book_id).single();
          if (readErr || !row) throw new Error(readErr?.message || "کتاب نہیں ملی");
          const { error: upErr } = await supabase
            .from("books")
            .update({ stock: (Number(row.stock) || 0) + qty })
            .eq("id", it.book_id);
          if (upErr) throw new Error(upErr.message);
          // نئی خرید قیمت: کتاب پر بھی اور اس سپلائر کے ریکارڈ میں بھی
          if (price > 0) {
            await supabase.from("books").update({ cost_price: price }).eq("id", it.book_id);
            await supabase
              .from("supplier_books")
              .update({ cost_price: price })
              .eq("supplier_id", receiveOrder.supplier_id)
              .eq("book_id", it.book_id);
          }
        }
        const newReceived = base + qty;
        if (newReceived < it.quantity) allDone = false;
        await supabase
          .from("supplier_order_items")
          .update({ received_qty: newReceived, unit_price: price > 0 ? price : it.unit_price ?? null })
          .eq("id", it.id);
      }

      const finished = closeRemaining || allDone;
      const { error } = await supabase
        .from("supplier_orders")
        .update({
          status: finished ? "received" : "partial",
          ...(finished ? { received_at: new Date().toISOString() } : {}),
          total_amount: (Number(freshOrder?.total_amount) || 0) + addedTotal,
        })
        .eq("id", receiveOrder.id);
      if (error) throw new Error(error.message);
      setReceiveOrder(null);
      await fetchBooksAndLinks();
    } catch (e) {
      setReceiveMsg("سٹاک میں شامل نہیں ہو سکا: " + (e as Error).message);
    }
    setReceiveBusy(false);
  };

  // دستی کتاب کو کتب کی فہرست میں شامل کریں (تاکہ اس کا سٹاک بھی بڑھ سکے)
  const addManualToBooks = async (it: SupplierOrderItem) => {
    if (!receiveOrder || it.book_id !== null) return;
    const priceText = window.prompt(`"${it.title}" کی فروخت کی قیمت (روپے) لکھیں، نہ معلوم ہو تو خالی چھوڑیں:`, "");
    if (priceText === null) return;
    const salePrice = parseFloat(priceText) || 0;
    const cost = parseFloat(recvPrice[it.id] ?? "") || 0;
    setReceiveMsg("");
    try {
      const { data: created, error } = await supabase
        .from("books")
        .insert({
          title: it.title,
          author: it.author || "مكتبہ الزھراء",
          category: "عمومی",
          language: "اردو",
          price: salePrice,
          weight: 1,
          stock: 0,
          cost_price: cost,
        })
        .select("id")
        .single();
      if (error || !created) throw new Error(error?.message || "کتاب نہیں بن سکی");
      await supabase.from("supplier_order_items").update({ book_id: created.id }).eq("id", it.id);
      await supabase
        .from("supplier_books")
        .insert({ supplier_id: receiveOrder.supplier_id, book_id: created.id, cost_price: cost > 0 ? cost : null });
      const { data: fresh } = await supabase
        .from("supplier_orders")
        .select("*, supplier_order_items(*)")
        .eq("id", receiveOrder.id)
        .single();
      await fetchBooksAndLinks();
      if (fresh) setReceiveOrder(fresh as SupplierOrder);
    } catch (e) {
      setReceiveMsg("کتب میں شامل نہیں ہو سکی: " + (e as Error).message);
    }
  };

  // پرانا (زیر انتظار) آرڈر ترمیم یا دوبارہ بھیجنے کے لیے کھولیں
  const loadOrderForEdit = (o: SupplierOrder) => {
    if (!orderSupplier) return;
    const items = o.supplier_order_items || [];
    const mineIds = new Set(supplierBooks(orderSupplier.id).map((b) => b.id));
    if (items.some((it) => it.book_id !== null && !mineIds.has(it.book_id))) {
      alert("اس آرڈر کی کوئی کتاب اب اس سپلائر کی فہرست میں نہیں۔ پہلے اسے \"کتب کی فہرست\" میں شامل کریں۔");
      return;
    }
    const qm: Record<number, string> = {};
    items
      .filter((it) => it.book_id !== null)
      .forEach((it) => {
        qm[it.book_id as number] = String(it.quantity);
      });
    setQtyMap(qm);
    setManualLines(
      items.filter((it) => it.book_id === null).map((it) => ({ title: it.title, author: it.author || "", qty: it.quantity }))
    );
    setOrderNo(o.order_no);
    orderStateRef.current = { orderNo: o.order_no, id: o.id, sig: "" };
    setOrderMsg("آرڈر ترمیم کے لیے کھلا ہے۔ تعداد بدلیں (کتاب ہٹانی ہو تو تعداد خالی کر دیں) اور دوبارہ بھیجیں یا محفوظ کریں۔");
    setOrderTab("order");
  };

  const deleteSupplierOrder = async (o: SupplierOrder) => {
    if (!confirm("یہ آرڈر ریکارڈ حذف کریں؟ (سٹاک پر کوئی اثر نہیں پڑے گا)")) return;
    await supabase.from("supplier_orders").delete().eq("id", o.id);
    await fetchSupplierOrders();
  };

  // واٹس ایپ کا باقاعدہ (پروفیشنل) آرڈر پیغام
  const sendOrder = () => {
    if (!orderSupplier) return;
    const lines = getOrderLines();
    if (lines.length === 0) {
      alert("کم از کم ایک کتاب کی تعداد لکھیں");
      return;
    }
    void saveOrderRecord(lines);
    const totalQty = lines.reduce((sum, x) => sum + x.qty, 0);
    const line = "━━━━━━━━━━━━━━━";
    const text =
      `*مکتبۃ الزھراء*\n` +
      `نزد جامعہ الحسنین، فیصل آباد\n` +
      `📞 0305-5232889\n` +
      `${line}\n` +
      `*پرچیز آرڈر (Purchase Order)*\n` +
      `آرڈر نمبر: *${orderNo}*\n` +
      `تاریخ: ${new Date().toLocaleDateString("en-GB")}\n` +
      `${line}\n` +
      `محترم: *${orderSupplier.name}*${orderSupplier.contact_person ? " (" + orderSupplier.contact_person + ")" : ""}\n` +
      `السلام علیکم! براہِ کرم درج ذیل کتب ارسال فرمائیں:\n\n` +
      lines.map((x, i) => `${i + 1}. ${x.b.title}\n    تعداد: *${x.qty}*`).join("\n") +
      `\n${line}\n` +
      `کل عنوانات: *${lines.length}*\n` +
      `کل تعداد: *${totalQty}*\n` +
      `${line}\n` +
      `براہِ کرم آرڈر کی تصدیق اور ترسیل کا وقت بتا دیں۔\n` +
      `شکریہ\n*مکتبۃ الزھراء*`;
    const number = toWhatsappNumber(orderSupplier.phone);
    const url = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // آرڈر شیٹ کا مواد: نام ← مصنف ← تعداد
  const buildOrderSheetInner = (lines: OrderLine[]) => {
    if (!orderSupplier) return "";
    const totalQty = lines.reduce((sum, x) => sum + x.qty, 0);
    const now = new Date();
    const rows = lines
      .map(
        (x, i) => `
        <tr>
          <td style="width: 7%;">${i + 1}</td>
          <td style="font-weight: bold;">${escapeHtml(x.b.title)}</td>
          <td style="width: 30%;">${escapeHtml(x.b.author || "-")}</td>
          <td style="width: 12%; text-align: center; font-weight: bold;">${x.qty}</td>
        </tr>`
      )
      .join("");
    return `
          <div class="sheet">
            <div class="header">
              <img src="${window.location.origin}/logo.jpg" alt="logo" class="logo-img" />
              <h1>مكتبۃ الزھراء</h1>
              <p>نزد جامعہ الحسنین، فیصل آباد</p>
              <p>Phone #: 0305-5232889 | Email: maktabaalzahra32@gmail.com</p>
            </div>
            <div class="title">PURCHASE ORDER</div>
            <div class="meta-box">
              <div><span>Order No: <b>${orderNo}</b></span><span>${now.toLocaleDateString("en-GB")} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span></div>
              <div><span>To: <b>${escapeHtml(orderSupplier.name)}</b></span></div>
              ${orderSupplier.contact_person ? `<div><span>Attn: ${escapeHtml(orderSupplier.contact_person)}</span></div>` : ""}
              ${orderSupplier.phone ? `<div><span>Phone: ${escapeHtml(orderSupplier.phone)}</span></div>` : ""}
              ${orderSupplier.address ? `<div><span>Address: ${escapeHtml(orderSupplier.address)}</span></div>` : ""}
            </div>
            <table class="items">
              <thead>
                <tr><th>#</th><th>Item Name</th><th>Author</th><th style="text-align: center;">Qty</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="totals-box">
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;"><span>Total titles:</span><span style="font-weight: bold;">${lines.length}</span></div>
              <div class="grand-total"><span>Total Quantity:</span><span>${totalQty}</span></div>
            </div>
            <div class="sign-row"><span>Prepared by (Shafi)</span><span>Supplier Signature</span></div>
            <div class="footer-note">(Computer Software developed by Maktaba Al-Zahra. Ph: 0305-5232889)</div>
          </div>`;
  };

  // بل جیسی آرڈر شیٹ: پرنٹ کریں یا PDF محفوظ کریں
  const printOrderSheet = () => {
    if (!orderSupplier) return;
    const lines = getOrderLines();
    if (lines.length === 0) {
      alert("کم از کم ایک کتاب کی تعداد لکھیں");
      return;
    }
    void saveOrderRecord(lines);
    const html = `
      <html dir="ltr" lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>${orderNo}</title>
          ${orderSheetFontLink}
          <style>${orderSheetBodyStyle}${orderSheetStyles}
            @media print { body { padding: 0; } .sheet { border: none; max-width: 100%; padding: 0; } }
          </style>
        </head>
        <body>
          ${buildOrderSheetInner(lines)}
          <script>window.onload = function () { var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve(); ready.then(function () { setTimeout(function () { window.focus(); window.print(); }, 200); }); };</script>
        </body>
      </html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  // PDF بنا کر شیئر کریں (فون پر شیئر مینو، کمپیوٹر پر ڈاؤنلوڈ)
  const shareOrderPdf = async () => {
    if (!orderSupplier) return;
    const lines = getOrderLines();
    if (lines.length === 0) {
      alert("کم از کم ایک کتاب کی تعداد لکھیں");
      return;
    }
    void saveOrderRecord(lines);
    setPdfBusy(true);
    let frame: HTMLIFrameElement | null = null;
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

      frame = document.createElement("iframe");
      frame.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1400px;border:0;visibility:hidden;";
      document.body.appendChild(frame);
      const html = `<!DOCTYPE html><html dir="ltr"><head><meta charset="UTF-8" />${orderSheetFontLink}<style>${orderSheetBodyStyle}${orderSheetStyles}</style></head><body>${buildOrderSheetInner(lines)}</body></html>`;
      const doc = frame.contentDocument;
      if (!doc) throw new Error("no iframe document");
      doc.open();
      doc.write(html);
      doc.close();

      // لوگو اور فونٹ لوڈ ہونے کا انتظار
      await Promise.all(
        Array.from(doc.images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) resolve();
              else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      );
      try {
        await doc.fonts.ready;
        await new Promise((r) => setTimeout(r, 300));
      } catch {}

      const canvas = await html2canvas(doc.body, { scale: 2.5, backgroundColor: "#ffffff", useCORS: true });

      const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const imgW = pageW - margin * 2;
      const ratio = imgW / canvas.width;
      const sliceH = Math.floor((pageH - margin * 2) / ratio);
      for (let y = 0, page = 0; y < canvas.height; y += sliceH, page++) {
        const part = document.createElement("canvas");
        part.width = canvas.width;
        part.height = Math.min(sliceH, canvas.height - y);
        const ctx = part.getContext("2d");
        if (!ctx) throw new Error("no canvas context");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, part.width, part.height);
        ctx.drawImage(canvas, 0, y, canvas.width, part.height, 0, 0, canvas.width, part.height);
        if (page > 0) pdf.addPage();
        pdf.addImage(part.toDataURL("image/jpeg", 0.85), "JPEG", margin, margin, imgW, part.height * ratio);
      }

      const blob = pdf.output("blob");
      const file = new File([blob], `${orderNo}.pdf`, { type: "application/pdf" });
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Purchase Order ${orderNo}` });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${orderNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert("PDF ڈاؤنلوڈ ہو گئی ہے۔ اسے واٹس ایپ میں منسلک (Attach → Document) کر کے بھیج دیں۔");
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") {
        alert("PDF نہیں بن سکی۔ براہِ کرم 'آرڈر شیٹ پرنٹ / PDF' والا بٹن استعمال کریں۔");
      }
    } finally {
      if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
      setPdfBusy(false);
    }
  };

  const fetchSuppliers = async () => {
    setLoaded(false);
    const { data } = await supabase.from("suppliers").select("*").order("id", { ascending: false });
    if (data) setSuppliers(data as Supplier[]);
    setLoaded(true);
  };

  useEffect(() => {
    fetchSuppliers();
    fetchBooksAndLinks();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setSaveError(null);
  };

  const openEditModal = (s: Supplier) => {
    setEditingId(s.id);
    setName(s.name);
    setContactPerson(s.contact_person || "");
    setPhone(s.phone || "");
    setEmail(s.email || "");
    setAddress(s.address || "");
    setNotes(s.notes || "");
    setSaveError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (name.trim() === "") return;
    setSaving(true);
    setSaveError(null);

    const supplierData = {
      name: name.trim(),
      contact_person: contactPerson.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    };

    const { error } = editingId
      ? await supabase.from("suppliers").update(supplierData).eq("id", editingId)
      : await supabase.from("suppliers").insert(supplierData);

    if (error) {
      setSaveError(`محفوظ نہیں ہو سکا: ${error.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowModal(false);
    resetForm();
    fetchSuppliers();
  };

  const handleDelete = async (id: number) => {
    await supabase.from("suppliers").delete().eq("id", id);
    setConfirmDeleteId(null);
    fetchSuppliers();
  };

  const menuItems = [
    { href: "/", label: "ڈیش بورڈ", icon: LayoutDashboard },
    { href: "/books", label: "کتب", icon: BookOpen },
    { href: "/authors", label: "مصنفین", icon: PenLine },
    { href: "/categories", label: "زمرے", icon: FolderTree },
    { href: "/orders", label: "آرڈرز", icon: ShoppingCart },
    { href: "/customers", label: "کسٹمرز", icon: Users },
    { href: "/invoices", label: "بل / انوائس", icon: Receipt },
    { href: "/suppliers", label: "سپلائرز", icon: Truck, active: true },
    { href: "/returns", label: "واپسی/خراب", icon: RotateCcw },
    { href: "/reviews", label: "ریویوز", icon: Star },
    { href: "/low-stock", label: "کم سٹاک", icon: PackageMinus },
    { href: "/expenses", label: "اخراجات", icon: Wallet },
  ];

  return (
    <main dir="rtl" className="min-h-screen flex bg-slate-50/60 font-sans">
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
            <h2 className="text-xl font-bold text-slate-900">سپلائرز 🚚</h2>
            <p className="text-xs text-slate-500 mt-0.5">کل {suppliers.length} سپلائرز کی معلومات</p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-xs"
          >
            <Plus size={15} />
            <span>نیا سپلائر شامل کریں</span>
          </button>
        </div>

        {/* Suppliers List / Cards Grid */}
        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-xl border border-slate-200 bg-white p-4 animate-pulse" />
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <span className="text-4xl mb-2 block">🚚</span>
            <p className="text-xs text-slate-500">ابھی کوئی سپلائر شامل نہیں کیا گیا</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-emerald-600 transition">
                    {s.name}
                  </h3>
                  {s.contact_person && (
                    <p className="text-xs text-slate-500 mb-2 font-medium">رابطہ کار: {s.contact_person}</p>
                  )}

                  <div className="space-y-1.5 mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    {s.phone && (
                      <p className="flex items-center gap-2" dir="ltr">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span>{s.phone}</span>
                      </p>
                    )}
                    {s.email && (
                      <p className="flex items-center gap-2 truncate" dir="ltr">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </p>
                    )}
                    {s.address && (
                      <p className="flex items-start gap-2">
                        <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{s.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                {(() => {
                  const mine = supplierBooks(s.id);
                  const needed = mine.filter(isLowStock);
                  return (
                    <div className="mt-3 pt-2 border-t border-slate-100 text-xs">
                      <p className="text-slate-500">
                        📚 {mine.length} کتب
                        {(() => {
                          const pending = supplierOrders.filter((o) => o.supplier_id === s.id && o.status !== "received").length;
                          return pending > 0 ? (
                            <span className="mr-2 inline-block rounded-md bg-sky-50 border border-sky-200 text-sky-700 font-semibold px-2 py-0.5 text-[11px]">
                              ⏳ {pending} آرڈر زیر انتظار
                            </span>
                          ) : null;
                        })()}
                        {(() => {
                          const acc = supplierAccount(s.id);
                          return Math.round(acc.balance) !== 0 ? (
                            <button
                              type="button"
                              onClick={() => openOrder(s, "account")}
                              className={`mr-2 inline-block rounded-md border font-semibold px-2 py-0.5 text-[11px] ${
                                acc.balance > 0
                                  ? "bg-amber-50 border-amber-200 text-amber-700"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
                              }`}
                            >
                              {acc.balance > 0 ? `💰 بقایا Rs ${Math.round(acc.balance).toLocaleString()}` : `پیشگی Rs ${Math.round(-acc.balance).toLocaleString()}`}
                            </button>
                          ) : null;
                        })()}
                        {needed.length > 0 && (
                          <span className="mr-2 inline-block rounded-md bg-rose-50 border border-rose-200 text-rose-600 font-semibold px-2 py-0.5 text-[11px]">
                            ⚠ {needed.length} کم/ختم
                          </span>
                        )}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => openOrder(s, "order")}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition"
                        >
                          آرڈر بنائیں
                        </button>
                        <button
                          onClick={() => openOrder(s, "list")}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-medium hover:bg-slate-50 transition"
                        >
                          کتب کی فہرست
                        </button>
                        <button
                          onClick={() => openOrder(s, "history")}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-medium hover:bg-slate-50 transition"
                        >
                          پرانے آرڈرز
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(s)}
                    className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition"
                  >
                    ترمیم
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(s.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-md transition"
                    title="حذف کریں"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* سپلائر کا آرڈر اور کتب کی فہرست */}
      {orderSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-full max-w-lg shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setOrderSupplier(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
            <h3 className="text-base font-bold text-slate-800 mb-3">{orderSupplier.name}</h3>

            <button
              type="button"
              onClick={() => setBillOpen(true)}
              className="mb-3 w-full rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 py-2 text-xs font-semibold hover:bg-emerald-100 transition"
            >
              📷 سپلائر کا بل اپلوڈ کریں (خود بخود کتابیں اور سٹاک)
            </button>

            {linksError && (
              <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">
                {linksError}
              </div>
            )}

            <div className="flex gap-2 mb-4 text-xs">
              <button
                onClick={() => setOrderTab("order")}
                className={`flex-1 py-1.5 rounded-lg font-semibold border ${
                  orderTab === "order" ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200 text-slate-600"
                }`}
              >
                آرڈر بنائیں
              </button>
              <button
                onClick={() => setOrderTab("list")}
                className={`flex-1 py-1.5 rounded-lg font-semibold border ${
                  orderTab === "list" ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200 text-slate-600"
                }`}
              >
                کتب کی فہرست
              </button>
              <button
                onClick={() => setOrderTab("history")}
                className={`flex-1 py-1.5 rounded-lg font-semibold border ${
                  orderTab === "history" ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200 text-slate-600"
                }`}
              >
                پرانے آرڈرز
              </button>
              <button
                onClick={() => setOrderTab("account")}
                className={`flex-1 py-1.5 rounded-lg font-semibold border ${
                  orderTab === "account" ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200 text-slate-600"
                }`}
              >
                حساب
              </button>
            </div>

            {ordersError && orderTab !== "list" && (
              <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">{ordersError}</div>
            )}

            {orderTab === "account" ? (
              (() => {
                const acc = supplierAccount(orderSupplier.id);
                const myPays = supplierPayments.filter((p) => p.supplier_id === orderSupplier.id);
                const fmt = (n: number) => Math.round(n).toLocaleString();
                return (
                  <div>
                    {paymentsError && (
                      <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">{paymentsError}</div>
                    )}
                    <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 text-xs">
                      <div className="flex justify-between p-2.5"><span className="text-slate-500">موصول شدہ مال کی رقم</span><b>Rs {fmt(acc.received)}</b></div>
                      {acc.charges > 0 && (
                        <div className="flex justify-between p-2.5"><span className="text-slate-500">پرانا / اضافی بقایا</span><b>Rs {fmt(acc.charges)}</b></div>
                      )}
                      <div className="flex justify-between p-2.5"><span className="text-slate-500">کل ادائیگیاں</span><b>Rs {fmt(acc.paid)}</b></div>
                      <div className={`flex justify-between p-2.5 font-bold ${acc.balance > 0 ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"}`}>
                        <span>{acc.balance >= 0 ? "ہمارے ذمے بقایا" : "پیشگی (سپلائر کے ذمے)"}</span>
                        <span>Rs {fmt(Math.abs(acc.balance))}</span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-slate-200 p-3">
                      <p className="text-[11px] font-bold text-slate-700 mb-1.5">نیا اندراج</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder="رقم (روپے)"
                          className="w-28 rounded-lg border border-slate-200 p-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          value={payNote}
                          onChange={(e) => setPayNote(e.target.value)}
                          placeholder="نوٹ (اختیاری)"
                          className="flex-1 min-w-0 rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => addPaymentEntry("payment")}
                          disabled={payBusy}
                          className="flex-1 rounded-lg bg-emerald-600 text-white py-1.5 text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-40"
                        >
                          ادائیگی کی
                        </button>
                        <button
                          onClick={() => addPaymentEntry("charge")}
                          disabled={payBusy}
                          className="flex-1 rounded-lg border border-amber-300 text-amber-700 py-1.5 text-xs font-semibold hover:bg-amber-50 transition disabled:opacity-40"
                        >
                          بقایا بڑھائیں (پرانا حساب)
                        </button>
                      </div>
                      {payMsg && <p className="mt-2 text-[11px] text-rose-600">{payMsg}</p>}
                    </div>

                    {(() => {
                      const myOrders = supplierOrders.filter((o) => o.supplier_id === orderSupplier.id);
                      const monthly = new Map<string, number>();
                      const topMap = new Map<string, number>();
                      myOrders.forEach((o) => {
                        const amt = Number(o.total_amount) || 0;
                        if (amt > 0) {
                          const d = new Date(o.received_at || o.created_at);
                          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                          monthly.set(key, (monthly.get(key) || 0) + amt);
                        }
                        (o.supplier_order_items || []).forEach((it) => {
                          const q = Number(it.received_qty) || 0;
                          if (q > 0) topMap.set(it.title, (topMap.get(it.title) || 0) + q);
                        });
                      });
                      const monthRows = Array.from(monthly.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
                      const topRows = Array.from(topMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
                      if (monthRows.length === 0 && topRows.length === 0) return null;
                      return (
                        <div className="mt-3 rounded-lg border border-slate-200 p-3 text-xs">
                          <p className="text-[11px] font-bold text-slate-700 mb-1.5">رپورٹ</p>
                          {monthRows.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[10px] text-slate-400 mb-1">ہر مہینے کتنا مال آیا (رقم)</p>
                              {monthRows.map(([m, amt]) => (
                                <div key={m} className="flex justify-between py-0.5">
                                  <span dir="ltr" className="text-slate-500">{m}</span>
                                  <b>Rs {Math.round(amt).toLocaleString()}</b>
                                </div>
                              ))}
                            </div>
                          )}
                          {topRows.length > 0 && (
                            <div>
                              <p className="text-[10px] text-slate-400 mb-1">سب سے زیادہ آنے والی کتب (تعداد)</p>
                              {topRows.map(([t, q]) => (
                                <div key={t} className="flex justify-between gap-2 py-0.5">
                                  <span className="truncate text-slate-600">{t}</span>
                                  <b className="shrink-0">{q}</b>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {myPays.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold text-slate-500 mb-1">اندراجات</p>
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
                          {myPays.map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-2 p-2 text-xs">
                              <div className="min-w-0">
                                <p className={`font-semibold ${p.kind === "charge" ? "text-amber-700" : "text-emerald-700"}`}>
                                  {p.kind === "charge" ? "+ بقایا" : "− ادائیگی"} Rs {fmt(Number(p.amount))}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate" dir="ltr">
                                  {new Date(p.paid_at).toLocaleDateString("en-GB")}
                                  {p.note ? ` • ${p.note}` : ""}
                                </p>
                              </div>
                              <button onClick={() => deletePaymentEntry(p.id)} className="p-1 text-slate-400 hover:text-rose-600" title="حذف">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : orderTab === "history" ? (
              (() => {
                const mineOrders = supplierOrders.filter((o) => o.supplier_id === orderSupplier.id);
                if (mineOrders.length === 0) {
                  return <p className="text-xs text-slate-500 text-center py-8">ابھی اس سپلائر کا کوئی محفوظ آرڈر نہیں۔</p>;
                }
                return (
                  <div className="space-y-2.5">
                    {mineOrders.map((o) => {
                      const items = o.supplier_order_items || [];
                      const pending = o.status !== "received";
                      const isReceiving = receiveOrder?.id === o.id;
                      return (
                        <div key={o.id} className="rounded-lg border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-slate-800" dir="ltr">{o.order_no}</p>
                              <p className="text-[11px] text-slate-400" dir="ltr">
                                {new Date(o.created_at).toLocaleDateString("en-GB")}
                                {Number(o.total_amount) > 0 ? ` • Rs ${Number(o.total_amount).toLocaleString()}` : ""}
                              </p>
                            </div>
                            <span
                              className={`text-[11px] font-semibold rounded-md border px-2 py-0.5 ${
                                o.status === "partial"
                                  ? "bg-amber-50 border-amber-200 text-amber-700"
                                  : pending
                                  ? "bg-sky-50 border-sky-200 text-sky-700"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
                              }`}
                            >
                              {o.status === "partial" ? "جزوی موصول" : pending ? "زیر انتظار" : "موصول ہوا"}
                            </span>
                          </div>

                          {!isReceiving && (
                            <ul className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                              {items.map((it) => (
                                <li key={it.id} className="flex justify-between gap-2">
                                  <span className="truncate">{it.title}{it.book_id === null ? " (دستی)" : ""}</span>
                                  <span className="shrink-0 font-semibold">
                                    {it.quantity}
                                    {it.received_qty !== null && it.received_qty !== undefined && Number(it.received_qty) > 0 && Number(it.received_qty) !== it.quantity
                                      ? ` ← ${it.received_qty} آئیں`
                                      : ""}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {isReceiving && (
                            <div className="mt-2">
                              <p className="text-[11px] text-slate-500 mb-1.5">
                                جتنی کتابیں اصل میں آئیں وہ تعداد لکھیں۔ یہی تعداد سٹاک میں جمع ہوگی (0 = شامل نہیں)۔
                              </p>
                              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
                                {items.map((it) => (
                                  <div key={it.id} className="flex items-center justify-between gap-2 p-2">
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-slate-800 truncate">{it.title}</p>
                                      <p className="text-[10px] text-slate-400">
                                        آرڈر: {it.quantity} • آ چکی: {Number(it.received_qty) || 0} • باقی:{" "}
                                        {Math.max(0, it.quantity - (Number(it.received_qty) || 0))}
                                      </p>
                                      {it.book_id === null && (
                                        <button
                                          type="button"
                                          onClick={() => addManualToBooks(it)}
                                          className="mt-0.5 text-[10px] font-semibold text-sky-700 hover:underline"
                                        >
                                          دستی کتاب — کتب میں شامل کریں (تاکہ سٹاک بڑھے)
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                      <input
                                        type="number"
                                        min={0}
                                        value={recvQty[it.id] ?? ""}
                                        onChange={(e) => setRecvQty((prev) => ({ ...prev, [it.id]: e.target.value }))}
                                        className="w-14 rounded-lg border border-slate-200 p-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                        placeholder="تعداد"
                                      />
                                      <input
                                        type="number"
                                        min={0}
                                        value={recvPrice[it.id] ?? ""}
                                        onChange={(e) => setRecvPrice((prev) => ({ ...prev, [it.id]: e.target.value }))}
                                        className="w-20 rounded-lg border border-slate-200 p-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                        placeholder="خرید قیمت"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={closeRemaining}
                                  onChange={(e) => setCloseRemaining(e.target.checked)}
                                  className="w-3.5 h-3.5 accent-sky-600"
                                />
                                باقی مال نہیں آئے گا، آرڈر بند کر دیں
                              </label>
                              <p className="mt-2 text-[11px] font-semibold text-slate-700">
                                اس بار کی رقم: Rs{" "}
                                {items
                                  .reduce(
                                    (sum, it) => sum + (parseInt(recvQty[it.id] ?? "0") || 0) * (parseFloat(recvPrice[it.id] ?? "") || 0),
                                    0
                                  )
                                  .toLocaleString()}
                                <span className="font-normal text-slate-400"> (سپلائر کے حساب میں جمع ہوگی)</span>
                              </p>
                              {receiveMsg && <p className="mt-2 text-[11px] text-rose-600">{receiveMsg}</p>}
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={confirmReceive}
                                  disabled={receiveBusy}
                                  className="flex-1 rounded-lg bg-sky-600 text-white py-1.5 text-xs font-semibold hover:bg-sky-700 transition disabled:opacity-40"
                                >
                                  {receiveBusy ? "شامل ہو رہا ہے..." : "سٹاک میں شامل کریں"}
                                </button>
                                <button
                                  onClick={() => setReceiveOrder(null)}
                                  className="flex-1 rounded-lg border border-slate-200 text-slate-600 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
                                >
                                  منسوخ
                                </button>
                              </div>
                            </div>
                          )}

                          {!isReceiving && (
                            <div className="mt-2.5 flex items-center justify-end gap-2">
                              {o.status === "pending" && (
                                <button
                                  onClick={() => loadOrderForEdit(o)}
                                  className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold transition"
                                >
                                  ترمیم / دوبارہ بھیجیں
                                </button>
                              )}
                              {pending && (
                                <button
                                  onClick={() => openReceive(o)}
                                  className="px-3 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 text-[11px] font-semibold transition"
                                >
                                  {o.status === "partial" ? "مزید مال آیا" : "مال آ گیا (سٹاک میں شامل)"}
                                </button>
                              )}
                              <button
                                onClick={() => deleteSupplierOrder(o)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                                title="ریکارڈ حذف کریں"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : orderTab === "order" ? (
              (() => {
                const mine = supplierBooks(orderSupplier.id);
                const needed = mine.filter(isLowStock);
                const others = mine.filter((b) => !isLowStock(b));
                const renderRow = (b: BookLite) => (
                  <div key={b.id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{b.title}</p>
                      <p className={`text-[11px] font-semibold ${(b.stock ?? 0) <= 0 ? "text-rose-600" : isLowStock(b) ? "text-amber-600" : "text-slate-400"}`}>
                        {(b.stock ?? 0) <= 0 ? "ختم" : isLowStock(b) ? `کم سٹاک (${b.stock})` : `سٹاک ${b.stock}`}
                      </p>
                      {lastPrice(orderSupplier.id, b) !== null && (
                        <p className="text-[10px] text-slate-400">آخری خرید قیمت: Rs {lastPrice(orderSupplier.id, b)}</p>
                      )}
                    </div>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="تعداد"
                      value={qtyMap[b.id] || ""}
                      onChange={(e) => setQtyMap((prev) => ({ ...prev, [b.id]: e.target.value }))}
                      className="w-20 rounded-lg border border-slate-200 p-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                );
                return (
                  <div>
                    {mine.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">
                        اس سپلائر کی کوئی کتاب شامل نہیں۔ "کتب کی فہرست" میں کتابیں چنیں، یا نیچے دستی کتاب لکھیں۔
                      </p>
                    )}
                    {mine.length > 0 && needed.length > 0 ? (
                      <>
                        <p className="text-[11px] font-bold text-rose-600 mb-1">کم یا ختم کتب</p>
                        {needed.map(renderRow)}
                      </>
                    ) : mine.length > 0 ? (
                      <p className="text-xs text-emerald-600 mb-2">اس سپلائر کی کوئی کتاب کم یا ختم نہیں ہے ✅</p>
                    ) : null}
                    {others.length > 0 && (
                      <>
                        <p className="text-[11px] font-bold text-slate-500 mt-4 mb-1">باقی کتب</p>
                        {others.map(renderRow)}
                      </>
                    )}
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                      <p className="text-[11px] font-bold text-amber-800 mb-1.5">✍️ دستی کتاب (جو فہرست میں نہیں)</p>
                      <input
                        type="text"
                        placeholder="کتاب کا نام"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="mb-2 w-full rounded-lg border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="مصنف (اختیاری)"
                          value={manualAuthor}
                          onChange={(e) => setManualAuthor(e.target.value)}
                          className="flex-1 min-w-0 rounded-lg border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                        <input
                          type="number"
                          min={1}
                          value={manualQty}
                          onChange={(e) => setManualQty(e.target.value)}
                          className="w-16 rounded-lg border border-slate-200 p-2 text-xs text-center bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          placeholder="تعداد"
                        />
                        <button
                          type="button"
                          onClick={handleAddManual}
                          className="bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-amber-700 transition"
                        >
                          شامل
                        </button>
                      </div>
                      {manualLines.length > 0 && (
                        <ul className="mt-2 divide-y divide-amber-100">
                          {manualLines.map((m, i) => {
                            const upd = (patch: Partial<{ title: string; author: string; qty: number }>) =>
                              setManualLines((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                            return (
                              <li key={i} className="py-2 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={m.title}
                                    onChange={(e) => upd({ title: e.target.value })}
                                    placeholder="کتاب کا نام"
                                    className="flex-1 min-w-0 rounded-lg border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setManualLines((prev) => prev.filter((_, j) => j !== i))}
                                    className="text-rose-500 hover:text-rose-700 shrink-0"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={m.author}
                                    onChange={(e) => upd({ author: e.target.value })}
                                    placeholder="مصنف (اختیاری)"
                                    className="flex-1 min-w-0 rounded-lg border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                  />
                                  <input
                                    type="number"
                                    min={1}
                                    value={m.qty}
                                    onChange={(e) => upd({ qty: parseInt(e.target.value) || 0 })}
                                    className="w-16 rounded-lg border border-slate-200 p-1.5 text-xs text-center bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                  />
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {(() => {
                      const est = getOrderLines().reduce(
                        (sum, x) => sum + (x.manual ? 0 : x.qty * (lastPrice(orderSupplier.id, x.b) || 0)),
                        0
                      );
                      return est > 0 ? (
                        <p className="mt-3 text-xs font-semibold text-slate-700 text-center">
                          اندازاً کل رقم: Rs {est.toLocaleString()}
                          <span className="font-normal text-slate-400"> (آخری خرید قیمت کے حساب سے)</span>
                        </p>
                      ) : null;
                    })()}
                    <p className="mt-4 text-[11px] text-slate-400 text-center" dir="ltr">Order No: {orderNo}</p>
                    <button
                      onClick={sendOrder}
                      className="mt-2 w-full rounded-lg bg-emerald-600 text-white py-2 text-xs font-bold hover:bg-emerald-700 transition"
                    >
                      آرڈر واٹس ایپ پر بھیجیں
                    </button>
                    <button
                      onClick={printOrderSheet}
                      className="mt-2 w-full rounded-lg border border-emerald-600 text-emerald-700 py-2 text-xs font-bold hover:bg-emerald-50 transition"
                    >
                      آرڈر شیٹ پرنٹ / PDF
                    </button>
                    <button
                      onClick={shareOrderPdf}
                      disabled={pdfBusy}
                      className="mt-2 w-full rounded-lg bg-slate-800 text-white py-2 text-xs font-bold hover:bg-slate-900 transition disabled:opacity-50"
                    >
                      {pdfBusy ? "PDF بن رہی ہے..." : "PDF شیئر کریں (واٹس ایپ وغیرہ)"}
                    </button>
                    <button
                      onClick={() => {
                        const lines = getOrderLines();
                        if (lines.length === 0) {
                          alert("کم از کم ایک کتاب کی تعداد لکھیں");
                          return;
                        }
                        void saveOrderRecord(lines);
                      }}
                      className="mt-2 w-full rounded-lg border border-sky-300 text-sky-700 py-2 text-xs font-bold hover:bg-sky-50 transition"
                    >
                      آرڈر صرف محفوظ کریں (بھیجے بغیر)
                    </button>
                    {orderMsg && <p className="mt-2 text-[11px] text-center text-slate-600">{orderMsg}</p>}
                    {!orderSupplier.phone && (
                      <p className="mt-2 text-[11px] text-amber-600 text-center">
                        اس سپلائر کا فون نمبر درج نہیں، واٹس ایپ میں خود نمبر چننا ہوگا۔
                      </p>
                    )}
                  </div>
                );
              })()
            ) : (
              (() => {
                const term = bookSearch.trim().toLowerCase();
                // جو کتابیں کسی دوسرے سپلائر کے تحت شامل ہیں وہ یہاں چھپ جاتی ہیں
                const takenByOther = new Set(
                  links.filter((l) => l.supplier_id !== orderSupplier.id).map((l) => l.book_id)
                );
                const matchesTerm = (b: BookLite) =>
                  term === "" ||
                  b.title.toLowerCase().includes(term) ||
                  (b.author || "").toLowerCase().includes(term);
                const hiddenCount = allBooks.filter((b) => matchesTerm(b) && takenByOther.has(b.id)).length;
                const visible = allBooks.filter(
                  (b) => matchesTerm(b) && (showOtherSupplierBooks || !takenByOther.has(b.id))
                );
                const notAdded = visible.filter(
                  (b) => !links.some((l) => l.supplier_id === orderSupplier.id && l.book_id === b.id)
                );
                return (
                  <div>
                    <input
                      type="text"
                      placeholder="کتاب کے نام یا مصنف کے نام سے تلاش کریں..."
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      className="w-full mb-2 rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[11px] text-slate-400">
                        {supplierBooks(orderSupplier.id).length} کتب منتخب • {visible.length} نظر آ رہی ہیں
                      </p>
                      {term !== "" && notAdded.length > 0 && (
                        <button
                          onClick={() => addAllVisible(orderSupplier.id, visible)}
                          className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold px-2.5 py-1 hover:bg-emerald-100 transition"
                        >
                          یہ سب {notAdded.length} کتب شامل کریں
                        </button>
                      )}
                    </div>
                    {(hiddenCount > 0 || showOtherSupplierBooks) && (
                      <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5">
                        <p className="text-[11px] text-slate-500">
                          {showOtherSupplierBooks
                            ? "دوسرے سپلائرز کی کتب بھی نظر آ رہی ہیں"
                            : `${hiddenCount} کتب دوسرے سپلائرز کے تحت شامل ہیں، اس لیے چھپی ہیں`}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowOtherSupplierBooks((v) => !v)}
                          className="shrink-0 text-[11px] font-semibold text-sky-700 hover:underline"
                        >
                          {showOtherSupplierBooks ? "چھپائیں" : "دکھائیں"}
                        </button>
                      </div>
                    )}
                    <div className="max-h-[50vh] overflow-y-auto">
                      {visible.map((b) => {
                        const checked = links.some((l) => l.supplier_id === orderSupplier.id && l.book_id === b.id);
                        return (
                          <label
                            key={b.id}
                            className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleLink(orderSupplier.id, b.id)}
                              className="w-4 h-4 accent-emerald-600"
                            />
                            <span className="flex-1 min-w-0">
                              <span className="block text-xs text-slate-700">{b.title}</span>
                              {b.author && <span className="block text-[11px] text-slate-400">{b.author}</span>}
                            </span>
                            <span className="text-[11px] text-slate-400">سٹاک {b.stock ?? 0}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-full max-w-sm shadow-xl text-center relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800">سپلائر حذف کریں؟</h3>
            <p className="text-slate-500 text-xs mt-1.5">کیا آپ واقعی اس سپلائر کو ریکارڈ سے ختم کرنا چاہتے ہیں؟</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 rounded-lg bg-rose-600 text-white py-1.5 text-xs font-semibold hover:bg-rose-700 transition"
              >
                حذف کریں
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-lg border border-slate-200 text-slate-600 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-full max-w-md shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4">
              {editingId ? "سپلائر میں ترمیم" : "نیا سپلائر شامل کریں"}
            </h3>

            {saveError && (
              <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">
                {saveError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">سپلائر کا نام</label>
                <input
                  type="text"
                  placeholder="سپلائر کا نام"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">رابطہ کار کا نام (اختیاری)</label>
                <input
                  type="text"
                  placeholder="رابطہ کار کا نام"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">فون نمبر (اختیاری)</label>
                <input
                  type="tel"
                  placeholder="فون نمبر"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ای میل (اختیاری)</label>
                <input
                  type="email"
                  placeholder="ای میل"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">پتہ (اختیاری)</label>
                <textarea
                  placeholder="پتہ درج کریں..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">نوٹس (اختیاری)</label>
                <textarea
                  placeholder="اضافی معلومات..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {saving ? "محفوظ ہو رہا ہے..." : editingId ? "محفوظ کریں" : "شامل کریں"}
              </button>
            </div>
          </div>
        </div>
      )}
      {billOpen && orderSupplier && (
        <BillUpload
          supplier={{ id: orderSupplier.id, name: orderSupplier.name }}
          allBooks={allBooks}
          links={links}
          onClose={() => setBillOpen(false)}
          onDone={() => {
            fetchBooksAndLinks();
          }}
        />
      )}
    </main>
  );
}