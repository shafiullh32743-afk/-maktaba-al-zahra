import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BookDetailClient from "./BookDetailClient";

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
    .from("books")
    .select("*")
    .eq("slug", identifier)
    .limit(1);
  if (bySlug && bySlug.length > 0) return bySlug[0];

  const { data: byTitle } = await supabase
    .from("books")
    .select("*")
    .eq("title", identifier)
    .limit(1);
  if (byTitle && byTitle.length > 0) return byTitle[0];

  if (/^\d+$/.test(identifier)) {
    const { data: byId } = await supabase
      .from("books")
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
    return { title: "کتاب نہیں ملی | مكتبہ الزھراء" };
  }

  const priceText = book.price ? ` قیمت: Rs ${Number(book.price).toLocaleString()}۔` : "";
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
      images: book.image_url ? [{ url: book.image_url }] : [],
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

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("book_title", book.title)
    .eq("approved", true);

  const { data: related } = await supabase
    .from("books")
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
  if (book.image_url) jsonLd.image = book.image_url;
  if (book.price) {
    jsonLd.offers = {
      "@type": "Offer",
      price: book.price,
      priceCurrency: "PKR",
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
