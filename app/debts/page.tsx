"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  FolderTree,
  Receipt,
  Users,
  ShoppingCart,
  Truck,
  RotateCcw,
  Star,
  PackageMinus,
  Wallet,
  LogOut,
  Menu,
  X,
  Plus,
  Trash2,
  Search,
  Banknote,
  TrendingUp,
  TrendingDown,
  Scale,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Direction = "receivable" | "payable";

interface CustomerRow {
  id: number;
  name: string;
  phone?: string | null;
}

interface InvoiceRow {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  walk_in_name?: string | null;
  total_amount: number;
  amount_paid: number;
  payment_status: string | null;
  created_at: string;
  customers?: { name: string; phone?: string | null } | null;
}

interface DebtPayment {
  id: number;
  debt_id: number | null;
  invoice_id?: number | null;
  amount: number;
  note?: string | null;
  paid_at: string;
}

interface DebtRow {
  id: number;
  direction: Direction;
  party_name: string;
  party_phone?: string | null;
  amount: number;
  note?: string | null;
  debt_date: string;
  due_date?: string | null;
  created_at: string;
  debt_payments?: DebtPayment[];
}

interface LedgerItem {
  kind: "invoice" | "debt";
  id: number;
  label: string;
  date: string;
  total: number;
  paid: number;
  balance: number;
  note?: string | null;
  due?: string | null;
  payments: DebtPayment[];
}

interface Party {
  key: string;
  name: string;
  phone: string;
  items: LedgerItem[];
  balance: number;
}

type DeleteTarget = {
  type: "debt" | "payment" | "invoicePayment";
  id: number;
  label: string;
  amount?: number;
  invoiceId?: number | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) => Number(n || 0).toLocaleString("en-US");
const dateLabel = (d: string) => new Date(d).toLocaleDateString("en-GB");

