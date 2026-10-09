"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  FolderTree,
  Receipt,
  Users,
  ShoppingCart,
  Truck,
  RotateCcw,
  Star,
  PackageMinus,
  Wallet,
  LogOut,
  Menu,
  X,
  Plus,
  Trash2,
  Printer,
  Search,
  FileText,
  TrendingUp,
  AlertCircle,
  Eye,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Customer {
  id: number;
  name: string;
  phone?: string;
  whatsapp_number?: string;
}

interface Book {
  id: number;
  title: string;
  price: number;
  stock: number;
}

interface SelectedItem {
  book_id: number;
  title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_status: "unpaid" | "partial" | "paid";
  amount_paid: number;
  due_date: string | null;
  created_at: string;
  customers?: { name: string; phone?: string };
}

interface LineItem {
  book_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  books?: { title: string };
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BILL-${stamp}-${rand}`;
}

function statusLabel(status: string) {
  if (status === "paid")
    return { label: "ادا شدہ", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (status === "partial")
    return { label: "جزوی ادائیگی", color: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "غیر ادا شدہ", color: "bg-rose-50 text-rose-700 border-rose-200" };
}

const invoiceStyles = `
  body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; direction: rtl; color: #111827; background:#f8fafc; }
  .invoice-wrapper { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  .header { text-align: center; background: linear-gradient(135deg, #047857, #059669); padding: 26px 16px; color: white; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
  .info-box { margin: 20px 24px 0; border: 1px solid #e5e7eb; background: #f9fafb; padding: 14px; border-radius: 10px; font-size: 14px; }
  .info-box p { margin: 4px 0; }
  table.items { width: calc(100% - 48px); border-collapse: collapse; margin: 16px 24px; font-size: 14px; }
  table.items th { background: #ecfdf5; color: #047857; padding: 8px; border: 1px solid #e5e7eb; }
  table.items td { padding: 8px; border: 1px solid #e5e7eb; }
  .totals { margin: 8px 24px 24px; padding: 16px; background: #f9fafb; border-radius: 10px; font-size: 14px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .grand { border-top: 2px solid #047857; font-weight: bold; font-size: 16px; color: #047857; padding-top: 8px; margin-top: 4px; }
  .totals .balance { color: #dc2626; font-weight: bold; }
`;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [manualSubtotal, setManualSubtotal] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [amountPaid, setAmountPaid] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [currentBookId, setCurrentBookId] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [currentQty, setCurrentQty] = useState("1");

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewItems, setPreviewItems] = useState<LineItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = async () => {
    setLoaded(false);
    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("*, customers(name, phone)")
      .order("id", { ascending: false });

    if (invoicesData) setInvoices(invoicesData as Invoice[]);

    const { data: customersData } = await supabase
      .from("customers")
      .select("id, name, phone, whatsapp_number");
    if (customersData) setCustomers(customersData as Customer[]);

    const { data: booksData } = await supabase
      .from("books")
      .select("id, title, price, stock");
    if (booksData) setBooks(booksData as Book[]);

    setLoaded(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCustomerName = (inv: Invoice) => {
    if (inv.customers?.name) return inv.customers.name;
    if (inv.customer_id) {
      const matched = customers.find((c) => c.id === inv.customer_id);
      if (matched) return matched.name;
    }
    if ((inv as any).walk_in_name) return (inv as any).walk_in_name;
    return "عام گاہک (براہ راست)";
  };

  const handleAddItem = () => {
    if (!currentBookId) return;
    const book = books.find((b) => b.id === parseInt(currentBookId));
    if (!book) return;

    const qty = parseInt(currentQty) || 1;
    if (qty <= 0) return;

    if (qty > book.stock) {
      alert(`دستیاب اسٹاک میں صرف ${book.stock} کتابیں موجود ہیں!`);
      return;
    }

    const existingIndex = selectedItems.findIndex((item) => item.book_id === book.id);
    if (existingIndex > -1) {
      const updated = [...selectedItems];
      const newQty = updated[existingIndex].quantity + qty;
      if (newQty > book.stock) {
        alert(`کل تعداد دستیاب اسٹاک (${book.stock}) سے تجاوز کر رہی ہے!`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].total_price = newQty * book.price;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          book_id: book.id,
          title: book.title,
          quantity: qty,
          unit_price: book.price,
          total_price: qty * book.price,
        },
      ]);
    }

    setCurrentBookId("");
    setCurrentQty("1");
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const itemsSubtotal = selectedItems.reduce((sum, item) => sum + item.total_price, 0);
  const effectiveSubtotal = selectedItems.length > 0 ? itemsSubtotal : parseFloat(manualSubtotal) || 0;
  const computedTotal = Math.max(0, effectiveSubtotal - (parseFloat(discountAmount) || 0));

  const filteredInvoices = invoices.filter((inv) => {
    const term = search.trim().toLowerCase();
    const custName = getCustomerName(inv).toLowerCase();
    const matchesSearch =
      term === "" ||
      inv.invoice_number.toLowerCase().includes(term) ||
      custName.includes(term);
    const matchesStatus = filterStatus ? inv.payment_status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = invoices
    .filter((i) => i.payment_status !== "paid")
    .reduce((sum, i) => sum + (i.total_amount - i.amount_paid), 0);

  const totalRevenue = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const totalBillsCount = invoices.length;

  const resetForm = () => {
    setSelectedCustomerId("");
    setSelectedItems([]);
    setManualSubtotal("");
    setDiscountAmount("0");
    setAmountPaid("0");
    setDueDate("");
    setSaveError(null);
    setCurrentBookId("");
    setCurrentQty("1");
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSave = async () => {
    if (effectiveSubtotal <= 0) {
      setSaveError("براہ کرم کتابیں شامل کریں یا فرعی مجموعہ درج کریں!");
      return;
    }

    setSaving(true);
    setSaveError(null);

    const total = computedTotal;
    const paid = parseFloat(amountPaid) || 0;
    let status: "unpaid" | "partial" | "paid" = "unpaid";
    if (paid >= total && total > 0) status = "paid";
    else if (paid > 0) status = "partial";

    const invoiceData = {
      invoice_number: generateInvoiceNumber(),
      customer_id:
        selectedCustomerId && selectedCustomerId !== "__new__"
          ? parseInt(selectedCustomerId)
          : null,
      walk_in_name: selectedCustomerId === "__new__" ? walkInName.trim() || null : null,
      subtotal: effectiveSubtotal,
      discount_amount: parseFloat(discountAmount) || 0,
      total_amount: total,
      amount_paid: paid,
      payment_status: status,
      due_date: dueDate || null,
    };

    try {
      const { data: newInvoice, error: invErr } = await supabase
        .from("invoices")
        .insert(invoiceData)
        .select()
        .single();

      if (invErr || !newInvoice) {
        throw new Error(invErr?.message || "محفوظ کرنے میں ناکامی ہوئی");
      }

      if (selectedItems.length > 0) {
        for (const item of selectedItems) {
          await supabase.from("invoice_items").insert({
            invoice_id: newInvoice.id,
            book_id: item.book_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          });

          const targetBook = books.find((b) => b.id === item.book_id);
          if (targetBook) {
            await supabase
              .from("books")
              .update({ stock: targetBook.stock - item.quantity })
              .eq("id", item.book_id);
          }
        }
      }

      setSaving(false);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setSaveError(`محفوظ کرنے میں ناکامی: ${err.message}`);
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await supabase.from("invoices").delete().eq("id", id);
    setConfirmDeleteId(null);
    fetchData();
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    await supabase
      .from("invoices")
      .update({ payment_status: "paid", amount_paid: invoice.total_amount })
      .eq("id", invoice.id);
    fetchData();
  };

  const buildInvoiceHtml = (invoice: Invoice, items: LineItem[]) => {
    const customerName = getCustomerName(invoice);
    const balance = invoice.total_amount - invoice.amount_paid;

    const itemsRows = items
      .map(
        (it, i) => `
        <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"};">
          <td>${it.books?.title || "کتاب"}</td>
          <td style="text-align:center">${it.quantity}</td>
          <td style="text-align:left">${Number(it.unit_price).toLocaleString()} روپے</td>
          <td style="text-align:left">${Number(it.total_price).toLocaleString()} روپے</td>
        </tr>`
      )
      .join("");

    return `
      <div class="invoice-wrapper">
        <div class="header">
          <h1>مكتبة الزهراء</h1>
          <p>انوائس نمبر: ${invoice.invoice_number}</p>
        </div>
        <div class="info-box">
          <p><strong>گاہک کا نام:</strong> ${customerName}</p>
          <p><strong>تاریخ:</strong> ${new Date(invoice.created_at).toLocaleDateString("ur-PK")}</p>
          ${invoice.due_date ? `<p><strong>آخری تاریخ:</strong> ${invoice.due_date}</p>` : ""}
        </div>
        ${
          items.length > 0
            ? `<table class="items">
                <thead>
                  <tr>
                    <th style="text-align:right">کتاب کی تفصیلات</th>
                    <th style="text-align:center">تعداد</th>
                    <th style="text-align:left">قیمت</th>
                    <th style="text-align:left">کل</th>
                  </tr>
                </thead>
                <tbody>${itemsRows}</tbody>
              </table>`
            : ""
        }
        <div class="totals">
          <div><span>فرعی مجموعہ</span><span>${Number(invoice.subtotal).toLocaleString()} روپے</span></div>
          <div><span>رعایت</span><span>${Number(invoice.discount_amount).toLocaleString()} روپے</span></div>
          <div class="grand"><span>کل واجب الادا رقم</span><span>${Number(invoice.total_amount).toLocaleString()} روپے</span></div>
          <div><span>ادا شدہ</span><span>${Number(invoice.amount_paid).toLocaleString()} روپے</span></div>
          ${balance > 0 ? `<div class="balance"><span>بقایا رقم</span><span>${balance.toLocaleString()} روپے</span></div>` : ""}
        </div>
      </div>`;
  };

  const fetchLineItems = async (invoiceId: number): Promise<LineItem[]> => {
    const { data } = await supabase
      .from("invoice_items")
      .select("*, books(title)")
      .eq("invoice_id", invoiceId);
    return (data as LineItem[]) || [];
  };

  const handlePrintInvoice = async (invoice: Invoice) => {
    const items = await fetchLineItems(invoice.id);
    const html = `
      <html dir="rtl" lang="ur">
        <head>
          <meta charset="UTF-8" />
          <title>${invoice.invoice_number}</title>
          <style>${invoiceStyles}
            @media print { body { background: white; } .invoice-wrapper { box-shadow: none; } }
          </style>
        </head>
        <body>${buildInvoiceHtml(invoice, items)}</body>
      </html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  const handlePreviewInvoice = async (invoice: Invoice) => {
    setPreviewLoading(true);
    setPreviewInvoice(invoice);
    const items = await fetchLineItems(invoice.id);
    setPreviewItems(items);
    setPreviewLoading(false);
  };

  const menuItems = [
    { href: "/", label: "ڈیش بورڈ", icon: LayoutDashboard },
    { href: "/books", label: "کتب", icon: BookOpen },
    { href: "/authors", label: "مصنفین", icon: PenLine },
    { href: "/categories", label: "زمرے", icon: FolderTree },
    { href: "/orders", label: "آرڈرز", icon: ShoppingCart },
    { href: "/customers", label: "کسٹمرز", icon: Users },
    { href: "/invoices", label: "بل / انوائس", icon: Receipt, active: true },
    { href: "/suppliers", label: "سپلائرز", icon: Truck },
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
            <h2 className="text-xl font-bold text-slate-900">بل / انوائس 📄</h2>
            <p className="text-xs text-slate-500 mt-0.5">کل {invoices.length} انوائسز کا ریکارڈ</p>
          </div>

          <button
            onClick={openAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-xs"
          >
            <Plus size={15} />
            <span>نئی انوائس بنائیں</span>
          </button>
        </div>

        {/* Statistics Cards */}
        {loaded && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">کل انوائسز</p>
                <p className="text-base font-bold text-slate-800">{totalBillsCount}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">کل آمدنی</p>
                <p className="text-base font-bold text-slate-800">{totalRevenue.toLocaleString()} روپے</p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-[11px] text-rose-600 font-semibold">بقایا رقم (غیر ادا شدہ)</p>
                <p className="text-base font-bold text-rose-700">{totalOutstanding.toLocaleString()} روپے</p>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="انوائس نمبر یا گاہک کے نام سے تلاش کریں..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-9 pl-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-xs"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition sm:w-48"
          >
            <option value="">تمام حالات</option>
            <option value="unpaid">غیر ادا شدہ</option>
            <option value="partial">جزوی ادائیگی</option>
            <option value="paid">ادا شدہ</option>
          </select>
        </div>

        {/* Invoices List / Cards Grid */}
        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 rounded-xl border border-slate-200 bg-white p-4 animate-pulse" />
            ))}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <span className="text-4xl mb-2 block">🧾</span>
            <p className="text-xs text-slate-500">کوئی انوائس موجود نہیں ہے</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredInvoices.map((inv) => {
              const status = statusLabel(inv.payment_status);
              const balance = inv.total_amount - inv.amount_paid;
              const customerName = getCustomerName(inv);

              return (
                <div
                  key={inv.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-bold text-slate-800" dir="ltr">
                        {inv.invoice_number}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="text-xs text-emerald-700 font-semibold mb-1 truncate">
                      👤 گاہک: {customerName}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      {new Date(inv.created_at).toLocaleDateString("ur-PK")}
                      {inv.due_date && ` — آخری تاریخ: ${inv.due_date}`}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">کل رقم:</span>
                      <span className="text-sm font-bold text-slate-900">
                        {Number(inv.total_amount).toLocaleString()} روپے
                      </span>
                    </div>

                    {balance > 0 && (
                      <div className="flex items-center justify-between text-[11px] mt-1">
                        <span className="text-rose-600 font-medium">بقایا رقم:</span>
                        <span className="font-bold text-rose-600">
                          {balance.toLocaleString()} روپے
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    {inv.payment_status !== "paid" && (
                      <button
                        onClick={() => handleMarkPaid(inv)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition text-[11px] font-semibold"
                      >
                        ادا شدہ
                      </button>
                    )}
                    <button
                      onClick={() => handlePreviewInvoice(inv)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition"
                      title="پیش نظارہ"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handlePrintInvoice(inv)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition"
                      title="پرنٹ کریں"
                    >
                      <Printer size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(inv.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-md transition"
                      title="حذف کریں"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-full max-w-sm shadow-xl text-center relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800">انوائس حذف کریں؟</h3>
            <p className="text-slate-500 text-xs mt-1.5">کیا آپ واقعی اس انوائس کو حذف کرنا چاہتے ہیں؟ اس عمل کو واپس نہیں لایا جا سکتا۔</p>
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

      {/* Preview Invoice Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150 p-5">
            <button
              onClick={() => {
                setPreviewInvoice(null);
                setPreviewItems([]);
              }}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
            <style>{invoiceStyles}</style>
            {previewLoading ? (
              <div className="p-10 text-center text-xs text-slate-400">لوڈنگ جاری ہے...</div>
            ) : (
              <div className="p-2" dangerouslySetInnerHTML={{ __html: buildInvoiceHtml(previewInvoice, previewItems) }} />
            )}
            <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setPreviewInvoice(null);
                  setPreviewItems([]);
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition"
              >
                بند کریں
              </button>
              <button
                onClick={() => handlePrintInvoice(previewInvoice)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-xs"
              >
                <Printer size={15} />
                <span>پرنٹ کریں</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-full max-w-lg shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4">نئی انوائس بنائیں</h3>

            {saveError && (
              <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">
                {saveError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">گاہک منتخب کریں (اختیاری)</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    if (e.target.value !== "__new__") setWalkInName("");
                  }}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">عام گاہک (براہ راست / بغیر نام)</option>
                  <option value="__new__">+ نیا نام شامل کریں</option>
                  {Array.isArray(customers) && customers.length > 0 ? (
                    customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name ? c.name : "بغیر نام"} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))
                  ) : (
                    <option disabled>کوئی گاہک موجود نہیں</option>
                  )}
                </select>

                {selectedCustomerId === "__new__" && (
                  <input
                    type="text"
                    placeholder="گاہک کا نام درج کریں"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    autoFocus
                  />
                )}
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-lg">
                <label className="text-xs font-bold text-emerald-800 mb-1.5 block">
                  📖 کتاب شامل کریں (خودکار حساب اور اسٹاک اپ ڈیٹ)
                </label>
                <input
                  type="text"
                  placeholder="کتاب تلاش کریں..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={currentBookId}
                    onChange={(e) => setCurrentBookId(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">کتاب منتخب کریں...</option>
                    {books
                      .filter((b) => b.title.toLowerCase().includes(bookSearch.trim().toLowerCase()))
                      .map((b) => (
                        <option key={b.id} value={b.id} disabled={b.stock <= 0}>
                          {b.title} ({b.price} روپے | اسٹاک: {b.stock})
                        </option>
                      ))}
                  </select>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={currentQty}
                      onChange={(e) => setCurrentQty(e.target.value)}
                      className="w-16 rounded-lg border border-slate-200 p-2 text-center text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="تعداد"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      شامل کریں
                    </button>
                  </div>
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-2">کتاب</th>
                        <th className="p-2 text-center">تعداد</th>
                        <th className="p-2">قیمت</th>
                        <th className="p-2">کل</th>
                        <th className="p-2 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{item.title}</td>
                          <td className="p-2 text-center">{item.quantity}</td>
                          <td className="p-2">{item.unit_price} روپے</td>
                          <td className="p-2 font-bold text-emerald-700">{item.total_price} روپے</td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  فرعی مجموعہ (روپے) {selectedItems.length > 0 && "(خودکار حساب)"}
                </label>
                <input
                  type="number"
                  placeholder="مثال: 1500"
                  value={selectedItems.length > 0 ? itemsSubtotal : manualSubtotal}
                  disabled={selectedItems.length > 0}
                  onChange={(e) => setManualSubtotal(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  رعایت / ڈسکاؤنٹ (روپے)
                </label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-800">کل واجب الادا رقم:</span>
                <span className="font-extrabold text-emerald-800 text-base">
                  {computedTotal.toLocaleString()} روپے
                </span>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  ادا شدہ رقم (روپے)
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  آخری تاریخ (اختیاری)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {saving ? "محفوظ ہو رہا ہے..." : "انوائس بنائیں"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}