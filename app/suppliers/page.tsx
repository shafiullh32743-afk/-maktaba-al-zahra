"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, ShoppingCart,
  Star, PackageMinus, Wallet, Users, Receipt, Truck, Gift, Ticket, RotateCcw,
  Phone, Mail, MapPin, Trash2, Plus,
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

  const fetchSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("*").order("id", { ascending: false });
    if (data) setSuppliers(data as Supplier[]);
    setLoaded(true);
  };

  useEffect(() => {
    fetchSuppliers();
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

  return (
    <main className="min-h-screen flex bg-gray-50">
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden" />
      )}

      <aside className={`w-64 min-h-screen bg-blue-400 p-6 flex flex-col fixed md:static inset-y-0 right-0 z-50 flex-shrink-0 transform transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
              <BookOpen className="text-white" size={20} />
            </div>
            <h1 className="text-lg font-bold text-white">مكتبہ الزھراء</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-white/80 hover:text-white"><X size={22} /></button>
        </div>

        <nav className="mt-10 space-y-1.5 flex-1">
          <p className="text-white/50 text-xs font-medium px-3 mb-2">مینو</p>
          <Link href="/" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><LayoutDashboard size={19} /> ڈیش بورڈ</Link>
          <Link href="/books" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><BookOpen size={19} /> کتب</Link>
          <Link href="/authors" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><PenLine size={19} /> مصنفین</Link>
          <Link href="/categories" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><FolderTree size={19} /> زمرے</Link>
          <Link href="/orders" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><ShoppingCart size={19} /> آرڈرز</Link>
          <Link href="/customers" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Users size={19} /> کسٹمرز</Link>
          <Link href="/invoices" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Receipt size={19} /> رسیدیں</Link>
          <Link href="/suppliers" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md"><Truck size={19} /> سپلائرز</Link>
          <Link href="/loyalty" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Gift size={19} /> لائلٹی پوائنٹس</Link>
          <Link href="/coupons" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Ticket size={19} /> کوپنز</Link>
          <Link href="/returns" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><RotateCcw size={19} /> واپسی/خراب</Link>
          <Link href="/reviews" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Star size={19} /> ریویوز</Link>
          <Link href="/low-stock" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><PackageMinus size={19} /> کم سٹاک</Link>
          <Link href="/expenses" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Wallet size={19} /> اخراجات</Link>
        </nav>

        <div className="border-t border-white/20 pt-4 space-y-3">
          <button onClick={() => { document.cookie = "maktaba-auth=; path=/; max-age=0"; window.location.href = "/login"; }} className="flex items-center gap-3 p-3 rounded-xl w-full text-white/80 hover:bg-white/[0.15] hover:text-white transition">
            <LogOut size={19} /> لاگ آؤٹ
          </button>
          <p className="text-white/50 text-xs text-center">مكتبہ الزھراء © 2026</p>
        </div>
      </aside>

      <section className="flex-1 min-w-0 p-5 md:p-10">
        <div className="flex items-center justify-between md:hidden mb-4">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm"><Menu size={22} /></button>
          <h1 className="text-lg font-bold text-emerald-800">مكتبہ الزھراء</h1>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">سپلائرز</h2>
            <p className="mt-2 text-gray-500">کل {suppliers.length} سپلائرز</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm w-full md:w-auto">
            <Plus size={18} /> نیا سپلائر شامل کریں
          </button>
        </div>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : suppliers.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">🚚</span>
            <p className="text-gray-500 text-lg">ابھی کوئی سپلائر شامل نہیں</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((s) => (
              <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition">
                <h3 className="text-lg font-bold text-gray-800">{s.name}</h3>
                {s.contact_person && <p className="mt-1 text-gray-500 text-sm">رابطہ: {s.contact_person}</p>}
                {s.phone && <p className="mt-2 flex items-center gap-2 text-sm text-gray-600" dir="ltr"><Phone size={14} className="text-gray-400" /> {s.phone}</p>}
                {s.email && <p className="mt-1 flex items-center gap-2 text-sm text-gray-600" dir="ltr"><Mail size={14} className="text-gray-400" /> {s.email}</p>}
                {s.address && <p className="mt-1 flex items-start gap-2 text-sm text-gray-600"><MapPin size={14} className="text-gray-400 mt-0.5" /> {s.address}</p>}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEditModal(s)} className="flex-1 rounded-lg bg-amber-50 px-3 py-2 text-amber-700 hover:bg-amber-100 transition text-sm">ترمیم</button>
                  <button onClick={() => setConfirmDeleteId(s.id)} className="rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 transition"><Trash2 size={16} /></button>
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
            <h3 className="text-lg font-bold text-gray-800 mt-4">کیا آپ واقعی یہ سپلائر حذف کرنا چاہتے ہیں؟</h3>
            <div className="mt-6 flex gap-3">
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 rounded-xl bg-red-600 text-white py-3 hover:bg-red-700 transition">ہاں، حذف کریں</button>
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition">منسوخ کریں</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800">{editingId ? "سپلائر میں ترمیم" : "نیا سپلائر شامل کریں"}</h3>
            {saveError && <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{saveError}</div>}
            <input type="text" placeholder="سپلائر کا نام" value={name} onChange={(e) => setName(e.target.value)} className="mt-5 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            <input type="text" placeholder="رابطہ کار کا نام" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            <input type="tel" placeholder="فون نمبر" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="mt-3 w-full rounded-xl border border-gray-200 p-3 text-left focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            <input type="email" placeholder="ای میل (اختیاری)" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="mt-3 w-full rounded-xl border border-gray-200 p-3 text-left focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            <textarea placeholder="پتہ (اختیاری)" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none" />
            <textarea placeholder="نوٹس (اختیاری)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none" />
            <div className="mt-6 flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition disabled:opacity-60">{saving ? "محفوظ ہو رہا ہے..." : editingId ? "محفوظ کریں" : "شامل کریں"}</button>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition">منسوخ کریں</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
