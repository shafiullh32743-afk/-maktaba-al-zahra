"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Camera, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Book {
  id: string | number;
  title: string;
  author?: string;
  price?: number;
  stock?: number;
  barcode?: string | null;
}

const READER_ID = "barcode-reader";

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState("");
  const [manual, setManual] = useState("");
  const [book, setBook] = useState<Book | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {}
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookup = async (barcode: string) => {
    const value = barcode.trim();
    if (!value) return;
    setCode(value);
    setMessage("");
    setResults([]);
    setSearch("");
    const { data, error } = await supabase.from("books").select("id, title, author, price, stock, barcode").eq("barcode", value).limit(1);
    if (error) {
      setMessage("خرابی: " + error.message + " (کیا books میں barcode کالم بنایا ہے؟)");
      setBook(null);
      setNotFound(false);
      return;
    }
    if (data && data.length > 0) {
      setBook(data[0] as Book);
      setNotFound(false);
    } else {
      setBook(null);
      setNotFound(true);
    }
  };

  const startScanner = async () => {
    setMessage("");
    setBook(null);
    setNotFound(false);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await new Promise((r) => setTimeout(r, 100));
      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 150 } },
        (decodedText: string) => {
          stopScanner();
          lookup(decodedText);
        },
        () => {}
      );
    } catch {
      setScanning(false);
      scannerRef.current = null;
      setMessage("کیمرا نہیں کھل سکا۔ براؤزر/ایپ کو کیمرے کی اجازت دیں۔");
    }
  };

  const changeStock = async (delta: number) => {
    if (!book) return;
    const next = Math.max(0, (book.stock ?? 0) + delta);
    const { error } = await supabase.from("books").update({ stock: next }).eq("id", book.id);
    if (error) {
      setMessage("سٹاک محفوظ نہیں ہوا: " + error.message);
      return;
    }
    setBook({ ...book, stock: next });
    setMessage("سٹاک اپڈیٹ ہو گیا");
  };

  const searchBooks = async (q: string) => {
    setSearch(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const { data } = await supabase.from("books").select("id, title, author, price, stock, barcode").ilike("title", `%${q.trim()}%`).limit(8);
    setResults((data as Book[]) || []);
  };

  const linkBarcode = async (target: Book) => {
    const { error } = await supabase.from("books").update({ barcode: code }).eq("id", target.id);
    if (error) {
      setMessage("بارکوڈ محفوظ نہیں ہوا: " + error.message);
      return;
    }
    setBook({ ...target, barcode: code });
    setNotFound(false);
    setResults([]);
    setSearch("");
    setMessage("بارکوڈ اس کتاب سے جوڑ دیا گیا۔ اگلی بار سکین پر یہی کتاب کھلے گی۔");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-slate-800 text-base">بارکوڈ سکین</h1>
        <Link href="/books" className="flex items-center gap-1 text-xs text-slate-500">
          کتب
          <ArrowRight size={14} className="rotate-180" />
        </Link>
      </header>

      <main className="mx-auto max-w-md p-4 space-y-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          {scanning ? (
            <>
              <div id={READER_ID} className="overflow-hidden rounded-xl" />
              <button onClick={stopScanner} className="mt-3 w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 flex items-center justify-center gap-2">
                <X size={16} /> بند کریں
              </button>
            </>
          ) : (
            <button onClick={startScanner} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white flex items-center justify-center gap-2">
              <Camera size={18} /> کیمرے سے بارکوڈ سکین کریں
            </button>
          )}

          <div className="mt-3 flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="یا بارکوڈ نمبر خود لکھیں"
              inputMode="numeric"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <button onClick={() => lookup(manual)} className="rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white">
              تلاش
            </button>
          </div>
        </div>

        {message && <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">{message}</div>}

        {book && (
          <div className="rounded-2xl bg-white border border-emerald-200 p-4">
            <p className="text-[11px] text-slate-400">بارکوڈ: {code || book.barcode}</p>
            <h2 className="mt-1 font-bold text-slate-800">{book.title}</h2>
            {book.author && <p className="text-xs text-slate-500">{book.author}</p>}
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-600">قیمت: Rs {book.price ?? "-"}</span>
              <span className="font-bold text-emerald-700">سٹاک: {book.stock ?? 0}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => changeStock(1)} className="rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white">
                + سٹاک بڑھائیں
              </button>
              <button onClick={() => changeStock(-1)} className="rounded-xl bg-rose-50 border border-rose-200 py-2.5 text-sm font-bold text-rose-600">
                − سٹاک کم کریں
              </button>
            </div>
          </div>
        )}

        {notFound && (
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-800">یہ بارکوڈ ({code}) کسی کتاب سے جڑا نہیں</p>
            <p className="mt-1 text-xs text-slate-500">کتاب کا نام لکھ کر تلاش کریں اور اس سے یہ بارکوڈ جوڑ دیں:</p>
            <input
              value={search}
              onChange={(e) => searchBooks(e.target.value)}
              placeholder="کتاب کا نام"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <div className="mt-2 space-y-1.5">
              {results.map((r) => (
                <button
                  key={String(r.id)}
                  onClick={() => linkBarcode(r)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-right text-xs text-slate-700 hover:bg-emerald-50"
                >
                  {r.title}
                  {r.author ? ` — ${r.author}` : ""}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
