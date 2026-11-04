import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
}

// فون کا نوٹیفکیشن پتا محفوظ کریں
export async function POST(request: Request) {
  try {
    const sub = await request.json();
    const endpoint = sub?.endpoint;
    const p256dh = sub?.keys?.p256dh;
    const auth = sub?.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ ok: false, error: "invalid subscription" }, { status: 400 });
    }
    const { error } = await db()
      .from("push_subscriptions")
      .upsert({ endpoint, p256dh, auth }, { onConflict: "endpoint" });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// نوٹیفکیشن بند کریں
export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json();
    if (endpoint) {
      await db().from("push_subscriptions").delete().eq("endpoint", endpoint);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}