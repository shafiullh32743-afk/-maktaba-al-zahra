import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// براؤزر میں: لاگ اِن سیشن کوکیز میں محفوظ ہوتا ہے (تاکہ سرور بھی پہچان سکے)
// سرور پر (sitemap، کتاب کا صفحہ): سادہ کلائنٹ، جو صرف عوامی ڈیٹا پڑھتا ہے
export const supabase =
  typeof window === "undefined"
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createBrowserClient(supabaseUrl, supabaseAnonKey);