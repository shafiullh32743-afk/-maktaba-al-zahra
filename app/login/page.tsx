"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, BookOpen, Eye, EyeOff, Globe, Fingerprint } from "lucide-react";

// ⚠️ یہاں اپنی مرضی کا پاس ورڈ لکھ لیں
const CORRECT_PASSWORD = "zahra74234";

const translations = {
  ur: {
    brand: "مكتبہ الزھراء",
    tagline: "لائبریری مینجمنٹ سسٹم",
    secureAccess: "محفوظ رسائی",
    subtitle: "جاری رکھنے کے لیے پاس ورڈ درج کریں",
    placeholder: "پاس ورڈ درج کریں",
    error: "پاس ورڈ غلط ہے، دوبارہ کوشش کریں",
    loading: "جانچ ہو رہی ہے...",
    button: "داخل ہوں",
    footer: "© مكتبہ الزھراء — تمام حقوق محفوظ ہیں",
    fingerprintLogin: "فنگر پرنٹ سے لاگ اِن کریں",
    fingerprintError: "فنگر پرنٹ تصدیق ناکام ہوئی، پاس ورڈ استعمال کریں",
    orDivider: "یا",
    offerTitle: "فنگر پرنٹ فعال کریں؟",
    offerSubtitle: "اگلی بار پاس ورڈ کے بغیر، صرف فنگر پرنٹ سے لاگ اِن کریں",
    offerYes: "جی ہاں، فعال کریں",
    offerNo: "ابھی نہیں",
  },
  en: {
    brand: "Maktaba Al-Zahra",
    tagline: "Library Management System",
    secureAccess: "Secure Access",
    subtitle: "Enter password to continue",
    placeholder: "Enter password",
    error: "Incorrect password, try again",
    loading: "Checking...",
    button: "Sign In",
    footer: "© Maktaba Al-Zahra — All rights reserved",
    fingerprintLogin: "Sign in with Fingerprint",
    fingerprintError: "Fingerprint verification failed, use password",
    orDivider: "or",
    offerTitle: "Enable Fingerprint?",
    offerSubtitle: "Next time, sign in with just your fingerprint — no password needed",
    offerYes: "Yes, enable it",
    offerNo: "Not now",
  },
};

const FINGERPRINT_KEY = "maktaba-fingerprint-id";

function bufferToBase64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuffer(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"ur" | "en">("ur");
  const router = useRouter();
  const t = translations[lang];

  const [fingerprintSupported, setFingerprintSupported] = useState(false);
  const [fingerprintRegistered, setFingerprintRegistered] = useState(false);
  const [showFingerprintOffer, setShowFingerprintOffer] = useState(false);

  useEffect(() => {
    const checkFingerprintSupport = async () => {
      try {
        if (
          typeof window !== "undefined" &&
          window.PublicKeyCredential &&
          typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
        ) {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setFingerprintSupported(available);
          setFingerprintRegistered(!!localStorage.getItem(FINGERPRINT_KEY));
        }
      } catch {
        setFingerprintSupported(false);
      }
    };
    checkFingerprintSupport();
  }, []);

  const goHome = () => {
    router.push("/");
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password === CORRECT_PASSWORD) {
      document.cookie = "maktaba-auth=true; path=/; max-age=" + 60 * 60 * 24 * 30;

      if (fingerprintSupported && !fingerprintRegistered) {
        setLoading(false);
        setShowFingerprintOffer(true);
        return;
      }

      goHome();
    } else {
      setError(t.error);
      setLoading(false);
    }
  };

  const handleRegisterFingerprint = async () => {
    try {
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "مكتبہ الزھراء", id: window.location.hostname },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: "admin",
            displayName: "Admin - مكتبہ الزھراء",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
          attestation: "none",
        },
      })) as PublicKeyCredential;

      if (credential) {
        const credentialId = bufferToBase64(credential.rawId);
        localStorage.setItem(FINGERPRINT_KEY, credentialId);
        setFingerprintRegistered(true);
      }
    } catch {
      // صارف نے منسوخ کر دیا یا ڈیوائس سپورٹ نہیں کرتی — کوئی بات نہیں، پاس ورڈ سے لاگ اِن ہو چکا ہے
    } finally {
      setShowFingerprintOffer(false);
      goHome();
    }
  };

  const handleSkipFingerprint = () => {
    setShowFingerprintOffer(false);
    goHome();
  };

  const handleFingerprintLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const storedId = localStorage.getItem(FINGERPRINT_KEY);
      if (!storedId) {
        setLoading(false);
        return;
      }

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [
            { id: base64ToBuffer(storedId), type: "public-key" },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      });

      if (assertion) {
        document.cookie = "maktaba-auth=true; path=/; max-age=" + 60 * 60 * 24 * 30;
        goHome();
      } else {
        setLoading(false);
      }
    } catch {
      setError(t.fingerprintError);
      setLoading(false);
    }
  };

  return (
    <main
      dir={lang === "ur" ? "rtl" : "ltr"}
      className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0b1f17] p-4"
    >
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <button
        type="button"
        onClick={() => setLang(lang === "ur" ? "en" : "ur")}
        className="absolute top-5 ltr:left-5 rtl:right-5 flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2 transition z-10"
      >
        <Globe size={16} />
        {lang === "ur" ? "English" : "اردو"}
      </button>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/40 ring-1 ring-white/10">
            <BookOpen className="text-white" size={26} />
          </div>
          <h1 className="text-white text-xl font-bold mt-4 tracking-wide">{t.brand}</h1>
          <p className="text-emerald-100/60 text-sm mt-1">{t.tagline}</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Lock className="text-emerald-300" size={16} />
            </div>
            <div>
              <p className="text-white font-medium text-sm">{t.secureAccess}</p>
              <p className="text-white/40 text-xs">{t.subtitle}</p>
            </div>
          </div>

          {fingerprintSupported && fingerprintRegistered && (
            <>
              <button
                type="button"
                onClick={handleFingerprintLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-200 py-3.5 font-medium hover:bg-emerald-600/30 transition-all disabled:opacity-60"
              >
                <Fingerprint size={20} />
                {t.fingerprintLogin}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">{t.orDivider}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t.placeholder}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/30 p-3.5 ltr:pl-11 rtl:pr-11 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 transition"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg py-2 px-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3.5 font-medium shadow-lg shadow-emerald-900/30 hover:shadow-emerald-800/40 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? t.loading : t.button}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">{t.footer}</p>
      </div>

      {showFingerprintOffer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f2a1f] border border-white/10 rounded-2xl p-7 w-full max-w-xs text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-600/20 flex items-center justify-center">
              <Fingerprint className="text-emerald-300" size={28} />
            </div>
            <h3 className="text-white font-bold mt-4">{t.offerTitle}</h3>
            <p className="text-white/50 text-sm mt-2">{t.offerSubtitle}</p>

            <div className="mt-6 space-y-2.5">
              <button
                onClick={handleRegisterFingerprint}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3 font-medium hover:from-emerald-500 hover:to-emerald-400 transition-all"
              >
                {t.offerYes}
              </button>
              <button
                onClick={handleSkipFingerprint}
                className="w-full rounded-xl bg-white/5 text-white/60 py-3 hover:bg-white/10 transition"
              >
                {t.offerNo}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}