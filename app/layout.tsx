import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import RegisterServiceWorker from "./RegisterServiceWorker";
import AdminBottomNav from "./AdminBottomNav";

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-arabic",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "مكتبہ الزھراء",
  description: "مكتبہ الزھراء کی آن لائن لائبریری",
  verification: {
    google: "7ZL2od7nZPRqz8n4Ra5o9hsLFBuqV3Nxa-evcMYsHQY",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "الزھراء",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#065f46",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ur" dir="rtl" className={`${notoSansArabic.className} ${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        {children}
        <RegisterServiceWorker />
        <AdminBottomNav />
      </body>
    </html>
  );
}
