import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get("maktaba-auth")?.value === "true";
  const path = request.nextUrl.pathname;

  const isLoginPage = path.startsWith("/login");
  const isSitemap = path === "/sitemap.xml";
  const isBookDetailPage = /^\/books\/[^/]+$/.test(path);

  const isPublicPage = isLoginPage || isSitemap || isBookDetailPage;

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};