import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );
}

const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

// فون نمبر سے آرڈر کی حالت (صرف کتاب، حالت اور ٹریکنگ — پتہ وغیرہ نہیں)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = digits(body?.phone);
    if (phone.length < 10) {
      return NextResponse.json({ ok: false, error: "invalid phone" }, { status: 400 });
    }
    const last10 = phone.slice(-10);

    const { data, error } = await db()
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1500);
    if (error) {
      return NextResponse.json({ ok: false, error: "lookup failed" }, { status: 500 });
    }

    const mine = (data || []).filter((o: Record<string, unknown>) => digits(o.customer_phone).endsWith(last10));

    const groups = new Map<string, Record<string, unknown>[]>();
    mine.forEach((o: Record<string, unknown>) => {
      const key = String(o.order_group ?? o.id);
      const arr = groups.get(key) || [];
      arr.push(o);
      groups.set(key, arr);
    });

    const orders = Array.from(groups.values())
      .slice(0, 10)
      .map((rows) => {
        const first = rows[0];
        const withTotal = rows.find((r) => r.total_amount) || first;
        return {
          date: first.created_at,
          status: first.status,
          courier: first.courier_name || null,
          tracking: first.tracking_number || null,
          total: Number(withTotal.total_amount) || 0,
          items: rows.map((r) => ({ title: r.book_title, quantity: r.quantity })),
        };
      });

    return NextResponse.json({ ok: true, orders });
  } catch {
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}