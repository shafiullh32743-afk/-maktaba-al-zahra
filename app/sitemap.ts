import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://maktaba-al-zahra-books.vercel.app";

  const { data: books } = await supabase.from("books_public").select("slug, title, author, image_url");

  const bookEntries = (books || []).map((book) => ({
    url: `${baseUrl}/books/${book.slug || encodeURIComponent(book.title)}`,
    lastModified: new Date(),
    ...(book.image_url ? { images: [book.image_url as string] } : {}),
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    ...bookEntries,
  ];
}