"use client";

import { useState, useEffect, ChangeEvent, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  FolderTree,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Users,
  Receipt,
  Truck,
  RotateCcw,
  RotateCw,
  Pencil,
  Upload,
  Camera,
  MessageCircle,
  Star,
  MessageSquarePlus,
  PackageCheck,
  PackageX,
  PackageMinus,
  FileSpreadsheet,
  Wallet,
  Trash2,
  Plus,
  Minus,
  FileDown,
  Heart,
  CheckSquare,
  Square,
  Tags,
  Printer,
  Filter,
  MapPin,
  Phone,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import * as XLSX from "xlsx";

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  price?: number;
  weight?: number;
  stock?: number;
  cost_price?: number;
  slug?: string;
  image_url?: string;
  language?: string;
}

interface Review {
  id: number;
  book_title: string;
  customer_name: string;
  rating: number;
  comment: string;
  approved: boolean;
}

type CartItem = {
  id: number;
  title: string;
  price: number;
  weight: number;
  costPrice: number;
  stock: number;
  quantity: number;
};

type DragMode = "move" | "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";

const CROP_HANDLES: { mode: DragMode; cls: string }[] = [
  { mode: "tl", cls: "-top-2.5 -left-2.5 cursor-nwse-resize" },
  { mode: "tr", cls: "-top-2.5 -right-2.5 cursor-nesw-resize" },
  { mode: "bl", cls: "-bottom-2.5 -left-2.5 cursor-nesw-resize" },
  { mode: "br", cls: "-bottom-2.5 -right-2.5 cursor-nwse-resize" },
  { mode: "t", cls: "-top-2.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  { mode: "b", cls: "-bottom-2.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  { mode: "l", cls: "top-1/2 -left-2.5 -translate-y-1/2 cursor-ew-resize" },
  { mode: "r", cls: "top-1/2 -right-2.5 -translate-y-1/2 cursor-ew-resize" },
];

const urduToRomanMap: Record<string, string> = {
  "ا": "a", "آ": "aa", "ب": "b", "پ": "p", "ت": "t", "ٹ": "t", "ث": "s",
  "ج": "j", "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ڈ": "d", "ذ": "z",
  "ر": "r", "ڑ": "r", "ز": "z", "ژ": "zh", "س": "s", "ش": "sh", "ص": "s",
  "ض": "z", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh", "ف": "f", "ق": "q",
  "ک": "k", "گ": "g", "ل": "l", "م": "m", "ن": "n", "ں": "n", "و": "o",
  "ہ": "h", "ھ": "h", "ء": "", "ی": "i", "ے": "e", "؟": "", "۔": "",
};

const WISHLIST_KEY = "maktaba-wishlist";

function generateSlugFromTitle(title: string): string {
  let result = "";
  for (const ch of title) {
    if (urduToRomanMap[ch] !== undefined) {
      result += urduToRomanMap[ch];
    } else if (/[a-zA-Z0-9\s]/.test(ch)) {
      result += ch;
    } else if (ch === " ") {
      result += "-";
    }
  }
  return result
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function makeUniqueSlug(baseSlug: string, allBooks: Book[], excludeId: number | null): string {
  const taken = new Set(
    allBooks.filter((b) => b.id !== excludeId).map((b) => (b.slug || "").toLowerCase())
  );
  if (!baseSlug) baseSlug = "book";
  if (!taken.has(baseSlug)) return baseSlug;
  let counter = 2;
  while (taken.has(`${baseSlug}-${counter}`)) counter++;
  return `${baseSlug}-${counter}`;
}

function calculateDeliveryCharge(weight: number): number {
  if (weight <= 1) return 225;
  const extraKg = Math.ceil(weight - 1);
  return 225 + extraKg * 100;
}

function compressImage(file: File, maxWidth = 1000, quality = 0.75): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("compression failed"));
              return;
            }
            const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
            resolve(new File([blob], newName, { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("image load failed"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export default function BooksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-emerald-700 text-xs">لوڈ ہو رہا ہے... / Loading...</div>}>
      <BooksPageInner />
    </Suspense>
  );
}

function BooksPageInner() {
  const searchParams = useSearchParams();

  // ڈارک موڈ اور زبان کے لیے اسٹیٹس (Theme & Lang States)
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<"ur" | "en">("ur");

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterPriceFrom, setFilterPriceFrom] = useState("");
  const [filterPriceTo, setFilterPriceTo] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [newLanguage, setNewLanguage] = useState("اردو");
  const [newPrice, setNewPrice] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  // تصویر ایڈیٹر (کراپ + گھمانا)
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageSrc, setEditingImageSrc] = useState<string | null>(null);
  const [editingImageFileName, setEditingImageFileName] = useState<string>("image.jpg");
  const [editorBusy, setEditorBusy] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, box: { x: 0, y: 0, w: 0, h: 0 } });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartName, setCartName] = useState("");
  const [cartPhone, setCartPhone] = useState("");
  const [cartAddress, setCartAddress] = useState("");
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartSubmitting, setCartSubmitting] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBookTitle, setReviewBookTitle] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [renamingCategory, setRenamingCategory] = useState(false);
  const [categoryRenameValue, setCategoryRenameValue] = useState("");
  const [showCategoryRename, setShowCategoryRename] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [wishlist, setWishlist] = useState<number[]>([]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const t = {
    ur: {
      welcomeBanner: "مكتبہ الزھراء میں خوش آمدید — آن لائن اسلامک بک سٹور",
      bannerSub: "اگر مطلوبہ كتاب نظر نہ آئے تو واٹس ایپ پر رابطہ كریں",
      contact: "رابطہ کریں",
      dashboard: "ڈیش بورڈ",
      books: "کتب",
      authors: "مصنفین",
      categories: "زمرے",
      orders: "آرڈرز",
      customers: "کسٹمرز",
      invoices: "بل / انوائس",
      suppliers: "سپلائرز",
      returns: "واپسی/خراب",
      reviews: "ریویوز",
      lowStock: "کم سٹاک",
      expenses: "اخراجات",
      logout: "لاگ آؤٹ",
      ourBooks: "ہماری کتب 📚",
      subHeading: "تمام کتب اور ان کا سٹاک کیٹلاگ",
      cart: "ٹوکری",
      excel: "ایکسل",
      importing: "درآمد...",
      pdf: "PDF",
      labels: "لیبلز",
      addBook: "نئی کتاب",
      searchPlaceholder: "کتاب تلاش کریں...",
      allCategories: "تمام زمرے",
      allAuthors: "تمام مصنفین",
      more: "مزید",
      wishlist: "پسندیدہ",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      lowStockLabel: "Low Stock",
      addToCart: "ٹوکری میں ڈالیں",
      review: "ریویو",
      edit: "ترمیم",
      delete: "حذف",
      priceNotSet: "قیمت درج نہیں",
      rupees: "روپے",
      gallery: "گیلری",
      camera: "کیمرہ",
      adjustImage: "تصویر ایڈجسٹ کریں",
      left: "بائیں",
      right: "دائیں",
      fullImage: "پوری تصویر",
      confirm: "تصدیق کریں",
      cancel: "منسوخ",
      save: "شامل کریں",
      update: "ترمیم محفوظ کریں",
      saving: "محفوظ...",
      footerDesc: "آن لائن اسلامک بک سٹور جہاں تمام دینی، علمی وادبی کتب مناسب قیمت پر دستیاب ہیں۔",
      address: "پتہ",
      addressDetails: "مکتبہ الزہراء، نزد جامعہ الحسنین فیصل آباد، پاکستان",
      phone: "رابطہ",
    },
    en: {
      welcomeBanner: "Welcome to Maktaba Al-Zahra — Online Islamic Book Store",
      bannerSub: "Contact on WhatsApp if you cannot find your required book",
      contact: "Contact Us",
      dashboard: "Dashboard",
      books: "Books",
      authors: "Authors",
      categories: "Categories",
      orders: "Orders",
      customers: "Customers",
      invoices: "Invoices",
      suppliers: "Suppliers",
      returns: "Returns",
      reviews: "Reviews",
      lowStock: "Low Stock",
      expenses: "Expenses",
      logout: "Logout",
      ourBooks: "Our Books 📚",
      subHeading: "Catalog of all available books and stock",
      cart: "Cart",
      excel: "Excel",
      importing: "Importing...",
      pdf: "PDF",
      labels: "Labels",
      addBook: "Add Book",
      searchPlaceholder: "Search book...",
      allCategories: "All Categories",
      allAuthors: "All Authors",
      more: "More",
      wishlist: "Wishlist",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      lowStockLabel: "Low Stock",
      addToCart: "Add to Cart",
      review: "Review",
      edit: "Edit",
      delete: "Delete",
      priceNotSet: "Price Not Set",
      rupees: "PKR",
      gallery: "Gallery",
      camera: "Camera",
      adjustImage: "Adjust Image",
      left: "Left",
      right: "Right",
      fullImage: "Full Image",
      confirm: "Confirm",
      cancel: "Cancel",
      save: "Save Book",
      update: "Update Book",
      saving: "Saving...",
      footerDesc: "Online Islamic bookstore offering religious and literary books at affordable prices.",
      address: "Address",
      addressDetails: "Maktaba Al-Zahra, Near Jamia Al-Hasanain, Faisalabad, Pakistan",
      phone: "Contact",
    },
  }[lang];

  function getStockStatus(stock: number) {
    if (stock <= 0) return { label: t.outOfStock, color: "text-rose-700 bg-rose-50 border-rose-200" };
    if (stock <= 5) return { label: t.lowStockLabel, color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: t.inStock, color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  }

  useEffect(() => {
    const authorParam = searchParams.get("author");
    if (authorParam) setFilterAuthor(authorParam);
    const categoryParam = searchParams.get("category");
    if (categoryParam) setFilterCategory(categoryParam);
  }, [searchParams]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      if (stored) setWishlist(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleWishlist = (id: number) => {
    setWishlist((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const fetchBooks = async () => {
    setLoaded(false);
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data) {
      setBooks(data as Book[]);

      const booksWithoutSlug = (data as Book[]).filter((b) => !b.slug);
      if (booksWithoutSlug.length > 0) {
        const currentBooks = data as Book[];
        await Promise.all(
          booksWithoutSlug.map((b) => {
            const base = generateSlugFromTitle(b.title);
            const unique = makeUniqueSlug(base, currentBooks, b.id);
            return unique ? supabase.from("books").update({ slug: unique }).eq("id", b.id) : null;
          })
        );
        const { data: refreshed } = await supabase
          .from("books")
          .select("*")
          .order("id", { ascending: true });
        if (refreshed) setBooks(refreshed as Book[]);
      }
    }
    setLoaded(true);
  };

  const fetchReviews = async () => {
    const { data } = await supabase.from("reviews").select("*").eq("approved", true);
    if (data) setReviews(data as Review[]);
  };

  useEffect(() => {
    fetchBooks();
    fetchReviews();
  }, []);

  const getBookRating = (title: string) => {
    const bookReviews = reviews.filter((r) => r.book_title === title);
    if (bookReviews.length === 0) return null;
    const avg = bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length;
    return { avg: avg.toFixed(1), count: bookReviews.length };
  };

  const resetAllFilters = () => {
    setSearch("");
    setFilterCategory("");
    setFilterAuthor("");
    setFilterLanguage("");
    setFilterPriceFrom("");
    setFilterPriceTo("");
    setInStockOnly(false);
    setShowWishlistOnly(false);
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch = search.trim() === "" || book.title.toLowerCase().includes(search.trim().toLowerCase());
    const matchesCategory = filterCategory ? book.category === filterCategory : true;
    const matchesAuthor = filterAuthor ? book.author === filterAuthor : true;
    const matchesLanguage = filterLanguage ? (book.language || "اردو") === filterLanguage : true;
    const matchesStock = inStockOnly ? (book.stock ?? 0) > 0 : true;
    const matchesWishlist = showWishlistOnly ? wishlist.includes(book.id) : true;

    const price = book.price || 0;
    const minPrice = filterPriceFrom !== "" ? parseFloat(filterPriceFrom) : null;
    const maxPrice = filterPriceTo !== "" ? parseFloat(filterPriceTo) : null;

    const matchesPriceFrom = minPrice === null || price >= minPrice;
    const matchesPriceTo = maxPrice === null || price <= maxPrice;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesAuthor &&
      matchesLanguage &&
      matchesStock &&
      matchesWishlist &&
      matchesPriceFrom &&
      matchesPriceTo
    );
  });

  const existingCategories = Array.from(new Set(books.map((b) => b.category)));

  const handleRenameCategory = async () => {
    if (!newCategory || newCategory === "__new__" || categoryRenameValue.trim() === "") return;
    setRenamingCategory(true);
    await supabase
      .from("books")
      .update({ category: categoryRenameValue.trim() })
      .eq("category", newCategory);
    setNewCategory(categoryRenameValue.trim());
    setRenamingCategory(false);
    setShowCategoryRename(false);
    fetchBooks();
  };
  const existingAuthors = Array.from(new Set(books.map((b) => b.author)));
  const existingLanguages = Array.from(new Set(books.map((b) => b.language || "اردو")));

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaveError(null);
    setEditingImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditingImageSrc(ev.target?.result as string);
      setCropBox({ x: 0, y: 0, w: 100, h: 100 });
      setShowImageEditor(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const openEditorForCurrentImage = () => {
    if (!imagePreview) return;
    setEditingImageSrc(imagePreview);
    setEditingImageFileName("image.jpg");
    setCropBox({ x: 0, y: 0, w: 100, h: 100 });
    setShowImageEditor(true);
  };

  const closeImageEditor = () => {
    setShowImageEditor(false);
    setEditingImageSrc(null);
    setCropBox({ x: 0, y: 0, w: 100, h: 100 });
  };

  const rotateImage = async (delta: number) => {
    if (!editingImageSrc || editorBusy) return;
    setEditorBusy(true);
    try {
      const img = await loadImage(editingImageSrc);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalHeight;
      canvas.height = img.naturalWidth;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((delta * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      setEditingImageSrc(canvas.toDataURL("image/jpeg", 0.92));
      setCropBox({ x: 0, y: 0, w: 100, h: 100 });
    } catch {
    } finally {
      setEditorBusy(false);
    }
  };

  const getEditorPoint = (e: React.MouseEvent | React.TouchEvent, area: HTMLDivElement) => {
    const rect = area.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const startDrag = (e: React.MouseEvent | React.TouchEvent, mode: DragMode, area: HTMLDivElement) => {
    e.stopPropagation();
    const point = getEditorPoint(e, area);
    setDragMode(mode);
    setDragStart({ x: point.x, y: point.y, box: { ...cropBox } });
  };

  const onDragMove = (e: React.MouseEvent | React.TouchEvent, area: HTMLDivElement) => {
    if (!dragMode) return;
    const point = getEditorPoint(e, area);
    const dx = point.x - dragStart.x;
    const dy = point.y - dragStart.y;
    const start = dragStart.box;
    const minSize = 10;

    let { x, y, w, h } = start;

    if (dragMode === "move") {
      x = Math.max(0, Math.min(100 - start.w, start.x + dx));
      y = Math.max(0, Math.min(100 - start.h, start.y + dy));
    }

    if (dragMode === "tl" || dragMode === "bl" || dragMode === "l") {
      const newX = Math.max(0, Math.min(start.x + start.w - minSize, start.x + dx));
      w = start.w + (start.x - newX);
      x = newX;
    }
    if (dragMode === "tr" || dragMode === "br" || dragMode === "r") {
      w = Math.max(minSize, Math.min(100 - start.x, start.w + dx));
    }
    if (dragMode === "tl" || dragMode === "tr" || dragMode === "t") {
      const newY = Math.max(0, Math.min(start.y + start.h - minSize, start.y + dy));
      h = start.h + (start.y - newY);
      y = newY;
    }
    if (dragMode === "bl" || dragMode === "br" || dragMode === "b") {
      h = Math.max(minSize, Math.min(100 - start.y, start.h + dy));
    }

    setCropBox({ x, y, w, h });
  };

  const endDrag = () => setDragMode(null);

  const handleConfirmImageEdit = async () => {
    if (!editingImageSrc) return;
    setCompressing(true);
    setShowImageEditor(false);
    try {
      const img = await loadImage(editingImageSrc);

      const cropX = (cropBox.x / 100) * img.naturalWidth;
      const cropY = (cropBox.y / 100) * img.naturalHeight;
      const cropW = Math.max(1, (cropBox.w / 100) * img.naturalWidth);
      const cropH = Math.max(1, (cropBox.h / 100) * img.naturalHeight);

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = Math.round(cropW);
      finalCanvas.height = Math.round(cropH);
      const fCtx = finalCanvas.getContext("2d");
      if (!fCtx) throw new Error("canvas unavailable");
      fCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, finalCanvas.width, finalCanvas.height);

      const blob: Blob = await new Promise((resolve, reject) => {
        finalCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.9);
      });
      const finalFile = new File([blob], editingImageFileName.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
      const compressed = await compressImage(finalFile);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch {
      setSaveError("تصویر پر کارروائی نہیں ہو سکی، دوبارہ کوشش کریں");
    } finally {
      setCompressing(false);
      setEditingImageSrc(null);
      setCropBox({ x: 0, y: 0, w: 100, h: 100 });
    }
  };

  const removeCurrentImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  };

  const handleAddBook = async () => {
    if (newTitle.trim() === "") return;
    setUploading(true);
    setSaveError(null);

    const finalCategory = newCategory === "__new__" ? customCategory.trim() : newCategory;
    let imageUrl = existingImageUrl;

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage.from("book-covers").upload(fileName, imageFile);
      if (uploadError) {
        setSaveError(`تصویر اپلوڈ نہیں ہو سکی: ${uploadError.message}`);
        setUploading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("book-covers").getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const baseSlug = newSlug.trim() || generateSlugFromTitle(newTitle);
    const uniqueSlug = makeUniqueSlug(baseSlug, books, editingId);

    const bookData = {
      title: newTitle,
      author: newAuthor || "مكتبہ الزھراء",
      category: finalCategory || "عمومی",
      language: newLanguage || "اردو",
      image_url: imageUrl,
      price: parseFloat(newPrice) || 0,
      weight: parseFloat(newWeight) || 1,
      stock: parseInt(newStock) || 0,
      cost_price: parseFloat(newCostPrice) || 0,
      slug: uniqueSlug,
    };

    const { error: saveErr } = editingId
      ? await supabase.from("books").update(bookData).eq("id", editingId)
      : await supabase.from("books").insert(bookData);

    if (saveErr) {
      setSaveError(`محفوظ نہیں ہو سکا: ${saveErr.message}`);
      setUploading(false);
      return;
    }

    setNewTitle("");
    setNewAuthor("");
    setNewCategory("");
    setCustomCategory("");
    setNewLanguage("اردو");
    setNewPrice("");
    setNewWeight("");
    setNewStock("");
    setNewCostPrice("");
    setNewSlug("");
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setUploading(false);
    setShowModal(false);
    fetchBooks();
  };

  const handleEditClick = (book: Book) => {
    setEditingId(book.id);
    setNewTitle(book.title);
    setNewAuthor(book.author);
    setNewCategory(book.category);
    setNewLanguage(book.language || "اردو");
    setNewPrice(book.price ? book.price.toString() : "");
    setNewWeight(book.weight ? book.weight.toString() : "");
    setNewStock(book.stock ? book.stock.toString() : "");
    setNewCostPrice(book.cost_price ? book.cost_price.toString() : "");
    setNewSlug(book.slug || generateSlugFromTitle(book.title));
    setExistingImageUrl(book.image_url || null);
    setImagePreview(book.image_url || null);
    setImageFile(null);
    setSaveError(null);
    setShowModal(true);
  };

  const handleDeleteBook = async (id: number) => {
    await supabase.from("books").delete().eq("id", id);
    setConfirmDeleteId(null);
    fetchBooks();
  };

  const handleExcelImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const usedSlugsThisBatch: string[] = [];

      const booksToInsert = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const title = row[0];
        const author = row[1];
        const price = row[2];
        const category = row[3];
        const language = row[4];
        if (!title || typeof title !== "string" || title.trim() === "") continue;

        const base = generateSlugFromTitle(title.toString().trim());
        const combinedExisting = books.map((b) => ({ id: b.id, slug: b.slug || "" } as Book));
        let slug = makeUniqueSlug(base, combinedExisting, null);
        while (usedSlugsThisBatch.includes(slug)) {
          slug = makeUniqueSlug(slug, [{ id: -1, slug } as Book], null);
        }
        usedSlugsThisBatch.push(slug);

        booksToInsert.push({
          title: title.toString().trim(),
          author: author ? author.toString().trim() : "مكتبہ الزھراء",
          category: category && category.toString().trim() !== "" ? category.toString().trim() : "عمومی",
          language: language ? language.toString().trim() : "اردو",
          price: typeof price === "number" ? price : parseFloat(price) || 0,
          weight: 1,
          stock: 0,
          slug,
        });
      }

      if (booksToInsert.length > 0) {
        const { error } = await supabase.from("books").insert(booksToInsert);
        if (error) {
          setImportResult(`خرابی: ${error.message}`);
        } else {
          setImportResult(`✅ ${booksToInsert.length} کتابیں کامیابی سے شامل ہو گئیں`);
          fetchBooks();
        }
      } else {
        setImportResult("کوئی کتاب نہیں ملی، فائل چیک کریں");
      }
      setImporting(false);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const addToCart = (book: Book) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === book.id);
      if (existing) {
        if (existing.quantity >= (book.stock || 0)) return prev;
        return prev.map((item) =>
          item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: book.id,
          title: book.title,
          price: book.price || 0,
          weight: book.weight || 1,
          costPrice: book.cost_price || 0,
          stock: book.stock || 0,
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock) return item;
          return { ...item, quantity: newQty };
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotalWeight = cart.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  const cartDeliveryCharge = cart.length > 0 ? calculateDeliveryCharge(cartTotalWeight) : 0;
  const cartTotalBill = cartSubtotal + cartDeliveryCharge;

  const sendCartToWhatsApp = () => {
    const itemsList = cart
      .map((item) => `📚 ${item.title} — تعداد: ${item.quantity} — Rs ${item.price * item.quantity}`)
      .join("\n");

    const message = `السلام علیکم، میں نے آرڈر کیا ہے:

${itemsList}

👤 نام: ${cartName}
📞 فون: ${cartPhone}
📍 پتہ: ${cartAddress}

💰 کتابوں کی مجموعی قیمت: ${cartSubtotal} روپے
🚚 ڈیلیوری چارجز: ${cartDeliveryCharge} روپے
💵 کل بل: ${cartTotalBill} روپے`;

    const whatsappUrl = `https://wa.me/923055232889?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleSubmitCartOrder = async () => {
    if (cartName.trim() === "" || cartPhone.trim() === "" || cart.length === 0) return;
    setCartSubmitting(true);

    const orderGroup = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const orderRows = cart.map((item, index) => ({
      book_title: item.title,
      customer_name: cartName,
      customer_phone: cartPhone,
      customer_address: cartAddress,
      status: "نیا",
      book_price: item.price * item.quantity,
      cost_price: item.costPrice * item.quantity,
      delivery_charge: index === 0 ? cartDeliveryCharge : 0,
      total_amount: index === 0 ? cartTotalBill : item.price * item.quantity,
      quantity: item.quantity,
      order_group: orderGroup,
    }));

    await supabase.from("orders").insert(orderRows);

    for (const item of cart) {
      const { data: freshBook } = await supabase
        .from("books")
        .select("stock")
        .eq("id", item.id)
        .single();
      const liveStock = freshBook?.stock ?? item.stock;
      const newStockValue = Math.max(0, liveStock - item.quantity);
      await supabase.from("books").update({ stock: newStockValue }).eq("id", item.id);
    }

    fetchBooks();
    setCartSubmitting(false);
    setCartSuccess(true);
  };

  const closeCartModal = () => {
    setShowCartModal(false);
    if (cartSuccess) {
      setCart([]);
      setCartName("");
      setCartPhone("");
      setCartAddress("");
      setCartSuccess(false);
    }
  };

  const handleReviewClick = (title: string) => {
    setReviewBookTitle(title);
    setReviewName("");
    setReviewRating(5);
    setReviewComment("");
    setReviewSuccess(false);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (reviewName.trim() === "" || reviewComment.trim() === "") return;
    setReviewSubmitting(true);
    await supabase.from("reviews").insert({
      book_title: reviewBookTitle,
      customer_name: reviewName,
      rating: reviewRating,
      comment: reviewComment,
      approved: false,
    });
    setReviewSubmitting(false);
    setReviewSuccess(true);
  };

  const handleDownloadPDF = () => {
    const rows = filteredBooks
      .map(
        (book, index) => `
        <tr>
          <td style="padding:8px;border:1px solid #ccc;text-align:center;">${index + 1}</td>
          <td style="padding:8px;border:1px solid #ccc;">${book.title}</td>
          <td style="padding:8px;border:1px solid #ccc;">${book.author}</td>
          <td style="padding:8px;border:1px solid #ccc;">${book.category}</td>
          <td style="padding:8px;border:1px solid #ccc;text-align:center;">${book.price || "-"}</td>
          <td style="padding:8px;border:1px solid #ccc;text-align:center;">${book.stock ?? "-"}</td>
        </tr>`
      )
      .join("");

    const html = `
      <html dir="${lang === "ur" ? "rtl" : "ltr"}" lang="${lang}">
        <head>
          <meta charset="UTF-8" />
          <title>مكتبہ الزھراء - فہرست کتب</title>
          <style>
            body { font-family: Arial, "Noto Nastaliq Urdu", sans-serif; padding: 24px; }
            h1 { text-align: center; color: #047857; }
            p { text-align: center; color: #555; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 14px; }
            th { background: #047857; color: white; padding: 8px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <h1>مكتبہ الزھراء</h1>
          <p>فہرست کتب — کل ${filteredBooks.length} کتابیں</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>کتاب کا نام</th>
                <th>مصنف</th>
                <th>زمرہ</th>
                <th>قیمت</th>
                <th>سٹاک</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  const handlePrintLabels = (booksToPrint: Book[]) => {
    if (booksToPrint.length === 0) return;

    const labelsHtml = booksToPrint
      .map(
        (b) => `
        <div class="label">
          <div class="label-title">${b.title}</div>
          <div class="label-author">${b.author}</div>
          <div class="label-price">${b.price ? "Rs " + Number(b.price).toLocaleString() : "قیمت درج نہیں"}</div>
        </div>`
      )
      .join("");

    const html = `
      <html dir="${lang === "ur" ? "rtl" : "ltr"}" lang="${lang}">
        <head>
          <meta charset="UTF-8" />
          <title>لیبلز پرنٹ</title>
          <style>
            body { font-family: Arial, "Noto Nastaliq Urdu", sans-serif; margin: 0; padding: 12px; }
            .labels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
            .label { border: 1px dashed #999; border-radius: 6px; padding: 10px 6px; text-align: center; break-inside: avoid; }
            .label-title { font-weight: bold; font-size: 13px; line-height: 1.3; }
            .label-author { font-size: 10px; color: #555; margin-top: 3px; }
            .label-price { font-size: 14px; color: #047857; font-weight: bold; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="labels-grid">${labelsHtml}</div>
        </body>
      </html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setBulkCategory("");
  };

  const handleBulkCategoryChange = async () => {
    if (selectedIds.length === 0 || !bulkCategory) return;
    setBulkProcessing(true);
    await supabase.from("books").update({ category: bulkCategory }).in("id", selectedIds);
    setBulkProcessing(false);
    clearSelection();
    fetchBooks();
  };

  const handleBulkDeleteConfirmed = async () => {
    setBulkProcessing(true);
    await supabase.from("books").delete().in("id", selectedIds);
    setBulkProcessing(false);
    setConfirmBulkDelete(false);
    clearSelection();
    fetchBooks();
  };

  const menuItems = [
    { href: "/", label: t.dashboard, icon: LayoutDashboard },
    { href: "/books", label: t.books, icon: BookOpen, active: true },
    { href: "/authors", label: t.authors, icon: PenLine },
    { href: "/categories", label: t.categories, icon: FolderTree },
    { href: "/orders", label: t.orders, icon: ShoppingCart },
    { href: "/customers", label: t.customers, icon: Users },
    { href: "/invoices", label: t.invoices, icon: Receipt },
    { href: "/suppliers", label: t.suppliers, icon: Truck },
    { href: "/returns", label: t.returns, icon: RotateCcw },
    { href: "/reviews", label: t.reviews, icon: Star },
    { href: "/low-stock", label: t.lowStock, icon: PackageMinus },
    { href: "/expenses", label: t.expenses, icon: Wallet },
  ];

  const hasActiveFilters =
    search ||
    filterCategory ||
    filterAuthor ||
    filterLanguage ||
    filterPriceFrom ||
    filterPriceTo ||
    inStockOnly ||
    showWishlistOnly;

  return (
    <main
      dir={lang === "ur" ? "rtl" : "ltr"}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50/60 text-slate-800"
      }`}
    >
      {/* 1. فلوٹنگ WhatsApp بٹن */}
      <a
        href="https://wa.me/923055232889?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%DB%8C%DA%A9%D9%85%D8%8C%20%D9%85%DA%98%DB%8C%D8%AF%20%D9%85%D8%B9%D9%84%D9%88%D9%85%D8%A7%D8%AA%20%DA%86%D8%A7%DB%81%DB%8C%DB%9C"
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-6 ${lang === "ur" ? "left-6" : "right-6"} z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-lg transition transform hover:scale-105 flex items-center justify-center group`}
        title={t.contact}
      >
        <MessageCircle size={24} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-semibold pr-0 group-hover:pr-2">
          {t.contact}
        </span>
      </a>

      {/* اوپر کا بینر و نائٹ/لینگویج سوئچ */}
      <div className={`${darkMode ? "bg-emerald-950" : "bg-emerald-800"} text-white text-xs py-2 px-4 flex flex-col md:flex-row items-center justify-between gap-2 text-center font-medium`}>
        <div className="flex-1 flex items-center justify-center gap-2 flex-wrap">
          <span>{t.welcomeBanner}</span>
          <span className="hidden md:inline">•</span>
          <span>{t.bannerSub}</span>
          <span className="hidden md:inline">•</span>
          <a href="https://wa.me/923055232889" target="_blank" className="font-bold underline hover:text-emerald-200">
            WA: 03055232889
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white transition flex items-center gap-1 text-[11px] px-2"
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{darkMode ? "Light" : "Dark"}</span>
          </button>

          <button
            onClick={() => setLang(lang === "ur" ? "en" : "ur")}
            className="p-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white transition flex items-center gap-1 text-[11px] px-2 font-bold"
            title="Switch Language"
          >
            <Globe size={14} />
            <span>{lang === "ur" ? "English" : "اردو"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {mobileMenuOpen && (
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" />
        )}

        {/* Sidebar */}
        <aside
          className={`w-60 min-h-screen md:h-screen md:sticky md:top-0 border-r border-l ${
            darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          } p-4 flex flex-col fixed inset-y-0 ${lang === "ur" ? "right-0" : "left-0"} z-50 flex-shrink-0 transform transition-transform duration-300 shadow-sm ${
            mobileMenuOpen ? "translate-x-0" : lang === "ur" ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
                <BookOpen className="text-white" size={17} />
              </div>
              <h1 className={`text-base font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>مكتبہ الزھراء</h1>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <nav className="mt-6 space-y-1 flex-1 overflow-y-auto pl-1">
            <p className="text-slate-400 text-[11px] font-semibold px-2 mb-1">{t.books}</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    item.active
                      ? darkMode
                        ? "bg-emerald-900/50 text-emerald-300"
                        : "bg-emerald-50 text-emerald-700 shadow-xs"
                      : darkMode
                      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} className={item.active ? "text-emerald-600" : "text-slate-400"} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className={`border-t ${darkMode ? "border-slate-800" : "border-slate-100"} pt-3 mt-2 space-y-2`}>
            <button
              onClick={() => {
                document.cookie = "maktaba-auth=; path=/; max-age=0";
                window.location.href = "/login";
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-xs font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut size={16} /> {t.logout}
            </button>
            <p className="text-slate-500 text-[10px] text-center">مكتبہ الزھراء © 2026</p>
          </div>
        </aside>

        {/* الگ سائیڈ فلٹر پینل */}
        {showFilterSidebar && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setShowFilterSidebar(false)} />
            <div className={`relative w-80 ${darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-800"} min-h-full p-5 shadow-xl flex flex-col z-10 overflow-y-auto border-r border-slate-200`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Filter size={16} /> کسٹم فلٹرز
                </h3>
                <button onClick={() => setShowFilterSidebar(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4 flex-1 text-xs">
                <div>
                  <label className="font-semibold mb-1.5 block">قیمت حد (Rs)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="کم سے کم"
                      value={filterPriceFrom}
                      onChange={(e) => setFilterPriceFrom(e.target.value)}
                      className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      placeholder="زیادہ سے زیادہ"
                      value={filterPriceTo}
                      onChange={(e) => setFilterPriceTo(e.target.value)}
                      className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold mb-1.5 block">زبان (Language)</label>
                  <select
                    value={filterLanguage}
                    onChange={(e) => setFilterLanguage(e.target.value)}
                    className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                  >
                    <option value="">تمام زبانیں</option>
                    <option value="اردو">اردو</option>
                    <option value="عربی">عربی</option>
                    <option value="انگلش">English</option>
                    <option value="فارسی">فارسی</option>
                    {existingLanguages.map(
                      (langItem) =>
                        !["اردو", "عربی", "انگلش", "فارسی"].includes(langItem) && (
                          <option key={langItem} value={langItem}>{langItem}</option>
                        )
                    )}
                  </select>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 font-medium cursor-pointer border border-emerald-500/20 bg-emerald-500/10 p-2.5 rounded-lg">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    صرف سٹاک میں موجود
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setShowFilterSidebar(false)}
                  className="flex-1 rounded-lg bg-emerald-600 text-white py-2 text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  لاگو کریں
                </button>
                <button
                  onClick={resetAllFilters}
                  className="rounded-lg border border-slate-200 bg-slate-50 text-slate-600 px-3 py-2 text-xs font-medium hover:bg-slate-100 transition"
                >
                  ریسیٹ
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="flex-1 min-w-0 p-4 md:p-6 max-w-7xl mx-auto pb-28">
          {/* Mobile Header */}
          <div className={`flex items-center justify-between md:hidden mb-4 p-3 rounded-xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <button onClick={() => setMobileMenuOpen(true)} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-bold text-slate-800">مكتبہ الزھراء</h1>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{t.ourBooks}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.subHeading}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowCartModal(true)}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 border transition text-xs font-semibold shadow-xs ${
                  darkMode ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ShoppingCart size={15} className="text-emerald-600" />
                {t.cart}
                {cartCount > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center -mr-1">
                    {cartCount}
                  </span>
                )}
              </button>

              <label className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border transition cursor-pointer text-xs font-semibold ${
                darkMode ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}>
                <FileSpreadsheet size={15} className="text-emerald-600" />
                {importing ? t.importing : t.excel}
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} disabled={importing} className="hidden" />
              </label>

              <button
                onClick={handleDownloadPDF}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border transition text-xs font-semibold ${
                  darkMode ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <FileDown size={15} />
                {t.pdf}
              </button>

              <button
                onClick={() => handlePrintLabels(filteredBooks)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border transition text-xs font-semibold ${
                  darkMode ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Printer size={15} />
                {t.labels}
              </button>

              <button
                onClick={() => {
                  setEditingId(null);
                  setNewTitle("");
                  setNewAuthor("");
                  setNewCategory("");
                  setNewLanguage("اردو");
                  setNewPrice("");
                  setNewWeight("");
                  setNewStock("");
                  setNewCostPrice("");
                  setNewSlug("");
                  setImageFile(null);
                  setImagePreview(null);
                  setExistingImageUrl(null);
                  setSaveError(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs text-xs font-semibold"
              >
                <Plus size={15} />
                <span>{t.addBook}</span>
              </button>
            </div>
          </div>

          {importResult && (
            <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3.5 py-2">
              {importResult}
            </div>
          )}

          {/* فلٹرز سیکشن */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`lg:col-span-2 rounded-lg border p-2 text-xs transition shadow-xs ${
                darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"
              }`}
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`rounded-lg border p-2 text-xs transition ${
                darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"
              }`}
            >
              <option value="">{t.allCategories}</option>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              className={`rounded-lg border p-2 text-xs transition ${
                darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"
              }`}
            >
              <option value="">{t.allAuthors}</option>
              {existingAuthors.map((author) => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilterSidebar(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition ${
                  darkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <Filter size={14} /> {t.more}
              </button>

              <button
                onClick={() => setShowWishlistOnly((v) => !v)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs transition font-medium ${
                  showWishlistOnly
                    ? "bg-rose-50 border-rose-300 text-rose-600"
                    : darkMode
                    ? "bg-slate-900 border-slate-800 text-slate-300"
                    : "bg-white border-slate-200 text-slate-600"
                }`}
              >
                <Heart size={14} className={showWishlistOnly ? "fill-rose-500" : ""} />
                {t.wishlist}
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
              <span>{filteredBooks.length} نتائج ملے</span>
              <span>•</span>
              <button onClick={resetAllFilters} className="text-emerald-600 hover:underline">
                تمام فلٹرز صاف کریں
              </button>
            </div>
          )}

          {/* کتب کارڈز گرڈ */}
          {!loaded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`h-64 rounded-xl border p-4 animate-pulse ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredBooks.length === 0 && (
                <div className={`col-span-full py-12 text-center text-xs text-slate-500 rounded-xl border shadow-xs ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <span className="text-3xl mb-2 block">📖</span>
                  <p>کوئی کتاب نہیں ملی</p>
                </div>
              )}

              {filteredBooks.map((book) => {
                const ratingInfo = getBookRating(book.title);
                const stockInfo = getStockStatus(book.stock ?? 0);
                const outOfStock = (book.stock ?? 0) <= 0;
                const inCart = cart.find((item) => item.id === book.id);
                const isWished = wishlist.includes(book.id);
                const isSelected = selectedIds.includes(book.id);

                return (
                  <div
                    key={book.id}
                    className={`relative rounded-xl border p-4 shadow-xs transition-all flex flex-col justify-between group ${
                      darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                    } ${isSelected ? "border-emerald-500 ring-1 ring-emerald-500/20" : ""}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => toggleSelect(book.id)}
                          className="text-slate-400 hover:text-emerald-600 transition"
                          title="منتخب کریں"
                        >
                          {isSelected ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} />}
                        </button>

                        <button
                          onClick={() => toggleWishlist(book.id)}
                          className={`p-1 rounded-full transition ${
                            isWished ? "text-rose-500" : "text-slate-300 hover:text-rose-500"
                          }`}
                          title={t.wishlist}
                        >
                          <Heart size={16} className={isWished ? "fill-rose-500" : ""} />
                        </button>
                      </div>

                      <div
                        onClick={() => book.image_url && setZoomedImage(book.image_url)}
                        className={`relative w-full aspect-[4/3] rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden mb-3 border border-slate-100 ${
                          book.image_url ? "cursor-pointer" : ""
                        }`}
                      >
                        {book.image_url ? (
                          <Image
                            src={book.image_url}
                            alt={book.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <BookOpen size={36} className="text-slate-300" />
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${stockInfo.color}`}>
                          {stockInfo.label} {(book.stock ?? 0) > 0 && `(${book.stock})`}
                        </span>

                        {ratingInfo && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <span className="font-bold text-slate-700">{ratingInfo.avg}</span>
                          </div>
                        )}
                      </div>

                      <h3 className={`text-sm font-bold line-clamp-1 mb-0.5 ${darkMode ? "text-white" : "text-slate-800"}`}>{book.title}</h3>
                      <p className="text-xs text-slate-500 truncate mb-2">{book.author}</p>

                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                          {book.category}
                        </span>
                        <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-medium">
                          {book.language || "اردو"}
                        </span>
                      </div>

                      {book.price ? (
                        <p className="text-sm font-extrabold text-emerald-700 mb-3">
                          {Number(book.price).toLocaleString()} {t.rupees}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic mb-3">{t.priceNotSet}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {inCart ? (
                        <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs">
                          <button
                            onClick={() => updateCartQuantity(book.id, -1)}
                            className="w-5 h-5 rounded bg-white text-emerald-700 flex items-center justify-center shadow-xs"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="font-bold text-emerald-800">{inCart.quantity} {t.cart}</span>
                          <button
                            onClick={() => updateCartQuantity(book.id, 1)}
                            disabled={inCart.quantity >= (book.stock ?? 0)}
                            className="w-5 h-5 rounded bg-white text-emerald-700 flex items-center justify-center shadow-xs disabled:opacity-40"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(book)}
                          disabled={outOfStock}
                          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-1.5 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          <ShoppingCart size={13} />
                          {outOfStock ? t.outOfStock : t.addToCart}
                        </button>
                      )}

                      <div className="flex gap-1.5 text-xs">
                        <button
                          onClick={() => handleReviewClick(book.title)}
                          className={`flex-1 py-1 rounded-lg border text-[11px] transition ${darkMode ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-600"}`}
                        >
                          {t.review}
                        </button>
                        <button
                          onClick={() => handleEditClick(book)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition text-[11px] font-medium"
                        >
                          {t.edit}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(book.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition text-[11px] font-medium"
                        >
                          {t.delete}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* فوٹر */}
          <footer className={`mt-16 border-t pt-8 pb-6 text-xs ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5 text-emerald-600">
                  <BookOpen size={16} /> مكتبہ الزھراء
                </h3>
                <p className="text-[11px] leading-relaxed">{t.footerDesc}</p>
              </div>

              <div>
                <h4 className="font-bold mb-2">{t.address}</h4>
                <p className="flex items-start gap-1.5 text-[11px]">
                  <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  {t.addressDetails}
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-2">{t.phone}</h4>
                <div className="space-y-1 text-[11px]">
                  <p className="flex items-center gap-1.5">
                    <Phone size={13} className="text-emerald-600" /> 0305-5232889
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MessageCircle size={13} className="text-emerald-600" /> WA: 0305-5232889
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400">
              © 2026 مكتبہ الزھراء. جملہ حقوق محفوظ ہیں۔
            </div>
          </footer>
        </section>

        {/* بلک ایکشن بار */}
        {selectedIds.length > 0 && (
          <div className={`fixed bottom-0 inset-x-0 md:inset-x-auto md:right-60 md:left-0 border-t shadow-xl z-40 p-3 ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"}`}>
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-2.5 text-xs">
              <span className="font-bold whitespace-nowrap">{selectedIds.length} کتب منتخب</span>

              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className={`rounded-lg border p-1.5 flex-1 w-full md:w-auto text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
              >
                <option value="">زمرہ تبدیل کریں...</option>
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={handleBulkCategoryChange}
                  disabled={!bulkCategory || bulkProcessing}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  لاگو کریں
                </button>
                <button
                  onClick={() => handlePrintLabels(books.filter((b) => selectedIds.includes(b.id)))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition"
                >
                  لیبلز
                </button>
                <button
                  onClick={() => setConfirmBulkDelete(true)}
                  disabled={bulkProcessing}
                  className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg font-semibold hover:bg-rose-100 transition"
                >
                  حذف
                </button>
                <button onClick={clearSelection} className="text-slate-400 hover:text-slate-600 underline text-xs">
                  منسوخ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* بلک ڈیلیٹ کنفکرمیشن */}
        {confirmBulkDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className={`rounded-xl border p-5 w-full max-w-sm shadow-xl text-center ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"}`}>
              <h3 className="text-sm font-bold">{selectedIds.length} کتب حذف کریں؟</h3>
              <p className="text-slate-400 text-xs mt-1.5">کیا آپ واقعی منتخب کردہ کتب کا ریکارڈ ختم کرنا چاہتے ہیں؟</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleBulkDeleteConfirmed}
                  disabled={bulkProcessing}
                  className="flex-1 rounded-lg bg-rose-600 text-white py-1.5 text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {bulkProcessing ? "حذف..." : "حذف کریں"}
                </button>
                <button
                  onClick={() => setConfirmBulkDelete(false)}
                  className="flex-1 rounded-lg border border-slate-200 text-slate-600 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
                >
                  منسوخ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* سمپل ڈیلیٹ کنفرمیشن */}
        {confirmDeleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className={`rounded-xl border p-5 w-full max-w-sm shadow-xl text-center ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"}`}>
              <h3 className="text-sm font-bold">کتاب حذف کریں؟</h3>
              <p className="text-slate-400 text-xs mt-1.5">کیا آپ واقعی اس کتاب کا ریکارڈ ختم کرنا چاہتے ہیں؟</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleDeleteBook(confirmDeleteId)}
                  className="flex-1 rounded-lg bg-rose-600 text-white py-1.5 text-xs font-semibold hover:bg-rose-700 transition"
                >
                  حذف کریں
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 rounded-lg border border-slate-200 text-slate-600 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
                >
                  منسوخ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* تصاویر زوم موڈل */}
        {zoomedImage && (
          <div
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[70] p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
            >
              <X size={20} />
            </button>
            <img
              src={zoomedImage}
              alt="بڑی تصویر"
              className="w-full max-w-2xl max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* امیج ایڈیٹر: کاٹنا + گھمانا */}
        {showImageEditor && editingImageSrc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className={`rounded-xl border p-5 w-full max-w-md shadow-xl text-center ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"}`}>
              <h3 className="text-sm font-bold">{t.adjustImage}</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                فریم کو گھسیٹ کر اور کونوں سے سائز بدلیں
              </p>

              <div className="mt-3 flex items-center justify-center rounded-lg bg-slate-900 p-2">
                <div
                  dir="ltr"
                  className="relative inline-block overflow-hidden select-none touch-none"
                  onMouseMove={(e) => onDragMove(e, e.currentTarget)}
                  onMouseUp={endDrag}
                  onMouseLeave={endDrag}
                  onTouchMove={(e) => onDragMove(e, e.currentTarget)}
                  onTouchEnd={endDrag}
                  onTouchCancel={endDrag}
                >
                  <img
                    src={editingImageSrc}
                    alt="edit preview"
                    draggable={false}
                    className="block max-h-[50vh] max-w-full pointer-events-none rounded-sm"
                  />

                  <div
                    className="absolute border-2 border-emerald-400 cursor-move"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.w}%`,
                      height: `${cropBox.h}%`,
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                    }}
                    onMouseDown={(e) => startDrag(e, "move", e.currentTarget.parentElement as HTMLDivElement)}
                    onTouchStart={(e) => startDrag(e, "move", e.currentTarget.parentElement as HTMLDivElement)}
                  >
                    {CROP_HANDLES.map((h) => (
                      <div
                        key={h.mode}
                        className={`absolute w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow ${h.cls}`}
                        onMouseDown={(e) =>
                          startDrag(e, h.mode, e.currentTarget.parentElement?.parentElement as HTMLDivElement)
                        }
                        onTouchStart={(e) =>
                          startDrag(e, h.mode, e.currentTarget.parentElement?.parentElement as HTMLDivElement)
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => rotateImage(-90)}
                  disabled={editorBusy}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 disabled:opacity-50"
                >
                  <RotateCcw size={14} /> {t.left}
                </button>
                <button
                  type="button"
                  onClick={() => rotateImage(90)}
                  disabled={editorBusy}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 disabled:opacity-50"
                >
                  <RotateCw size={14} /> {t.right}
                </button>
                <button
                  type="button"
                  onClick={() => setCropBox({ x: 0, y: 0, w: 100, h: 100 })}
                  className="rounded-lg border border-slate-200 px-2.5 py-1"
                >
                  {t.fullImage}
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmImageEdit}
                  disabled={editorBusy}
                  className="flex-1 rounded-lg bg-emerald-600 text-white py-1.5 text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {t.confirm}
                </button>
                <button
                  type="button"
                  onClick={closeImageEditor}
                  className="flex-1 rounded-lg border border-slate-200 text-slate-600 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* نئی کتاب شامل / ترمیم موڈل */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className={`rounded-xl border p-5 w-full max-w-lg shadow-xl relative max-h-[90vh] overflow-y-auto ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"}`}>
              <button onClick={() => setShowModal(false)} className="absolute left-4 top-4 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>

              <h3 className="text-base font-bold mb-4">
                {editingId ? "کتاب میں ترمیم کریں" : "نئی کتاب شامل کریں"}
              </h3>

              {saveError && (
                <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2">
                  {saveError}
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 font-semibold">کتاب کا نام *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (!editingId) {
                        setNewSlug(generateSlugFromTitle(e.target.value));
                      }
                    }}
                    placeholder="مثلاً: كیف عاملہم"
                    className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold">مصنف</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="مثلاً: صالح المنجد"
                    className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold">زمرہ (Category)</label>
                    {newCategory && newCategory !== "__new__" && (
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryRenameValue(newCategory);
                          setShowCategoryRename(true);
                        }}
                        className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <Pencil size={11} /> نام بدلیں
                      </button>
                    )}
                  </div>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                  >
                    <option value="">زمرہ منتخب کریں...</option>
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__new__">+ نیا زمرہ بنائیں</option>
                  </select>

                  {newCategory === "__new__" && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="نیا زمرہ لکھیں..."
                      className={`mt-2 w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  )}
                </div>

                <div>
                  <label className="block mb-1 font-semibold">زبان (Language)</label>
                  <select
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                  >
                    <option value="اردو">اردو</option>
                    <option value="عربی">عربی</option>
                    <option value="انگلش">English</option>
                    <option value="فارسی">فارسی</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block mb-1 font-semibold">فروخت قیمت (Rs)</label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="1200"
                      className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">خریداری قیمت (Cost)</label>
                    <input
                      type="number"
                      value={newCostPrice}
                      onChange={(e) => setNewCostPrice(e.target.value)}
                      placeholder="800"
                      className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block mb-1 font-semibold">وزن (کلو گرام)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="1"
                      className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">سٹاک (تعداد)</label>
                    <input
                      type="number"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      placeholder="10"
                      className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-semibold">URL Slug</label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="kif-aamlhum"
                    className={`w-full rounded-lg border p-2 text-xs font-mono text-[11px] ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold">کتاب کی تصویر</label>

                  {imagePreview && (
                    <div className="relative w-24 h-32 mb-2 rounded-lg overflow-hidden border border-slate-200">
                      <button
                        type="button"
                        onClick={openEditorForCurrentImage}
                        className="absolute inset-0 w-full h-full cursor-pointer"
                        title="کلک کر کے تصویر درست کریں"
                      >
                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                      </button>
                      <button
                        type="button"
                        onClick={removeCurrentImage}
                        className="absolute top-1 right-1 z-10 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center justify-center gap-1.5 border border-dashed rounded-lg p-3 text-center transition cursor-pointer text-slate-500 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <Upload size={16} />
                      <span className="text-[11px]">{t.gallery}</span>
                      <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    </label>
                    <label className={`flex items-center justify-center gap-1.5 border border-dashed rounded-lg p-3 text-center transition cursor-pointer text-slate-500 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <Camera size={16} />
                      <span className="text-[11px]">{t.camera}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleAddBook}
                  disabled={uploading || compressing}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {uploading ? t.saving : editingId ? t.update : t.save}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* زمرہ نام تبدیل موڈل */}
        {showCategoryRename && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className={`rounded-xl border p-5 w-full max-w-sm shadow-xl ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"}`}>
              <h3 className="text-sm font-bold mb-3">زمرے کا نیا نام درج کریں</h3>
              <input
                type="text"
                value={categoryRenameValue}
                onChange={(e) => setCategoryRenameValue(e.target.value)}
                className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                autoFocus
              />
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  onClick={() => setShowCategoryRename(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 transition"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleRenameCategory}
                  disabled={renamingCategory}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {renamingCategory ? "تبدیل..." : "تبدیل کریں"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* شاپنگ کارٹ موڈل */}
        {showCartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className={`rounded-xl border p-5 w-full max-w-lg shadow-xl relative max-h-[90vh] flex flex-col ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"}`}>
              <button onClick={closeCartModal} className="absolute left-4 top-4 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>

              <h3 className="text-base font-bold mb-3 flex items-center gap-1.5">
                <ShoppingCart className="text-emerald-600" size={18} />
                آپ کی ٹوکری ({cartCount} کتب)
              </h3>

              {cartSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <span className="text-4xl block">🎉</span>
                  <h4 className="text-lg font-bold text-emerald-800">آرڈر موصول ہو گیا ہے!</h4>
                  <p className="text-slate-400 text-xs">
                    آپ کا آرڈر کامیابی سے درج کر لیا گیا ہے۔
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={sendCartToWhatsApp}
                      className="w-full rounded-lg bg-emerald-600 text-white py-2 text-xs font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle size={15} /> واٹس ایپ پر آرڈر بھیجیں
                    </button>
                    <button
                      onClick={closeCartModal}
                      className="w-full rounded-lg border border-slate-200 text-slate-600 py-2 text-xs font-medium hover:bg-slate-50 transition"
                    >
                      بند کریں
                    </button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  ٹوکری خالی ہے
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto my-3 space-y-3 text-xs">
                  <div className="space-y-1.5">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"}`}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold truncate">{item.title}</h4>
                          <p className="text-emerald-500 font-semibold text-[11px] mt-0.5">
                            Rs {item.price} × {item.quantity} = Rs {item.price * item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 border rounded-md p-0.5 ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
                            <button
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-5 text-center font-bold text-[11px]">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, 1)}
                              disabled={item.quantity >= item.stock}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 space-y-1">
                    <div className="flex justify-between">
                      <span>مجموعی قیمت:</span>
                      <span className="font-semibold">Rs {cartSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ڈیلیوری چارجز ({cartTotalWeight} kg):</span>
                      <span className="font-semibold">Rs {cartDeliveryCharge}</span>
                    </div>
                    <div className="flex justify-between text-emerald-500 font-bold text-sm pt-1 border-t border-emerald-500/30">
                      <span>کل بل:</span>
                      <span>Rs {cartTotalBill.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="font-semibold block">گاہک کی تفصیلات:</label>
                    <input
                      type="text"
                      placeholder="آپ کا نام *"
                      value={cartName}
                      onChange={(e) => setCartName(e.target.value)}
                      className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                    <input
                      type="text"
                      placeholder="موبائل / واٹس ایپ نمبر *"
                      value={cartPhone}
                      onChange={(e) => setCartPhone(e.target.value)}
                      className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                    <textarea
                      placeholder="مکمل پتہ"
                      value={cartAddress}
                      onChange={(e) => setCartAddress(e.target.value)}
                      rows={2}
                      className={`w-full rounded-lg border p-2 text-xs resize-none ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                </div>
              )}

              {!cartSuccess && cart.length > 0 && (
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                  <button
                    onClick={handleSubmitCartOrder}
                    disabled={cartSubmitting || !cartName.trim() || !cartPhone.trim()}
                    className="w-full rounded-lg bg-emerald-600 text-white py-2 text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {cartSubmitting ? "آرڈر درج..." : "آرڈر مکمل کریں"}
                  </button>
                  <button
                    onClick={sendCartToWhatsApp}
                    className="w-full rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 py-1.5 font-semibold hover:bg-emerald-100 transition flex items-center justify-center gap-1.5 text-xs"
                  >
                    <MessageCircle size={14} /> براہ راست واٹس ایپ پر آرڈر کریں
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ریویو فارم موڈل */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className={`rounded-xl border p-5 w-full max-w-md shadow-xl relative ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"}`}>
              <button onClick={() => setShowReviewModal(false)} className="absolute left-4 top-4 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>

              <h3 className="text-sm font-bold mb-3">ریویو دیں: {reviewBookTitle}</h3>

              {reviewSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <span className="text-3xl block">✨</span>
                  <h4 className="text-base font-bold text-emerald-500">شکریہ!</h4>
                  <p className="text-slate-400 text-xs">
                    آپ کا ریویو موصول ہو گیا ہے اور ایڈمن کی منظوری کے بعد شائع کر دیا جائے گا۔
                  </p>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="w-full rounded-lg bg-emerald-600 text-white py-1.5 text-xs font-semibold hover:bg-emerald-700 transition mt-2"
                  >
                    بند کریں
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold">آپ کا نام *</label>
                    <input
                      type="text"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="نام لکھیں"
                      className={`w-full rounded-lg border p-2 text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">ریٹنگ (ستارے)</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-0.5 text-amber-400 hover:scale-110 transition"
                        >
                          <Star
                            size={20}
                            className={star <= reviewRating ? "fill-amber-400" : "text-slate-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">آپ کی رائے *</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="کتاب کے بارے میں اپنی رائے کا اظہار کریں..."
                      rows={3}
                      className={`w-full rounded-lg border p-2 text-xs resize-none ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 transition"
                    >
                      {t.cancel}
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting || !reviewName.trim() || !reviewComment.trim()}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {reviewSubmitting ? "جمع..." : "ریویو جمع کریں"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}