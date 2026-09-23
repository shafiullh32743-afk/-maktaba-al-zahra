"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard, BookOpen, PenLine, FolderTree, LogOut, Menu, X, ShoppingCart,
  Star, PackageMinus, Wallet, Users, Receipt, Truck, Gift, Ticket, RotateCcw,
  Plus, Trash2, Copy,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  valid_until?: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [usageLimit, setUsageLimit] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCoupons = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (data) setCoupons(data as Coupon[]);
    setLoaded(true);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setCode("");
    setDescription("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrderAmount("0");
    setUsageLimit("");
    setValidUntil("");
    setSaveError(null);
  };

  const handleSave = async () => {
    if (code.trim() === "" || !discountValue) return;
    setSaving(true);
    setSaveError(null);

    const couponData = {
      code: code.trim().toUpperCase(),
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      min_order_amount: parseFloat(minOrderAmount) || 0,
      usage_limit: usageLimit ? parseInt(usageLimit) : null,
      valid_until: validUntil || null,
      is_active: true,
    };

    const { error } = await supabase.from("coupons").insert(couponData);

    if (error) {
      setSaveError(`محفوظ نہیں ہو سکا: ${error.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowModal(false);
    resetForm();
    fetchCoupons();
  };

  const toggleActive = async (coupon: Coupon) => {
    await supabase.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    setConfirmDeleteId(null);
    fetchCoupons();
  };

  const handleCopy = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
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
          <Link href="/suppliers" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Truck size={19} /> سپلائرز</Link>
          <Link href="/loyalty" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition"><Gift size={19} /> لائلٹی پوائنٹس</Link>
          <Link href="/coupons" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md"><Ticket size={19} /> کوپنز</Link>
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">کوپنز</h2>
            <p className="mt-2 text-gray-500">ڈسکاؤنٹ کوڈز بنائیں اور منظم کریں</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm w-full md:w-auto">
            <Plus size={18} /> نیا کوپن بنائیں
          </button>
        </div>

        {!loaded ? (
          <p className="mt-8 text-gray-500">لوڈ ہو رہا ہے...</p>
        ) : coupons.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">🎟️</span>
            <p className="text-gray-500 text-lg">ابھی کوئی کوپن نہیں بنایا گیا</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((c) => (
              <div key={c.id} className={`rounded-2xl border p-6 shadow-sm transition ${c.is_active ? "border-emerald-200 bg-white" : "border-gray-200 bg-gray-50 opacity-70"}`}>
                <div className="flex items-center justify-between">
                  <button onClick={() => handleCopy(c.code)} className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 border-dashed px-3 py-1.5 font-mono font-bold text-emerald-700" dir="ltr">
                    {c.code} <Copy size={14} />
                  </button>
                  {copiedCode === c.code && <span className="text-xs text-emerald-600">کاپی ہو گیا!</span>}
                </div>

                <p className="mt-3 text-2xl font-extrabold text-gray-800">
                  {c.discount_type === "percentage" ? `${c.discount_value}%` : `Rs ${c.discount_value}`} رعایت
                </p>
                {c.description && <p className="mt-1 text-gray-500 text-sm">{c.description}</p>}
                {c.min_order_amount ? <p className="mt-1 text-xs text-gray-400">کم از کم آرڈر: Rs {c.min_order_amount}</p> : null}
                <p className="mt-1 text-xs text-gray-400">
                  استعمال: {c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </p>
                {c.valid_until && <p className="mt-1 text-xs text-gray-400">میعاد: {c.valid_until}</p>}

                <div className="mt-4 flex gap-2">
                  <button onClick={() => toggleActive(c)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${c.is_active ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                    {c.is_active ? "غیر فعال کریں" : "فعال کریں"}
                  </button>
                  <button onClick={() => setConfirmDeleteId(c.id)} className="rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 transition"><Trash2 size={16} /></button>
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
            <h3 className="text-lg font-bold text-gray-800 mt-4">کیا آپ واقعی یہ کوپن حذف کرنا چاہتے ہیں؟</h3>
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
            <h3 className="text-xl font-bold text-gray-800">نیا کوپن بنائیں</h3>
            {saveError && <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{saveError}</div>}

            <input type="text" placeholder="کوپن کوڈ (مثلاً EID2026)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} dir="ltr" className="mt-5 w-full rounded-xl border border-gray-200 p-3 text-left font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600" />

            <input type="text" placeholder="تفصیل (اختیاری)" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-3 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" />

            <div className="mt-3 flex gap-3">
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")} className="flex-1 rounded-xl border border-gray-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600">
                <option value="percentage">فیصد (%)</option>
                <option value="fixed">مقررہ رقم (Rs)</option>
              </select>
              <input type="number" placeholder={discountType === "percentage" ? "مثلاً 10" : "مثلاً 100"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="flex-1 rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </div>

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">کم از کم آرڈر رقم (اختیاری)</span>
              <input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </label>

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">استعمال کی حد (اختیاری)</span>
              <input type="number" placeholder="لامحدود کے لیے خالی چھوڑیں" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </label>

            <label className="mt-3 block">
              <span className="text-xs text-gray-500">میعاد ختم ہونے کی تاریخ (اختیاری)</span>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </label>

            <div className="mt-6 flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition disabled:opacity-60">{saving ? "محفوظ ہو رہا ہے..." : "کوپن بنائیں"}</button>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition">منسوخ کریں</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
