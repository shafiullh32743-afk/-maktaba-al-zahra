import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// "maktaba-auth" کوکی اب صرف ایک نشانی ہے (بٹن دکھانے / لاگ آؤٹ کے لیے)۔
// اصل حفاظت Supabase کا سیشن ہے، جسے جعلی نہیں بنایا جا سکتا۔
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasHint = request.cookies.get("maktaba-auth")?.value === "true";

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // سرور سے تصدیق (جعلی کوکی نہیں چلے گی)
  let hasSession = false;
  try {
    const { data } = await supabase.auth.getUser();
    hasSession = !!data.user;
  } catch {
    hasSession = false;
  }

  // لاگ آؤٹ: نشانی کوکی ہٹ جائے تو سیشن بھی ختم سمجھیں
  const isLoggedIn = hasSession && hasHint;

  // 1. عوامی صفحات
  const isHomePage = path === "/";
  const isLoginPage = path.startsWith("/login");
  const isSitemap = path === "/sitemap.xml";
  const isBookDetailPage = /^\/books\/[^/]+$/.test(path);
  const isShopPage = path === "/shop" || path.startsWith("/shop/");
  const isAboutOrContact = path === "/about" || path === "/contact";
  const isCartPage = path === "/cart";
  const isNotifyApi = path === "/api/notify-order";

  const isPublicPage =
    isHomePage || isLoginPage || isSitemap || isBookDetailPage || isShopPage || isAboutOrContact || isCartPage || isNotifyApi;

  const redirectTo = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    // لاگ آؤٹ شدہ حالت میں پرانی Supabase کوکیز صاف کر دیں
    if (!isLoggedIn) {
      request.cookies
        .getAll()
        .filter((c) => c.name.startsWith("sb-"))
        .forEach((c) => res.cookies.set(c.name, "", { path: "/", maxAge: 0 }));
    }
    return res;
  };

  if (!isLoggedIn && !isPublicPage) return redirectTo("/login");
  if (isLoggedIn && isLoginPage) return redirectTo("/");
  if (!isLoggedIn && isHomePage) return redirectTo("/shop");

  // عوامی صفحے پر لاگ آؤٹ شدہ صارف: پرانی کوکیز صاف
  if (!isLoggedIn) {
    request.cookies
      .getAll()
      .filter((c) => c.name.startsWith("sb-"))
      .forEach((c) => response.cookies.set(c.name, "", { path: "/", maxAge: 0 }));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico|txt|woff|woff2)$).*)",
  ],
};