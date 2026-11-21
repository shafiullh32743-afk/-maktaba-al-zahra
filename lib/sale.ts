// مكتبہ الزھراء - سیل / ڈسکاؤنٹ کے مشترکہ فنکشنز
export type SaleFields = {
  price?: number | null;
  sale_price?: number | null;
  sale_ends_at?: string | null;
};

// سیل ابھی جاری ہے؟ (آخری تاریخ نہ ہو یا گزری نہ ہو)
export function saleActive(endsAt?: string | null): boolean {
  if (!endsAt) return true;
  const end = new Date(String(endsAt).slice(0, 10) + "T23:59:59");
  return isNaN(end.getTime()) ? true : end.getTime() >= Date.now();
}

export function isOnSale(b: SaleFields): boolean {
  const price = Number(b.price) || 0;
  const sp = Number(b.sale_price) || 0;
  return sp > 0 && sp < price && saleActive(b.sale_ends_at);
}

// گاہک سے اصل میں لی جانے والی قیمت
export function effectivePrice(b: SaleFields): number {
  return isOnSale(b) ? Number(b.sale_price) : Number(b.price) || 0;
}

export function salePercent(b: SaleFields): number {
  if (!isOnSale(b)) return 0;
  return Math.round((1 - Number(b.sale_price) / Number(b.price)) * 100);
}