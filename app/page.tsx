"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  FolderTree,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Users,
  Receipt,
  Truck,
  RotateCcw,
  Star,
  PackageMinus,
  Wallet,
  TrendingUp,
  Boxes,
  ArrowUpRight,
  Sun,
  Moon,
  Globe,
  ShoppingBag,
  Download,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { isOnSale, saleActive } from "@/lib/sale";
import { getCartCount } from "@/lib/cart";


const PALETTE = ["#34d399", "#38bdf8", "#fbbf24", "#a78bfa", "#fb7185", "#cbd5e1"];

const shortNum = (n: number) =>
  n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : n >= 1000 ? Math.round(n / 1000) + "k" : String(Math.round(n));

const smoothPath = (pts: [number, number][]) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
};

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  const w = 90;
  const h = 28;
  const pts: [number, number][] = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, h - 3 - (v / max) * (h - 8)]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="overflow-visible" aria-hidden>
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function Donut({ data, size = 112, center }: { data: { label: string; value: number }[]; size?: number; center?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 38;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} dir="ltr">
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        <circle cx={50} cy={50} r={r} fill="none" stroke="#e2e8f0" strokeOpacity={0.6} strokeWidth={13} />
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.value / total) * c;
            const el = (
              <circle
                key={d.label}
                cx={50}
                cy={50}
                r={r}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={13}
                strokeDasharray={`${Math.max(0, len - 1.5)} ${c - Math.max(0, len - 1.5)}`}
                strokeDashoffset={-acc}
              >
                <title>{`${d.label}: ${Math.round(d.value).toLocaleString("en-US")}`}</title>
              </circle>
            );
            acc += len;
            return el;
          })}
      </svg>
      {center && <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-500">{center}</div>}
    </div>
  );
}

