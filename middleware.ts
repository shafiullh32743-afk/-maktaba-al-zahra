import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get("maktaba-auth")?.value === "true";
  const path = request.nextUrl.pathname;

  // 1. تمام عوامی (Public) صفحات کی تعریف
  const isHomePage = path === "/";
  const isLoginPage = path.startsWith("/login");
  const isSitemap = path === "/sitemap.xml";
  const isBookDetailPage = /^\/books\/[^/]+$/.test(path);
  const isShopPage = path === "/shop" || path.startsWith("/shop/");

  // اگر ان میں سے کوئی بھی صفحہ ہو تو بغیر لاگ ان کے رسائی کی اجازت دیں
  const isPublicPage = isHomePage || isLoginPage || isSitemap || isBookDetailPage || isShopPage;

  // 2. غیر لاگ ان صارف کو غیر محفوظ صفحات سے /login پر بھیجیں
  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. پہلے سے لاگ ان صارف کو /login پیج کے بجائے ہوم پیج پر بھیجیں
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Static فائلز اور امیجز کے علاوہ تمام روٹس پر مڈل ویئر لاگو ہوگا
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};