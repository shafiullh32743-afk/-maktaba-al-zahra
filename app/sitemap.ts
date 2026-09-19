import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://maktaba-al-zahra-books.vercel.app";

  const { data: books } = await supabase.from("books").select("slug, title");

  const bookEntries = (books || []).map((book) => ({
    url: `${baseUrl}/books/${book.slug || encodeURIComponent(book.title)}`,
    lastModified: new Date(),
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/books`,
      lastModified: new Date(),
    },
    ...bookEntries,
  ];
}