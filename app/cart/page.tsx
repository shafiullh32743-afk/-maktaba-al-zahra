"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, Minus, Plus, MessageCircle, ShoppingBag, ShoppingCart, ArrowRight, MapPin, CreditCard, Globe, Moon, Sun, Phone } from "lucide-react";
import { getCart, removeFromCart, updateQty, clearCart, CartItem } from "@/lib/cart";

export default function CartPage() {
  const [lang, setLang] = useState<"ur" | "en">("ur");
  const [darkMode, setDarkMode] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "advance">("cod");

  useEffect(() => {
    const saved = localStorage.getItem("maktaba-dark-mode");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("maktaba-dark-mode", darkMode ? "true" : "false");
  }, [darkMode]);

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

  const t = {
    ur: {
      navBooks: "کتب",
      navHome: "ہوم",
      navAbout: "ہمارے بارے میں",
      navContact: "رابطہ",
      cartTitle: "آپ کی ٹوکری",
      clearCart: "ٹوکری خالی کریں",
      emptyCart: "آپ کی ٹوکری خالی ہے",
      viewBooks: "کتابیں دیکھیں",
      priceNotSet: "قیمت درج نہیں",
      totalPrice: "کتابوں کی قیمت",
      deliveryCharge: "ڈیلیوری چارجز",
      grandTotal: "کل مجموعی رقم",
      checkoutWhatsApp: "واٹس ایپ پر آرڈر مکمل کریں",
      checkoutNote: "آرڈر مکمل کرنے کے لیے آپ کو واٹس ایپ پر بھیجا جائے گا",
      detailsTitle: "ترسیل کی تفصیلات",
      nameLabel: "آپ کا نام",
      namePlaceholder: "اپنا پورا نام لکھیں",
      phoneLabel: "فون نمبر",
      phonePlaceholder: "03XXXXXXXXX",
      addressLabel: "مکمل پتہ",
      addressPlaceholder: "گھر نمبر، گلی، علاقہ، شہر",
      paymentMethodLabel: "ادائیگی کا طریقہ",
      paymentCod: "آرڈر پر ادائیگی (Cash on Delivery)",
      paymentAdvance: "پیشگی ادائیگی (بینک ٹرانسفر / ایزی پیسہ / جاز کیش)",
      fillRequired: "براہ کرم نام، فون نمبر اور پتہ درج کریں",
      address: "پتہ (Address)",
      addressDetails: "مکتبہ الزہراء، نزد جامعہ الحسنین فیصل آباد، پاکستان",
      paymentTitle: "ادائیگی کا طریقہ کار (Payment Method)",
      paymentDetails: "آن لائن بینک ٹرانسفر، ایزی پیسہ، جائز کیش یا کیش آن ڈیلیوری دستیاب ہے۔",
      contactLabel: "رابطہ",
      waMessage: "واٹس ایپ پر پیغام بھیجیں",
      footerDesc: "آن لائن اسلامک بک سٹور جہاں تمام دینی، علمی و ادبی کتب مناسب قیمت پر دستیاب ہیں۔",
      copyright: "© 2026 مكتبہ الزھراء. جملہ حقوق محفوظ ہیں۔",
      loading: "لوڈ ہو رہا ہے...",
    },
    en: {
      navBooks: "Books",
      navHome: "Home",
      navAbout: "About",
      navContact: "Contact",
      cartTitle: "Your Cart",
      clearCart: "Clear Cart",
      emptyCart: "Your cart is empty",
      viewBooks: "View Books",
      priceNotSet: "Price Not Set",
      totalPrice: "Books Total",
      deliveryCharge: "Delivery Charges",
      grandTotal: "Grand Total",
      checkoutWhatsApp: "Complete Order on WhatsApp",
      checkoutNote: "You will be redirected to WhatsApp to confirm your order",
      detailsTitle: "Delivery Details",
      nameLabel: "Your Name",
      namePlaceholder: "Enter your full name",
      phoneLabel: "Phone Number",
      phonePlaceholder: "03XXXXXXXXX",
      addressLabel: "Full Address",
      addressPlaceholder: "House no., street, area, city",
      paymentMethodLabel: "Payment Method",
      paymentCod: "Cash on Delivery",
      paymentAdvance: "Advance Payment (Bank Transfer / Easypaisa / JazzCash)",
      fillRequired: "Please enter your name, phone number and address",
      address: "Address",
      addressDetails: "Maktaba Al-Zahra, Near Jamia Al-Hasanain, Faisalabad, Pakistan",
      paymentTitle: "Payment Method",
      paymentDetails: "Online Bank Transfer, Easypaisa, JazzCash, or Cash on Delivery available.",
      contactLabel: "Contact",
      waMessage: "Send a WhatsApp message",
      footerDesc: "Online Islamic bookstore offering religious and literary books at affordable prices.",
      copyright: "© 2026 Maktaba Al-Zahra. All rights reserved.",
      loading: "Loading...",
    },
  }[lang];

  const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);
   const totalWeight =
    Math.round(cart.reduce((sum, item) => sum + (item.weight || 1) * item.qty, 0) * 100) / 100;
  const deliveryCharge =
    cart.length > 0
      ? totalWeight <= 1
        ? 225
        : 225 + Math.ceil(totalWeight - 1) * 100
      : 0;
  const grandTotal = total + deliveryCharge;

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
    if (customerName.trim() === "" || customerPhone.trim() === "" || customerAddress.trim() === "") {
      alert(t.fillRequired);
      return;
    }
    let message = lang === "ur" ? "السلام علیکم! میں یہ کتابیں خریدنا چاہتا ہوں:\n\n" : "Assalam-o-Alaikum! I want to order these books:\n\n";
    cart.forEach((item, i) => {
      message += `${i + 1}. ${item.title} — ${lang === "ur" ? "مقدار" : "Qty"}: ${item.qty}`;
      if (item.price) message += ` — ${lang === "ur" ? "قیمت" : "Price"}: Rs ${(item.price * item.qty).toLocaleString()}`;
      message += "\n";
    });
    if (total > 0) {
      message += `\n${lang === "ur" ? "کتابوں کی قیمت" : "Books Total"}: Rs ${total.toLocaleString()}`;
    }
    message += `\n${lang === "ur" ? "ڈیلیوری چارجز" : "Delivery Charges"} (${totalWeight} kg): Rs ${deliveryCharge.toLocaleString()}`;
    message += `\n${lang === "ur" ? "کل مجموعی رقم" : "Grand Total"}: Rs ${grandTotal.toLocaleString()}`;
    message += `\n\n${lang === "ur" ? "نام" : "Name"}: ${customerName}`;
    message += `\n${lang === "ur" ? "فون نمبر" : "Phone"}: ${customerPhone}`;
    message += `\n${lang === "ur" ? "پتہ" : "Address"}: ${customerAddress}`;
    message += `\n${lang === "ur" ? "ادائیگی کا طریقہ" : "Payment Method"}: ${
      paymentMethod === "cod" ? t.paymentCod : t.paymentAdvance
    }`;
    const url = "https://wa.me/923055232889?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  };

  return (
    <main dir={lang === "ur" ? "rtl" : "ltr"} className={`min-h-screen font-sans transition-colors ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* ہیڈر */}
      <header className={`sticky top-0 z-30 shadow-md text-white ${darkMode ? "bg-gray-900" : "bg-emerald-800"}`}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-10 w-auto rounded-md" />
            <span className="text-lg font-bold">مكتبہ الزھراء</span>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/shop" className="hover:text-emerald-200 transition">
              {t.navBooks}
            </Link>
            <Link href="/about" className="hover:text-emerald-200 transition">
              {t.navAbout}
            </Link>
            <Link href="/contact" className="hover:text-emerald-200 transition">
              {t.navContact}
            </Link>
            <Link
              href="/cart"
              className={`relative flex items-center justify-center rounded-lg transition p-2 ${
                darkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-500"
              }`}
            >
              <ShoppingCart size={17} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-emerald-800">
                  {cart.length}
                </span>
              )}
            </Link>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center justify-center rounded-lg transition p-1.5 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-emerald-700 hover:bg-emerald-600"}`}
              title={darkMode ? "لائٹ موڈ" : "ڈارک موڈ"}
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={() => setLang(lang === "ur" ? "en" : "ur")}
              className={`flex items-center gap-1 rounded-lg transition px-2 py-1 text-xs font-bold ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-emerald-700 hover:bg-emerald-600"}`}
            >
              <Globe size={14} />
              {lang === "ur" ? "EN" : "اردو"}
            </button>
          </nav>
        </div>
      </header>

      {/* مین مواد */}
      <section className="max-w-3xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-emerald-700" size={24} />
            {t.cartTitle}
          </h1>
          {cart.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs font-medium text-rose-600 hover:underline"
            >
              {t.clearCart}
            </button>
          )}
        </div>

        {!loaded ? (
          <div className="py-16 text-center text-gray-400 text-sm">{t.loading}</div>
        ) : cart.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 text-center rounded-2xl border shadow-sm ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            <span className="text-6xl mb-4">🛒</span>
            <p className="text-gray-400 text-lg mb-4">{t.emptyCart}</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 text-white px-5 py-2.5 hover:bg-emerald-800 transition shadow-sm text-sm font-medium"
            >
              {t.viewBooks} <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border shadow-sm p-4 flex items-center gap-4 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
                >
                  <div className={`w-16 h-16 shrink-0 rounded-xl flex items-center justify-center border overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"}`}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="text-amber-300" size={22} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm line-clamp-1 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.author}</p>
                    {item.price ? (
                      <p className="text-sm font-bold text-emerald-500 mt-1">Rs {item.price.toLocaleString()}</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-1">{t.priceNotSet}</p>
                    )}
                  </div>

                  <div className={`flex items-center gap-2 rounded-lg border px-1.5 py-1 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                    <button
                      onClick={() => handleQtyChange(item.id, -1)}
                      className="p-1 rounded-md hover:bg-gray-600/20 text-gray-400 disabled:opacity-30"
                      disabled={item.qty <= 1}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                    <button
                      onClick={() => handleQtyChange(item.id, 1)}
                      className="p-1 rounded-md hover:bg-gray-600/20 text-gray-400"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* ترسیل کی تفصیلات (نام، فون، پتہ، ادائیگی) */}
            <div className={`mt-6 rounded-2xl border shadow-sm p-5 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
              <h3 className={`font-bold text-sm mb-4 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{t.detailsTitle}</h3>

              <div className="space-y-3">
                <div>
                  <label className={`block mb-1 text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t.nameLabel}</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className={`w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                      darkMode ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white border-gray-200 text-gray-900"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t.phoneLabel}</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    className={`w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                      darkMode ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white border-gray-200 text-gray-900"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t.addressLabel}</label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder={t.addressPlaceholder}
                    rows={2}
                    className={`w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                      darkMode ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white border-gray-200 text-gray-900"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1.5 text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t.paymentMethodLabel}</label>
                  <div className="space-y-1.5">
                    <label className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs cursor-pointer ${
                      paymentMethod === "cod"
                        ? darkMode ? "border-emerald-600 bg-emerald-950" : "border-emerald-400 bg-emerald-50"
                        : darkMode ? "border-gray-700" : "border-gray-200"
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                      />
                      {t.paymentCod}
                    </label>
                    <label className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs cursor-pointer ${
                      paymentMethod === "advance"
                        ? darkMode ? "border-emerald-600 bg-emerald-950" : "border-emerald-400 bg-emerald-50"
                        : darkMode ? "border-gray-700" : "border-gray-200"
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "advance"}
                        onChange={() => setPaymentMethod("advance")}
                      />
                      {t.paymentAdvance}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* ٹوٹل اور چیک آؤٹ */}
            <div className={`mt-4 rounded-2xl border shadow-sm p-5 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
              {total > 0 && (
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-gray-400">{t.totalPrice}</span>
                  <span className="font-semibold">Rs {total.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-gray-400">{t.deliveryCharge} ({totalWeight} kg)</span>
                <span className="font-semibold">Rs {deliveryCharge.toLocaleString()}</span>
              </div>
              <div className={`flex items-center justify-between mb-4 pt-2 border-t text-sm ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                <span className="font-bold">{t.grandTotal}</span>
                <span className="font-extrabold text-lg text-emerald-500">Rs {grandTotal.toLocaleString()}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white py-3 font-semibold hover:bg-[#20BD5A] transition shadow-sm"
              >
                <MessageCircle size={18} />
                {t.checkoutWhatsApp}
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-3">
                {t.checkoutNote}
              </p>
            </div>
          </>
        )}
      </section>

      {/* فوٹر (پتہ اور ادائیگی کے طریقہ کار کے ساتھ) */}
      <footer className={`border-t mt-10 ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
        <div className="max-w-5xl mx-auto px-5 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="text-center md:text-right">
            <h4 className={`font-bold mb-2 flex items-center justify-center md:justify-start gap-1.5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
              <MapPin size={15} className="text-emerald-600" /> {t.address}
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">{t.addressDetails}</p>
          </div>

          <div className="text-center md:text-right">
            <h4 className={`font-bold mb-2 flex items-center justify-center md:justify-start gap-1.5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
              <CreditCard size={15} className="text-emerald-600" /> {t.paymentTitle}
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">{t.paymentDetails}</p>
          </div>

          <div className="text-center md:text-right">
            <h4 className={`font-bold mb-2 flex items-center justify-center md:justify-start gap-1.5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
              <Phone size={15} className="text-emerald-600" /> {t.contactLabel}
            </h4>
            <a href="tel:+923055232889" dir="ltr" className="text-xs text-gray-400 hover:text-emerald-600 block">
              0305-5232889
            </a>
            <a href="https://wa.me/923055232889" target="_blank" rel="noopener noreferrer" className="text-xs text-[#25D366] font-semibold mt-1 inline-block">
              {t.waMessage}
            </a>
          </div>
        </div>
        <div className={`border-t py-4 text-center text-xs text-gray-400 ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
          <p>{t.copyright}</p>
        </div>
      </footer>
    </main>
  );
}