function todayStr(): string {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function daysSince(d: string): number {
  const t = new Date(d).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

// اردو/عربی حروف کے فرق (ک/ك، ی/ي، ہ/ه/ھ) ختم کر کے نام کا موازنہ
function normalizeName(value: string): string {
  return (value || "")
    .replace(/[ً-ٰٟ‌‍]/g, "")
    .replace(/ك/g, "ک")
    .replace(/[يى]/g, "ی")
    .replace(/ۓ/g, "ے")
    .replace(/[هھۃة]/g, "ہ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function waNumber(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return "92" + digits.slice(1);
  return digits;
}

function statusFor(paid: number, total: number): string {
  return paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid";
}

export default function DebtsPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [invPayments, setInvPayments] = useState<DebtPayment[]>([]);
  const [debts, setDebts] = useState<DebtRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [suppliers, setSuppliers] = useState<{ name: string; phone?: string | null }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [invError, setInvError] = useState<string | null>(null);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [tab, setTab] = useState<Direction>("receivable");
  const [search, setSearch] = useState("");
  const [showSettled, setShowSettled] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"amount" | "oldest" | "name">("amount");
  const [ageFilter, setAgeFilter] = useState<"all" | "30" | "90" | "due">("all");

  // نیا اندراج
  const [showAdd, setShowAdd] = useState(false);
  const [addDirection, setAddDirection] = useState<Direction>("receivable");
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addDate, setAddDate] = useState(todayStr());
  const [addNote, setAddNote] = useState("");
  const [addDue, setAddDue] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ادائیگی درج کرنا
  const [payTarget, setPayTarget] = useState<{ party: Party; direction: Direction; only?: LedgerItem } | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(todayStr());
  const [payNote, setPayNote] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // حذف کی تصدیق
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget | null>(null);

  const fetchData = async () => {
    setLoaded(false);

    // بل: وہ سب جن کی ادائیگی مکمل نہیں (خالی حالت والے بل بھی شامل)
    const { data: invData, error: invErr } = await supabase
      .from("invoices")
      .select(
        "id, invoice_number, customer_id, walk_in_name, total_amount, amount_paid, payment_status, created_at, customers(name, phone)"
      )
      .or("payment_status.is.null,payment_status.neq.paid")
      .order("created_at", { ascending: true });
    setInvError(invErr ? invErr.message : null);
    setInvoices((invData as any) || []);

    const { data: custData } = await supabase.from("customers").select("id, name, phone");
    setCustomers((custData as CustomerRow[]) || []);

    // سپلائرز کے نام (صرف نام تجویز کرنے کے لیے؛ ٹیبل نہ ہو تو خاموشی سے چھوڑ دیا جاتا ہے)
    const { data: supData } = await supabase.from("suppliers").select("name, phone");
    setSuppliers(((supData as any[]) || []).filter((s) => s && s.name));

    const { data: debtData, error: debtErr } = await supabase
      .from("debts")
      .select("*, debt_payments(*)")
      .order("debt_date", { ascending: true });

    if (debtErr) {
      setSetupError(debtErr.message);
      setDebts([]);
    } else {
      setSetupError(null);
      setDebts((debtData as DebtRow[]) || []);
    }

    // بلوں کی ادائیگیوں کا ریکارڈ (نیا SQL چلانے کے بعد کام کرتا ہے)
    const { data: ipData, error: ipErr } = await supabase
      .from("debt_payments")
      .select("*")
      .not("invoice_id", "is", null);
    if (ipErr) {
      setMigrationNeeded(true);
      setInvPayments([]);
    } else {
      setMigrationNeeded(false);
      setInvPayments((ipData as DebtPayment[]) || []);
    }

    setLoaded(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------- لیجر بنانا ----------
  const buildParties = (direction: Direction): Party[] => {
    const map = new Map<string, Party>();

    // گاہک کا نام ایک ہی گاہک سے ملے تو اس کی آئی ڈی سے جوڑیں؛ ایک نام کے دو گاہک ہوں تو الگ رکھیں
    const customerKeyByName = new Map<string, string>();
    const duplicates = new Set<string>();
    customers.forEach((c) => {
      const n = normalizeName(c.name);
      if (!n) return;
      if (customerKeyByName.has(n)) duplicates.add(n);
      else customerKeyByName.set(n, `c${c.id}`);
    });
    duplicates.forEach((n) => customerKeyByName.delete(n));

    const keyForName = (name: string) => {
      const n = normalizeName(name);
      if (!n) return "__anon__";
      return customerKeyByName.get(n) || `n${n}`;
    };

    const getParty = (key: string, name: string, phone: string) => {
      let party = map.get(key);
      if (!party) {
        party = {
          key,
          name: name.trim() || "نامعلوم گاہک (کیش سیل)",
          phone: "",
          items: [],
          balance: 0,
        };
        map.set(key, party);
      }
      if (!party.phone && phone) party.phone = phone;
      return party;
    };

    // بلوں سے خودکار بقایا (صرف "مجھے ملنے ہیں" میں)
    if (direction === "receivable") {
      invoices.forEach((inv) => {
        const total = Number(inv.total_amount || 0);
        const paid = Number(inv.amount_paid || 0);
        const balance = round2(total - paid);
        if (balance <= 0) return;
        const name = inv.customers?.name || inv.walk_in_name || "";
        const key = inv.customer_id ? `c${inv.customer_id}` : keyForName(name);
        const party = getParty(key, name, inv.customers?.phone || "");
        party.items.push({
          kind: "invoice",
          id: inv.id,
          label: `بل #${inv.invoice_number}`,
          date: inv.created_at,
          total,
          paid,
          balance,
          payments: invPayments
            .filter((p) => p.invoice_id === inv.id)
            .sort((a, b) => a.paid_at.localeCompare(b.paid_at)),
        });
      });
    }

    // ہاتھ سے لکھے گئے قرض
    debts
      .filter((d) => d.direction === direction)
      .forEach((d) => {
        const payments = d.debt_payments || [];
        const paid = round2(payments.reduce((sum, p) => sum + Number(p.amount || 0), 0));
        const total = Number(d.amount || 0);
        const balance = round2(total - paid);
        if (balance <= 0 && !showSettled) return;
        const party = getParty(keyForName(d.party_name), d.party_name, d.party_phone || "");
        party.items.push({
          kind: "debt",
          id: d.id,
          label: "ہاتھ سے درج",
          date: d.debt_date,
          total,
          paid,
          balance: Math.max(0, balance),
          note: d.note,
          due: d.due_date || null,
          payments: [...payments].sort((a, b) => a.paid_at.localeCompare(b.paid_at)),
        });
      });

    const parties = Array.from(map.values())
      .filter((p) => p.items.length > 0)
      .map((p) => {
        const items = [...p.items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return { ...p, items, balance: round2(items.reduce((sum, i) => sum + i.balance, 0)) };
      });

    return parties.sort((a, b) => b.balance - a.balance);
  };

  const receivableParties = buildParties("receivable");
  const payableParties = buildParties("payable");

  const totalReceivable = round2(receivableParties.reduce((s, p) => s + p.balance, 0));
  const totalPayable = round2(payableParties.reduce((s, p) => s + p.balance, 0));
  const net = round2(totalReceivable - totalPayable);

  const term = normalizeName(search);
  const matchesSearch = (p: Party) =>
    term === "" || normalizeName(p.name).includes(term) || p.phone.replace(/\D/g, "").includes(term.replace(/\D/g, "") || "§");

  const today = todayStr();
  const isOverdueItem = (i: LedgerItem) => i.balance > 0 && !!i.due && String(i.due).slice(0, 10) < today;
  const oldestAge = (p: Party) => {
    const o = p.items.find((i) => i.balance > 0);
    return o ? daysSince(o.date) : 0;
  };
  const shownParties = (tab === "receivable" ? receivableParties : payableParties)
    .filter(matchesSearch)
    .filter((p) => {
      if (ageFilter === "30") return p.balance > 0 && oldestAge(p) >= 30;
      if (ageFilter === "90") return p.balance > 0 && oldestAge(p) >= 90;
      if (ageFilter === "due") return p.items.some(isOverdueItem);
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return oldestAge(b) - oldestAge(a);
      if (sortBy === "name") return a.name.localeCompare(b.name, "ur");
      return b.balance - a.balance;
    });
  const shownTotal = round2(shownParties.reduce((s, p) => s + p.balance, 0));

  // اضافی اعداد
  const monthPrefix = today.slice(0, 7);
  const collectedThisMonth = round2(
    [...invPayments, ...debts.filter((d) => d.direction === "receivable").flatMap((d) => d.debt_payments || [])]
      .filter((p) => String(p.paid_at || "").startsWith(monthPrefix))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  );
  const oldReceivable = round2(
    receivableParties.reduce(
      (sum, p) => sum + p.items.filter((i) => i.balance > 0 && daysSince(i.date) >= 90).reduce((x, i) => x + i.balance, 0),
      0
    )
  );
  const overdueCount = receivableParties.filter((p) => p.items.some(isOverdueItem)).length;

  const knownNames = Array.from(
    new Set(
      [
        ...customers.map((c) => c.name),
        ...suppliers.map((s) => s.name),
        ...receivableParties.map((p) => p.name),
        ...payableParties.map((p) => p.name),
      ].filter(Boolean)
    )
  );

  // ---------- نیا اندراج ----------
  const openAdd = (direction: Direction) => {
    setAddDirection(direction);
    setAddName("");
    setAddPhone("");
    setAddAmount("");
    setAddDate(todayStr());
    setAddNote("");
    setAddDue("");
    setEditId(null);
    setAddError(null);
    setShowAdd(true);
  };

  const openEdit = (item: LedgerItem, direction: Direction) => {
    const d = debts.find((x) => x.id === item.id);
    if (!d) return;
    setEditId(d.id);
    setAddDirection(direction);
    setAddName(d.party_name);
    setAddPhone(d.party_phone || "");
    setAddAmount(String(d.amount));
    setAddDate(String(d.debt_date || todayStr()).slice(0, 10));
    setAddNote(d.note || "");
    setAddDue(d.due_date ? String(d.due_date).slice(0, 10) : "");
    setAddError(null);
    setShowAdd(true);
  };

  const handleAddNameChange = (value: string) => {
    setAddName(value);
    if (!addPhone) {
      const n = normalizeName(value);
      const found =
        customers.find((c) => normalizeName(c.name) === n && c.phone) ||
        suppliers.find((s) => normalizeName(s.name) === n && s.phone);
      if (found?.phone) setAddPhone(found.phone);
    }
  };

  const handleSaveDebt = async () => {
    const amount = round2(parseFloat(addAmount));
    if (addName.trim() === "") {
      setAddError("براہ کرم نام لکھیں");
      return;
    }
    if (!amount || amount <= 0) {
      setAddError("براہ کرم درست رقم لکھیں");
      return;
    }
    setAddSaving(true);
    setAddError(null);

    const payload: Record<string, any> = {
      direction: addDirection,
      party_name: addName.trim(),
      party_phone: addPhone.trim() || null,
      amount,
      note: addNote.trim() || null,
      debt_date: addDate || todayStr(),
    };
    if (addDue) payload.due_date = addDue;

    let error: { message: string } | null = null;
    if (editId) {
      const cur = debts.find((x) => x.id === editId);
      const paidSoFar = round2((cur?.debt_payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0));
      if (amount < paidSoFar) {
        setAddSaving(false);
        setAddError(`رقم ادا شدہ رقم (${fmt(paidSoFar)}) سے کم نہیں ہو سکتی`);
        return;
      }
      if (!addDue && cur?.due_date) payload.due_date = null;
      const res = await supabase.from("debts").update(payload).eq("id", editId);
      error = res.error;
    } else {
      const res = await supabase.from("debts").insert(payload);
      error = res.error;
    }

    setAddSaving(false);
    if (error) {
      setAddError(
        error.message.includes("due_date")
          ? "وعدہ کی تاریخ کے لیے نیا debts-setup.sql ایک بار SQL Editor میں چلائیں"
          : `محفوظ نہیں ہو سکا: ${error.message}`
      );
      return;
    }
    setEditId(null);
    setShowAdd(false);
    setTab(addDirection);
    fetchData();
  };

  // ---------- ادائیگی ----------
  const openPay = (party: Party, direction: Direction, only?: LedgerItem) => {
    setPayTarget({ party, direction, only });
    setPayAmount(String(only ? only.balance : party.balance));
    setPayDate(todayStr());
    setPayNote("");
    setPayError(null);
  };

  const handleSavePayment = async () => {
    if (!payTarget) return;
    const { party } = payTarget;
    const amount = round2(parseFloat(payAmount));

    if (!amount || amount <= 0) {
      setPayError("براہ کرم درست رقم لکھیں");
      return;
    }
    const scopeBalance = payTarget.only ? payTarget.only.balance : party.balance;
    if (amount > scopeBalance + 0.001) {
      setPayError(`رقم بقایا (${fmt(scopeBalance)}) سے زیادہ ہے`);
      return;
    }

    setPaySaving(true);
    setPayError(null);

    // پرانے حساب سے شروع کر کے رقم تقسیم کرنا
    const queue = (payTarget.only ? [payTarget.only] : [...party.items])
      .filter((i) => i.balance > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remaining = amount;
    try {
      for (const item of queue) {
        if (remaining <= 0) break;
        const take = round2(Math.min(remaining, item.balance));

        if (item.kind === "invoice") {
          const newPaid = round2(item.paid + take);
          const { error } = await supabase
            .from("invoices")
            .update({ amount_paid: newPaid, payment_status: statusFor(newPaid, item.total) })
            .eq("id", item.id);
          if (error) throw error;

          // تاریخ اور نوٹ کے ساتھ ریکارڈ (نیا SQL چلا ہو تو)؛ ناکام ہو تو بقایا پھر بھی درست رہتا ہے
          if (!migrationNeeded) {
            await supabase.from("debt_payments").insert({
              invoice_id: item.id,
              amount: take,
              note: payNote.trim() || null,
              paid_at: payDate || todayStr(),
            });
          }
        } else {
          const { error } = await supabase.from("debt_payments").insert({
            debt_id: item.id,
            amount: take,
            note: payNote.trim() || null,
            paid_at: payDate || todayStr(),
          });
          if (error) throw error;
        }
        remaining = round2(remaining - take);
      }
      setPaySaving(false);
      setPayTarget(null);
      fetchData();
    } catch (err: any) {
      setPaySaving(false);
      setPayError(`محفوظ نہیں ہو سکا: ${err?.message || "نامعلوم خرابی"}`);
      fetchData();
    }
  };

  // ---------- حذف ----------
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "debt") {
      await supabase.from("debts").delete().eq("id", confirmDelete.id);
    } else if (confirmDelete.type === "invoicePayment") {
      // بل کی ادائیگی حذف ہو تو بل کا بقایا واپس بڑھ جاتا ہے
      const inv = invoices.find((i) => i.id === confirmDelete.invoiceId);
      if (inv) {
        const newPaid = Math.max(0, round2(Number(inv.amount_paid || 0) - Number(confirmDelete.amount || 0)));
        await supabase
          .from("invoices")
          .update({ amount_paid: newPaid, payment_status: statusFor(newPaid, Number(inv.total_amount || 0)) })
          .eq("id", inv.id);
      }
      await supabase.from("debt_payments").delete().eq("id", confirmDelete.id);
    } else {
      await supabase.from("debt_payments").delete().eq("id", confirmDelete.id);
    }
    setConfirmDelete(null);
    fetchData();
  };

  // ---------- واٹس ایپ یاددہانی ----------
  const sendReminder = (party: Party) => {
    const number = waNumber(party.phone);
    if (!number) return;
    const message = `السلام علیکم ${party.name}،\nمکتبہ الزھراء کی طرف سے یاددہانی: آپ کے ذمے ${fmt(party.balance)} روپے بقایا ہیں۔ براہ کرم سہولت سے ادائیگی فرما دیں۔ جزاک اللہ`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const statementText = (party: Party) => {
    const lines = [`السلام علیکم ${party.name}،`, "مکتبہ الزھراء کی طرف سے آپ کا حساب:", ""];
    party.items
      .filter((i) => i.balance > 0)
      .forEach((i) => {
        lines.push(
          `• ${dateLabel(i.date)} ${i.kind === "invoice" ? i.label : "ہاتھ سے درج"}: کل ${fmt(i.total)}، ادا ${fmt(i.paid)}، بقایا ${fmt(i.balance)}`
        );
      });
    lines.push("", `کل بقایا: ${fmt(party.balance)} روپے`, "جزاک اللہ");
    return lines.join("\n");
  };

  const sendStatement = async (party: Party) => {
    const text = statementText(party);
    const number = waNumber(party.phone);
    if (number) {
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      alert("حساب کاپی ہو گیا۔ اب جہاں چاہیں پیسٹ کر دیں۔");
    } catch {
      window.prompt("حساب کاپی کریں:", text);
    }
  };

  const exportCsv = () => {
    const rows: string[][] = [["نام", "فون", "قسم", "تاریخ", "حوالہ", "کل رقم", "ادا شدہ", "بقایا", "وعدہ کی تاریخ", "نوٹ"]];
    shownParties.forEach((p) =>
      p.items.forEach((i) =>
        rows.push([
          p.name,
          p.phone,
          i.kind === "invoice" ? "بل" : "ہاتھ سے",
          dateLabel(i.date),
          i.kind === "invoice" ? i.label : "",
          String(i.total),
          String(i.paid),
          String(i.balance),
          i.due ? dateLabel(i.due) : "",
          i.note || "",
        ])
      )
    );
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qarz-${tab}-${todayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const menuItems = [
    { href: "/", label: "ڈیش بورڈ", icon: LayoutDashboard },
    { href: "/books", label: "کتب", icon: BookOpen },
    { href: "/authors", label: "مصنفین", icon: PenLine },
    { href: "/categories", label: "زمرے", icon: FolderTree },
    { href: "/orders", label: "آرڈرز", icon: ShoppingCart },
    { href: "/customers", label: "کسٹمرز", icon: Users },
    { href: "/invoices", label: "بل", icon: Receipt },
    { href: "/debts", label: "قرض", icon: Banknote, active: true },
    { href: "/suppliers", label: "سپلائرز", icon: Truck },
    { href: "/returns", label: "واپسی/خراب", icon: RotateCcw },
    { href: "/reviews", label: "ریویوز", icon: Star },
    { href: "/low-stock", label: "کم سٹاک", icon: PackageMinus },
    { href: "/expenses", label: "اخراجات", icon: Wallet },
  ];

  const isReceivable = tab === "receivable";
  const amountColor = isReceivable ? "text-emerald-700" : "text-rose-600";
  const payScopeBalance = payTarget ? (payTarget.only ? payTarget.only.balance : payTarget.party.balance) : 0;

  return (
    <main dir="rtl" className="min-h-screen flex bg-slate-50/60 font-sans">
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`w-60 min-h-screen md:h-screen md:sticky md:top-0 border-l border-slate-200 bg-white p-4 flex flex-col fixed inset-y-0 right-0 z-50 flex-shrink-0 transform transition-transform duration-300 shadow-sm ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
              <BookOpen className="text-white" size={17} />
            </div>
            <h1 className="text-base font-bold text-slate-800">مكتبہ الزھراء</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 space-y-1 flex-1 overflow-y-auto pl-1">
          <p className="text-slate-400 text-[11px] font-semibold px-2 mb-1">مینو</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  item.active
                    ? "bg-emerald-50 text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={16} className={item.active ? "text-emerald-600" : "text-slate-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
          <button
            onClick={() => {
              document.cookie = "maktaba-auth=; path=/; max-age=0";
              window.location.href = "/login";
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut size={16} className="text-slate-400" />
            لاگ آؤٹ
          </button>
          <p className="text-slate-400 text-[10px] text-center">مكتبہ الزھراء © 2026</p>
        </div>
      </aside>

      <section className="flex-1 min-w-0 p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between md:hidden mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-bold text-slate-800">مكتبہ الزھراء</h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">قرض کا ریکارڈ 💰</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              بلوں کا بقایا خود بخود یہاں آ جاتا ہے، اور آپ ہاتھ سے بھی اندراج کر سکتے ہیں
            </p>
          </div>

          <button
            onClick={() => openAdd(tab)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-xs"
          >
            <Plus size={15} />
            <span>نیا اندراج</span>
          </button>
        </div>

        {setupError && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 flex gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">قرض کی ٹیبلز ابھی نہیں بنیں</p>
              <p className="mt-0.5">
                Supabase کے SQL Editor میں <span dir="ltr" className="font-mono">debts-setup.sql</span> چلائیں۔ تب تک صرف بلوں کا
                بقایا نظر آئے گا اور ہاتھ سے اندراج محفوظ نہیں ہوگا۔
              </p>
              <p dir="ltr" className="mt-1 text-[10px] text-amber-600 font-mono">{setupError}</p>
            </div>
          </div>
        )}

        {!setupError && migrationNeeded && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 flex gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">بلوں کی ادائیگی کی تاریخ محفوظ کرنے کے لیے SQL اپ ڈیٹ چاہیے</p>
              <p className="mt-0.5">
                نیا <span dir="ltr" className="font-mono">debts-setup.sql</span> ایک بار SQL Editor میں چلا دیں۔ تب تک بل کا
                بقایا تو درست کم ہوگا، مگر ہر ادائیگی کی تاریخ اور نوٹ محفوظ نہیں ہوں گے۔
              </p>
            </div>
          </div>
        )}

        {invError && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">بلوں کا بقایا پڑھا نہیں جا سکا</p>
              <p className="mt-0.5">بلوں کی ٹیبل میں مطلوبہ کالم موجود نہیں ہو سکتے۔ یہ پیغام ڈیولپر کو دکھائیں:</p>
              <p dir="ltr" className="mt-1 text-[10px] font-mono">{invError}</p>
            </div>
          </div>
        )}

        {/* خلاصہ */}
        {loaded && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-[11px] text-emerald-700 font-semibold">میرا قرض (مجھے ملنا ہے)</p>
                <p className="text-base font-bold text-emerald-800">{fmt(totalReceivable)} روپے</p>
                <p className="text-[10px] text-emerald-600/80">{receivableParties.filter((p) => p.balance > 0).length} افراد</p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <TrendingDown size={18} />
              </div>
              <div>
                <p className="text-[11px] text-rose-600 font-semibold">میں مقروض ہوں (مجھے دینا ہے)</p>
                <p className="text-base font-bold text-rose-700">{fmt(totalPayable)} روپے</p>
                <p className="text-[10px] text-rose-500/80">{payableParties.filter((p) => p.balance > 0).length} افراد</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                <Scale size={18} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">خالص حساب</p>
                <p className={`text-base font-bold ${net >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                  {fmt(Math.abs(net))} روپے
                </p>
                <p className="text-[10px] text-slate-400">
                  {net === 0 ? "حساب برابر ہے" : net > 0 ? "کل ملا کر آپ کو ملنے ہیں" : "کل ملا کر آپ کو دینے ہیں"}
                </p>
              </div>
            </div>
          </div>
        )}

        {loaded && (receivableParties.length > 0 || payableParties.length > 0) && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <p className="text-[11px] text-slate-400 font-medium">💵 اس مہینے ریکارڈ شدہ وصولی</p>
              <p className="text-sm font-bold text-emerald-700 mt-0.5">{fmt(collectedThisMonth)} روپے</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <p className="text-[11px] text-slate-400 font-medium">⏳ 90 دن سے پرانا بقایا</p>
              <p className={`text-sm font-bold mt-0.5 ${oldReceivable > 0 ? "text-rose-600" : "text-slate-400"}`}>{fmt(oldReceivable)} روپے</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <p className="text-[11px] text-slate-400 font-medium">🔔 وعدہ گزر جانے والے</p>
              <p className={`text-sm font-bold mt-0.5 ${overdueCount > 0 ? "text-amber-600" : "text-slate-400"}`}>{overdueCount} افراد</p>
            </div>
          </div>
        )}

        {/* تلاش */}
        <div className="mb-4 relative">
          <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="نام یا فون نمبر سے تلاش کریں..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-9 pl-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-xs"
          />
        </div>

        {/* ٹیبز */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 sm:w-96">
            <button
              onClick={() => setTab("receivable")}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                tab === "receivable" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              مجھے ملنے ہیں (گاہکوں سے)
            </button>
            <button
              onClick={() => setTab("payable")}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                tab === "payable" ? "bg-white text-rose-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              مجھے دینے ہیں (میرا قرض)
            </button>
          </div>

          <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showSettled}
              onChange={(e) => setShowSettled(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-600"
            />
            ادا ہو چکے ہاتھ والے اندراجات بھی دکھائیں
          </label>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "سب"],
              ["30", "30+ دن"],
              ["90", "90+ دن"],
              ["due", "🔔 وعدہ گزرا"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setAgeFilter(val)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                ageFilter === val
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "amount" | "oldest" | "name")}
            className="mr-auto rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 focus:outline-none"
          >
            <option value="amount">ترتیب: زیادہ رقم پہلے</option>
            <option value="oldest">ترتیب: پرانا پہلے</option>
            <option value="name">ترتیب: نام سے</option>
          </select>
          <button
            onClick={exportCsv}
            disabled={shownParties.length === 0}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
          >
            ⬇️ ایکسل فائل
          </button>
        </div>
        {loaded && shownParties.length > 0 && (
          <p className="mb-3 text-[11px] text-slate-400">
            {shownParties.length} افراد — کل {fmt(shownTotal)} روپے
          </p>
        )}

        {/* فہرست */}
        {!loaded ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-xl border border-slate-200 bg-white animate-pulse" />
            ))}
          </div>
        ) : shownParties.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <span className="text-4xl mb-2 block">{isReceivable ? "✅" : "🤝"}</span>
            <p className="text-xs text-slate-500">
              {search
                ? "اس نام سے کوئی ریکارڈ نہیں ملا"
                : isReceivable
                ? "کسی گاہک کا بقایا نہیں ہے"
                : "ابھی کوئی قرض درج نہیں ہے"}
            </p>
            {!search && (
              <button
                onClick={() => openAdd(tab)}
                className="mt-3 text-xs font-semibold text-emerald-600 hover:underline"
              >
                + نیا اندراج کریں
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
            {shownParties.map((party) => {
              const expanded = expandedKey === `${tab}-${party.key}`;
              const settled = party.balance <= 0;
              const oldest = party.items.find((i) => i.balance > 0);
              const age = oldest ? daysSince(oldest.date) : 0;
              const sumTotal = party.items.reduce((sum, i) => sum + i.total, 0);
              const sumPaid = party.items.reduce((sum, i) => sum + i.paid, 0);
              const pctPaid = sumTotal > 0 ? Math.min(100, Math.round((sumPaid / sumTotal) * 100)) : 0;
              const hasOverdue = party.items.some(isOverdueItem);
              return (
                <div
                  key={`${tab}-${party.key}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">👤 {party.name}</p>
                      {party.phone && (
                        <p dir="ltr" className="text-[11px] text-slate-400 mt-0.5 text-right">
                          {party.phone}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>{party.items.length} اندراج / بل</span>
                        {!settled && age >= 30 && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] border ${
                              age >= 90
                                ? "bg-rose-50 text-rose-600 border-rose-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                          >
                            ⏳ {age} دن پرانا
                          </span>
                        )}
                        {hasOverdue && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] border bg-amber-50 text-amber-700 border-amber-100">
                            🔔 وعدہ گزر گیا
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-[10px] text-slate-400">بقایا</p>
                      <p className={`text-base font-extrabold ${settled ? "text-slate-400" : amountColor}`}>
                        {fmt(party.balance)} <span className="text-[11px] font-semibold">روپے</span>
                      </p>
                    </div>
                  </div>

                  {sumPaid > 0 && !settled && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>
                          ادا شدہ {fmt(sumPaid)} / {fmt(sumTotal)}
                        </span>
                        <span>{pctPaid}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pctPaid}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    {!settled && (
                      <button
                        onClick={() => openPay(party, tab)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition text-[11px] font-semibold"
                      >
                        {isReceivable ? "ادائیگی وصول ہوئی" : "ادائیگی کر دی"}
                      </button>
                    )}
                    {isReceivable && !settled && party.phone && (
                      <button
                        onClick={() => sendReminder(party)}
                        className="px-2.5 py-1 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C4A] hover:bg-[#25D366]/20 transition text-[11px] font-semibold flex items-center gap-1"
                      >
                        <MessageCircle size={12} /> یاددہانی
                      </button>
                    )}
                    {isReceivable && !settled && (
                      <button
                        onClick={() => sendStatement(party)}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition text-[11px] font-semibold"
                      >
                        📄 حساب بھیجیں
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedKey(expanded ? null : `${tab}-${party.key}`)}
                      className="mr-auto px-2 py-1 rounded-lg text-slate-500 hover:bg-slate-50 transition text-[11px] font-medium flex items-center gap-1"
                    >
                      تفصیل {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>

                  {expanded && (
                    <div className="mt-3 space-y-2">
                      {party.items.map((item) => (
                        <div
                          key={`${item.kind}-${item.id}`}
                          className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-[11px]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                    item.kind === "invoice"
                                      ? "bg-blue-50 text-blue-700 border-blue-100"
                                      : "bg-amber-50 text-amber-700 border-amber-100"
                                  }`}
                                >
                                  {item.kind === "invoice" ? "بل سے" : "ہاتھ سے"}
                                </span>
                                <span dir="ltr">{item.kind === "invoice" ? item.label : ""}</span>
                                <span className="text-slate-400 font-normal">{dateLabel(item.date)}</span>
                                {item.due && item.balance > 0 && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                      isOverdueItem(item)
                                        ? "bg-rose-50 text-rose-600 border-rose-100"
                                        : "bg-slate-50 text-slate-500 border-slate-200"
                                    }`}
                                  >
                                    وعدہ: {dateLabel(item.due)}
                                  </span>
                                )}
                              </p>
                              {item.note && <p className="text-slate-500 mt-1">📝 {item.note}</p>}
                            </div>
                            {item.kind === "debt" && (
                              <button
                                onClick={() =>
                                  setConfirmDelete({ type: "debt", id: item.id, label: `${party.name} کا اندراج (${fmt(item.total)} روپے)` })
                                }
                                className="p-1 text-slate-300 hover:text-rose-600 transition shrink-0"
                                title="اندراج حذف کریں"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
                            <div className="rounded bg-white border border-slate-100 py-1">
                              <p className="text-[9px] text-slate-400">کل رقم</p>
                              <p className="font-bold text-slate-700">{fmt(item.total)}</p>
                            </div>
                            <div className="rounded bg-white border border-slate-100 py-1">
                              <p className="text-[9px] text-slate-400">ادا شدہ</p>
                              <p className="font-bold text-emerald-700">{fmt(item.paid)}</p>
                            </div>
                            <div className="rounded bg-white border border-slate-100 py-1">
                              <p className="text-[9px] text-slate-400">بقایا</p>
                              <p className={`font-bold ${item.balance > 0 ? amountColor : "text-slate-400"}`}>{fmt(item.balance)}</p>
                            </div>
                          </div>

                          {(item.balance > 0 || item.kind === "debt") && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {item.balance > 0 && (
                                <button
                                  onClick={() => openPay(party, tab, item)}
                                  className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition text-[10px] font-semibold"
                                >
                                  💵 {item.kind === "invoice" ? "اس بل" : "اس اندراج"} پر ادائیگی
                                </button>
                              )}
                              {item.kind === "debt" && (
                                <button
                                  onClick={() => openEdit(item, tab)}
                                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-[10px] font-semibold"
                                >
                                  ✏️ ترمیم
                                </button>
                              )}
                            </div>
                          )}

                          {item.payments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.payments.map((pay) => (
                                <div
                                  key={pay.id}
                                  className="flex items-center justify-between gap-2 rounded bg-white border border-slate-100 px-2 py-1"
                                >
                                  <span className="text-slate-500">
                                    {dateLabel(pay.paid_at)}
                                    {pay.note ? ` — ${pay.note}` : ""}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <span className="font-semibold text-emerald-700">{fmt(pay.amount)}</span>
                                    <button
                                      onClick={() =>
                                        setConfirmDelete(
                                          item.kind === "invoice"
                                            ? {
                                                type: "invoicePayment",
                                                id: pay.id,
                                                label: `${fmt(pay.amount)} روپے کی ادائیگی (${item.label})`,
                                                amount: Number(pay.amount),
                                                invoiceId: item.id,
                                              }
                                            : { type: "payment", id: pay.id, label: `${fmt(pay.amount)} روپے کی ادائیگی` }
                                        )
                                      }
                                      className="text-slate-300 hover:text-rose-600 transition"
                                      title="ادائیگی حذف کریں"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {party.items.some((i) => i.kind === "invoice") && (
                        <p className="text-[10px] text-slate-400">
                          بل والی ادائیگی درج کرنے سے اس بل کی ادائیگی کی حالت بھی خود اپ ڈیٹ ہو جاتی ہے۔
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* نیا اندراج موڈل */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAdd(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4">{editId ? "اندراج میں ترمیم" : "نیا قرض درج کریں"}</h3>

            {addError && (
              <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">
                {addError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100">
                <button
                  type="button"
                  onClick={() => setAddDirection("receivable")}
                  className={`rounded-lg py-2 font-semibold transition ${
                    addDirection === "receivable" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500"
                  }`}
                >
                  مجھے لینا ہے
                </button>
                <button
                  type="button"
                  onClick={() => setAddDirection("payable")}
                  className={`rounded-lg py-2 font-semibold transition ${
                    addDirection === "payable" ? "bg-white text-rose-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  مجھے دینا ہے
                </button>
              </div>
              <p className="text-[11px] text-slate-400 -mt-1">
                {addDirection === "receivable"
                  ? "کسی نے آپ سے ادھار لیا ہے یا رقم دینی ہے"
                  : "آپ نے کسی سے قرض لیا ہے یا رقم دینی ہے"}
              </p>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">نام *</label>
                <input
                  type="text"
                  list="debt-known-names"
                  value={addName}
                  onChange={(e) => handleAddNameChange(e.target.value)}
                  placeholder="مثلاً: محمد علی"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  autoFocus
                />
                <datalist id="debt-known-names">
                  {knownNames.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">فون نمبر (اختیاری)</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="03XXXXXXXXX"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">رقم (روپے) *</label>
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">تاریخ</label>
                  <input
                    type="date"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">نوٹ (اختیاری)</label>
                <input
                  type="text"
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  placeholder="مثلاً: ادھار پر کتابیں / ذاتی قرض"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">وعدہ کی تاریخ (اختیاری)</label>
                <input
                  type="date"
                  value={addDue}
                  onChange={(e) => setAddDue(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">جس تاریخ تک ادائیگی کا وعدہ ہوا۔ گزر جائے تو 🔔 نشان آ جاتا ہے۔</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
              <button
                type="button"
                onClick={handleSaveDebt}
                disabled={addSaving}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {addSaving ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ادائیگی موڈل */}
      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-full max-w-sm shadow-xl relative">
            <button
              onClick={() => setPayTarget(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-800">
              {payTarget.direction === "receivable" ? "ادائیگی وصول ہوئی" : "ادائیگی کر دی"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {payTarget.party.name} —{" "}
              {payTarget.only ? (payTarget.only.kind === "invoice" ? payTarget.only.label : "اس اندراج") + " کا بقایا" : "کل بقایا"}:{" "}
              <span className="font-bold text-slate-800">{fmt(payScopeBalance)} روپے</span>
            </p>

            {payError && (
              <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">
                {payError}
              </div>
            )}

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">کتنی رقم ملی؟ (روپے)</label>
                  <span className="text-[10px] text-slate-400">جتنی رقم ملی وہی لکھیں</span>
                </div>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  autoFocus
                />
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {(
                    [
                      ["¼", 0.25],
                      ["آدھی", 0.5],
                      ["¾", 0.75],
                      ["پوری", 1],
                    ] as const
                  ).map(([label, f]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPayAmount(String(f === 1 ? payScopeBalance : Math.round(payScopeBalance * f)))}
                      className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {parseFloat(payAmount) > 0 && parseFloat(payAmount) < payScopeBalance && (
                  <p className="text-[11px] text-amber-600 mt-2">
                    جزوی ادائیگی: باقی بقایا {fmt(round2(payScopeBalance - parseFloat(payAmount)))} روپے رہے گا
                  </p>
                )}
                {parseFloat(payAmount) >= payScopeBalance && payScopeBalance > 0 && (
                  <p className="text-[11px] text-emerald-600 mt-2">مکمل ادائیگی: حساب بے باق ہو جائے گا ✅</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">تاریخ</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">نوٹ (اختیاری)</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="مثلاً: ایزی پیسہ سے / نقد"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <p className="text-[10px] text-slate-400">{payTarget.only ? "رقم صرف اسی اندراج میں کٹے گی۔" : "رقم سب سے پرانے حساب سے کٹنا شروع ہوتی ہے۔"}</p>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
              <button
                type="button"
                onClick={handleSavePayment}
                disabled={paySaving}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {paySaving ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* حذف کی تصدیق */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-full max-w-sm shadow-xl text-center">
            <h3 className="text-sm font-bold text-slate-800">
              {confirmDelete.type === "debt" ? "اندراج حذف کریں؟" : "ادائیگی حذف کریں؟"}
            </h3>
            <p className="text-slate-500 text-xs mt-1.5">{confirmDelete.label}</p>
            {confirmDelete.type === "debt" && (
              <p className="text-[11px] text-amber-600 mt-1">اس کی تمام ادائیگیاں بھی حذف ہو جائیں گی</p>
            )}
            {confirmDelete.type === "invoicePayment" && (
              <p className="text-[11px] text-amber-600 mt-1">بل کا بقایا اتنا واپس بڑھ جائے گا</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-lg bg-rose-600 text-white py-1.5 text-xs font-semibold hover:bg-rose-700 transition"
              >
                حذف کریں
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-slate-200 text-slate-600 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
              >
                منسوخ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}