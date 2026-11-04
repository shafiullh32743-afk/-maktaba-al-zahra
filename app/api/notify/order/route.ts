import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

// کسٹمر کا آرڈر محفوظ ہونے کے بعد ایڈمن کے فون پر اطلاع بھیجتا ہے
export async function POST(request: Request) {
  try {
    const { orderGroup } = await request.json();
    if (typeof orderGroup !== "string" || !orderGroup.startsWith("grp_")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:maktabaalzahra32@gmail.com";
    if (!publicKey || !privateKey) {
      return NextResponse.json({ ok: false, error: "vapid keys missing" }, { status: 500 });
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );

    const { data: rows } = await supabase
      .from("orders")
      .select("customer_name, total_amount, quantity")
      .eq("order_group", orderGroup);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: false, error: "order not found" }, { status: 404 });
    }

    const name = rows[0].customer_name || "گاہک";
    const total = rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
    const payload = JSON.stringify({
      title: "🛒 نیا آرڈر آیا ہے",
      body: `${name} — ${rows.length} کتب — کل Rs ${total}`,
      url: "/orders",
    });

    const { data: subs } = await supabase.from("push_subscriptions").select("endpoint, p256dh, auth");
    let sent = 0;
    for (const s of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        // فون نے اجازت واپس لے لی ہو تو پرانا پتا ہٹا دیں
        if (code === 404 || code === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    }
    return NextResponse.json({ ok: true, sent });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}