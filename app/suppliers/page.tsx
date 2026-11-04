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
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

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
  id: number;
  title: string;
  author?: string;
  price?: number;
  stock?: number;
}

interface SupplierBookLink {
  supplier_id: number;
  book_id: number;
}

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
  if (digits.startsWith("0")) digits = "92" + digits.slice(1);
  return digits;
}

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
  const [orderTab, setOrderTab] = useState<"order" | "list">("order");
  const [qtyMap, setQtyMap] = useState<Record<number, string>>({});
  const [bookSearch, setBookSearch] = useState("");

  const fetchBooksAndLinks = async () => {
    const { data: booksData } = await supabase.from("books").select("id, title, author, price, stock").order("title", { ascending: true });
    if (booksData) setAllBooks(booksData as BookLite[]);
    const { data: linkData, error } = await supabase.from("supplier_books").select("supplier_id, book_id");
    if (error) {
      setLinksError("سپلائر کی کتب کا ٹیبل نہیں ملا۔ Supabase میں supplier_books ٹیبل بنائیں۔");
    } else {
      setLinksError(null);
      setLinks((linkData || []) as SupplierBookLink[]);
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

  const openOrder = (s: Supplier, tab: "order" | "list") => {
    setOrderSupplier(s);
    setOrderTab(tab);
    setQtyMap({});
    setBookSearch("");
  };

  const sendOrder = () => {
    if (!orderSupplier) return;
    const lines = supplierBooks(orderSupplier.id)
      .map((b) => ({ b, qty: parseInt(qtyMap[b.id] || "0", 10) || 0 }))
      .filter((x) => x.qty > 0);
    if (lines.length === 0) {
      alert("کم از کم ایک کتاب کی تعداد لکھیں");
      return;
    }
    const text =
      `السلام علیکم${orderSupplier.contact_person ? " " + orderSupplier.contact_person : ""}،\n` +
      `مکتبہ الزھراء کی طرف سے آرڈر:\n\n` +
      lines.map((x, i) => `${i + 1}. ${x.b.title} — ${x.qty} عدد`).join("\n") +
      `\n\nشکریہ`;
    const number = toWhatsappNumber(orderSupplier.phone);
    const url = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
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
            </div>

            {orderTab === "order" ? (
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
                if (mine.length === 0) {
                  return (
                    <p className="text-xs text-slate-500 text-center py-8">
                      اس سپلائر کی کوئی کتاب شامل نہیں۔ پہلے "کتب کی فہرست" میں کتابیں چنیں۔
                    </p>
                  );
                }
                return (
                  <div>
                    {needed.length > 0 ? (
                      <>
                        <p className="text-[11px] font-bold text-rose-600 mb-1">کم یا ختم کتب</p>
                        {needed.map(renderRow)}
                      </>
                    ) : (
                      <p className="text-xs text-emerald-600 mb-2">اس سپلائر کی کوئی کتاب کم یا ختم نہیں ہے ✅</p>
                    )}
                    {others.length > 0 && (
                      <>
                        <p className="text-[11px] font-bold text-slate-500 mt-4 mb-1">باقی کتب</p>
                        {others.map(renderRow)}
                      </>
                    )}
                    <button
                      onClick={sendOrder}
                      className="mt-4 w-full rounded-lg bg-emerald-600 text-white py-2 text-xs font-bold hover:bg-emerald-700 transition"
                    >
                      آرڈر واٹس ایپ پر بھیجیں
                    </button>
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
                const visible = allBooks.filter(
                  (b) =>
                    term === "" ||
                    b.title.toLowerCase().includes(term) ||
                    (b.author || "").toLowerCase().includes(term)
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
    </main>
  );
}