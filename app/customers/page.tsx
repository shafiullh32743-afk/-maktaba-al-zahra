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
  Search,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Plus,
  Edit2,
  ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Customer {
  id: number;
  name: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  loyalty_points?: number;
  total_spent?: number;
  notes?: string;
  created_at?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newDob, setNewDob] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"new" | "name" | "points" | "dues" | "spent">("new");
  const [onlyDues, setOnlyDues] = useState(false);
  const [custInvoices, setCustInvoices] = useState<{ customer_id: number; total_amount: number; amount_paid: number | null; payment_status: string | null }[]>([]);

  const fetchCustomers = async () => {
    setLoaded(false);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) setCustomers(data as Customer[]);
    setLoaded(true);
  };

  useEffect(() => {
    fetchCustomers();
    supabase
      .from("invoices")
      .select("customer_id, total_amount, amount_paid, payment_status")
      .then(({ data }) => {
        if (data) setCustInvoices(data as typeof custInvoices);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ہر کسٹمر کی کل خریداری اور بقایا
  const money = new Map<number, { spent: number; due: number }>();
  custInvoices.forEach((i) => {
    if (i.customer_id == null) return;
    const cur = money.get(i.customer_id) || { spent: 0, due: 0 };
    const total = Number(i.total_amount) || 0;
    cur.spent += total;
    if (i.payment_status !== "paid") cur.due += Math.max(0, total - (Number(i.amount_paid) || 0));
    money.set(i.customer_id, cur);
  });
  const waLink = (phone?: string) => {
    let d = (phone || "").replace(/\D/g, "");
    if (d.startsWith("0")) d = "92" + d.slice(1);
    return d ? `https://wa.me/${d}` : "";
  };
  const exportCsv = () => {
    const rows = [["نام", "فون", "واٹس ایپ", "پتہ", "پوائنٹس", "کل خریداری", "بقایا"]].concat(
      customers.map((c) => [
        c.name,
        c.phone || "",
        c.whatsapp_number || "",
        (c.address || "").replace(/\n/g, " "),
        String(c.loyalty_points ?? 0),
        String(Math.round(money.get(c.id)?.spent || 0)),
        String(Math.round(money.get(c.id)?.due || 0)),
      ])
    );
    const csv = "\uFEFF" + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "customers.csv";
    a.click();
  };
  const totalDues = Array.from(money.values()).reduce((s2, v) => s2 + v.due, 0);
  const duesCount = Array.from(money.values()).filter((v) => v.due > 0).length;
  const totalPoints = customers.reduce((s2, c) => s2 + (c.loyalty_points ?? 0), 0);

  const filteredCustomersRaw = customers.filter((c) => {
    const term = search.trim().toLowerCase();
    if (term === "") return true;
    return (
      c.name.toLowerCase().includes(term) ||
      (c.phone || "").includes(term) ||
      (c.whatsapp_number || "").includes(term)
    );
  });

  const filteredCustomers = (() => {
    let arr = filteredCustomersRaw.filter((c) => !onlyDues || (money.get(c.id)?.due || 0) > 0);
    arr = [...arr];
    if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name, "ur"));
    else if (sortBy === "points") arr.sort((a, b) => (b.loyalty_points ?? 0) - (a.loyalty_points ?? 0));
    else if (sortBy === "dues") arr.sort((a, b) => (money.get(b.id)?.due || 0) - (money.get(a.id)?.due || 0));
    else if (sortBy === "spent") arr.sort((a, b) => (money.get(b.id)?.spent || 0) - (money.get(a.id)?.spent || 0));
    return arr;
  })();

  const resetForm = () => {
    setEditingId(null);
    setNewName("");
    setNewPhone("");
    setNewWhatsapp("");
    setNewEmail("");
    setNewAddress("");
    setNewDob("");
    setNewNotes("");
    setSaveError(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingId(c.id);
    setNewName(c.name);
    setNewPhone(c.phone || "");
    setNewWhatsapp(c.whatsapp_number || "");
    setNewEmail(c.email || "");
    setNewAddress(c.address || "");
    setNewDob(c.date_of_birth || "");
    setNewNotes(c.notes || "");
    setSaveError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (newName.trim() === "") return;
    setSaving(true);
    setSaveError(null);

    const customerData = {
      name: newName.trim(),
      phone: newPhone.trim() || null,
      whatsapp_number: newWhatsapp.trim() || null,
      email: newEmail.trim() || null,
      address: newAddress.trim() || null,
      date_of_birth: newDob || null,
      notes: newNotes.trim() || null,
    };

    const { error } = editingId
      ? await supabase.from("customers").update(customerData).eq("id", editingId)
      : await supabase.from("customers").insert(customerData);

    if (error) {
      setSaveError(`محفوظ نہیں ہو سکا: ${error.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowModal(false);
    resetForm();
    fetchCustomers();
  };

  const handleDelete = async (id: number) => {
    await supabase.from("customers").delete().eq("id", id);
    setConfirmDeleteId(null);
    fetchCustomers();
  };

  const menuItems = [
    { href: "/", label: "ڈیش بورڈ", icon: LayoutDashboard },
    { href: "/books", label: "کتب", icon: BookOpen },
    { href: "/authors", label: "مصنفین", icon: PenLine },
    { href: "/categories", label: "زمرے", icon: FolderTree },
    { href: "/orders", label: "آرڈرز", icon: ShoppingCart },
    { href: "/customers", label: "کسٹمرز", icon: Users, active: true },
    { href: "/invoices", label: "بل / انوائس", icon: Receipt },
    { href: "/suppliers", label: "سپلائرز", icon: Truck },
    { href: "/returns", label: "واپسی/خراب", icon: RotateCcw },
    { href: "/reviews", label: "ریویوز", icon: Star },
    { href: "/low-stock", label: "کم سٹاک", icon: PackageMinus },
    { href: "/expenses", label: "اخراجات", icon: Wallet },
  ];

  return (
    <main dir="rtl" className="min-h-screen flex bg-gradient-to-b from-emerald-50/70 via-slate-50 to-slate-50 font-sans">
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
            <img src="/logo.jpg" alt="logo" className="w-9 h-9 rounded-2xl object-cover ring-2 ring-emerald-200" />
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
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-colors ${
                  item.active
                    ? "bg-emerald-50 text-emerald-700 shadow-[0_2px_14px_rgba(15,23,42,0.05)]"
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
        <div className="flex items-center justify-between md:hidden mb-4 bg-white p-3 rounded-3xl border border-slate-100 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
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
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">کسٹمرز 👥</h2>
            <p className="text-xs text-slate-500 mt-0.5">تمام کسٹمرز اور ان کی تفصیلات کی فہرست</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="کسٹمر یا فون تلاش کریں..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 rounded-xl border border-slate-100 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-[0_2px_14px_rgba(15,23,42,0.05)]"
              />
            </div>

            {/* Add Customer Button */}
            <button
              onClick={openAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 text-white text-xs font-semibold hover:opacity-90 transition shadow-[0_2px_14px_rgba(15,23,42,0.05)]"
            >
              <Plus size={15} />
              <span>نیا کسٹمر</span>
            </button>
          </div>
        </div>

        {/* خلاصہ */}
        <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["👥", "کل کسٹمرز", String(customers.length), "bg-emerald-50 text-emerald-600"],
            ["💰", "کل بقایا وصولی", "Rs " + Math.round(totalDues).toLocaleString("en-US"), "bg-rose-50 text-rose-500"],
            ["⏳", "بقایا والے کسٹمرز", String(duesCount), "bg-amber-50 text-amber-600"],
            ["🎁", "کل لائلٹی پوائنٹس", totalPoints.toLocaleString("en-US"), "bg-violet-50 text-violet-600"],
          ].map(([ic, lb, vl, tone]) => (
            <div key={lb} className="rounded-3xl border border-slate-100 bg-white p-3.5 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
              <span className={`inline-flex w-9 h-9 items-center justify-center rounded-2xl ${tone}`}>{ic}</span>
              <p className="mt-2 text-base font-extrabold text-slate-900 truncate" dir="ltr" style={{ textAlign: "right" }}>{vl}</p>
              <p className="text-[11px] text-slate-400">{lb}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-[11px] font-medium shadow-[0_2px_14px_rgba(15,23,42,0.05)]"
          >
            <option value="new">ترتیب: نئے پہلے</option>
            <option value="name">نام کے مطابق</option>
            <option value="spent">سب سے زیادہ خریداری</option>
            <option value="dues">سب سے زیادہ بقایا</option>
            <option value="points">سب سے زیادہ پوائنٹس</option>
          </select>
          <button
            onClick={() => setOnlyDues((v) => !v)}
            className={`px-3 py-2 rounded-xl text-[11px] font-semibold border transition ${onlyDues ? "bg-rose-500 text-white border-rose-500" : "bg-white border-slate-100 text-slate-500"}`}
          >
            صرف بقایا والے
          </button>
          <button
            onClick={exportCsv}
            className="px-3 py-2 rounded-xl text-[11px] font-semibold border border-slate-100 bg-white text-slate-500 hover:bg-emerald-50 transition"
          >
            ⬇ فہرست ایکسل (CSV) میں
          </button>
          <span className="text-[11px] text-slate-400">{filteredCustomers.length} کسٹمرز</span>
        </div>

        {/* Customer Cards Grid */}
        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-3xl border border-slate-100 bg-white p-4 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredCustomers.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
                کوئی کسٹمر نہیں ملا
              </div>
            )}

            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-100 p-4 flex flex-col justify-between shadow-[0_2px_14px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:shadow-lg transition-all group relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-md transition"
                      title="ترمیم کریں"
                    >
                      <Edit2 size={14} />
                    </button>

                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                      <Users size={12} className="text-emerald-600" />
                      <span>{c.loyalty_points ?? 0} پوائنٹس</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-9 h-9 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-100 to-sky-100 text-emerald-700 flex items-center justify-center text-sm font-extrabold">
                      {c.name.trim().charAt(0)}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition">
                      {c.name}
                    </h3>
                  </div>
                  {(money.get(c.id)?.spent || 0) > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-sky-50 text-sky-700">
                        خریداری Rs {Math.round(money.get(c.id)!.spent).toLocaleString("en-US")}
                      </span>
                      {(money.get(c.id)?.due || 0) > 0 && (
                        <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-rose-50 text-rose-600">
                          بقایا Rs {Math.round(money.get(c.id)!.due).toLocaleString("en-US")}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    {c.phone && (
                      <p className="flex items-center gap-2" dir="ltr">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span>{c.phone}</span>
                      </p>
                    )}
                    {c.whatsapp_number && (
                      <p className="flex items-center gap-2 text-emerald-600" dir="ltr">
                        <span className="text-[10px] font-bold">WA:</span>
                        <span>{c.whatsapp_number}</span>
                      </p>
                    )}
                    {c.address && (
                      <p className="flex items-start gap-2">
                        <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{c.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex gap-1.5">
                  {waLink(c.whatsapp_number || c.phone) && (
                    <a
                      href={waLink(c.whatsapp_number || c.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center rounded-xl bg-emerald-50 text-emerald-700 py-1.5 text-[11px] font-bold hover:bg-emerald-100 transition"
                    >
                      واٹس ایپ
                    </a>
                  )}
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="flex-1 text-center rounded-xl bg-sky-50 text-sky-700 py-1.5 text-[11px] font-bold hover:bg-sky-100 transition"
                    >
                      کال
                    </a>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <button onClick={() => openEditModal(c)} className="flex items-center gap-1 hover:underline">
                    تمام تفصیلات دیکھیں
                  </button>
                  <ArrowUpRight size={13} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 w-full max-w-sm shadow-xl text-center relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800">کسٹمر حذف کریں؟</h3>
            <p className="text-slate-500 text-xs mt-1.5">کیا آپ واقعی اس کسٹمر کا ریکارڈ ختم کرنا چاہتے ہیں؟</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 rounded-xl bg-rose-600 text-white py-1.5 text-xs font-semibold hover:bg-rose-700 transition"
              >
                حذف کریں
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl border border-slate-100 text-slate-600 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 w-full max-w-md shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4">
              {editingId ? "کسٹمر کی معلومات ترمیم کریں" : "نیا کسٹمر درج کریں"}
            </h3>

            {saveError && (
              <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">
                {saveError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">نام</label>
                <input
                  type="text"
                  placeholder="کسٹمر کا نام"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-100 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">فون نمبر</label>
                  <input
                    type="tel"
                    placeholder="03001234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    dir="ltr"
                    className="w-full rounded-xl border border-slate-100 p-2 text-xs text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">واٹس ایپ</label>
                  <input
                    type="tel"
                    placeholder="03001234567"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    dir="ltr"
                    className="w-full rounded-xl border border-slate-100 p-2 text-xs text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ای میل (اختیاری)</label>
                <input
                  type="email"
                  placeholder="email@domain.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-100 p-2 text-xs text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">پتہ (اختیاری)</label>
                <textarea
                  placeholder="مکمل پتہ"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-100 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setShowModal(false);
                    setConfirmDeleteId(editingId);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition"
                >
                  حذف کریں
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}