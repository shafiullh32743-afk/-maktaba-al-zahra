import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BookDetailClient from "./BookDetailClient";
import { effectivePrice, isOnSale } from "@/lib/sale";

const SITE_URL = "https://maktaba-al-zahra-books.vercel.app";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const getBook = cache(async (rawIdentifier: string) => {
  const identifier = safeDecode(rawIdentifier);

  const { data: bySlug } = await supabase
    .from("books_public")
    .select("*")
    .eq("slug", identifier)
    .limit(1);
  if (bySlug && bySlug.length > 0) return bySlug[0];

  const { data: byTitle } = await supabase
    .from("books_public")
    .select("*")
    .eq("title", identifier)
    .limit(1);
  if (byTitle && byTitle.length > 0) return byTitle[0];

  // پرانے لنک: سلگ میں بعد میں مصنف وغیرہ شامل ہوا ہو تو ابتدا سے ملا لیں
  const clean = identifier.replace(/[%_]/g, "").trim();
  if (clean.length >= 3) {
    const { data: byPrefix } = await supabase
      .from("books_public")
      .select("*")
      .ilike("slug", `${clean}%`)
      .limit(1);
    if (byPrefix && byPrefix.length > 0) return byPrefix[0];

    const { data: byLike } = await supabase
      .from("books_public")
      .select("*")
      .ilike("title", `%${clean.replace(/-/g, " ")}%`)
      .limit(1);
    if (byLike && byLike.length > 0) return byLike[0];
  }

  if (/^\d+$/.test(identifier)) {
    const { data: byId } = await supabase
      .from("books_public")
      .select("*")
      .eq("id", Number(identifier))
      .limit(1);
    if (byId && byId.length > 0) return byId[0];
  }

  return null;
});

function bookUrl(book: any) {
  return `${SITE_URL}/books/${book.slug || encodeURIComponent(book.title)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ title: string }>;
}): Promise<Metadata> {
  const { title } = await params;
  const book = await getBook(title);

  if (!book) {
    return { title: "کتاب نہیں ملی | مكتبہ الزھراء", robots: { index: false } };
  }

  const priceText = book.price ? ` قیمت: Rs ${effectivePrice(book).toLocaleString()}${isOnSale(book) ? " (سیل)" : ""}۔` : "";
  const description = `${book.title} — ${book.author}۔${priceText} مكتبہ الزھراء سے آن لائن آرڈر کریں۔`;
  const url = bookUrl(book);

  return {
    title: `${book.title} — ${book.author} | مكتبہ الزھراء`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: book.title,
      description,
      url,
      siteName: "مكتبہ الزھراء",
      type: "website",
      // 1200×630 کی تیار تصویر: سرورق پوری اور صاف دکھتا ہے (فیس بک اسے کاٹتی نہیں)
      images: [{ url: `${SITE_URL}/api/og?id=${book.id}`, width: 1200, height: 630, alt: `${book.title} — ${book.author}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description,
      images: [`${SITE_URL}/api/og?id=${book.id}`],
    },
  };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ title: string }>;
}) {
  const { title } = await params;
  const book = await getBook(title);

  if (!book) notFound();

  // پرانا یا مختلف لنک کھلے تو مستقل (308) طور پر درست لنک پر بھیجیں، تاکہ گوگل نیا لنک سیکھ لے
  const wanted = safeDecode(title);
  if (book.slug && wanted.normalize("NFC") !== String(book.slug).normalize("NFC")) {
    permanentRedirect(`/books/${encodeURIComponent(book.slug)}`);
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("book_title", book.title)
    .eq("approved", true);

  const { data: related } = await supabase
    .from("books_public")
    .select("*")
    .eq("category", book.category)
    .neq("id", book.id)
    .limit(4);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Product", "Book"],
    name: book.title,
    author: { "@type": "Person", name: book.author },
    url: bookUrl(book),
  };
  jsonLd.image = [book.image_url || `${SITE_URL}/logo.jpg`];
  jsonLd.description = `${book.title} — ${book.author}`;
  if (book.price) {
    jsonLd.offers = {
      "@type": "Offer",
      price: effectivePrice(book),
      priceCurrency: "PKR",
      ...(isOnSale(book) && book.sale_ends_at ? { priceValidUntil: String(book.sale_ends_at).slice(0, 10) } : {}),
      availability:
        (book.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <BookDetailClient
        initialBook={book}
        initialReviews={reviews || []}
        initialRelated={related || []}
      />
    </>
  );
}