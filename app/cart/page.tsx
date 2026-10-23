"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, Minus, Plus, MessageCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { getCart, removeFromCart, updateQty, clearCart, CartItem } from "@/lib/cart";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCart(getCart());
    setLoaded(true);

    const refresh = () => setCart(getCart());
    window.addEventListener("maktaba-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("maktaba-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);

  const handleQtyChange = (id: string, delta: number) => {
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    updateQty(id, item.qty + delta);
    setCart(getCart());
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
    setCart(getCart());
  };

  const handleClear = () => {
    clearCart();
    setCart([]);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    let message = "السلام علیکم! میں یہ کتابیں خریدنا چاہتا ہوں:\n\n";
    cart.forEach((item, i) => {
      message += `${i + 1}. ${item.title} — مقدار: ${item.qty}`;
      if (item.price) message += ` — قیمت: Rs ${(item.price * item.qty).toLocaleString()}`;
      message += "\n";
    });
    if (total > 0) {
      message += `\nکل مجموعی قیمت: Rs ${total.toLocaleString()}`;
    }
    const url = "https://wa.me/923055232889?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  };

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
            <Link href="/" className="hover:text-emerald-200 transition">
              ہوم
            </Link>
            <Link href="/about" className="hover:text-emerald-200 transition">
              ہمارے بارے میں
            </Link>
            <Link href="/contact" className="hover:text-emerald-200 transition">
              رابطہ
            </Link>
          </nav>
        </div>
      </header>

      {/* مین مواد */}
      <section className="max-w-3xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-emerald-700" size={24} />
            آپ کی ٹوکری
          </h1>
          {cart.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs font-medium text-rose-600 hover:underline"
            >
              ٹوکری خالی کریں
            </button>
          )}
        </div>

        {!loaded ? (
          <div className="py-16 text-center text-gray-400 text-sm">لوڈ ہو رہا ہے...</div>
        ) : cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-6xl mb-4">🛒</span>
            <p className="text-gray-500 text-lg mb-4">آپ کی ٹوکری خالی ہے</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 text-white px-5 py-2.5 hover:bg-emerald-800 transition shadow-sm text-sm font-medium"
            >
              کتابیں دیکھیں <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-4"
                >
                  <div className="w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center border border-amber-200 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="text-amber-300" size={22} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.author}</p>
                    {item.price ? (
                      <p className="text-sm font-bold text-emerald-700 mt-1">Rs {item.price.toLocaleString()}</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-1">قیمت درج نہیں</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 px-1.5 py-1">
                    <button
                      onClick={() => handleQtyChange(item.id, -1)}
                      className="p-1 rounded-md hover:bg-gray-200 text-gray-600 disabled:opacity-30"
                      disabled={item.qty <= 1}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                    <button
                      onClick={() => handleQtyChange(item.id, 1)}
                      className="p-1 rounded-md hover:bg-gray-200 text-gray-600"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* ٹوٹل اور چیک آؤٹ */}
            <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              {total > 0 && (
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-gray-500">کل مجموعی قیمت (تخمینی)</span>
                  <span className="font-extrabold text-lg text-emerald-700">Rs {total.toLocaleString()}</span>
                </div>
              )}
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white py-3 font-semibold hover:bg-[#20BD5A] transition shadow-sm"
              >
                <MessageCircle size={18} />
                واٹس ایپ پر آرڈر مکمل کریں
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-3">
                آرڈر مکمل کرنے کے لیے آپ کو واٹس ایپ پر بھیجا جائے گا جہاں آپ اپنا پتہ اور تفصیلات بتا سکیں گے
              </p>
            </div>
          </>
        )}
      </section>

      {/* فوٹر */}
      <footer className="border-t border-gray-200 bg-white mt-10">
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col items-center gap-3">
          <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-10 w-auto opacity-90" />
          <p className="text-gray-500 text-sm text-center">© 2026 مكتبہ الزھراء. جملہ حقوق محفوظ ہیں۔</p>
        </div>
      </footer>
    </main>
  );
}