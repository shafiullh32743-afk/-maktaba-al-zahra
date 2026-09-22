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
  Search,
  Phone,
  Mail,
  MapPin,
  Gift,
  Trash2,
  Plus,
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

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) setCustomers(data as Customer[]);
    setLoaded(true);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const term = search.trim().toLowerCase();
    if (term === "") return true;
    return (
      c.name.toLowerCase().includes(term) ||
      (c.phone || "").includes(term) ||
      (c.whatsapp_number || "").includes(term)
    );
  });

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
          <Link href="/customers" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md">
            <Users size={19} /> کسٹمرز
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">کسٹمرز</h2>
            <p className="mt-2 text-gray-500">کل {customers.length} کسٹمرز</p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm w-full md:w-auto"
          >
            <Plus size={18} />
            نیا کسٹمر شامل کریں
          </button>
        </div>

        <div className="mt-6 relative">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="نام یا فون نمبر سے تلاش کریں..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-4 pr-11 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
          />
        </div>

        {!loaded ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
                <div className="h-5 w-2/3 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded mt-3" />
                <div className="h-4 w-1/3 bg-gray-200 rounded mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <span className="text-6xl mb-4">👥</span>
                <p className="text-gray-500 text-lg">کوئی کسٹمر نہیں ملا</p>
                <p className="text-gray-400 text-sm mt-1">نیا کسٹمر شامل کریں</p>
              </div>
            )}

            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700">
                    <Gift size={13} />
                    {c.loyalty_points ?? 0} پوائنٹس
                  </div>
                </div>

                <h3 className="mt-4 text-lg font-bold text-gray-800">{c.name}</h3>

                {c.phone && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-gray-600" dir="ltr">
                    <Phone size={14} className="text-gray-400" /> {c.phone}
                  </p>
                )}
                {c.email && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-600" dir="ltr">
                    <Mail size={14} className="text-gray-400" /> {c.email}
                  </p>
                )}
                {c.address && (
                  <p className="mt-1 flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" /> {c.address}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2">
                  <span className="text-xs text-emerald-600">کل خریداری</span>
                  <span className="font-bold text-emerald-700">
                    Rs {Number(c.total_spent ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openEditModal(c)}
                    className="flex-1 rounded-lg bg-amber-50 px-3 py-2 text-amber-700 hover:bg-amber-100 transition text-sm"
                  >
                    ترمیم
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(c.id)}
                    className="rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <span className="text-5xl">⚠️</span>
            <h3 className="text-lg font-bold text-gray-800 mt-4">کیا آپ واقعی یہ کسٹمر حذف کرنا چاہتے ہیں؟</h3>
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
            <h3 className="text-xl font-bold text-gray-800">
              {editingId ? "کسٹمر میں ترمیم کریں" : "نیا کسٹمر شامل کریں"}
            </h3>

            {saveError && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">
                {saveError}
              </div>
            )}

            <input
              type="text"
              placeholder="کسٹمر کا نام"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-5 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <input
              type="tel"
              placeholder="فون نمبر"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              dir="ltr"
              className="mt-3 w-full rounded-xl border border-gray-200 p-3 text-left focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <input
              type="tel"
              placeholder="واٹس ایپ نمبر (اگر مختلف ہو)"
              value={newWhatsapp}
              onChange={(e) => setNewWhatsapp(e.target.value)}
              dir="ltr"
              className="mt-3 w-full rounded-xl border border-gray-200 p-3 text-left focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <input
              type="email"
              placeholder="ای میل (اختیاری)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              dir="ltr"
              className="mt-3 w-full rounded-xl border border-gray-200 p-3 text-left focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <textarea
              placeholder="پتہ (اختیاری)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              rows={2}
              className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">تاریخ پیدائش (اختیاری)</span>
              <input
                type="date"
                value={newDob}
                onChange={(e) => setNewDob(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </label>

            <textarea
              placeholder="نوٹس (اختیاری)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={2}
              className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition disabled:opacity-60"
              >
                {saving ? "محفوظ ہو رہا ہے..." : editingId ? "محفوظ کریں" : "شامل کریں"}
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
