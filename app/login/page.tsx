"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ⚠️ یہاں اپنی مرضی کا پاس ورڈ لکھ لیں
const CORRECT_PASSWORD = "zahra74234";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (password === CORRECT_PASSWORD) {
      document.cookie = "maktaba-auth=true; path=/; max-age=" + 60 * 60 * 24 * 30;
      router.push("/");
      router.refresh();
    } else {
      setError("پاس ورڈ غلط ہے، دوبارہ کوشش کریں");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-md p-10 w-full max-w-sm text-center">
        <span className="text-5xl">🔐</span>
        <h1 className="text-2xl font-bold text-emerald-800 mt-4">مكتبہ الزھراء</h1>
        <p className="text-gray-500 mt-1">جاری رکھنے کے لیے پاس ورڈ درج کریں</p>

        <input
          type="password"
          placeholder="پاس ورڈ"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="mt-6 w-full rounded-xl border border-gray-200 p-3 text-center focus:outline-none focus:ring-2 focus:ring-emerald-600"
          autoFocus
        />

        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}

        <button
          onClick={handleLogin}
          className="mt-5 w-full rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition"
        >
          داخل ہوں
        </button>
      </div>
    </main>
  );
}