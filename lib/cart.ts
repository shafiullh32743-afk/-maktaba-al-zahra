// مكتبہ الزھراء - خریداری کی ٹوکری (شاپنگ کارٹ) کے فنکشنز
// یہ ڈیٹا صرف صارف کے اپنے براؤزر میں (localStorage) محفوظ ہوتا ہے

export interface CartItem {
  id: string;
  title: string;
  author: string;
  price?: number;
  slug?: string;
  image_url?: string;
  weight?: number;
  qty: number;
}

const CART_KEY = "maktaba-cart";

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("maktaba-cart-updated"));
  } catch {}
}

export function addToCart(item: Omit<CartItem, "qty">) {
  const cart = getCart();
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart(cart);
}

export function removeFromCart(id: string) {
  const cart = getCart().filter((c) => c.id !== id);
  saveCart(cart);
}

export function updateQty(id: string, qty: number) {
  const cart = getCart();
  const item = cart.find((c) => c.id === id);
  if (item) {
    item.qty = Math.max(1, qty);
    saveCart(cart);
  }
}

export function clearCart() {
  saveCart([]);
}

export function getCartCount(): number {
  try {
    return getCart().reduce((sum, c) => sum + c.qty, 0);
  } catch {
    return 0;
  }
}