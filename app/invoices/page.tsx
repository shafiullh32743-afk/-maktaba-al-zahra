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
  Truck,
  Gift,
  Ticket,
  RotateCcw,
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
  return { label: "غیر ادا شدہ", color: "bg-red-50 text-red-700 border-red-200" };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal & Form State
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

  // Book Selection inputs for Modal
  const [currentBookId, setCurrentBookId] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [currentQty, setCurrentQty] = useState("1");

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchData = async () => {
    // Join customers table to fetch customer name directly
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
    return "عام کسٹمر (واک ان)";
  };

  // Handle Book Item Additions
  const handleAddItem = () => {
    if (!currentBookId) return;
    const book = books.find((b) => b.id === parseInt(currentBookId));
    if (!book) return;

    const qty = parseInt(currentQty) || 1;
    if (qty <= 0) return;

    if (qty > book.stock) {
      alert(`اسٹاک میں صرف ${book.stock} کتب موجود ہیں!`);
      return;
    }

    const existingIndex = selectedItems.findIndex((item) => item.book_id === book.id);
    if (existingIndex > -1) {
      const updated = [...selectedItems];
      const newQty = updated[existingIndex].quantity + qty;
      if (newQty > book.stock) {
        alert(`کل تعداد اسٹاک (${book.stock}) سے زیادہ ہو رہی ہے!`);
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

  // Calculate Subtotal (Either from selected items or manual input)
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
      setSaveError("براہ کرم کتب شامل کریں یا ذیلی مجموعہ درج کریں!");
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
        throw new Error(invErr?.message || "محفوظ نہیں ہو سکا");
      }

      // If items were selected, save items & deduct stock
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
      setSaveError(`محفوظ نہیں ہو سکا: ${err.message}`);
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

  const handlePrintInvoice = async (invoice: Invoice) => {
    const customerName = getCustomerName(invoice);

    // Fetch line items if available
    const { data: lineItems } = await supabase
      .from("invoice_items")
      .select("*, books(title)")
      .eq("invoice_id", invoice.id);

    let itemsTableRows = "";
    if (lineItems && lineItems.length > 0) {
      itemsTableRows = lineItems
        .map(
          (it: any) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${it.books?.title || "کتاب"}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align:center">${it.quantity}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align:left">Rs ${it.unit_price}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align:left">Rs ${it.total_price}</td>
          </tr>`
        )
        .join("");
    }

    const html = `
      <html dir="rtl" lang="ur">
        <head>
          <meta charset="UTF-8" />
          <title>${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, "Noto Nastaliq Urdu", sans-serif; padding: 24px; direction: rtl; color: #111827; }
            h1 { text-align: center; color: #047857; margin-bottom: 4px; }
            p.sub { text-align: center; color: #4b5563; margin-top: 0; }
            .info-box { border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
            th { background: #047857; color: #ffffff; padding: 8px; border: 1px solid #047857; }
            .total-table td { border: 1px solid #ddd; padding: 8px; }
            .total-row td { font-weight: bold; background: #ecfdf5; font-size: 16px; color: #065f46; }
          </style>
        </head>
        <body>
          <h1>مكتبہ الزھراء</h1>
          <p class="sub">بل نمبر: ${invoice.invoice_number}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 16px;" />
          
          <div class="info-box">
            <p style="margin: 4px 0;"><strong>کسٹمر کا نام:</strong> ${customerName}</p>
            <p style="margin: 4px 0;"><strong>تاریخ:</strong> ${new Date(invoice.created_at).toLocaleDateString("ur-PK")}</p>
          </div>

          ${
            itemsTableRows
              ? `
            <table>
              <thead>
                <tr>
                  <th style="text-align:right">تفصیل کتب</th>
                  <th style="text-align:center">تعداد</th>
                  <th style="text-align:left">قیمت</th>
                  <th style="text-align:left">کل</th>
                </tr>
              </thead>
              <tbody>${itemsTableRows}</tbody>
            </table>`
              : ""
          }

          <table class="total-table" style="margin-top: 20px;">
            <tr><td>ذیلی مجموعہ</td><td style="text-align:left">Rs ${Number(invoice.subtotal).toLocaleString()}</td></tr>
            <tr><td>رعایت</td><td style="text-align:left">Rs ${Number(invoice.discount_amount).toLocaleString()}</td></tr>
            <tr class="total-row"><td>کل رقم</td><td style="text-align:left">Rs ${Number(invoice.total_amount).toLocaleString()}</td></tr>
            <tr><td>ادا شدہ</td><td style="text-align:left">Rs ${Number(invoice.amount_paid).toLocaleString()}</td></tr>
            <tr><td>باقی رقم</td><td style="text-align:left">Rs ${(invoice.total_amount - invoice.amount_paid).toLocaleString()}</td></tr>
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
    <main dir="ltr" className="min-h-screen flex bg-gray-50 font-sans">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Complete Sidebar Navigation Links */}
      <aside
        className={`w-64 min-h-screen bg-blue-400 p-6 flex flex-col fixed md:h-screen md:sticky md:top-0 md:overflow-y-auto inset-y-0 right-0 z-50 flex-shrink-0 transform transition-transform duration-300 ${
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
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-white/80 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="mt-8 space-y-1 flex-1">
          <p className="text-white/50 text-xs font-medium px-3 mb-2">مینو</p>
          <Link
            href="/"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <LayoutDashboard size={18} /> ڈیش بورڈ
          </Link>
          <Link
            href="/books"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <BookOpen size={18} /> کتب
          </Link>
          <Link
            href="/authors"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <PenLine size={18} /> مصنفین
          </Link>
          <Link
            href="/categories"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <FolderTree size={18} /> زمرے
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <ShoppingCart size={18} /> آرڈرز
          </Link>
          <Link
            href="/customers"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <Users size={18} /> کسٹمرز
          </Link>
          <Link
            href="/invoices"
            className="flex items-center gap-3 p-3 rounded-xl bg-emerald-600 text-white font-medium shadow-md text-sm"
          >
            <Receipt size={18} /> بلز
          </Link>
          <Link
            href="/suppliers"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <Truck size={18} /> سپلائرز
          </Link>
          <Link
            href="/loyalty"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <Gift size={18} /> لائلٹی پوائنٹس
          </Link>
          <Link
            href="/coupons"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <Ticket size={18} /> کوپنز
          </Link>
          <Link
            href="/returns"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <RotateCcw size={18} /> واپسی/خراب
          </Link>
          <Link
            href="/reviews"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <Star size={18} /> ریویوز
          </Link>
          <Link
            href="/low-stock"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <PackageMinus size={18} /> کم سٹاک
          </Link>
          <Link
            href="/expenses"
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <Wallet size={18} /> اخراجات
          </Link>
        </nav>

        <div className="border-t border-white/20 pt-4 space-y-2">
          <button
            onClick={() => {
              document.cookie = "maktaba-auth=; path=/; max-age=0";
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 p-3 rounded-xl w-full text-white/80 hover:bg-white/[0.15] hover:text-white transition text-sm"
          >
            <LogOut size={18} /> لاگ آؤٹ
          </button>
          <p className="text-white/50 text-xs text-center">مكتبہ الزھراء © 2026</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 min-w-0 p-4 md:p-10 pb-28">
        <div className="flex items-center justify-between md:hidden mb-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-bold text-emerald-800">مكتبہ الزھراء</h1>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">بلز</h2>
            <p className="mt-1 text-gray-500 text-sm">کل {invoices.length} بلز</p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm w-full md:w-auto font-medium text-sm"
          >
            <Plus size={18} />
            نیا بل بنائیں
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700 font-medium">کل باقی رقم (غیر ادا شدہ بلز)</p>
          <p className="text-2xl md:text-3xl font-extrabold text-red-800 mt-1">
            Rs {totalOutstanding.toLocaleString()}
          </p>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="بل نمبر یا کسٹمر کا نام تلاش کریں..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-3 pr-11 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm transition"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-gray-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm transition md:w-56"
          >
            <option value="">تمام حالتیں</option>
            <option value="unpaid">غیر ادا شدہ</option>
            <option value="partial">جزوی ادائیگی</option>
            <option value="paid">ادا شدہ</option>
          </select>
        </div>

        {!loaded ? (
          <p className="mt-8 text-gray-500 text-center">لوڈ ہو رہا ہے...</p>
        ) : filteredInvoices.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-5xl mb-3">🧾</span>
            <p className="text-gray-500 text-base">کوئی بل نہیں ملا</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredInvoices.map((inv) => {
              const status = statusLabel(inv.payment_status);
              const balance = inv.total_amount - inv.amount_paid;
              const customerName = getCustomerName(inv);

              return (
                <div
                  key={inv.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-800 text-base" dir="ltr">
                          {inv.invoice_number}
                        </p>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1 text-emerald-800 font-semibold text-sm">
                        👤 کسٹمر: {customerName}
                      </p>
                      <p className="mt-0.5 text-gray-400 text-xs">
                        {new Date(inv.created_at).toLocaleDateString("ur-PK")}
                        {inv.due_date && ` — آخری تاریخ: ${inv.due_date}`}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl md:text-2xl font-extrabold text-emerald-700">
                        Rs {Number(inv.total_amount).toLocaleString()}
                      </p>
                      {balance > 0 && (
                        <p className="text-xs text-red-600 font-medium">
                          باقی: Rs {balance.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {inv.payment_status !== "paid" && (
                        <button
                          onClick={() => handleMarkPaid(inv)}
                          className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-700 hover:bg-emerald-100 transition text-xs font-semibold"
                        >
                          ادا شدہ کریں
                        </button>
                      )}
                      <button
                        onClick={() => handlePrintInvoice(inv)}
                        className="rounded-lg bg-gray-100 p-2.5 text-gray-700 hover:bg-gray-200 transition"
                        title="پرنٹ کریں"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(inv.id)}
                        className="rounded-lg bg-red-50 p-2.5 text-red-600 hover:bg-red-100 transition"
                        title="حذف کریں"
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

      {/* Delete Confirmation Modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <span className="text-4xl">⚠️</span>
            <h3 className="text-lg font-bold text-gray-800 mt-3">
              کیا آپ واقعی یہ بل حذف کرنا چاہتے ہیں؟
            </h3>
            <p className="text-gray-500 text-xs mt-1">یہ عمل واپس نہیں ہو سکتا۔</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 rounded-xl bg-red-600 text-white py-2.5 hover:bg-red-700 transition font-medium text-sm"
              >
                ہاں، حذف کریں
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-2.5 hover:bg-gray-200 transition font-medium text-sm"
              >
                منسوخ کریں
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4">
          <div className="bg-white rounded-2xl p-5 md:p-6 w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">نیا بل بنائیں</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {saveError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs p-3">
                {saveError}
              </div>
            )}

            {/* Customer Selection */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                کسٹمر منتخب کریں (اختیاری)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  if (e.target.value !== "__new__") setWalkInName("");
                }}
                className="w-full rounded-xl border border-gray-300 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              >
                <option value="">عام کسٹمر (نام کے بغیر / واک ان)</option>
                <option value="__new__">+ نیا نام لکھیں</option>
                {Array.isArray(customers) && customers.length > 0 ? (
                  customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name ? c.name : "نام موجود نہیں"} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))
                ) : (
                  <option disabled>کوئی کسٹمر موجود نہیں</option>
                )}
              </select>

              {selectedCustomerId === "__new__" && (
                <input
                  type="text"
                  placeholder="کسٹمر کا نام لکھیں"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  autoFocus
                />
              )}
            </div>

            {/* Green Book Selection Box */}
            <div className="mt-4 bg-emerald-50 border-2 border-emerald-300 p-4 rounded-xl shadow-sm w-full">
              <label className="text-xs font-bold text-emerald-900 mb-2 block">
                📖 کتاب شامل کریں (خودکار حساب و اسٹاک)
              </label>
              <input
                type="text"
                placeholder="کتاب کا نام تلاش کریں..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                className="mb-2 w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <select
                  value={currentBookId}
                  onChange={(e) => setCurrentBookId(e.target.value)}
                  className="flex-1 w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">کتاب منتخب کریں...</option>
                  {books
                    .filter((b) => b.title.toLowerCase().includes(bookSearch.trim().toLowerCase()))
                    .map((b) => (
                      <option key={b.id} value={b.id} disabled={b.stock <= 0}>
                        {b.title} (Rs {b.price} | اسٹاک: {b.stock})
                      </option>
                    ))}
                </select>

                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="number"
                    min="1"
                    value={currentQty}
                    onChange={(e) => setCurrentQty(e.target.value)}
                    className="w-20 rounded-lg border border-gray-300 p-2.5 text-center text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="تعداد"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex-1 sm:flex-none bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-emerald-800 transition shadow-sm whitespace-nowrap"
                  >
                    شامل کریں
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Items List */}
            {selectedItems.length > 0 && (
              <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-2">کتاب</th>
                      <th className="p-2 text-center">تعداد</th>
                      <th className="p-2">قیمت</th>
                      <th className="p-2">کل</th>
                      <th className="p-2 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="p-2 font-medium">{item.title}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2">Rs {item.unit_price}</td>
                        <td className="p-2 font-bold text-emerald-700">Rs {item.total_price}</td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Manual Subtotal Input */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ذیلی مجموعہ (روپے) {selectedItems.length > 0 && "(کتابوں سے بننے والی رقم)"}
              </label>
              <input
                type="number"
                placeholder="مثلاً 1500"
                value={selectedItems.length > 0 ? itemsSubtotal : manualSubtotal}
                disabled={selectedItems.length > 0}
                onChange={(e) => setManualSubtotal(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm font-bold"
              />
            </div>

            {/* Discount */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                رعایت / ڈسکاؤنٹ (روپے)
              </label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>

            {/* Total Highlight */}
            <div className="mt-3 rounded-xl bg-emerald-100 border border-emerald-300 p-3 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-900">کل قابل ادا رقم:</span>
              <span className="font-extrabold text-emerald-900 text-lg">
                Rs {computedTotal.toLocaleString()}
              </span>
            </div>

            {/* Amount Paid */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                وصول شدہ / ادا شدہ رقم (روپے)
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>

            {/* Due Date */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                آخری تاریخ ادائیگی (اختیاری)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition disabled:opacity-60 font-bold text-sm shadow-md"
              >
                {saving ? "محفوظ ہو رہا ہے..." : "نیا بل بنائیں"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition font-medium text-sm"
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