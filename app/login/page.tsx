"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, BookOpen, Eye, EyeOff } from "lucide-react";

const CORRECT_PASSWORD = "zahra74234";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        document.cookie = "maktaba-auth=true; path=/; max-age=" + 60 * 60 * 24 * 30;
        router.push("/");
        router.refresh();
      } else {
        setError("پاس ورڈ غلط ہے، دوبارہ کوشش کریں");
        setLoading(false);
      }
    }, 400);
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0b1f17] p-4">
      {/* Decorative background glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/40 ring-1 ring-white/10">
            <BookOpen className="text-white" size={26} />
          </div>
          <h1 className="text-white text-xl font-bold mt-4 tracking-wide">مكتبہ الزھراء</h1>
          <p className="text-emerald-100/60 text-sm mt-1">لائبریری مینجمنٹ سسٹم</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Lock className="text-emerald-300" size={16} />
            </div>
            <div>
              <p className="text-white font-medium text-sm">محفوظ رسائی</p>
              <p className="text-white/40 text-xs">جاری رکھنے کے لیے پاس ورڈ درج کریں</p>
            </div>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="پاس ورڈ درج کریں"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/30 p-3.5 pl-11 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 transition"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
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
            onClick={handleLogin}
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3.5 font-medium shadow-lg shadow-emerald-900/30 hover:shadow-emerald-800/40 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? "جانچ ہو رہی ہے..." : "داخل ہوں"}
          </button>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © مكتبہ الزھراء — تمام حقوق محفوظ ہیں
        </p>
      </div>
    </main>
  );
}