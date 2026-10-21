"use client";

import Link from "next/link";
import { BookOpen, Heart, Target, Users } from "lucide-react";

export default function AboutPage() {
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
            <Link href="/" className="hover:text-emerald-200 transition">
              ہوم
            </Link>
            <Link href="/shop" className="hover:text-emerald-200 transition">
              کتب
            </Link>
            <Link href="/about" className="text-emerald-200">
              ہمارے بارے میں
            </Link>
            <Link href="/contact" className="hover:text-emerald-200 transition">
              رابطہ
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
          <h1 className="text-3xl font-bold text-emerald-900">ہمارے بارے میں</h1>
          <p className="text-gray-500 mt-2">مكتبہ الزھراء — علم کا سفر، آپ کے قریب</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 md:p-10 space-y-6 text-gray-700 leading-loose">
          <p>
            مكتبہ الزھراء ایک اسلامی کتب خانہ ہے جو دینی، علمی اور تعلیمی کتب فراہم کرنے کے
            لیے کام کر رہا ہے۔ ہماری کوشش ہے کہ ہر طالب علم اور قاری تک معیاری اور مستند
            کتابیں آسانی اور کم قیمت پر پہنچیں۔
          </p>
          <p>
            ہم فیصل آباد میں واقع ہیں اور مقامی و دور دراز گاہکوں کو ڈیلیوری کی سہولت فراہم
            کرتے ہیں تاکہ علم کا یہ سفر ہر گھر تک پہنچ سکے۔
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center">
              <BookOpen className="text-emerald-700" size={22} />
            </div>
            <h3 className="font-bold text-gray-800 mt-4">معیاری کتب</h3>
            <p className="text-sm text-gray-500 mt-1.5">مستند اور معیاری دینی و علمی کتابیں</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center">
              <Target className="text-emerald-700" size={22} />
            </div>
            <h3 className="font-bold text-gray-800 mt-4">ہمارا مقصد</h3>
            <p className="text-sm text-gray-500 mt-1.5">علم کو ہر گھر تک آسانی سے پہنچانا</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center">
              <Heart className="text-emerald-700" size={22} />
            </div>
            <h3 className="font-bold text-gray-800 mt-4">خدمت کا جذبہ</h3>
            <p className="text-sm text-gray-500 mt-1.5">ہر گاہک کی دیانتداری سے خدمت</p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 text-white px-6 py-3 hover:bg-emerald-800 transition shadow-sm"
          >
            <Users size={18} />
            ہم سے رابطہ کریں
          </Link>
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

