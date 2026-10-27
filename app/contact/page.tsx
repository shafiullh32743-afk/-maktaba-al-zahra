"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, MessageCircle, ShoppingCart } from "lucide-react";
import { getCartCount } from "@/lib/cart";

export default function ContactPage() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCartCount(getCartCount());
    refresh();
    window.addEventListener("maktaba-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("maktaba-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const whatsappUrl =
    "https://wa.me/923055232889?text=" +
    encodeURIComponent("السلام علیکم! مجھے مكتبہ الزھراء سے متعلق معلومات چاہییں۔");

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 font-sans">
      {/* ہیڈر */}
      <header className="bg-emerald-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-10 w-auto rounded-md" />
            <span className="text-lg font-bold">مكتبہ الزھراء</span>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/shop" className="hover:text-emerald-200 transition">
              کتب
            </Link>
                        <Link href="/about" className="hover:text-emerald-200 transition">
              ہمارے بارے میں
            </Link>
            <Link href="/contact" className="text-emerald-200">
              رابطہ
            </Link>
                        <Link
              href="/cart"
                           className="relative flex items-center justify-center rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition p-2"
            >
              <ShoppingCart size={17} className="text-orange-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-emerald-800">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {/* مین مواد */}
      <section className="max-w-3xl mx-auto px-5 py-12">
        <div className="flex flex-col items-center text-center mb-10">
          <img
            src="/logo.jpg"
            alt="مكتبہ الزھراء"
            className="h-28 w-auto rounded-xl shadow-md mb-5"
          />
          <h1 className="text-3xl font-bold text-emerald-900">ہم سے رابطہ کریں</h1>
          <p className="text-gray-500 mt-2">کسی بھی سوال یا آرڈر کے لیے رابطہ کریں</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <a
            href="tel:+923055232889"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition"
          >
            <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Phone className="text-emerald-700" size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">فون نمبر</p>
              <p className="font-bold text-gray-800" dir="ltr">
                0305-5232889
              </p>
            </div>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition"
          >
            <div className="w-12 h-12 shrink-0 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
              <MessageCircle className="text-[#25D366]" size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">واٹس ایپ</p>
              <p className="font-bold text-gray-800" dir="ltr">
                0305-5232889
              </p>
            </div>
          </a>

          <a
            href="mailto:maktabaalzahra32@gmail.com"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition"
          >
            <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Mail className="text-emerald-700" size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">ای میل</p>
              <p className="font-bold text-gray-800 break-all">maktabaalzahra32@gmail.com</p>
            </div>
          </a>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MapPin className="text-emerald-700" size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">پتہ</p>
              <p className="font-bold text-gray-800">نزد جامعہ الحسنین، فیصل آباد</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] text-white px-6 py-3 hover:bg-[#20BD5A] transition shadow-sm font-medium"
          >
            <MessageCircle size={18} />
            واٹس ایپ پر پیغام بھیجیں
          </a>
        </div>
      </section>

      {/* فوٹر */}
      <footer className="border-t border-gray-200 bg-white mt-10">
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col items-center gap-3">
          <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-10 w-auto opacity-90" />
          <p className="text-gray-500 text-sm text-center">
            © 2026 مكتبہ الزھراء. جملہ حقوق محفوظ ہیں۔
          </p>
        </div>
      </footer>
    </main>
  );
}
