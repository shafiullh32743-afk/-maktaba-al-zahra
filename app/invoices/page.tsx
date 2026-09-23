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
  Star,
  PackageMinus,
  Wallet,
  Users,
  Receipt,
  Plus,
  Trash2,
  Printer,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Customer {
  id: number;
  name: string;
  phone?: string;
  whatsapp_number?: string;
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
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${stamp}-${rand}`;
}

function statusLabel(status: string) {
  if (status === "paid") return { label: "ادا شدہ", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (status === "partial") return { label: "جزوی ادائیگی", color: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "غیر ادا شدہ", color: "bg-red-50 text-red-700 border-red-200" };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [amountPaid, setAmountPaid] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchData = async () => {
    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("*")
      .order("id", { ascending: false });
    if (invoicesData) setInvoices(invoicesData as Invoice[]);

    const { data: customersData } = await supabase.from("customers").select("id, name, phone, whatsapp_number");
    if (customersData) setCustomers(customersData as Customer[]);

    setLoaded(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCustomerName = (id: number | null) => {
    if (!id) return "نامعلوم کسٹمر";
    return customers.find((c) => c.id === id)?.name || "نامعلوم کسٹمر";
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      term === "" ||
      inv.invoice_number.toLowerCase().includes(term) ||
      getCustomerName(inv.customer_id).toLowerCase().includes(term);
    const matchesStatus = filterStatus ? inv.payment_status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = invoices
    .filter((i) => i.payment_status !== "paid")
    .reduce((sum, i) => sum + (i.total_amount - i.amount_paid), 0);

  const resetForm = () => {
    setSelectedCustomerId("");
    setSubtotal("");
    setDiscountAmount("0");
    setAmountPaid("0");
    setDueDate("");
    setSaveError(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const computedTotal = Math.max(0, (parseFloat(subtotal) || 0) - (parseFloat(discountAmount) || 0));

  const handleSave = async () => {
    if (!subtotal || parseFloat(subtotal) <= 0) return;
    setSaving(true);
    setSaveError(null);

    const total = computedTotal;
    const paid = parseFloat(amountPaid) || 0;
    let status: "unpaid" | "partial" | "paid" = "unpaid";
    if (paid >= total && total > 0) status = "paid";
    else if (paid > 0) status = "partial";

    const invoiceData = {
      invoice_number: generateInvoiceNumber(),
      customer_id: selectedCustomerId ? parseInt(selectedCustomerId) : null,
      subtotal: parseFloat(subtotal) || 0,
      discount_amount: parseFloat(discountAmount) || 0,
      total_amount: total,
      amount_paid: paid,
      payment_status: status,
      due_date: dueDate || null,
    };

    const { error } = await supabase.from("invoices").insert(invoiceData);

    if (error) {
      setSaveError(`محفوظ نہیں ہو سکا: ${error.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowModal(false);
    resetForm();
    fetchData();
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

  const handlePrintInvoice = (invoice: Invoice) => {
    const customerName = getCustomerName(invoice.customer_id);
    const html = `
      <html dir="rtl" lang="ur">
        <head>
          <meta charset="UTF-8" />
          <title>${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, "Noto Nastaliq Urdu", sans-serif; padding: 32px; }
            h1 { text-align: center; color: #047857; margin-bottom: 4px; }
            p.sub { text-align: center; color: #555; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 15px; }
            td { padding: 10px; border: 1px solid #ddd; }
            .label { color: #666; }
            .total-row td { font-weight: bold; background: #f0fdf4; font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>مكتبہ الزھراء</h1>
          <p class="sub">رسید نمبر: ${invoice.invoice_number}</p>
          <table>
            <tr><td class="label">کسٹمر</td><td>${customerName}</td></tr>
            <tr><td class="label">تاریخ</td><td>${new Date(invoice.created_at).toLocaleDateString("ur-PK")}</td></tr>
            <tr><td class="label">ذیلی مجموعہ</td><td>Rs ${Number(invoice.subtotal).toLocaleString()}</td></tr>
            <tr><td class="label">رعایت</td><td>Rs ${Number(invoice.discount_amount).toLocaleString()}</td></tr>
            <tr class="total-row"><td>کل رقم</td><td>Rs ${Number(invoice.total_amount).toLocaleString()}</td></tr>
            <tr><td class="label">ادا شدہ</td><td>Rs ${Number(invoice.amount_paid).toLocaleString()}</td></tr>
            <tr><td class="label">باقی رقم</td><td>Rs ${(invoice.total_amount - invoice.amount_paid).toLocaleString()}</td></tr>
          </table>
        </body>
      </html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  };

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
          <Link href="/orders" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <ShoppingCart size={19} /> آرڈرز
          </Link>
          <Link href="/customers" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <Users size={19} /> کسٹمرز
          </Link>
          <Link href="/invoices" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md">
            <Receipt size={19} /> رسیدیں
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

      <section className="flex-1 min-w-0 p-5 md:p-10 pb-28">
        <div className="flex items-center justify-between md:hidden mb-4">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm">
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-bold text-emerald-800">مكتبہ الزھراء</h1>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">رسیدیں</h2>
            <p className="mt-2 text-gray-500">کل {invoices.length} رسیدیں</p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm w-full md:w-auto"
          >
            <Plus size={18} />
            نئی رسید بنائیں
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">کل باقی رقم (غیر ادا شدہ رسیدیں)</p>
          <p className="text-3xl font-extrabold text-red-800 mt-1">Rs {totalOutstanding.toLocaleString()}</p>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="رسید نمبر یا کسٹمر کا نام تلاش کریں..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-4 pr-11 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition md:w-56"
          >
            <option value="">تمام حالتیں</option>
            <option value="unpaid">غیر ادا شدہ</option>
            <option value="partial">جزوی ادائیگی</option>
            <option value="paid">ادا شدہ</option>
          </select>
        </div>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : filteredInvoices.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">🧾</span>
            <p className="text-gray-500 text-lg">کوئی رسید نہیں ملی</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredInvoices.map((inv) => {
              const status = statusLabel(inv.payment_status);
              const balance = inv.total_amount - inv.amount_paid;

              return (
                <div key={inv.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-800" dir="ltr">{inv.invoice_number}</p>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-600 text-sm">{getCustomerName(inv.customer_id)}</p>
                      <p className="mt-1 text-gray-400 text-xs">
                        {new Date(inv.created_at).toLocaleDateString("ur-PK")}
                        {inv.due_date && ` — آخری تاریخ: ${inv.due_date}`}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-emerald-700">
                        Rs {Number(inv.total_amount).toLocaleString()}
                      </p>
                      {balance > 0 && (
                        <p className="text-sm text-red-600 font-medium">باقی: Rs {balance.toLocaleString()}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {inv.payment_status !== "paid" && (
                        <button
                          onClick={() => handleMarkPaid(inv)}
                          className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-700 hover:bg-emerald-100 transition text-sm font-medium"
                        >
                          ادا شدہ نشان زد کریں
                        </button>
                      )}
                      <button
                        onClick={() => handlePrintInvoice(inv)}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200 transition"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(inv.id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <span className="text-5xl">⚠️</span>
            <h3 className="text-lg font-bold text-gray-800 mt-4">کیا آپ واقعی یہ رسید حذف کرنا چاہتے ہیں؟</h3>
            <p className="text-gray-500 text-sm mt-2">یہ عمل واپس نہیں ہو سکتا۔</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 rounded-xl bg-red-600 text-white py-3 hover:bg-red-700 transition"
              >
                ہاں، حذف کریں
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition"
              >
                منسوخ کریں
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800">نئی رسید بنائیں</h3>

            {saveError && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">
                {saveError}
              </div>
            )}

            <label className="mt-5 block">
              <span className="text-xs text-gray-500">کسٹمر منتخب کریں (اختیاری)</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">کوئی کسٹمر منتخب نہیں</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">ذیلی مجموعہ (روپے)</span>
              <input
                type="number"
                placeholder="مثلاً 1500"
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </label>

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">رعایت (روپے)</span>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </label>

            <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex justify-between">
              <span className="text-sm text-emerald-700">کل رقم</span>
              <span className="font-bold text-emerald-800">Rs {computedTotal.toLocaleString()}</span>
            </div>

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">ادا شدہ رقم (روپے)</span>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </label>

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">آخری تاریخ ادائیگی (اختیاری)</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </label>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition disabled:opacity-60"
              >
                {saving ? "محفوظ ہو رہا ہے..." : "رسید بنائیں"}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition"
              >
                منسوخ کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