function DonutCard({
  title,
  data,
  card,
  strong,
  muted,
  empty,
}: {
  title: string;
  data: { label: string; value: number }[];
  card: string;
  strong: string;
  muted: string;
  empty: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={`rounded-3xl border p-5 ${card}`}>
      <h3 className={`text-sm font-bold mb-4 ${strong}`}>{title}</h3>
      {total === 0 ? (
        <p className={`text-xs py-8 text-center ${muted}`}>{empty}</p>
      ) : (
        <div className="flex items-center gap-4">
          <Donut data={data} center={"Rs " + shortNum(total)} />
          <ul className="flex-1 min-w-0 space-y-2">
            {data.map((d, i) => (
              <li key={d.label} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 min-w-0">
                  <i className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className={`truncate ${muted}`}>{d.label}</span>
                </span>
                <b className={strong}>{Math.round((d.value / total) * 100)}%</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AreaChart({ days, salesLabel, profitLabel }: { days: { day: number; revenue: number; profit: number }[]; salesLabel: string; profitLabel: string }) {
  const W = 640;
  const H = 190;
  const padL = 34;
  const padB = 22;
  const padT = 10;
  const max = Math.max(1, ...days.map((d) => Math.max(d.revenue, d.profit)));
  const x = (i: number) => padL + (i / (days.length - 1)) * (W - padL - 6);
  const y = (v: number) => padT + (1 - Math.max(0, v) / max) * (H - padT - padB);
  const sPts: [number, number][] = days.map((d, i) => [x(i), y(d.revenue)]);
  const pPts: [number, number][] = days.map((d, i) => [x(i), y(d.profit)]);
  const area = (pts: [number, number][]) => `${smoothPath(pts)} L${pts[pts.length - 1][0]},${H - padB} L${pts[0][0]},${H - padB} Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        {grid.map((g) => (
          <g key={g}>
            <line x1={padL} x2={W - 6} y1={y(max * g)} y2={y(max * g)} stroke="#e2e8f0" strokeDasharray="3 4" />
            <text x={padL - 6} y={y(max * g) + 3} textAnchor="end" fontSize={9} fill="#94a3b8">
              {shortNum(max * g)}
            </text>
          </g>
        ))}
        <path d={area(sPts)} fill="url(#gSales)" />
        <path d={smoothPath(sPts)} fill="none" stroke="#10b981" strokeWidth={2.2} strokeLinecap="round" />
        <path d={area(pPts)} fill="url(#gProfit)" />
        <path d={smoothPath(pPts)} fill="none" stroke="#0ea5e9" strokeWidth={2} strokeLinecap="round" />
        {days.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.revenue)} r={7} fill="transparent">
              <title>{`${d.day}: ${salesLabel} ${Math.round(d.revenue).toLocaleString("en-US")} • ${profitLabel} ${Math.round(d.profit).toLocaleString("en-US")}`}</title>
            </circle>
            {(i === 0 || i === days.length - 1 || i % 5 === 0) && (
              <text x={x(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#94a3b8">
                {d.day}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function Ring({ value, max, size = 120 }: { value: number; max: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} dir="ltr">
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        <circle cx={50} cy={50} r={r} fill="none" stroke="#e2e8f0" strokeOpacity={0.7} strokeWidth={10} />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={pct >= 1 ? "#10b981" : "#38bdf8"}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-slate-700">{Math.round(pct * 100)}%</div>
    </div>
  );
}


const compact = (n: number) => {
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1_000_000) return sign + (a / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (a >= 1_000) return sign + (a / 1_000).toFixed(a >= 10_000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return sign + Math.round(a);
};

// 6 مہینوں کے تین رنگ کے ستون: فروخت، اخراجات، نفع (اور نیچے نفع کا فیصد)
function ComboChart({
  months,
  names,
  salesLabel,
  expLabel,
  profitLabel,
  dark,
}: {
  months: { revenue: number; expense: number; profit: number }[];
  names: string[];
  salesLabel: string;
  expLabel: string;
  profitLabel: string;
  dark: boolean;
}) {
  const W = 360, H = 190, padB = 34, padT = 16, padX = 8;
  const max = Math.max(1, ...months.map((m) => Math.max(m.revenue, m.expense, Math.abs(m.profit))));
  const slot = (W - padX * 2) / Math.max(1, months.length);
  const bw = Math.min(16, slot / 4);
  const h = (v: number) => (Math.abs(v) / max) * (H - padB - padT);
  const base = H - padB;
  const txt = dark ? "#94a3b8" : "#94a3b8";
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" dir="ltr" role="img" aria-label="monthly chart">
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={padX} x2={W - padX} y1={base - g * (H - padB - padT)} y2={base - g * (H - padB - padT)} stroke={dark ? "#1e293b" : "#eef2f7"} strokeWidth="1" />
        ))}
        <line x1={padX} x2={W - padX} y1={base} y2={base} stroke={dark ? "#334155" : "#e2e8f0"} />
        {months.map((m, i) => {
          const cx = padX + slot * i + slot / 2;
          const margin = m.revenue > 0 ? Math.round((m.profit / m.revenue) * 100) : null;
          return (
            <g key={i}>
              <rect x={cx - bw * 1.5 - 1} y={base - h(m.revenue)} width={bw} height={Math.max(2, h(m.revenue))} rx="3" fill="#a7f3d0" />
              <rect x={cx - bw / 2} y={base - h(m.expense)} width={bw} height={Math.max(2, h(m.expense))} rx="3" fill="#fcd34d" />
              <rect x={cx + bw / 2 + 1} y={base - h(m.profit)} width={bw} height={Math.max(2, h(m.profit))} rx="3" fill={m.profit < 0 ? "#fb7185" : "#10b981"} />
              <text x={cx + bw} y={base - h(m.profit) - 4} textAnchor="middle" fontSize="8" fontWeight="700" fill={m.profit < 0 ? "#e11d48" : "#059669"}>
                {compact(m.profit)}
              </text>
              <text x={cx} y={H - 18} textAnchor="middle" fontSize="9" fill={txt}>{names[i]}</text>
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill={margin === null ? txt : margin >= 0 ? "#059669" : "#e11d48"}>
                {margin === null ? "—" : `${margin}%`}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-200 inline-block" /> {salesLabel}</span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-amber-300 inline-block" /> {expLabel}</span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> {profitLabel}</span>
      </div>
    </div>
  );
}

// اس مہینے بمقابلہ پچھلے مہینے: روزانہ جمع ہوتی فروخت
function CompareChart({ thisCum, lastCum, dark }: { thisCum: number[]; lastCum: number[]; dark: boolean }) {
  const W = 360, H = 170, padL = 6, padR = 6, padT = 14, padB = 20;
  const n = Math.max(thisCum.length, lastCum.length, 2);
  const max = Math.max(1, ...thisCum, ...lastCum);
  const x = (i: number) => padL + (i / (n - 1)) * (W - padL - padR);
  const y = (v: number) => H - padB - (v / max) * (H - padT - padB);
  const line = (a: number[]) => a.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const lastIdx = thisCum.length - 1;
  const area = thisCum.length > 1 ? `${line(thisCum)} L${x(lastIdx).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z` : "";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" dir="ltr" role="img" aria-label="month comparison">
      <defs>
        <linearGradient id="gCmp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10b981" stopOpacity="0.28" />
          <stop offset="1" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={padL} x2={W - padR} y1={y(max * g)} y2={y(max * g)} stroke={dark ? "#1e293b" : "#eef2f7"} />
      ))}
      <path d={line(lastCum)} fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="4 4" strokeLinecap="round" />
      {area && <path d={area} fill="url(#gCmp)" />}
      <path d={line(thisCum)} fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {lastIdx >= 0 && (
        <g>
          <circle cx={x(lastIdx)} cy={y(thisCum[lastIdx])} r="4" fill="#10b981" stroke="#fff" strokeWidth="2" />
          <text x={Math.min(W - 28, x(lastIdx))} y={y(thisCum[lastIdx]) - 9} textAnchor="middle" fontSize="9" fontWeight="800" fill="#059669">{compact(thisCum[lastIdx])}</text>
        </g>
      )}
      {[1, 8, 15, 22, n].filter((d) => d <= n).map((d) => (
        <text key={d} x={x(d - 1)} y={H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">{d}</text>
      ))}
    </svg>
  );
}

// دن کے کس وقت زیادہ فروخت ہوتی ہے
function HourChart({ hours, dark }: { hours: number[]; dark: boolean }) {
  const W = 360, H = 150, padB = 18, padT = 12;
  const max = Math.max(1, ...hours);
  const peak = hours.indexOf(Math.max(...hours));
  const slot = W / 24;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" dir="ltr" role="img" aria-label="sales by hour">
      <line x1="0" x2={W} y1={H - padB} y2={H - padB} stroke={dark ? "#334155" : "#e2e8f0"} />
      {hours.map((v, i) => {
        const bh = (v / max) * (H - padB - padT);
        const isPeak = v > 0 && i === peak;
        return (
          <g key={i}>
            <rect x={i * slot + 2} y={H - padB - bh} width={slot - 4} height={Math.max(v > 0 ? 3 : 1.5, bh)} rx="3" fill={isPeak ? "#f59e0b" : v > 0 ? "#6ee7b7" : dark ? "#1e293b" : "#f1f5f9"} />
            {isPeak && <text x={i * slot + slot / 2} y={H - padB - bh - 4} textAnchor="middle" fontSize="9" fontWeight="800" fill="#d97706">{compact(v)}</text>}
          </g>
        );
      })}
      {[0, 3, 6, 9, 12, 15, 18, 21].map((hr) => (
        <text key={hr} x={hr * slot + slot / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">
          {hr === 0 ? "12a" : hr < 12 ? `${hr}a` : hr === 12 ? "12p" : `${hr - 12}p`}
        </text>
      ))}
    </svg>
  );
}


// مغرب (غروبِ آفتاب) کا وقت۔ مقام نہ ملے تو ڈیفالٹ فیصل آباد
const SHOP_LAT = 31.4504;
const SHOP_LON = 73.135;
function sunsetMs(d: Date, lat: number, lon: number) {
  const rad = Math.PI / 180;
  const jd = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12) / 86400000 + 2440587.5;
  const n = Math.ceil(jd - 2451545.0 + 0.0008);
  const Js = n - lon / 360;
  const M = (357.5291 + 0.98560028 * Js) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const lam = (M + C + 180 + 102.9372) % 360;
  const Jt = 2451545.0 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lam * rad);
  const sinD = Math.sin(lam * rad) * Math.sin(23.4397 * rad);
  const cosD = Math.cos(Math.asin(sinD));
  const cosW = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sinD) / (Math.cos(lat * rad) * cosD);
  const w = Math.acos(Math.max(-1, Math.min(1, cosW))) / rad;
  return (Jt + w / 360 - 2440587.5) * 86400000;
}

// نفع کا پُل: فروخت ← لاگت ← اخراجات ← خالص نفع
function WaterfallChart({ sales, cost, expense, labels, dark }: { sales: number; cost: number; expense: number; labels: [string, string, string, string]; dark: boolean }) {
  const W = 360, H = 190, padT = 22, padB = 26, padX = 14;
  const profit = sales - cost - expense;
  const top = Math.max(1, sales, sales - cost);
  const bottom = Math.min(0, profit);
  const span = top - bottom || 1;
  const y = (v: number) => padT + ((top - v) / span) * (H - padT - padB);
  const slot = (W - padX * 2) / 4;
  const bw = Math.min(46, slot - 14);
  const bars = [
    { from: 0, to: sales, color: "#34d399", val: sales, label: labels[0], sign: "" },
    { from: sales - cost, to: sales, color: "#fbbf24", val: cost, label: labels[1], sign: "-" },
    { from: profit, to: sales - cost, color: "#fb7185", val: expense, label: labels[2], sign: "-" },
    { from: 0, to: profit, color: profit >= 0 ? "#059669" : "#e11d48", val: profit, label: labels[3], sign: "" },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" dir="ltr" role="img" aria-label="profit bridge">
      <line x1={padX} x2={W - padX} y1={y(0)} y2={y(0)} stroke={dark ? "#334155" : "#e2e8f0"} />
      {bars.map((b, i) => {
        const cx = padX + slot * i + slot / 2;
        const y1 = y(Math.max(b.from, b.to));
        const y2 = y(Math.min(b.from, b.to));
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={y1} width={bw} height={Math.max(2, y2 - y1)} rx="6" fill={b.color} opacity={i === 0 || i === 3 ? 1 : 0.85} />
            <text x={cx} y={y1 - 5} textAnchor="middle" fontSize="9" fontWeight="800" fill={dark ? "#e2e8f0" : "#334155"}>{b.sign}{compact(Math.abs(b.val))}</text>
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="9.5" fill="#94a3b8">{b.label}</text>
            {i < 3 && <line x1={cx + bw / 2} x2={cx + slot - bw / 2} y1={y(i === 0 ? sales : i === 1 ? sales - cost : profit)} y2={y(i === 0 ? sales : i === 1 ? sales - cost : profit)} stroke="#cbd5e1" strokeDasharray="3 3" />}
          </g>
        );
      })}
    </svg>
  );
}

// پچھلے 35 دن کی فروخت کا کیلنڈر (رنگ جتنا گہرا، فروخت اتنی زیادہ)
function HeatCalendar({ cells, dark, money }: { cells: { label: string; v: number; wd: number }[]; dark: boolean; money: (n: number) => string }) {
  const max = Math.max(1, ...cells.map((c) => c.v));
  const firstWd = cells.length ? cells[0].wd : 0;
  const padded: ({ label: string; v: number; wd: number } | null)[] = [...Array(firstWd).fill(null), ...cells];
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1.5 justify-center" dir="ltr">
      {padded.map((c, i) =>
        c === null ? (
          <span key={i} className="w-6 h-6 md:w-7 md:h-7" />
        ) : (
          <span
            key={i}
            title={`${c.label}: ${money(c.v)}`}
            className="w-6 h-6 md:w-7 md:h-7 rounded-md"
            style={{ background: c.v <= 0 ? (dark ? "#1e293b" : "#f1f5f9") : `rgba(16,185,129,${(0.2 + 0.8 * (c.v / max)).toFixed(2)})` }}
          />
        )
      )}
    </div>
  );
}

// گول فیصد کا چھوٹا کارڈ
function MiniRing({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const v = Math.max(0, Math.min(100, pct));
  const r = 40, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeOpacity="0.6" strokeWidth="11" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} />
    </svg>
  );
}

// اس ہفتے بمقابلہ پچھلا ہفتہ
function WeekCompare({ thisWeek, lastWeek, names, dark }: { thisWeek: number[]; lastWeek: number[]; names: string[]; dark: boolean }) {
  const W = 360, H = 160, padB = 22, padT = 12, padX = 10;
  const max = Math.max(1, ...thisWeek, ...lastWeek);
  const slot = (W - padX * 2) / 7;
  const bw = Math.min(14, slot / 3);
  const h = (v: number) => (v / max) * (H - padB - padT);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" dir="ltr" role="img" aria-label="week comparison">
      <line x1={padX} x2={W - padX} y1={H - padB} y2={H - padB} stroke={dark ? "#334155" : "#e2e8f0"} />
      {thisWeek.map((v, i) => {
        const cx = padX + slot * i + slot / 2;
        return (
          <g key={i}>
            <rect x={cx - bw - 1} y={H - padB - h(lastWeek[i])} width={bw} height={Math.max(2, h(lastWeek[i]))} rx="3" fill="#cbd5e1" />
            <rect x={cx + 1} y={H - padB - h(v)} width={bw} height={Math.max(2, h(v))} rx="3" fill="#10b981" />
            <text x={cx} y={H - 7} textAnchor="middle" fontSize="9" fill="#94a3b8">{names[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// سادہ افقی پٹیاں (مصنفین، آرڈرز کی حالت وغیرہ)
function HBars({ items, dark }: { items: { label: string; value: number; shown: string; color: string }[]; dark: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label}>
          <div className="flex items-center justify-between gap-3 text-xs mb-1">
            <span className={`truncate font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>{it.label}</span>
            <span className="shrink-0 text-slate-400" dir="ltr">{it.shown}</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(3, (it.value / max) * 100)}%`, background: it.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<"ur" | "en">("ur");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [books, setBooks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [supplierList, setSupplierList] = useState<any[]>([]);
  const [supOrders, setSupOrders] = useState<any[]>([]);
  const [supPays, setSupPays] = useState<any[]>([]);
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [targetAmt, setTargetAmt] = useState(0);
  const [backupDays, setBackupDays] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [hijriOffset, setHijriOffset] = useState(0);
  const [geo, setGeo] = useState<{ lat: number; lon: number; real: boolean }>({ lat: SHOP_LAT, lon: SHOP_LON, real: false });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [gSearch, setGSearch] = useState("");

  // موجودہ مقام (جہاں ڈیش بورڈ کھولا جائے) کے مطابق مغرب کا وقت
  const locateMe = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const g = { lat: pos.coords.latitude, lon: pos.coords.longitude, real: true };
        setGeo(g);
        try { localStorage.setItem("maktaba-geo", JSON.stringify({ lat: g.lat, lon: g.lon, at: Date.now() })); } catch {}
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 6 * 3600 * 1000 }
    );
  };
  useEffect(() => {
    try {
      const raw = localStorage.getItem("maktaba-geo");
      if (raw) {
        const g = JSON.parse(raw);
        if (typeof g.lat === "number" && typeof g.lon === "number") setGeo({ lat: g.lat, lon: g.lon, real: true });
      }
    } catch {}
    locateMe(); // ہر بار تازہ مقام (اجازت پہلی بار پوچھی جائے گی)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem("maktaba-hijri-offset") || 0);
      if (v >= -2 && v <= 2) setHijriOffset(v);
    } catch {}
  }, []);
  useEffect(() => {
    // ایڈمن کی جانچ: لاگ ان کوکی موجود ہو تو مالی اعداد و شمار نظر آئیں گے
    setIsAdmin(/(^|;\s*)maktaba-auth=[^;]+/.test(document.cookie));
  }, []);

  useEffect(() => {
    try {
      setTargetAmt(Number(localStorage.getItem("maktaba-target")) || 0);
      const lb = localStorage.getItem("maktaba-last-backup");
      setBackupDays(lb ? Math.floor((Date.now() - new Date(lb).getTime()) / 86400000) : null);
    } catch {}
  }, []);

  useEffect(() => {
    // عام گاہکوں کے لیے ٹوکری میں موجود اشیا کی تعداد
    const refresh = () => setCartCount(getCartCount());
    refresh();
    window.addEventListener("maktaba-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("maktaba-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: booksData } = await supabase
        .from("books")
        .select("*")
        .order("id", { ascending: true });
      if (booksData) setBooks(booksData);

      const { data: ordersData } = await supabase.from("orders").select("*");
      if (ordersData) setOrders(ordersData);

      const { data: invoicesData } = await supabase.from("invoices").select("*");
      if (invoicesData) setInvoices(invoicesData);

      const { data: invoiceItemsData } = await supabase.from("invoice_items").select("invoice_id, book_id, item_title, quantity, total_price");
      if (invoiceItemsData) setInvoiceItems(invoiceItemsData);

      const { data: expensesData } = await supabase.from("expenses").select("*");
      if (expensesData) setExpenses(expensesData);

      // باقی ماڈیولز: کوئی ٹیبل نہ ہو تو خاموشی سے چھوڑ دیں
      const safe = async (table: string, setter: (rows: any[]) => void) => {
        try {
          const { data, error } = await supabase.from(table).select("*");
          if (!error && data) setter(data);
        } catch {}
      };
      await Promise.all([
        safe("customers", setCustomersList),
        safe("suppliers", setSupplierList),
        safe("supplier_orders", setSupOrders),
        safe("supplier_payments", setSupPays),
        safe("book_returns", setReturnsList),
        safe("reviews", setReviewsList),
        safe("stock_alerts", (rows) => setAlertCount(rows.length)),
      ]);

      setLoaded(true);
      setLastUpdated(new Date());
    };
    fetchAll();
  }, [refreshTick]);

  // ہر 5 منٹ بعد خود تازہ ہو جائے
  useEffect(() => {
    const id = setInterval(() => setRefreshTick((n) => n + 1), 300000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  // فروخت کے تمام اندراجات: آرڈرز اور بل (انوائسز) دونوں سے
  const costByBook = new Map<any, number>(books.map((b) => [b.id, Number(b.cost_price) || 0]));
  const invoiceCostMap = new Map<any, number>();
  invoiceItems.forEach((it) => {
    const c = (it.quantity || 0) * (costByBook.get(it.book_id) || 0);
    invoiceCostMap.set(it.invoice_id, (invoiceCostMap.get(it.invoice_id) || 0) + c);
  });
  const saleEntries: { date: Date; revenue: number; cost: number }[] = [
    ...orders.map((o) => ({
      date: new Date(o.created_at || Date.now()),
      revenue: o.book_price || 0,
      cost: o.cost_price || 0,
    })),
    ...invoices.map((inv) => ({
      date: new Date(inv.created_at || Date.now()),
      revenue: Number(inv.total_amount) || 0,
      cost: invoiceCostMap.get(inv.id) || 0,
    })),
  ];
  const thisMonthOrders = saleEntries.filter((o) => {
    const d = o.date;
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.revenue, 0);
  const thisMonthCost = thisMonthOrders.reduce((sum, o) => sum + o.cost, 0);
  const thisMonthExpenseTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthProfit = thisMonthRevenue - thisMonthCost - thisMonthExpenseTotal;

  // ہر مہینے کا نفع: فروخت - لاگت - اخراجات
  const monthNamesUr = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
  const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthlyMap: Record<string, { year: number; month: number; revenue: number; cost: number; expense: number }> = {};
  const getMonthEntry = (d: Date) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthlyMap[key]) {
      monthlyMap[key] = { year: d.getFullYear(), month: d.getMonth(), revenue: 0, cost: 0, expense: 0 };
    }
    return monthlyMap[key];
  };
  getMonthEntry(now);
  saleEntries.forEach((o) => {
    const d = o.date;
    if (isNaN(d.getTime())) return;
    const m = getMonthEntry(d);
    m.revenue += o.revenue;
    m.cost += o.cost;
  });
  expenses.forEach((e) => {
    const d = new Date(e.expense_date);
    if (isNaN(d.getTime())) return;
    getMonthEntry(d).expense += e.amount || 0;
  });
  const monthlyStats = Object.values(monthlyMap)
    .sort((x, y) => y.year * 12 + y.month - (x.year * 12 + x.month))
    .map((m) => ({ ...m, profit: m.revenue - m.cost - m.expense }));

  const totalStockValue = books.reduce((sum, b) => sum + (b.price || 0) * (b.stock || 0), 0);
  const totalBooks = books.length;
  const totalAuthors = new Set(books.map((b) => b.author)).size;
  const totalCategories = new Set(books.map((b) => b.category)).size;


  // --- اضافی اعداد و شمار ڈیش بورڈ کے لیے ---
  const todayKey = now.toDateString();
  const todaySales =
    orders.filter((o) => new Date(o.created_at || 0).toDateString() === todayKey).reduce((s, o) => s + (Number(o.book_price) || 0), 0) +
    invoices.filter((i) => new Date(i.created_at || 0).toDateString() === todayKey).reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const duesTotal = invoices
    .filter((i) => i.payment_status !== "paid")
    .reduce((s, i) => s + Math.max(0, (Number(i.total_amount) || 0) - (Number(i.amount_paid) || 0)), 0);
  const orderGroups = (() => {
    const map = new Map<string, any[]>();
    orders.forEach((o) => {
      const key = String(o.order_group ?? o.id);
      const arr = map.get(key) || [];
      arr.push(o);
      map.set(key, arr);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b[0].created_at || 0).getTime() - new Date(a[0].created_at || 0).getTime()
    );
  })();
  const newOrderCount = orderGroups.filter((g) => g[0].status === "نیا").length;
  const lowStockBooks = books
    .filter((b) => (Number(b.stock) || 0) <= ((Number(b.price) || 0) >= 1000 ? 2 : 3))
    .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0));
  const chartMonths = [...monthlyStats].slice(0, 6).reverse();
  const chartMax = Math.max(1, ...chartMonths.map((m) => m.revenue));
  const L = (ur: string, en: string) => (lang === "ur" ? ur : en);
  const HIJRI_UR = ["محرم الحرام", "صفر المظفر", "ربیع الاول", "ربیع الثانی", "جمادی الاولیٰ", "جمادی الثانیہ", "رجب المرجب", "شعبان المعظم", "رمضان المبارک", "شوال المکرم", "ذوالقعدہ", "ذوالحجہ"];
  const HIJRI_EN = ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qa'dah", "Dhu al-Hijjah"];
  const maghribAt = sunsetMs(now, geo.lat, geo.lon);
  const afterMaghrib = now.getTime() >= maghribAt;
  const maghribTimeText = new Date(maghribAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const hijriText = (() => {
    try {
      // اسلامی دن مغرب سے شروع ہوتا ہے، اس لیے مغرب کے بعد اگلے دن کی تاریخ
      const d = new Date(now.getTime() + (hijriOffset + (afterMaghrib ? 1 : 0)) * 86400000);
      const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(d);
      const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
      const day = g("day"), mon = g("month"), yr = g("year");
      if (!day || !mon || !yr) return "";
      const name = (lang === "ur" ? HIJRI_UR : HIJRI_EN)[mon - 1] || "";
      return lang === "ur" ? `${day} ${name} ${yr} ھ` : `${day} ${name} ${yr} AH`;
    } catch {
      return "";
    }
  })();
  const changeHijriOffset = (v: number) => {
    const n = Math.max(-2, Math.min(2, v));
    setHijriOffset(n);
    try { localStorage.setItem("maktaba-hijri-offset", String(n)); } catch {}
  };
  const money = (n: number) => "Rs " + Math.round(n).toLocaleString("en-US");
  const dateText = now.toLocaleDateString(lang === "ur" ? "ur-PK" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const statusStyle = (s: string) =>
    s === "مکمل ہوا"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : s === "زیر عمل"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-sky-50 text-sky-700 ring-sky-200";
  const card = darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-100 shadow-[0_2px_14px_rgba(15,23,42,0.05)]";
  const muted = darkMode ? "text-slate-400" : "text-slate-400";
  const strong = darkMode ? "text-white" : "text-slate-900";

  // --- گراف اور تجزیے کے لیے ---
  const dayKey = (d: Date) => d.toDateString();
  const dailyMap = new Map<string, { revenue: number; cost: number }>();
  saleEntries.forEach((e) => {
    if (isNaN(e.date.getTime())) return;
    const k = dayKey(e.date);
    const cur = dailyMap.get(k) || { revenue: 0, cost: 0 };
    cur.revenue += e.revenue;
    cur.cost += e.cost;
    dailyMap.set(k, cur);
  });
  const orderCountByDay = new Map<string, number>();
  orderGroups.forEach((g) => {
    const k = dayKey(new Date(g[0].created_at || 0));
    orderCountByDay.set(k, (orderCountByDay.get(k) || 0) + 1);
  });
  const days30 = Array.from({ length: 30 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - idx));
    const v = dailyMap.get(dayKey(d)) || { revenue: 0, cost: 0 };
    return { day: d.getDate(), revenue: v.revenue, profit: v.revenue - v.cost, orders: orderCountByDay.get(dayKey(d)) || 0 };
  });
  const last7 = days30.slice(-7);

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastM = monthlyMap[`${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`];
  const lastMonthRevenue = lastM ? lastM.revenue : 0;
  const lastMonthProfit = lastM ? lastM.revenue - lastM.cost - lastM.expense : 0;
  const growth = (cur: number, prev: number) => (prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100);
  const salesGrowth = growth(thisMonthRevenue, lastMonthRevenue);
  const profitGrowth = growth(thisMonthProfit, lastMonthProfit);

  const inThisMonth = (v: any) => {
    const d = new Date(v || 0);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const monthOrders = orders.filter((o) => inThisMonth(o.created_at));
  const monthInvoices = invoices.filter((i) => inThisMonth(i.created_at));
  const onlineRevenue = monthOrders.reduce((s, o) => s + (Number(o.book_price) || 0), 0);
  const shopRevenue = monthInvoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const monthTxCount = new Set(monthOrders.map((o) => String(o.order_group ?? o.id))).size + monthInvoices.length;
  const avgTx = monthTxCount > 0 ? thisMonthRevenue / monthTxCount : 0;

  const bookTitleById = new Map<any, string>(books.map((b) => [b.id, b.title]));
  const monthInvoiceIds = new Set(monthInvoices.map((i) => i.id));
  const topMap = new Map<string, { qty: number; revenue: number }>();
  const addTop = (title: string, qty: number, revenue: number) => {
    if (!title) return;
    const cur = topMap.get(title) || { qty: 0, revenue: 0 };
    cur.qty += qty;
    cur.revenue += revenue;
    topMap.set(title, cur);
  };
  monthOrders.forEach((o) => addTop(o.book_title, Number(o.quantity) || 0, Number(o.book_price) || 0));
  invoiceItems
    .filter((it) => monthInvoiceIds.has(it.invoice_id))
    .forEach((it) => addTop(bookTitleById.get(it.book_id) || it.item_title || "", Number(it.quantity) || 0, Number(it.total_price) || 0));
  const topBooks = Array.from(topMap.entries())
    .map(([title, v]) => ({ title, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const topMaxQty = Math.max(1, ...topBooks.map((b) => b.qty));

  const topN = (entries: { label: string; value: number }[], n: number, otherLabel: string) => {
    const sorted = entries.filter((e) => e.value > 0).sort((a, b) => b.value - a.value);
    const head5 = sorted.slice(0, n);
    const rest = sorted.slice(n).reduce((s, e) => s + e.value, 0);
    return rest > 0 ? [...head5, { label: otherLabel, value: rest }] : head5;
  };
  const expMap = new Map<string, number>();
  thisMonthExpenses.forEach((e) => expMap.set(e.title || "—", (expMap.get(e.title || "—") || 0) + (Number(e.amount) || 0)));
  const expenseSlices = topN(Array.from(expMap.entries()).map(([label, value]) => ({ label, value })), 4, lang === "ur" ? "دیگر" : "Other");
  const catMap = new Map<string, number>();
  books.forEach((b) => catMap.set(b.category || "—", (catMap.get(b.category || "—") || 0) + (Number(b.price) || 0) * (Number(b.stock) || 0)));
  const categorySlices = topN(Array.from(catMap.entries()).map(([label, value]) => ({ label, value })), 4, lang === "ur" ? "دیگر" : "Other");
  const collected = invoices.reduce((s, i) => s + (Number(i.amount_paid) || 0), 0);
  const collectSlices = [
    { label: lang === "ur" ? "وصول شدہ" : "Collected", value: collected },
    { label: lang === "ur" ? "بقایا" : "Dues", value: duesTotal },
  ].filter((x) => x.value > 0);
  const sourceSlices = [
    { label: lang === "ur" ? "آن لائن آرڈرز" : "Online orders", value: onlineRevenue },
    { label: lang === "ur" ? "دکان / بل" : "Shop bills", value: shopRevenue },
  ].filter((x) => x.value > 0);

  // --- پورے کاروبار کا جائزہ ---
  const customerName = new Map<any, string>(customersList.map((c) => [c.id, c.name]));
  const spendMap = new Map<string, number>();
  orderGroups.forEach((g) => {
    const nm = String(g[0].customer_name || "").trim();
    if (!nm) return;
    const tot = Number((g.find((r: any) => r.total_amount) || g[0]).total_amount) || 0;
    spendMap.set(nm, (spendMap.get(nm) || 0) + tot);
  });
  invoices.forEach((i) => {
    const nm = customerName.get(i.customer_id);
    if (!nm) return;
    spendMap.set(nm, (spendMap.get(nm) || 0) + (Number(i.total_amount) || 0));
  });
  const topCustomers = Array.from(spendMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const topCustMax = Math.max(1, ...topCustomers.map((c) => c.total));

  const supplierBalances = supplierList
    .map((sp) => {
      const received = supOrders.filter((o) => o.supplier_id === sp.id).reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
      const mine = supPays.filter((p) => p.supplier_id === sp.id);
      const charges = mine.filter((p) => p.kind === "charge").reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const paid = mine.filter((p) => p.kind !== "charge").reduce((s, p) => s + (Number(p.amount) || 0), 0);
      return { name: sp.name as string, balance: received + charges - paid };
    })
    .filter((x) => Math.round(x.balance) > 0)
    .sort((a, b) => b.balance - a.balance);
  const payableTotal = supplierBalances.reduce((s, x) => s + x.balance, 0);

  const weekdayNames = lang === "ur" ? ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdaySums = [0, 0, 0, 0, 0, 0, 0];
  const cutoff90 = Date.now() - 90 * 86400000;
  saleEntries.forEach((e) => {
    if (isNaN(e.date.getTime()) || e.date.getTime() < cutoff90) return;
    weekdaySums[e.date.getDay()] += e.revenue;
  });
  const weekdayMax = Math.max(1, ...weekdaySums);
  const bestDay = weekdaySums.indexOf(Math.max(...weekdaySums));

  const reviewsPending = reviewsList.filter((r) => r.is_approved === false || r.approved === false || r.status === "pending").length;
  const returnsThisMonth = returnsList.filter((r) => inThisMonth(r.created_at)).length;
  const unpaidInvoiceCount = invoices.filter((i) => i.payment_status !== "paid").length;
  const booksNoCost = books.filter((b) => !(Number(b.cost_price) > 0)).length;
  const booksNoPrice = books.filter((b) => !(Number(b.price) > 0)).length;

  const ago = (d: Date) => {
    const m = Math.floor((Date.now() - d.getTime()) / 60000);
    if (isNaN(m)) return "";
    if (m < 1) return lang === "ur" ? "ابھی" : "now";
    if (m < 60) return `${m} ${lang === "ur" ? "منٹ پہلے" : "min ago"}`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ${lang === "ur" ? "گھنٹے پہلے" : "h ago"}`;
    const dd = Math.floor(h / 24);
    return `${dd} ${lang === "ur" ? "دن پہلے" : "d ago"}`;
  };

  const activeSaleCount = books.filter((b) => isOnSale(b)).length;
  const saleEndingSoon = books.filter((b) => {
    if (!isOnSale(b) || !b.sale_ends_at || !saleActive(b.sale_ends_at)) return false;
    const days = (new Date(String(b.sale_ends_at).slice(0, 10) + "T23:59:59").getTime() - Date.now()) / 86400000;
    return days <= 3;
  });
  const hr = now.getHours();
  const greeting = hr < 12 ? L("صبح بخیر ☀️", "Good morning ☀️") : hr < 17 ? L("السلام علیکم 👋", "Good afternoon 👋") : L("شام بخیر 🌙", "Good evening 🌙");
  const gTerm = gSearch.trim().toLowerCase();
  const gBooks = gTerm.length < 2 ? [] : books.filter((b) => String(b.title || "").toLowerCase().includes(gTerm) || String(b.author || "").toLowerCase().includes(gTerm)).slice(0, 6);
  const gCustomers = gTerm.length < 2 ? [] : customersList.filter((c) => String(c.name || "").toLowerCase().includes(gTerm) || String(c.phone || "").includes(gTerm)).slice(0, 4);

  const attention = [
    newOrderCount > 0 && { icon: "🛒", text: lang === "ur" ? `${newOrderCount} نئے آرڈرز پر کارروائی باقی ہے` : `${newOrderCount} new orders waiting`, href: "/orders", tone: "bg-sky-50 text-sky-700 border-sky-100" },
    duesTotal > 0 && { icon: "💰", text: lang === "ur" ? `گاہکوں سے وصولی: ${money(duesTotal)} (${unpaidInvoiceCount} بل)` : `Dues to collect: ${money(duesTotal)}`, href: "/invoices", tone: "bg-rose-50 text-rose-600 border-rose-100" },
    payableTotal > 0 && { icon: "🚚", text: lang === "ur" ? `سپلائرز کو ادائیگی: ${money(payableTotal)}` : `Owed to suppliers: ${money(payableTotal)}`, href: "/suppliers", tone: "bg-amber-50 text-amber-700 border-amber-100" },
    lowStockBooks.length > 0 && { icon: "📦", text: lang === "ur" ? `${lowStockBooks.length} کتابوں کا سٹاک کم یا ختم` : `${lowStockBooks.length} books low/out of stock`, href: "/low-stock", tone: "bg-orange-50 text-orange-700 border-orange-100" },
    alertCount > 0 && { icon: "🔔", text: lang === "ur" ? `${alertCount} گاہکوں نے کتاب آنے پر اطلاع مانگی ہے` : `${alertCount} back-in-stock requests`, href: "/low-stock", tone: "bg-violet-50 text-violet-700 border-violet-100" },
    reviewsPending > 0 && { icon: "⭐", text: lang === "ur" ? `${reviewsPending} ریویوز منظوری کے منتظر` : `${reviewsPending} reviews awaiting approval`, href: "/reviews", tone: "bg-yellow-50 text-yellow-700 border-yellow-100" },
    saleEndingSoon.length > 0 && { icon: "⏰", text: lang === "ur" ? `${saleEndingSoon.length} کتب کی سیل 3 دن میں ختم ہو رہی ہے` : `${saleEndingSoon.length} sales ending within 3 days`, href: "/books", tone: "bg-rose-50 text-rose-600 border-rose-100" },
    activeSaleCount > 0 && { icon: "🔥", text: lang === "ur" ? `${activeSaleCount} کتب اس وقت سیل پر ہیں` : `${activeSaleCount} books currently on sale`, href: "/books", tone: "bg-orange-50 text-orange-700 border-orange-100" },
    booksNoPrice > 0 && { icon: "🏷️", text: lang === "ur" ? `${booksNoPrice} کتابوں کی فروخت قیمت درج نہیں` : `${booksNoPrice} books have no sale price`, href: "/books", tone: "bg-slate-50 text-slate-600 border-slate-200" },
    booksNoCost > 0 && { icon: "🧮", text: lang === "ur" ? `${booksNoCost} کتابوں کی خرید قیمت درج نہیں (نفع غلط آ سکتا ہے)` : `${booksNoCost} books have no cost price`, href: "/books", tone: "bg-slate-50 text-slate-600 border-slate-200" },
    (backupDays === null || backupDays >= 7) && { icon: "💾", text: backupDays === null ? (lang === "ur" ? "بیک اپ ابھی نہیں لیا" : "No backup taken yet") : (lang === "ur" ? `آخری بیک اپ ${backupDays} دن پہلے لیا تھا` : `Last backup ${backupDays} days ago`), href: "/backup", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  ].filter(Boolean) as { icon: string; text: string; href: string; tone: string }[];

  const activity = [
    ...orderGroups.slice(0, 6).map((g) => ({
      date: new Date(g[0].created_at || 0),
      icon: "🛒",
      title: `${lang === "ur" ? "آن لائن آرڈر" : "Online order"} — ${g[0].customer_name || "—"}`,
      sub: money(Number((g.find((r: any) => r.total_amount) || g[0]).total_amount) || 0),
      href: "/orders",
    })),
    ...[...invoices]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 6)
      .map((i) => ({
        date: new Date(i.created_at || 0),
        icon: "🧾",
        title: `${lang === "ur" ? "بل" : "Bill"} #${i.id}${customerName.get(i.customer_id) ? " — " + customerName.get(i.customer_id) : ""}`,
        sub: money(Number(i.total_amount) || 0),
        href: "/invoices",
      })),
    ...[...expenses]
      .sort((a, b) => new Date(b.created_at || b.expense_date || 0).getTime() - new Date(a.created_at || a.expense_date || 0).getTime())
      .slice(0, 4)
      .map((e) => ({
        date: new Date(e.created_at || e.expense_date || 0),
        icon: "💸",
        title: `${lang === "ur" ? "خرچہ" : "Expense"} — ${e.title || ""}`,
        sub: money(Number(e.amount) || 0),
        href: "/expenses",
      })),
    ...[...returnsList]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 3)
      .map((r) => ({
        date: new Date(r.created_at || 0),
        icon: "↩️",
        title: lang === "ur" ? "واپسی / خراب مال" : "Return / damaged",
        sub: "",
        href: "/returns",
      })),
  ]
    .filter((e) => !isNaN(e.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  const changeTarget = () => {
    const v = window.prompt(lang === "ur" ? "اس مہینے کی فروخت کا ہدف (روپے) لکھیں:" : "Monthly sales target (Rs):", targetAmt ? String(targetAmt) : "");
    if (v === null) return;
    const n = Math.max(0, Number(v.replace(/[^0-9.]/g, "")) || 0);
    setTargetAmt(n);
    try {
      localStorage.setItem("maktaba-target", String(n));
    } catch {}
  };

  const handleLogout = async () => {
    document.cookie = "maktaba-auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const t = {
    ur: {
      menu: "مینو",
      dashboard: "ڈیش بورڈ",
      books: "کتب",
      authors: "مصنفین",
      categories: "زمرے",
      orders: "آرڈرز",
      customers: "کسٹمرز",
      bills: "بل / انوائس",
      suppliers: "سپلائرز",
      returns: "واپسی/خراب",
      reviews: "ریویوز",
      lowStock: "کم سٹاک",
      expenses: "اخراجات",
      logout: "لاگ آؤٹ",
      sales: "فروخت",
      cost: "لاگت",
      expenseLabel: "اخراجات",
    },
    en: {
      menu: "Menu",
      dashboard: "Dashboard",
      books: "Books",
      authors: "Authors",
      categories: "Categories",
      orders: "Orders",
      customers: "Customers",
      bills: "Bills / Invoices",
      suppliers: "Suppliers",
      returns: "Returns",
      reviews: "Reviews",
      lowStock: "Low Stock",
      expenses: "Expenses",
      logout: "Logout",
      sales: "Sales",
      cost: "Cost",
      expenseLabel: "Expenses",
    },
  }[lang];

  const menuItems = [
    { href: "/", label: t.dashboard, icon: LayoutDashboard, active: true, badge: 0 },
    { href: "/books", label: t.books, icon: BookOpen, badge: 0 },
    { href: "/authors", label: t.authors, icon: PenLine, badge: 0 },
    { href: "/categories", label: t.categories, icon: FolderTree, badge: 0 },
    { href: "/orders", label: t.orders, icon: ShoppingCart, badge: newOrderCount },
    { href: "/customers", label: t.customers, icon: Users, badge: 0 },
    { href: "/invoices", label: t.bills, icon: Receipt, badge: 0 },
    { href: "/suppliers", label: t.suppliers, icon: Truck, badge: 0 },
    { href: "/returns", label: t.returns, icon: RotateCcw, badge: 0 },
    { href: "/reviews", label: t.reviews, icon: Star, badge: 0 },
    { href: "/low-stock", label: t.lowStock, icon: PackageMinus, badge: lowStockBooks.length },
    { href: "/expenses", label: t.expenses, icon: Wallet, badge: 0 },
    { href: "/reports", label: L("رپورٹس", "Reports"), icon: TrendingUp, badge: 0 },
    { href: "/backup", label: L("بیک اپ", "Backup"), icon: Download, badge: 0 },
  ];

  const quickActions = [
    { href: "/invoices", label: L("نیا بل", "New Bill"), icon: Plus, tone: "bg-emerald-50 text-emerald-600" },
    { href: "/orders", label: L("آرڈرز", "Orders"), icon: ShoppingCart, tone: "bg-sky-50 text-sky-600" },
    { href: "/books", label: L("کتب", "Books"), icon: BookOpen, tone: "bg-violet-50 text-violet-600" },
    { href: "/suppliers", label: L("سپلائرز", "Suppliers"), icon: Truck, tone: "bg-amber-50 text-amber-600" },
    { href: "/reports", label: L("رپورٹس", "Reports"), icon: TrendingUp, tone: "bg-teal-50 text-teal-600" },
    { href: "/expenses", label: L("اخراجات", "Expenses"), icon: Wallet, tone: "bg-rose-50 text-rose-500" },
  ];

  const kpis = [
    { label: L("آج کی فروخت", "Today's Sales"), value: money(todaySales), icon: ShoppingBag, tone: "text-emerald-600 bg-emerald-50", href: "/invoices", spark: last7.map((d) => d.revenue), color: "#34d399" },
    { label: L("نئے آرڈرز", "New Orders"), value: String(newOrderCount), icon: ShoppingCart, tone: "text-sky-600 bg-sky-50", href: "/orders", spark: last7.map((d) => d.orders), color: "#38bdf8" },
    { label: L("وصول طلب بقایا", "Dues to Collect"), value: money(duesTotal), icon: Receipt, tone: "text-rose-500 bg-rose-50", href: "/invoices", spark: null, color: "#fb7185" },
    { label: L("کم سٹاک کتب", "Low Stock"), value: String(lowStockBooks.length), icon: PackageMinus, tone: "text-amber-600 bg-amber-50", href: "/low-stock", spark: null, color: "#fbbf24" },
  ];

  const modules = [
    { href: "/books", icon: BookOpen, tone: "bg-emerald-50 text-emerald-600", label: t.books, value: String(totalBooks), sub: `${lowStockBooks.length} ${L("کم سٹاک", "low")}` },
    { href: "/authors", icon: PenLine, tone: "bg-violet-50 text-violet-600", label: t.authors, value: String(totalAuthors), sub: "" },
    { href: "/categories", icon: FolderTree, tone: "bg-amber-50 text-amber-600", label: t.categories, value: String(totalCategories), sub: "" },
    { href: "/orders", icon: ShoppingCart, tone: "bg-sky-50 text-sky-600", label: t.orders, value: String(orderGroups.length), sub: `${newOrderCount} ${L("نئے", "new")}` },
    { href: "/customers", icon: Users, tone: "bg-teal-50 text-teal-600", label: t.customers, value: String(customersList.length), sub: "" },
    { href: "/invoices", icon: Receipt, tone: "bg-rose-50 text-rose-500", label: t.bills, value: String(invoices.length), sub: `${unpaidInvoiceCount} ${L("غیر ادا", "unpaid")}` },
    { href: "/suppliers", icon: Truck, tone: "bg-orange-50 text-orange-600", label: t.suppliers, value: String(supplierList.length), sub: payableTotal > 0 ? money(payableTotal) : "" },
    { href: "/returns", icon: RotateCcw, tone: "bg-slate-100 text-slate-600", label: t.returns, value: String(returnsList.length), sub: `${returnsThisMonth} ${L("اس مہینے", "this month")}` },
    { href: "/reviews", icon: Star, tone: "bg-yellow-50 text-yellow-600", label: t.reviews, value: String(reviewsList.length), sub: reviewsPending > 0 ? `${reviewsPending} ${L("منتظر", "pending")}` : "" },
    { href: "/expenses", icon: Wallet, tone: "bg-pink-50 text-pink-500", label: t.expenses, value: money(thisMonthExpenseTotal), sub: L("اس مہینے", "this month") },
    { href: "/reports", icon: TrendingUp, tone: "bg-cyan-50 text-cyan-600", label: L("رپورٹس", "Reports"), value: "PDF", sub: L("نفع / مصنف / سپلائر", "profit reports") },
    { href: "/backup", icon: Download, tone: "bg-lime-50 text-lime-600", label: L("بیک اپ", "Backup"), value: backupDays === null ? "—" : backupDays === 0 ? L("آج", "Today") : `${backupDays}${L(" دن", "d")}`, sub: L("آخری بیک اپ", "last backup") },
  ];

  const counters = [
    { label: L("سٹاک کی مالیت", "Stock Value"), value: money(totalStockValue), icon: Boxes, href: "/books", tone: "text-blue-600 bg-blue-50" },
    { label: t.books, value: String(totalBooks), icon: BookOpen, href: isAdmin ? "/books" : "/shop", tone: "text-emerald-600 bg-emerald-50" },
    { label: t.authors, value: String(totalAuthors), icon: PenLine, href: isAdmin ? "/authors" : "/shop", tone: "text-violet-600 bg-violet-50" },
    { label: t.categories, value: String(totalCategories), icon: FolderTree, href: isAdmin ? "/categories" : "/shop", tone: "text-amber-600 bg-amber-50" },
  ];

  // --- نئے تجزیے: مارجن، متوقع فروخت، بہترین دن، مہینوں کا موازنہ، اوقات ---
  const dayOfMonth = now.getDate();
  const daysInThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysInLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const marginPct = thisMonthRevenue > 0 ? (thisMonthProfit / thisMonthRevenue) * 100 : null;
  const projectedSales = dayOfMonth > 0 ? (thisMonthRevenue / dayOfMonth) * daysInThisMonth : 0;
  const avgPerDay = dayOfMonth > 0 ? thisMonthRevenue / dayOfMonth : 0;
  const monthRevenueOfDay = (y2: number, m2: number, d2: number) => {
    const v = dailyMap.get(new Date(y2, m2, d2).toDateString());
    return v ? v.revenue : 0;
  };
  let bestDayRev = 0, bestDayNo = 0;
  for (let d2 = 1; d2 <= dayOfMonth; d2++) {
    const r2 = monthRevenueOfDay(now.getFullYear(), now.getMonth(), d2);
    if (r2 > bestDayRev) { bestDayRev = r2; bestDayNo = d2; }
  }
  const thisCum: number[] = [];
  { let acc = 0; for (let d2 = 1; d2 <= dayOfMonth; d2++) { acc += monthRevenueOfDay(now.getFullYear(), now.getMonth(), d2); thisCum.push(acc); } }
  const lastCum: number[] = [];
  { let acc = 0; for (let d2 = 1; d2 <= daysInLastMonth; d2++) { acc += monthRevenueOfDay(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), d2); lastCum.push(acc); } }
  const lastMonthSameDay = lastCum[Math.min(dayOfMonth, lastCum.length) - 1] || 0;
  const vsLastSameDay = growth(thisMonthRevenue, lastMonthSameDay);
  const hourSums = Array.from({ length: 24 }, () => 0);
  {
    const since = now.getTime() - 90 * 86400000;
    saleEntries.forEach((e) => {
      const tm = e.date.getTime();
      if (isNaN(tm) || tm < since) return;
      hourSums[e.date.getHours()] += e.revenue;
    });
  }
  const peakHour = hourSums.some((v) => v > 0) ? hourSums.indexOf(Math.max(...hourSums)) : -1;
  const hourLabel = (h2: number) => {
    const h12 = h2 % 12 === 0 ? 12 : h2 % 12;
    return `${h12}:00 ${h2 < 12 ? "AM" : "PM"}`;
  };
  const sixMonths = [...monthlyStats].slice(0, 6).reverse();

  // --- مزید تجزیے ---
  const wdUr = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];
  const wdEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayAt = (back: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
  const revOfDate = (d3: Date) => (dailyMap.get(d3.toDateString()) || { revenue: 0, cost: 0 }).revenue;
  const thisWeekVals = Array.from({ length: 7 }, (_, i) => revOfDate(dayAt(6 - i)));
  const lastWeekVals = Array.from({ length: 7 }, (_, i) => revOfDate(dayAt(13 - i)));
  const weekNames = Array.from({ length: 7 }, (_, i) => (lang === "ur" ? wdUr : wdEn)[dayAt(6 - i).getDay()].slice(0, lang === "ur" ? 4 : 3));
  const thisWeekTotal = thisWeekVals.reduce((a, b) => a + b, 0);
  const lastWeekTotal = lastWeekVals.reduce((a, b) => a + b, 0);
  const weekGrowth = growth(thisWeekTotal, lastWeekTotal);
  const heatCells = Array.from({ length: 35 }, (_, i) => {
    const d3 = dayAt(34 - i);
    return { label: d3.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), v: revOfDate(d3), wd: d3.getDay() };
  });
  const authorByTitle = new Map<string, string>(books.map((b) => [b.title, b.author || "—"]));
  const authorMap = new Map<string, number>();
  topMap.forEach((v, title) => {
    const a2 = authorByTitle.get(title) || "—";
    authorMap.set(a2, (authorMap.get(a2) || 0) + v.revenue);
  });
  const topAuthors = Array.from(authorMap.entries())
    .filter(([a2, v]) => a2 !== "—" && v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const statusCount = new Map<string, number>();
  orderGroups.forEach((g) => statusCount.set(g[0].status || "نیا", (statusCount.get(g[0].status || "نیا") || 0) + 1));
  const statusColor = (st: string) => (st === "مکمل ہوا" ? "#10b981" : st === "زیر عمل" ? "#f59e0b" : st === "نیا" ? "#38bdf8" : "#94a3b8");
  const pipeline = Array.from(statusCount.entries()).map(([label, value]) => ({ label, value, shown: String(value), color: statusColor(label) }));
  const expenseRatio = thisMonthRevenue > 0 ? (thisMonthExpenseTotal / thisMonthRevenue) * 100 : 0;
  const collectRate = collected + duesTotal > 0 ? (collected / (collected + duesTotal)) * 100 : 0;
  const returnRate = monthTxCount > 0 ? (returnsThisMonth / monthTxCount) * 100 : 0;
  const stockHealth = totalBooks > 0 ? ((totalBooks - lowStockBooks.length) / totalBooks) * 100 : 0;

  const GrowthBadge = ({ value }: { value: number | null }) =>
    value === null ? null : (
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          value >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
        }`}
        dir="ltr"
      >
        {value >= 0 ? "▲" : "▼"} {Math.abs(Math.round(value))}%
      </span>
    );

  const sectionTitle = `text-sm font-bold ${strong}`;

  // --- آج کا خلاصہ اور سٹاک کی صحت ---
  const todayV = dailyMap.get(dayKey(now)) || { revenue: 0, cost: 0 };
  const todayOrdersN = orderCountByDay.get(dayKey(now)) || 0;
  const todayExpense = expenses
    .filter((e) => new Date(e.expense_date || e.created_at || 0).toDateString() === dayKey(now))
    .reduce((s2, e) => s2 + (Number(e.amount) || 0), 0);
  const yV = dailyMap.get(dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) || { revenue: 0, cost: 0 };
  const invUnits = books.reduce((s2, b) => s2 + (Number(b.stock) || 0), 0);
  const invCost = books.reduce((s2, b) => s2 + (Number(b.cost_price) || 0) * (Number(b.stock) || 0), 0);
  const invSale = books.reduce((s2, b) => s2 + (Number(b.price) || 0) * (Number(b.stock) || 0), 0);
  const cutoff60 = Date.now() - 60 * 86400000;
  const soldRecent = new Set<string>();
  orders.forEach((o) => {
    if (new Date(o.created_at || 0).getTime() >= cutoff60 && o.book_title) soldRecent.add(String(o.book_title));
  });
  const invDate = new Map<any, number>(invoices.map((i) => [i.id, new Date(i.created_at || 0).getTime()]));
  invoiceItems.forEach((it) => {
    if ((invDate.get(it.invoice_id) || 0) >= cutoff60) {
      const nm = it.book_id != null ? bookTitleById.get(it.book_id) : it.item_title;
      if (nm) soldRecent.add(String(nm));
    }
  });
  const slowBooks = books
    .filter((b) => (Number(b.stock) || 0) > 0 && !soldRecent.has(String(b.title)))
    .sort((a2, b2) => (Number(b2.stock) || 0) * (Number(b2.cost_price) || Number(b2.price) || 0) - (Number(a2.stock) || 0) * (Number(a2.cost_price) || Number(a2.price) || 0));
  const slowValue = slowBooks.reduce((s2, b) => s2 + (Number(b.stock) || 0) * (Number(b.cost_price) || 0), 0);
  const stockHealthPct = books.length > 0 ? Math.round((books.filter((b) => (Number(b.stock) || 0) > 3).length / books.length) * 100) : 0;
  const linkCls = "text-xs font-semibold text-emerald-600 hover:underline";

  return (
    <main
      dir={lang === "ur" ? "rtl" : "ltr"}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-gradient-to-b from-emerald-50/70 via-slate-50 to-slate-50 text-slate-800"
      }`}
    >
      <div className="flex flex-1">
        {isAdmin && mobileMenuOpen && (
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" />
        )}

        {/* سائیڈ بار */}
        {isAdmin && (
          <aside
            className={`w-64 min-h-screen md:h-screen md:sticky md:top-0 ${
              darkMode ? "bg-slate-900 border-slate-800" : "bg-white/90 border-slate-100"
            } border-x p-4 flex flex-col fixed inset-y-0 ${lang === "ur" ? "right-0" : "left-0"} z-50 flex-shrink-0 transform transition-transform duration-300 shadow-xl md:shadow-none ${
              mobileMenuOpen ? "translate-x-0" : lang === "ur" ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.jpg" alt="logo" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-emerald-200" />
                <div>
                  <h1 className={`text-base font-bold leading-tight ${strong}`}>مكتبہ الزھراء</h1>
                  <p className="text-[10px] text-slate-400">{L("ایڈمن پینل", "Admin Panel")}</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <nav className="mt-6 space-y-0.5 flex-1 overflow-y-auto">
              <p className="text-slate-400 text-[10px] font-bold tracking-wider px-3 mb-2">{t.menu}</p>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${
                      item.active
                        ? darkMode
                          ? "bg-emerald-900/40 text-emerald-300"
                          : "bg-emerald-50 text-emerald-700"
                        : darkMode
                        ? "text-slate-300 hover:bg-slate-800"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={17} className={item.active ? "text-emerald-500" : "text-slate-300"} />
                      {item.label}
                    </span>
                    {item.badge > 0 && (
                      <span className="bg-rose-100 text-rose-600 text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className={`border-t ${darkMode ? "border-slate-800" : "border-slate-100"} pt-3 mt-2`}>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl w-full text-[13px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut size={17} className="text-slate-300" />
                {t.logout}
              </button>
              <p className="text-slate-400 text-[10px] text-center mt-2">مكتبہ الزھراء © 2026</p>
            </div>
          </aside>
        )}

        <section className="flex-1 p-4 md:p-8 max-w-7xl mx-auto min-w-0 w-full pb-24 md:pb-8">
          {isAdmin ? (
            <>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setMobileMenuOpen(true)} className={`md:hidden p-2 rounded-2xl border ${card}`}>
                  <Menu size={20} />
                </button>
                <div className="min-w-0">
                  <h2 suppressHydrationWarning className={`text-xl md:text-2xl font-extrabold ${strong}`}>{greeting}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative hidden md:block">
                  <input
                    value={gSearch}
                    onChange={(e) => setGSearch(e.target.value)}
                    placeholder={L("کتاب یا کسٹمر تلاش کریں...", "Search books or customers...")}
                    className={`w-64 rounded-2xl border px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300 ${card}`}
                  />
                  {(gBooks.length > 0 || gCustomers.length > 0) && (
                    <div className={`absolute top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border z-50 p-1.5 shadow-xl ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} ${lang === "ur" ? "right-0" : "left-0"}`}>
                      {gBooks.map((b) => (
                        <Link key={"b" + b.id} href={`/books/${b.slug || encodeURIComponent(b.title)}`} onClick={() => setGSearch("")} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 hover:bg-emerald-50/60">
                          <span className="min-w-0">
                            <span className={`block text-xs font-bold truncate ${strong}`}>📘 {b.title}</span>
                            <span className="block text-[10px] text-slate-400 truncate">{b.author}</span>
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 shrink-0" dir="ltr">Rs {Number(b.price) || 0} • {Number(b.stock) || 0}</span>
                        </Link>
                      ))}
                      {gCustomers.map((c) => (
                        <Link key={"c" + c.id} href="/customers" onClick={() => setGSearch("")} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 hover:bg-sky-50/60">
                          <span className={`text-xs font-bold truncate ${strong}`}>👤 {c.name}</span>
                          <span className="text-[10px] text-slate-400" dir="ltr">{c.phone || ""}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setRefreshTick((n) => n + 1)}
                  className={`px-3 py-2.5 rounded-2xl border transition text-[11px] font-semibold ${card} text-slate-400 hover:text-emerald-600`}
                  title={L("ڈیٹا تازہ کریں", "Refresh data")}
                >
                  ⟳ {lastUpdated ? lastUpdated.toLocaleTimeString(lang === "ur" ? "ur-PK" : "en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2.5 rounded-2xl border transition ${card} text-slate-400 hover:text-emerald-600`}
                  title={darkMode ? "Light" : "Dark"}
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  onClick={() => setLang(lang === "ur" ? "en" : "ur")}
                  className={`px-3 py-2.5 rounded-2xl border transition text-xs font-bold flex items-center gap-1.5 ${card} text-slate-400 hover:text-emerald-600`}
                >
                  <Globe size={15} />
                  {lang === "ur" ? "EN" : "اردو"}
                </button>
              </div>
            </div>
            <div suppressHydrationWarning className="grid grid-cols-2 gap-2.5 mb-6 max-w-xl">
              <div className={`rounded-2xl border px-3.5 py-2.5 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                <p className="text-[10px] font-bold text-slate-400 tracking-wide">📅 {L("انگریزی تاریخ", "Gregorian date")}</p>
                <p className={`mt-1 text-[13px] md:text-sm font-extrabold leading-snug ${strong}`}>{dateText}</p>
              </div>
              <div className={`rounded-2xl border px-3.5 py-2.5 ${darkMode ? "bg-emerald-950/40 border-emerald-900" : "bg-emerald-50/70 border-emerald-100 shadow-sm"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold text-emerald-600 tracking-wide">🌙 {L("اسلامی تاریخ", "Hijri date")}</p>
                  <span className="inline-flex items-center rounded-full bg-white/70 text-emerald-700 text-[11px] font-bold ring-1 ring-emerald-100">
                    <button type="button" title={L("ایک دن پیچھے", "One day back")} onClick={() => changeHijriOffset(hijriOffset - 1)} className="px-2 leading-5">−</button>
                    <button type="button" title={L("ایک دن آگے", "One day forward")} onClick={() => changeHijriOffset(hijriOffset + 1)} className="px-2 leading-5">+</button>
                  </span>
                </div>
                <p className={`mt-1 text-[13px] md:text-sm font-extrabold leading-snug ${darkMode ? "text-emerald-300" : "text-emerald-800"}`}>{hijriText}</p>
                <p className="mt-1 text-[10px] text-emerald-600/80 leading-snug" dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>
                  🌇 {L("مغرب", "Maghrib")} {maghribTimeText}{afterMaghrib ? ` • ${L("نئی تاریخ شروع", "new day began")}` : ""}
                  <button type="button" onClick={locateMe} className="ms-1.5 underline decoration-dotted" title={L("مقام تازہ کریں", "Refresh location")}>
                    📍 {geo.real ? L("آپ کا مقام", "Your location") : L("فیصل آباد (ڈیفالٹ) • مقام دیں", "Faisalabad (default) • allow location")}
                  </button>
                </p>
              </div>
            </div>
            </>
          ) : (
            <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
              <Link href="/" className="flex items-center gap-2.5">
                <img src="/logo.jpg" alt="مكتبہ الزھراء" className="w-9 h-9 rounded-lg object-cover" />
                <h1 className="text-sm md:text-base font-bold text-slate-800">مكتبہ الزھراء</h1>
              </Link>
              <nav className="flex items-center gap-3 md:gap-4 text-xs font-semibold text-slate-600">
                <Link href="/shop" className="hover:text-emerald-600 transition">کتب</Link>
                <Link href="/about" className="hover:text-emerald-600 transition">ہمارے بارے میں</Link>
                <Link href="/contact" className="hover:text-emerald-600 transition">رابطہ</Link>
                <Link href="/cart" className="relative flex items-center justify-center rounded-lg bg-orange-50 hover:bg-orange-100 transition p-2">
                  <ShoppingCart size={17} className="text-orange-500" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </nav>
            </div>
          )}

          {!loaded ? (
            <div className="space-y-4 animate-pulse">
              <div className={`h-44 rounded-3xl ${darkMode ? "bg-slate-900" : "bg-white"}`} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-28 rounded-3xl ${darkMode ? "bg-slate-900" : "bg-white"}`} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {isAdmin && (
                <>
                  {/* مرکزی کارڈ */}
                  <div
                    className={`relative overflow-hidden rounded-3xl p-5 md:p-7 border ${
                      darkMode
                        ? "bg-gradient-to-br from-emerald-950 to-slate-900 border-slate-800 text-white"
                        : "bg-gradient-to-br from-emerald-100/80 via-teal-50 to-sky-50 border-emerald-100 text-emerald-950 shadow-[0_6px_24px_rgba(16,185,129,0.10)]"
                    }`}
                  >
                    <div className="absolute -top-20 -left-16 w-60 h-60 rounded-full bg-white/50 blur-2xl" />
                    <div className="absolute -bottom-24 right-6 w-64 h-64 rounded-full bg-sky-200/30 blur-2xl" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold opacity-70">
                            {L("اس مہینے کا خالص نفع", "Net Profit This Month")} — {(lang === "ur" ? monthNamesUr : monthNamesEn)[now.getMonth()]}
                          </p>
                          <p className="mt-2 text-3xl md:text-5xl font-extrabold tracking-tight" dir="ltr">
                            {thisMonthProfit < 0 ? "-" : ""}
                            {money(Math.abs(thisMonthProfit))}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-1.5 opacity-80">
                              {L("پچھلے مہینے کے مقابلے میں نفع", "Profit vs last month")} <GrowthBadge value={profitGrowth} />
                            </span>
                            <span className="flex items-center gap-1.5 opacity-80">
                              {L("فروخت", "Sales")} <GrowthBadge value={salesGrowth} />
                            </span>
                          </div>
                        </div>
                        <span className="p-3 rounded-2xl bg-white/70 text-emerald-600 shadow-sm">
                          <TrendingUp size={22} />
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-2.5">
                        {[
                          [t.sales, money(thisMonthRevenue)],
                          [t.cost, money(thisMonthCost)],
                          [t.expenseLabel, money(thisMonthExpenseTotal)],
                          [L("لین دین", "Transactions"), String(monthTxCount)],
                          [L("اوسط بل", "Avg. Sale"), money(avgTx)],
                        ].map(([label, val]) => (
                          <div key={label} className={`rounded-2xl p-3 ${darkMode ? "bg-white/5" : "bg-white/70 shadow-sm"}`}>
                            <p className="text-[11px] opacity-60">{label}</p>
                            <p className="mt-0.5 text-sm font-bold" dir="ltr">
                              {val}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        {[
                          ["📊", L("نفع کا تناسب", "Profit margin"), marginPct === null ? "—" : `${marginPct.toFixed(1)}%`],
                          ["🔮", L("مہینہ ختم تک متوقع فروخت", "Projected month sales"), money(projectedSales)],
                          ["🏆", L("بہترین دن", "Best day"), bestDayNo ? `${bestDayNo} • ${money(bestDayRev)}` : "—"],
                          ["📅", L("روزانہ اوسط فروخت", "Avg. per day"), money(avgPerDay)],
                        ].map(([ic, label, val]) => (
                          <div key={label} className={`rounded-2xl px-3 py-2.5 flex items-center gap-2.5 ${darkMode ? "bg-white/5" : "bg-white/60 ring-1 ring-white shadow-sm"}`}>
                            <span className="text-lg">{ic}</span>
                            <div className="min-w-0">
                              <p className="text-[10px] opacity-60 truncate">{label}</p>
                              <p className="text-[13px] font-extrabold truncate" dir="ltr">{val}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* توجہ طلب + ماہانہ ہدف */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className={`lg:col-span-2 rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={sectionTitle}>{L("🔔 توجہ طلب کام", "🔔 Needs Attention")}</h3>
                        <span className="text-[11px] text-slate-400">{attention.length} {L("اشارے", "items")}</span>
                      </div>
                      {attention.length === 0 ? (
                        <p className="text-xs py-6 text-center text-slate-400">✅ {L("سب کچھ ٹھیک ہے، کوئی کام باقی نہیں", "All clear — nothing pending")}</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {attention.map((a, i) => (
                            <Link key={i} href={a.href} className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-xs font-semibold hover:-translate-y-0.5 transition-all ${a.tone}`}>
                              <span className="text-base">{a.icon}</span>
                              <span className="leading-snug">{a.text}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`rounded-3xl border p-5 flex flex-col items-center justify-between text-center ${card}`}>
                      <div className="w-full flex items-center justify-between">
                        <h3 className={sectionTitle}>{L("🎯 ماہانہ ہدف", "🎯 Monthly Target")}</h3>
                        <button onClick={changeTarget} className="text-[11px] font-semibold text-emerald-600 hover:underline">
                          {targetAmt > 0 ? L("بدلیں", "Edit") : L("مقرر کریں", "Set")}
                        </button>
                      </div>
                      {targetAmt > 0 ? (
                        <>
                          <div className="my-3">
                            <Ring value={thisMonthRevenue} max={targetAmt} />
                          </div>
                          <p className="text-[11px] text-slate-400" dir="ltr">
                            {money(thisMonthRevenue)} / {money(targetAmt)}
                          </p>
                          <p className="text-[11px] mt-1 text-slate-500">
                            {thisMonthRevenue >= targetAmt
                              ? L("🎉 ہدف پورا ہو گیا!", "🎉 Target reached!")
                              : `${L("باقی", "Remaining")}: ${money(targetAmt - thisMonthRevenue)}`}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 py-8 leading-relaxed">
                          {L("اس مہینے کی فروخت کا ہدف مقرر کریں اور ترقی کا دائرہ دیکھیں", "Set a sales target and track progress")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* چار خانے */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {kpis.map((k) => {
                      const Icon = k.icon;
                      return (
                        <Link
                          key={k.label}
                          href={k.href}
                          className={`group rounded-3xl border p-4 hover:-translate-y-0.5 transition-all ${card}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`p-2.5 rounded-2xl ${k.tone}`}>
                              <Icon size={18} />
                            </span>
                            {k.spark ? <Sparkline values={k.spark} color={k.color} /> : <ArrowUpRight size={15} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />}
                          </div>
                          <p className={`mt-3 text-xl md:text-2xl font-extrabold ${strong}`} dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>
                            {k.value}
                          </p>
                          <p className="text-xs mt-0.5 text-slate-400">{k.label}</p>
                        </Link>
                      );
                    })}
                  </div>

                  {/* فوری کام */}
                  <div>
                    <h3 className={`${sectionTitle} mb-3`}>{L("فوری کام", "Quick Actions")}</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {quickActions.map((a) => {
                        const Icon = a.icon;
                        return (
                          <Link
                            key={a.href + a.label}
                            href={a.href}
                            className={`rounded-3xl border p-3.5 flex flex-col items-center gap-2 text-center hover:-translate-y-0.5 transition-all ${card}`}
                          >
                            <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${a.tone}`}>
                              <Icon size={20} />
                            </span>
                            <span className={`text-[11px] md:text-xs font-semibold ${darkMode ? "text-slate-200" : "text-slate-600"}`}>{a.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* آج کا خلاصہ */}
                  <div>
                    <h3 className={`${sectionTitle} mb-3`}>{L("آج کا خلاصہ", "Today")}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: L("آج کی فروخت", "Today's sales"), value: money(todayV.revenue), sub: yV.revenue > 0 ? L(`کل: ${money(yV.revenue)}`, `Yesterday: ${money(yV.revenue)}`) : L("کل کوئی فروخت نہیں", "None yesterday"), tone: "bg-emerald-50 text-emerald-600", icon: "💵" },
                        { label: L("آج کا نفع", "Today's profit"), value: money(todayV.revenue - todayV.cost - todayExpense), sub: L("خرچہ نکال کر", "after expenses"), tone: "bg-teal-50 text-teal-600", icon: "📈" },
                        { label: L("آج کے آن لائن آرڈرز", "Online orders today"), value: String(todayOrdersN), sub: L(`نئے: ${newOrderCount}`, `New: ${newOrderCount}`), tone: "bg-sky-50 text-sky-600", icon: "🛒" },
                        { label: L("آج کا خرچہ", "Today's expenses"), value: money(todayExpense), sub: L("دکان کے اخراجات", "shop expenses"), tone: "bg-rose-50 text-rose-500", icon: "💸" },
                      ].map((c) => (
                        <div key={c.label} className={`rounded-3xl border p-4 ${card}`}>
                          <span className={`inline-flex w-9 h-9 items-center justify-center rounded-2xl text-base ${c.tone}`}>{c.icon}</span>
                          <p className={`mt-2 text-lg font-extrabold truncate ${strong}`} dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>{c.value}</p>
                          <p className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{c.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{c.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* سٹاک کی صحت */}
                  <div className={`rounded-3xl border p-5 ${card}`}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h3 className={sectionTitle}>{L("سٹاک کی صحت اور گودام کی مالیت", "Inventory Health")}</h3>
                      <Link href="/books" className="text-[11px] font-semibold text-emerald-600">{L("کتب دیکھیں ←", "View books →")}</Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        [L("کل نسخے", "Total copies"), invUnits.toLocaleString("en-US"), "bg-sky-50 text-sky-700"],
                        [L("خرید کی مالیت", "At cost"), money(invCost), "bg-amber-50 text-amber-700"],
                        [L("فروخت کی مالیت", "At sale price"), money(invSale), "bg-emerald-50 text-emerald-700"],
                        [L("ممکنہ نفع", "Potential profit"), money(Math.max(0, invSale - invCost)), "bg-violet-50 text-violet-700"],
                      ].map(([l2, v2, tone]) => (
                        <div key={l2} className={`rounded-2xl p-3 ${tone}`}>
                          <p className="text-[11px] opacity-70">{l2}</p>
                          <p className="mt-0.5 text-sm font-extrabold truncate" dir="ltr">{v2}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-slate-500">{L("صحت مند سٹاک (3 سے زیادہ نسخے والی کتب)", "Healthy stock (more than 3 copies)")}</span>
                        <span className="font-bold text-emerald-600">{stockHealthPct}%</span>
                      </div>
                      <div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                        <div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500" style={{ width: `${stockHealthPct}%` }} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className={`text-xs font-bold mb-2 ${strong}`}>
                        {L("🐌 سست کتب — 60 دن میں نہیں بکیں", "🐌 Slow movers — not sold in 60 days")}
                        <span className="font-normal text-slate-400"> ({slowBooks.length}{slowValue > 0 ? ` • ${money(slowValue)}` : ""})</span>
                      </p>
                      {slowBooks.length === 0 ? (
                        <p className="text-[11px] text-slate-400">{L("ماشاءاللہ، ہر کتاب بک رہی ہے۔", "Everything is selling.")}</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {slowBooks.slice(0, 8).map((b) => (
                            <span key={b.id} className={`text-[11px] rounded-full px-2.5 py-1 border ${darkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                              {b.title} <span className="text-slate-400">×{Number(b.stock) || 0}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* پورا کاروبار ایک نظر میں */}
                  <div>
                    <h3 className={`${sectionTitle} mb-3`}>{L("پورا کاروبار ایک نظر میں", "Business Overview")}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {modules.map((m) => {
                        const Icon = m.icon;
                        return (
                          <Link key={m.href} href={m.href} className={`group rounded-3xl border p-4 hover:-translate-y-0.5 transition-all ${card}`}>
                            <div className="flex items-center justify-between">
                              <span className={`p-2.5 rounded-2xl ${m.tone}`}>
                                <Icon size={17} />
                              </span>
                              <ArrowUpRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <p className={`mt-3 text-lg font-extrabold truncate ${strong}`} dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>
                              {m.value}
                            </p>
                            <p className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{m.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 h-3.5 truncate">{m.sub}</p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* 30 دن کا گراف + ذریعہ */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className={`lg:col-span-2 rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={sectionTitle}>{L("پچھلے 30 دن", "Last 30 Days")}</h3>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <i className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> {t.sales}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> {L("نفع", "Profit")}
                          </span>
                        </div>
                      </div>
                      <AreaChart days={days30} salesLabel={t.sales} profitLabel={L("نفع", "Profit")} />
                    </div>
                    <DonutCard
                      title={L("فروخت کا ذریعہ (اس مہینے)", "Sales Source (this month)")}
                      data={sourceSlices}
                      card={card}
                      strong={strong}
                      muted="text-slate-400"
                      empty={L("اس مہینے ابھی فروخت نہیں", "No sales this month")}
                    />
                  </div>

                  {/* مہینوں کا موازنہ + بہترین وقت */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className={sectionTitle}>{L("اس مہینے بمقابلہ پچھلا مہینہ", "This Month vs Last Month")}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">{L("روزانہ جمع ہوتی فروخت", "Cumulative daily sales")}</p>
                        </div>
                        <GrowthBadge value={vsLastSameDay} />
                      </div>
                      <CompareChart thisCum={thisCum} lastCum={lastCum} dark={darkMode} />
                      <div className="mt-2 flex items-center justify-center gap-5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5"><i className="w-4 h-0.5 bg-emerald-500 inline-block rounded" /> {L("اس مہینے", "This month")}</span>
                        <span className="flex items-center gap-1.5"><i className="w-4 h-0 border-t-2 border-dashed border-slate-400 inline-block" /> {L("پچھلا مہینہ", "Last month")}</span>
                      </div>
                    </div>
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className={sectionTitle}>{L("فروخت کا بہترین وقت", "Best Selling Hours")}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">{L("پچھلے 90 دن", "Last 90 days")}</p>
                        </div>
                        {peakHour >= 0 && (
                          <span className="rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 px-2.5 py-1 text-[10px] font-bold" dir="ltr">⏰ {hourLabel(peakHour)}</span>
                        )}
                      </div>
                      <HourChart hours={hourSums} dark={darkMode} />
                    </div>
                  </div>

                  {/* نفع کا پُل + اہم تناسب */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className={`lg:col-span-2 rounded-3xl border p-5 ${card}`}>
                      <h3 className={sectionTitle}>{L("اس مہینے نفع کیسے بنا؟", "How this month's profit is built")}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 mb-3">{L("فروخت میں سے لاگت اور اخراجات نکل کر خالص نفع", "Sales minus cost and expenses = net profit")}</p>
                      <WaterfallChart sales={thisMonthRevenue} cost={thisMonthCost} expense={thisMonthExpenseTotal} labels={[t.sales, t.cost, t.expenseLabel, L("نفع", "Profit")]} dark={darkMode} />
                    </div>
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <h3 className={`${sectionTitle} mb-3`}>{L("کاروبار کی صحت", "Business Health")}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          [L("خرچ / فروخت", "Expense ratio"), expenseRatio, "#fb7185", expenseRatio.toFixed(0) + "%"],
                          [L("وصولی کی شرح", "Collection rate"), collectRate, "#10b981", collectRate.toFixed(0) + "%"],
                          [L("واپسی کی شرح", "Return rate"), returnRate, "#f59e0b", returnRate.toFixed(0) + "%"],
                          [L("سٹاک کی صحت", "Stock health"), stockHealth, "#38bdf8", stockHealth.toFixed(0) + "%"],
                        ].map(([lb, pc, col, txt]) => (
                          <div key={String(lb)} className="flex flex-col items-center text-center">
                            <div className="relative">
                              <MiniRing pct={Number(pc)} color={String(col)} />
                              <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-extrabold ${strong}`} dir="ltr">{txt}</span>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400 leading-tight">{lb}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* اس ہفتے بمقابلہ پچھلا ہفتہ + فروخت کیلنڈر */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className={sectionTitle}>{L("اس ہفتے بمقابلہ پچھلا ہفتہ", "This Week vs Last Week")}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5" dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>{money(thisWeekTotal)} / {money(lastWeekTotal)}</p>
                        </div>
                        <GrowthBadge value={weekGrowth} />
                      </div>
                      <WeekCompare thisWeek={thisWeekVals} lastWeek={lastWeekVals} names={weekNames} dark={darkMode} />
                      <div className="mt-2 flex items-center justify-center gap-5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> {L("اس ہفتے", "This week")}</span>
                        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" /> {L("پچھلا ہفتہ", "Last week")}</span>
                      </div>
                    </div>
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <h3 className={sectionTitle}>{L("فروخت کا کیلنڈر", "Sales Calendar")}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 mb-3">{L("پچھلے 35 دن؛ رنگ جتنا گہرا، فروخت اتنی زیادہ", "Last 35 days; darker = more sales")}</p>
                      <HeatCalendar cells={heatCells} dark={darkMode} money={money} />
                      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400" dir="ltr">
                        {L("کم", "Less")}
                        {[0.2, 0.4, 0.6, 0.8, 1].map((a) => (
                          <i key={a} className="w-3.5 h-3.5 rounded-sm inline-block" style={{ background: `rgba(16,185,129,${a})` }} />
                        ))}
                        {L("زیادہ", "More")}
                      </div>
                    </div>
                  </div>

                  {/* آرڈرز کی حالت + بہترین مصنفین */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <h3 className={`${sectionTitle} mb-4`}>{L("آرڈرز کی موجودہ حالت", "Order Pipeline")}</h3>
                      {pipeline.length === 0 ? (
                        <p className="text-xs py-8 text-center text-slate-400">{L("ابھی کوئی آرڈر نہیں", "No orders yet")}</p>
                      ) : (
                        <HBars items={pipeline} dark={darkMode} />
                      )}
                    </div>
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <h3 className={`${sectionTitle} mb-4`}>{L("اس مہینے بہترین مصنفین (فروخت کے لحاظ سے)", "Top Authors (by sales this month)")}</h3>
                      {topAuthors.length === 0 ? (
                        <p className="text-xs py-8 text-center text-slate-400">{L("اس مہینے ابھی فروخت نہیں", "No sales this month")}</p>
                      ) : (
                        <HBars items={topAuthors.map(([label, value], i) => ({ label, value, shown: money(value), color: PALETTE[i % PALETTE.length] }))} dark={darkMode} />
                      )}
                    </div>
                  </div>

                  {/* 6 مہینے + زیادہ بکنے والی کتب */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={sectionTitle}>{L("پچھلے 6 مہینے: فروخت، اخراجات اور نفع", "Last 6 Months: Sales, Expenses & Profit")}</h3>
                        <Link href="/reports" className={linkCls}>{L("تفصیلی رپورٹ", "Detailed report")}</Link>
                      </div>
                      <ComboChart
                        months={sixMonths}
                        names={sixMonths.map((m) => (lang === "ur" ? monthNamesUr : monthNamesEn)[m.month].slice(0, lang === "ur" ? 6 : 3))}
                        salesLabel={t.sales}
                        expLabel={t.expenseLabel}
                        profitLabel={L("نفع (نیچے فیصد)", "Profit (margin % below)")}
                        dark={darkMode}
                      />
                    </div>

                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <h3 className={`${sectionTitle} mb-4`}>{L("اس مہینے زیادہ بکنے والی کتب", "Top Selling Books (this month)")}</h3>
                      {topBooks.length === 0 ? (
                        <p className="text-xs py-8 text-center text-slate-400">{L("اس مہینے ابھی فروخت نہیں", "No sales this month")}</p>
                      ) : (
                        <ul className="space-y-3.5">
                          {topBooks.map((b, i) => (
                            <li key={b.title}>
                              <div className="flex items-center justify-between gap-2 text-xs mb-1">
                                <span className={`truncate font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                                  {i + 1}. {b.title}
                                </span>
                                <span className="shrink-0 text-slate-400">
                                  {b.qty} {L("عدد", "pcs")}
                                </span>
                              </div>
                              <div className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${(b.qty / topMaxQty) * 100}%`, background: PALETTE[i % PALETTE.length] }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* تین ڈونٹ گراف */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DonutCard
                      title={L("اخراجات کی تقسیم (اس مہینے)", "Expenses (this month)")}
                      data={expenseSlices}
                      card={card}
                      strong={strong}
                      muted="text-slate-400"
                      empty={L("اس مہینے کوئی خرچہ نہیں", "No expenses this month")}
                    />
                    <DonutCard
                      title={L("زمروں کے لحاظ سے سٹاک مالیت", "Stock Value by Category")}
                      data={categorySlices}
                      card={card}
                      strong={strong}
                      muted="text-slate-400"
                      empty={L("سٹاک موجود نہیں", "No stock")}
                    />
                    <DonutCard
                      title={L("وصولی اور بقایا", "Collected vs Dues")}
                      data={collectSlices}
                      card={card}
                      strong={strong}
                      muted="text-slate-400"
                      empty={L("ابھی کوئی بل نہیں", "No bills yet")}
                    />
                  </div>

                  {/* ہفتے کے دن + بہترین گاہک + سپلائرز کا بقایا */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <h3 className={`${sectionTitle} mb-1`}>{L("ہفتے کے دنوں کی فروخت", "Sales by Weekday")}</h3>
                      <p className="text-[11px] text-slate-400 mb-4">
                        {L("پچھلے 90 دن", "Last 90 days")} — {L("بہترین دن", "Best day")}: <b className="text-emerald-600">{weekdaySums[bestDay] > 0 ? weekdayNames[bestDay] : "—"}</b>
                      </p>
                      <div className="flex items-end justify-between gap-1.5 h-32" dir="ltr">
                        {weekdaySums.map((v, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 min-w-0">
                            <div
                              className={`w-full max-w-7 rounded-t-lg ${i === bestDay && v > 0 ? "bg-emerald-400" : "bg-sky-200"}`}
                              style={{ height: `${Math.max(4, (v / weekdayMax) * 100)}%` }}
                              title={money(v)}
                            />
                            <span className="text-[9px] text-slate-400 truncate w-full text-center">{weekdayNames[i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={sectionTitle}>{L("🏆 بہترین گاہک", "🏆 Top Customers")}</h3>
                        <Link href="/customers" className={linkCls}>{L("سب", "All")}</Link>
                      </div>
                      {topCustomers.length === 0 ? (
                        <p className="text-xs py-8 text-center text-slate-400">{L("ابھی کوئی ریکارڈ نہیں", "No data yet")}</p>
                      ) : (
                        <ul className="space-y-3">
                          {topCustomers.map((c, i) => (
                            <li key={c.name}>
                              <div className="flex items-center justify-between gap-2 text-xs mb-1">
                                <span className={`truncate font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{i + 1}. {c.name}</span>
                                <span className="shrink-0 text-slate-400" dir="ltr">{money(c.total)}</span>
                              </div>
                              <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                <div className="h-full rounded-full" style={{ width: `${(c.total / topCustMax) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={sectionTitle}>{L("🚚 سپلائرز کا بقایا", "🚚 Supplier Payables")}</h3>
                        <Link href="/suppliers" className={linkCls}>{L("سب", "All")}</Link>
                      </div>
                      {supplierBalances.length === 0 ? (
                        <p className="text-xs py-8 text-center text-slate-400">✅ {L("کوئی بقایا نہیں", "Nothing owed")}</p>
                      ) : (
                        <>
                          <p className={`text-xl font-extrabold mb-3 ${strong}`} dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>{money(payableTotal)}</p>
                          <div className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                            {supplierBalances.slice(0, 4).map((sp) => (
                              <div key={sp.name} className="py-2 flex items-center justify-between gap-2 text-xs">
                                <span className={`truncate ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{sp.name}</span>
                                <b className="shrink-0 text-amber-600" dir="ltr">{money(sp.balance)}</b>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* حالیہ آرڈرز + کم سٹاک */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={sectionTitle}>{L("حالیہ آرڈرز", "Recent Orders")}</h3>
                        <Link href="/orders" className={linkCls}>
                          {L("سب دیکھیں", "View all")}
                        </Link>
                      </div>
                      {orderGroups.length === 0 ? (
                        <p className="text-xs py-6 text-center text-slate-400">{L("ابھی کوئی آرڈر نہیں", "No orders yet")}</p>
                      ) : (
                        <div className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                          {orderGroups.slice(0, 5).map((g, idx) => {
                            const total = (g.find((r: any) => r.total_amount) || g[0]).total_amount || 0;
                            return (
                              <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className={`text-[13px] font-semibold truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                                    {g[0].customer_name || "—"}
                                  </p>
                                  <p className="text-[11px] truncate text-slate-400">
                                    {g.length} {L("کتب", "books")} • {money(Number(total))}
                                  </p>
                                </div>
                                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset ${statusStyle(g[0].status)}`}>
                                  {g[0].status || "نیا"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className={`rounded-3xl border p-5 ${card}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={sectionTitle}>{L("کم سٹاک کتب", "Low Stock Books")}</h3>
                        <Link href="/low-stock" className={linkCls}>
                          {L("سب دیکھیں", "View all")}
                        </Link>
                      </div>
                      {lowStockBooks.length === 0 ? (
                        <p className="text-xs py-6 text-center text-slate-400">✅ {L("تمام کتب کا سٹاک مکمل ہے", "All books are in stock")}</p>
                      ) : (
                        <div className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                          {lowStockBooks.slice(0, 5).map((b) => (
                            <div key={b.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className={`text-[13px] font-semibold truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{b.title}</p>
                                <p className="text-[11px] truncate text-slate-400">{b.author}</p>
                              </div>
                              <span
                                className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset ${
                                  (Number(b.stock) || 0) === 0 ? "bg-rose-50 text-rose-500 ring-rose-200" : "bg-amber-50 text-amber-600 ring-amber-200"
                                }`}
                              >
                                {(Number(b.stock) || 0) === 0 ? L("ختم", "Out") : `${b.stock} ${L("باقی", "left")}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* حالیہ سرگرمی */}
                  <div className={`rounded-3xl border p-5 ${card}`}>
                    <h3 className={`${sectionTitle} mb-4`}>{L("🕒 حالیہ سرگرمی", "🕒 Recent Activity")}</h3>
                    {activity.length === 0 ? (
                      <p className="text-xs py-6 text-center text-slate-400">{L("ابھی کوئی سرگرمی نہیں", "No activity yet")}</p>
                    ) : (
                      <ol className="relative space-y-4 border-slate-100" style={{ borderInlineStartWidth: 2, paddingInlineStart: 18 }}>
                        {activity.map((a, i) => (
                          <li key={i} className="relative">
                            <span
                              className={`absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}
                              style={{ insetInlineStart: -31 }}
                            >
                              {a.icon}
                            </span>
                            <Link href={a.href} className="flex items-center justify-between gap-3 group">
                              <div className="min-w-0">
                                <p className={`text-[13px] font-semibold truncate group-hover:text-emerald-600 transition-colors ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{a.title}</p>
                                <p className="text-[11px] text-slate-400" dir="ltr" style={{ textAlign: lang === "ur" ? "right" : "left" }}>{a.sub}</p>
                              </div>
                              <span className="shrink-0 text-[10px] text-slate-400">{ago(a.date)}</span>
                            </Link>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </>
              )}

              {/* گنتی کے کارڈ (صرف وزیٹر کے لیے؛ ایڈمن کو اوپر "پورا کاروبار" میں یہی نظر آتا ہے) */}
              {!isAdmin && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {counters
                  .filter((c) => isAdmin || c.label !== L("سٹاک کی مالیت", "Stock Value"))
                  .map((c) => {
                    const Icon = c.icon;
                    return (
                      <Link
                        key={c.label}
                        href={c.href}
                        className={`rounded-3xl border p-4 hover:-translate-y-0.5 transition-all flex items-center gap-3 ${card}`}
                      >
                        <div className={`p-3 rounded-2xl ${c.tone}`}>
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-base md:text-lg font-extrabold leading-tight truncate ${strong}`} dir="ltr">{c.value}</p>
                          <p className="text-xs text-slate-400">{c.label}</p>
                        </div>
                      </Link>
                    );
                  })}
              </div>
              )}

              {/* حالیہ کتب */}
              <div className={`rounded-3xl border p-5 ${card}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={sectionTitle}>{L("حالیہ کتب", "Recent Books")}</h3>
                  <Link href={isAdmin ? "/books" : "/shop"} className={linkCls}>
                    {L("تمام کتب دیکھیں", "View all books")}
                  </Link>
                </div>
                {books.length === 0 ? (
                  <p className="text-xs py-6 text-center text-slate-400">{L("ابھی کوئی کتاب شامل نہیں کی گئی", "No books added yet")}</p>
                ) : (
                  <div className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                    {books.slice(-5).reverse().map((book) => (
                      <div key={book.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className={`text-[13px] font-semibold truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{book.title}</p>
                          <p className="text-[11px] truncate text-slate-400">{book.author}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"}`}>
                          {book.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!isAdmin && (
            <footer className="mt-10 border-t border-slate-200 pt-6 flex flex-col items-center gap-2">
              <img src="/logo.jpg" alt="مكتبہ الزھراء" className="h-8 w-auto opacity-90" />
              <p className="text-slate-400 text-xs text-center">© 2026 مكتبہ الزھراء. جملہ حقوق محفوظ ہیں۔</p>
            </footer>
          )}
        </section>
      </div>
    </main>
  );
}