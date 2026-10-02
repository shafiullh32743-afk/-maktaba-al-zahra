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
  Gift,
  Ticket,
  RotateCcw,
  RotateCw,
  Upload,
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

function getStockStatus(stock: number) {
  if (stock <= 0) return { label: "Out of Stock", color: "text-red-600 bg-red-50 border-red-200", icon: "out" };
  if (stock <= 5) return { label: "Low Stock", color: "text-amber-600 bg-amber-50 border-amber-200", icon: "low" };
  return { label: "In Stock", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: "in" };
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

export default function BooksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-emerald-700">لوڈ ہو رہا ہے...</div>}>
      <BooksPageInner />
    </Suspense>
  );
}

function BooksPageInner() {
  const searchParams = useSearchParams();

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
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageSrc, setEditingImageSrc] = useState<string | null>(null);
  const [editingImageFileName, setEditingImageFileName] = useState<string>("image.jpg");
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const [dragMode, setDragMode] = useState<
    "move" | "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | null
  >(null);
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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [wishlist, setWishlist] = useState<number[]>([]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

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
      setRotationDegrees(0);
      setShowImageEditor(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const rotateImage = (delta: number) => {
    setRotationDegrees((prev) => (prev + delta + 360) % 360);
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

  const startDrag = (
    e: React.MouseEvent | React.TouchEvent,
    mode: "move" | "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r",
    area: HTMLDivElement
  ) => {
    e.stopPropagation();
    const point = getEditorPoint(e, area);
    setDragMode(mode);
    setDragStart({ x: point.x, y: point.y, box: { ...cropBox } });
  };

  const onDragMove = (e: React.MouseEvent | React.TouchEvent, area: HTMLDivElement) => {
    if (!dragMode) return;
    if ("touches" in e) e.preventDefault();
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
      const img = new window.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = editingImageSrc;
      });

      const rad = (rotationDegrees * Math.PI) / 180;
      const swap = rotationDegrees === 90 || rotationDegrees === 270;
      const rotatedCanvas = document.createElement("canvas");
      rotatedCanvas.width = swap ? img.height : img.width;
      rotatedCanvas.height = swap ? img.width : img.height;
      const rCtx = rotatedCanvas.getContext("2d");
      if (!rCtx) throw new Error("canvas unavailable");
      rCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
      rCtx.rotate(rad);
      rCtx.drawImage(img, -img.width / 2, -img.height / 2);

      const cropX = (cropBox.x / 100) * rotatedCanvas.width;
      const cropY = (cropBox.y / 100) * rotatedCanvas.height;
      const cropW = (cropBox.w / 100) * rotatedCanvas.width;
      const cropH = (cropBox.h / 100) * rotatedCanvas.height;

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = cropW;
      finalCanvas.height = cropH;
      const fCtx = finalCanvas.getContext("2d");
      if (!fCtx) throw new Error("canvas unavailable");
      fCtx.drawImage(rotatedCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const blob: Blob = await new Promise((resolve, reject) => {
        finalCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.9);
      });
      const finalFile = new File([blob], editingImageFileName.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
      const compressed = await compressImage(finalFile);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch {
    } finally {
      setCompressing(false);
      setEditingImageSrc(null);
      setCropBox({ x: 10, y: 10, w: 80, h: 80 });
    }
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
      <html dir="rtl" lang="ur">
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
      <html dir="rtl" lang="ur">
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
    <main dir="rtl" className="min-h-screen flex flex-col bg-gray-50 relative">
      {/* 1. فلوٹنگ WhatsApp بٹن (ہمیشہ نظر آنے والا) */}
      <a
        href="https://wa.me/923055232889?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%DB%8C%DA%A9%D9%85%D8%8C%20%D9%85%DA%98%DB%8C%D8%AF%20%D9%85%D8%B9%D9%84%D9%88%D9%85%D8%A7%D8%AA%20%DA%86%D8%A7%DB%81%DB%8C%DB%9C"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl transition transform hover:scale-110 flex items-center justify-center group"
        title="واٹس ایپ پر رابطہ کریں"
      >
        <MessageCircle size={28} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-sm font-bold pr-0 group-hover:pr-2">
          رابطہ کریں
        </span>
      </a>

      {/* اوپر کا بینر */}
      <div className="bg-emerald-800 text-white text-sm py-2 px-4 flex flex-col md:flex-row items-center justify-center gap-2 text-center">
        <span>مكتبہ الزھراء میں خوش آمدید — آن لائن اسلامک بک سٹور</span>
        <span className="hidden md:inline">•</span>
        <a href="https://wa.me/923055232889" target="_blank" className="font-bold underline hover:text-emerald-200">
          آرڈر کرنے کے لیے رابطہ کریں: 0305-5232889
        </a>
      </div>

      <div className="flex flex-1">
        {mobileMenuOpen && (
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden" />
        )}

        {/* سائیڈ بار مینو */}
        <aside
          className={`w-64 min-h-screen md:h-screen md:sticky md:top-0 md:overflow-y-auto bg-blue-400 p-6 flex flex-col fixed inset-y-0 right-0 z-50 flex-shrink-0 transform transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
                <BookOpen className="text-white" size={20} />
              </div>
              <h1 className="text-lg font-bold text-white">مكتبہ الزھراء</h1>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-white/80 hover:text-white">
              <X size={22} />
            </button>
          </div>

          <nav className="mt-10 space-y-1.5 flex-1">
            <p className="text-white/50 text-xs font-medium px-3 mb-2">مینو</p>
            <Link href="/" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <LayoutDashboard size={19} /> ڈیش بورڈ
            </Link>
            <Link href="/books" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 text-white font-medium shadow-md">
              <BookOpen size={19} /> کتب
            </Link>
            <Link href="/authors" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <PenLine size={19} /> مصنفین
            </Link>
            <Link href="/categories" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <FolderTree size={19} /> زمرے
            </Link>
            <Link href="/orders" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <ShoppingCart size={19} /> آرڈرز
            </Link>
            <Link href="/customers" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <Users size={19} /> کسٹمرز
            </Link>
            <Link href="/invoices" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <Receipt size={19} /> رسیدیں
            </Link>
            <Link href="/suppliers" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <Truck size={19} /> سپلائرز
            </Link>
            <Link href="/loyalty" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <Gift size={19} /> لائلٹی پوائنٹس
            </Link>
            <Link href="/coupons" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <Ticket size={19} /> کوپنز
            </Link>
            <Link href="/returns" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <RotateCcw size={19} /> واپسی/خراب
            </Link>
            <Link href="/reviews" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <Star size={19} /> ریویوز
            </Link>
            <Link href="/low-stock" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <PackageMinus size={19} /> کم سٹاک
            </Link>
            <Link href="/expenses" className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-white/[0.15] hover:text-white transition">
              <Wallet size={19} /> اخراجات
            </Link>
          </nav>

          <div className="border-t border-white/20 pt-4 space-y-3">
            <button
              onClick={() => {
                document.cookie = "maktaba-auth=; path=/; max-age=0";
                window.location.href = "/login";
              }}
              className="flex items-center gap-3 p-3 rounded-xl w-full text-white/80 hover:bg-white/[0.15] hover:text-white transition"
            >
              <LogOut size={19} /> لاگ آؤٹ
            </button>
            <p className="text-white/50 text-xs text-center">مكتبہ الزھراء © 2026</p>
          </div>
        </aside>

        {/* الگ سائیڈ فلٹر پینل (درخواست کردہ ڈرائر) */}
        {showFilterSidebar && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/40" onClick={() => setShowFilterSidebar(false)} />
            <div className="relative w-80 bg-white min-h-full p-6 shadow-2xl flex flex-col z-10 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Filter size={18} /> کسٹم فلٹرز
                </h3>
                <button onClick={() => setShowFilterSidebar(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-5 flex-1">
                {/* 2. قیمت فلٹر (Price From/To) */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">قیمت حد (Price Filter)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="کم سے کم"
                      value={filterPriceFrom}
                      onChange={(e) => setFilterPriceFrom(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-sm bg-white"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="زیادہ سے زیادہ"
                      value={filterPriceTo}
                      onChange={(e) => setFilterPriceTo(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-sm bg-white"
                    />
                  </div>
                </div>

                {/* 3. زبان (Language) فلٹر */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">زبان (Language)</label>
                  <select
                    value={filterLanguage}
                    onChange={(e) => setFilterLanguage(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 bg-white text-sm"
                  >
                    <option value="">تمام زبانیں</option>
                    <option value="اردو">اردو</option>
                    <option value="عربی">عربی</option>
                    <option value="انگلش">English</option>
                    <option value="فارسی">فارسی</option>
                    {existingLanguages.map(
                      (lang) =>
                        !["اردو", "عربی", "انگلش", "فارسی"].includes(lang) && (
                          <option key={lang} value={lang}>{lang}</option>
                        )
                    )}
                  </select>
                </div>

                {/* 4. "صرف سٹاک میں موجود" چیک باکس */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    "صرف سٹاک میں موجود" کتب
                  </label>
                </div>
              </div>

              {/* Apply/Clear بٹنز */}
              <div className="pt-6 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => setShowFilterSidebar(false)}
                  className="flex-1 rounded-xl bg-emerald-700 text-white py-2.5 font-medium hover:bg-emerald-800 transition text-sm"
                >
                  Apply (لاگو کریں)
                </button>
                <button
                  onClick={resetAllFilters}
                  className="rounded-xl border border-gray-200 bg-gray-50 text-gray-700 px-4 py-2.5 font-medium hover:bg-gray-100 transition text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="flex-1 min-w-0 pb-28">
          <div className="md:sticky md:top-0 md:z-30 bg-gray-50 p-5 md:p-10 md:pb-0">
            <div className="flex items-center justify-between md:hidden mb-4">
              <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                <Menu size={22} />
              </button>
              <h1 className="text-lg font-bold text-emerald-800">مكتبہ الزھراء</h1>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">ہماری کتب</h2>
                <p className="mt-2 text-gray-500">مكتبہ الزھراء کی کتب</p>
              </div>

              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-wrap">
                <button
                  onClick={() => setShowCartModal(true)}
                  className="relative flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition shadow-sm font-medium"
                >
                  <ShoppingCart size={18} />
                  ٹوکری
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                <label className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition shadow-sm cursor-pointer font-medium">
                  <FileSpreadsheet size={18} />
                  {importing ? "درآمد ہو رہا ہے..." : "Excel سے درآمد کریں"}
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} disabled={importing} className="hidden" />
                </label>

                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition shadow-sm font-medium"
                >
                  <FileDown size={18} />
                  PDF ڈاؤن لوڈ کریں
                </button>

                <button
                  onClick={() => handlePrintLabels(filteredBooks)}
                  className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition shadow-sm font-medium"
                >
                  <Printer size={18} />
                  لیبلز پرنٹ کریں
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
                  className="rounded-xl px-5 py-3 bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm w-full md:w-auto"
                >
                  + کتاب شامل کریں
                </button>
              </div>
            </div>

            {importResult && (
              <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-2">
                {importResult}
              </div>
            )}

            {/* فلٹرز سیکشن */}
            <div className="mt-8 flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="کتاب تلاش کریں..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition md:w-48"
              >
                <option value="">تمام زمرے</option>
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={filterAuthor}
                onChange={(e) => setFilterAuthor(e.target.value)}
                className="rounded-xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition md:w-48"
              >
                <option value="">تمام مصنفین</option>
                {existingAuthors.map((author) => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>

              {/* الگ سائیڈ پینل کھولنے والا بٹن */}
              <button
                onClick={() => setShowFilterSidebar(true)}
                className="flex items-center justify-center gap-2 rounded-xl border bg-white border-gray-200 text-gray-700 px-5 py-4 hover:bg-gray-50 transition font-medium"
              >
                <Filter size={18} />
                مزید فلٹرز
              </button>

              <button
                onClick={() => setShowWishlistOnly((v) => !v)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-4 transition font-medium ${
                  showWishlistOnly
                    ? "bg-rose-50 border-rose-300 text-rose-600"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Heart size={18} className={showWishlistOnly ? "fill-rose-500" : ""} />
                پسندیدہ
              </button>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">{filteredBooks.length} نتائج ملے</span>
                <button
                  onClick={resetAllFilters}
                  className="text-sm text-emerald-700 hover:text-emerald-900 underline"
                >
                  تمام فلٹرز صاف کریں
                </button>
              </div>
            )}
          </div>

          <div className="px-5 md:px-10">
            {!loaded ? (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-full rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
                    <div className="h-40 w-full rounded-xl bg-gray-200" />
                    <div className="h-5 w-3/4 bg-gray-200 rounded mt-5 mx-auto" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded mt-3 mx-auto" />
                    <div className="h-8 w-full bg-gray-200 rounded-lg mt-5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredBooks.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-6xl mb-4">📖</span>
                    <p className="text-gray-500 text-lg">کوئی کتاب نہیں ملی</p>
                    <p className="text-gray-400 text-sm mt-1">کوئی مختلف نام تلاش کریں یا نئی کتاب شامل کریں</p>
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
                      className={`relative w-full rounded-2xl border bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center ${
                        isSelected ? "border-emerald-400 ring-2 ring-emerald-200" : "border-gray-200"
                      }`}
                    >
                      <button
                        onClick={() => toggleSelect(book.id)}
                        className="absolute top-3 right-3 z-10 bg-white/90 rounded-md p-1 shadow-sm text-emerald-700"
                        title="منتخب کریں"
                      >
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>

                      <button
                        onClick={() => toggleWishlist(book.id)}
                        className={`absolute top-3 left-3 z-10 rounded-full p-1.5 shadow-sm transition ${
                          isWished ? "bg-rose-50 text-rose-500" : "bg-white/90 text-gray-400 hover:text-rose-500"
                        }`}
                        title="پسندیدہ"
                      >
                        <Heart size={18} className={isWished ? "fill-rose-500" : ""} />
                      </button>

                      <div
                        onClick={() => book.image_url && setZoomedImage(book.image_url)}
                        className={`relative w-full aspect-[3/4] rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center border border-amber-200 overflow-hidden ${
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
                          <span className="text-6xl">📚</span>
                        )}
                      </div>

                      <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${stockInfo.color}`}>
                        {stockInfo.icon === "in" && <PackageCheck size={13} />}
                        {stockInfo.icon === "low" && <PackageMinus size={13} />}
                        {stockInfo.icon === "out" && <PackageX size={13} />}
                        {stockInfo.label}
                        {(book.stock ?? 0) > 0 && ` (${book.stock})`}
                      </div>

                      <h3 className="mt-3 text-xl font-bold text-gray-800 line-clamp-2">{book.title}</h3>
                      <p className="mt-2 text-gray-500 text-sm">{book.author}</p>

                      {ratingInfo && (
                        <div className="mt-2 flex items-center gap-1">
                          <Star size={15} className="fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-gray-700">{ratingInfo.avg}</span>
                          <span className="text-xs text-gray-400">({ratingInfo.count} ریویوز)</span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
                          {book.category}
                        </span>
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                          {book.language || "اردو"}
                        </span>
                      </div>

                      {book.price ? (
                        <div className="mt-3 inline-flex items-baseline gap-1 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 px-4 py-1.5 shadow-sm">
                          <span className="text-xs font-medium text-emerald-600">Rs</span>
                          <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">
                            {Number(book.price).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-gray-400 italic">قیمت درج نہیں</p>
                      )}

                      {inCart ? (
                        <div className="mt-4 w-full flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                          <button
                            onClick={() => updateCartQuantity(book.id, -1)}
                            className="w-7 h-7 rounded-md bg-white text-emerald-700 flex items-center justify-center hover:bg-emerald-100"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold text-emerald-800">{inCart.quantity} ٹوکری میں</span>
                          <button
                            onClick={() => updateCartQuantity(book.id, 1)}
                            disabled={inCart.quantity >= (book.stock ?? 0)}
                            className="w-7 h-7 rounded-md bg-white text-emerald-700 flex items-center justify-center hover:bg-emerald-100 disabled:opacity-40"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(book)}
                          disabled={outOfStock}
                          className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart size={16} />
                          {outOfStock ? "سٹاک ختم" : "ٹوکری میں ڈالیں"}
                        </button>
                      )}

                      <button
                        onClick={() => handleReviewClick(book.title)}
                        className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 transition font-medium text-sm"
                      >
                        <MessageSquarePlus size={15} />
                        ریویو دیں
                      </button>

                      <div className="mt-2 w-full flex gap-2">
                        <Link
                          href={`/books/${book.slug || encodeURIComponent(book.title)}`}
                          className="flex-1 rounded-lg bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 transition text-center"
                        >
                          تفصیل دیکھیں
                        </Link>
                        <button
                          onClick={() => handleEditClick(book)}
                          className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700 hover:bg-amber-100 transition"
                        >
                          ترمیم
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(book.id)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 transition"
                        >
                          حذف کریں
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. فوٹر (دفتر کا پتہ اور واٹس ایپ رابطہ) */}
          <footer className="mt-20 border-t border-gray-200 bg-white text-gray-700 pt-10 pb-8 px-5 md:px-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <BookOpen size={20} /> مكتبہ الزھراء
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  آن لائن اسلامک بک سٹور جہاں تمام دینی، علمی و ادبی کتب مناسب قیمت پر دستیاب ہیں۔
                </p>
              </div>

              <div>
                <h4 className="text-base font-bold text-gray-800 mb-3">دفتر کا پتہ</h4>
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <MapPin size={18} className="text-emerald-700 flex-shrink-0 mt-0.5" />
                  مکتبہ الزہراء، بالمقابل جامعہ مسجد، مین بازار، پاکستان
                </p>
              </div>

              <div>
                <h4 className="text-base font-bold text-gray-800 mb-3">رابطہ کی تفصیلات</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Phone size={16} className="text-emerald-700" /> 0305-5232889
                  </p>
                  <p className="flex items-center gap-2">
                    <MessageCircle size={16} className="text-emerald-500" /> WhatsApp: 0305-5232889
                  </p>
                  <p className="flex items-center gap-2">
                    <Globe size={16} className="text-emerald-700" /> www.maktabaalzahra.com
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
              © 2026 مكتبہ الزھراء. جملہ حقوق محفوظ ہیں۔
            </div>
          </footer>
        </section>

        {/* بلک ایکشن بار */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-0 inset-x-0 md:inset-x-auto md:right-64 md:left-0 bg-white border-t border-gray-200 shadow-2xl z-40 p-4">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-3">
              <span className="font-bold text-gray-800 whitespace-nowrap">{selectedIds.length} کتابیں منتخب</span>

              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="rounded-xl border border-gray-200 p-2.5 bg-white flex-1 w-full md:w-auto"
              >
                <option value="">زمرہ تبدیل کریں...</option>
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                onClick={handleBulkCategoryChange}
                disabled={!bulkCategory || bulkProcessing}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 bg-emerald-700 text-white hover:bg-emerald-800 transition disabled:opacity-50 whitespace-nowrap"
              >
                <Tags size={16} /> لاگو کریں
              </button>

              <button
                onClick={() => handlePrintLabels(books.filter((b) => selectedIds.includes(b.id)))}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition whitespace-nowrap"
              >
                <Printer size={16} /> لیبلز پرنٹ کریں
              </button>

              <button
                onClick={() => setConfirmBulkDelete(true)}
                disabled={bulkProcessing}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 transition whitespace-nowrap"
              >
                <Trash2 size={16} /> حذف کریں
              </button>

              <button
                onClick={clearSelection}
                className="text-sm text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
              >
                منتخب ہٹائیں
              </button>
            </div>
          </div>
        )}

        {/* بلک ڈیلیٹ کنفکرمیشن */}
        {confirmBulkDelete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
              <span className="text-5xl">⚠️</span>
              <h3 className="text-lg font-bold text-gray-800 mt-4">
                کیا آپ واقعی {selectedIds.length} کتابیں حذف کرنا چاہتے ہیں؟
              </h3>
              <p className="text-gray-500 text-sm mt-2">یہ عمل واپس نہیں ہو سکتا۔</p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleBulkDeleteConfirmed}
                  disabled={bulkProcessing}
                  className="flex-1 rounded-xl bg-red-600 text-white py-3 hover:bg-red-700 transition disabled:opacity-60"
                >
                  {bulkProcessing ? "حذف ہو رہا ہے..." : "ہاں، حذف کریں"}
                </button>
                <button
                  onClick={() => setConfirmBulkDelete(false)}
                  className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition"
                >
                  منسوخ کریں
                </button>
              </div>
            </div>
          </div>
        )}

        {/* سمپل ڈیلیٹ کنفرمیشن */}
        {confirmDeleteId !== null && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
              <span className="text-5xl">⚠️</span>
              <h3 className="text-lg font-bold text-gray-800 mt-4">کیا آپ واقعی یہ کتاب حذف کرنا چاہتے ہیں؟</h3>
              <p className="text-gray-500 text-sm mt-2">یہ عمل واپس نہیں ہو سکتا۔</p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleDeleteBook(confirmDeleteId)}
                  className="flex-1 rounded-xl bg-red-600 text-white py-3 hover:bg-red-700 transition"
                >
                  ہاں، حذف کریں
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition"
                >
                  منسوخ کریں
                </button>
              </div>
            </div>
          </div>
        )}

        {/* تصاویر زوم موڈل */}
        {zoomedImage && (
          <div
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
            >
              <X size={24} />
            </button>
            <img
              src={zoomedImage}
              alt="بڑی تصویر"
              className="w-full max-w-2xl max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* امیج ایڈیٹر */}
        {showImageEditor && editingImageSrc && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl text-center">
              <h3 className="text-lg font-bold text-gray-800">تصویر درست کریں</h3>
              <p className="text-xs text-gray-400 mt-1">فریم کو گھسیٹ کر کاٹنے کی جگہ منتخب کریں</p>

              <div
                className="mt-4 relative overflow-hidden rounded-xl bg-gray-900 h-72 select-none"
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
                  style={{ transform: `rotate(${rotationDegrees}deg)` }}
                  className="absolute inset-0 w-full h-full object-contain transition-transform pointer-events-none"
                />
                <div
                  className="absolute border-2 border-emerald-400 bg-emerald-400/10 cursor-move"
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.w}%`,
                    height: `${cropBox.h}%`,
                  }}
                  onMouseDown={(e) => startDrag(e, "move", e.currentTarget.parentElement as HTMLDivElement)}
                  onTouchStart={(e) => startDrag(e, "move", e.currentTarget.parentElement as HTMLDivElement)}
                >
                  <div
                    className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white cursor-nwse-resize"
                    onMouseDown={(e) => startDrag(e, "tl", e.currentTarget.parentElement?.parentElement as HTMLDivElement)}
                    onTouchStart={(e) => startDrag(e, "tl", e.currentTarget.parentElement?.parentElement as HTMLDivElement)}
                  />
                  <div
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white cursor-nesw-resize"
                    onMouseDown={(e) => startDrag(e, "tr", e.currentTarget.parentElement?.parentElement as HTMLDivElement)}
                    onTouchStart={(e) => startDrag(e, "tr", e.currentTarget.parentElement?.parentElement as HTMLDivElement)}
                  />
                  <div
                    className="absolute -bottom-1.5 -left-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white cursor-nesw-resize"
                    onMouseDown={(e) => startDrag(e, "bl", e.currentTarget.parentElement?.parentElement as HTMLDivElement)}
                    onTouchStart={(e) => startDrag(e, "bl", e.currentTarget.parentElement?.parentElement as HTMLDivElement)}
                  />
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white cursor-nwse-resize"
                    onMouseDown={(e) => startDrag(e, "br", e.currentTarget.parentElement?.parentElement as HTMLDivElement)}
                    onTouchStart={(e) => startDrag(e, "br", e.currentTarget.parentElement?.parentElement as HTMLDivElement)}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => rotateImage(-90)}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 transition text-sm"
                >
                  <RotateCcw size={16} /> بائیں گھمائیں
                </button>
                <button
                  onClick={() => rotateImage(90)}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 transition text-sm"
                >
                  <RotateCw size={16} /> دائیں گھمائیں
                </button>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleConfirmImageEdit}
                  className="flex-1 rounded-xl bg-emerald-700 text-white py-3 hover:bg-emerald-800 transition"
                >
                  تصدیق کریں
                </button>
                <button
                  onClick={() => {
                    setShowImageEditor(false);
                    setEditingImageSrc(null);
                  }}
                  className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 hover:bg-gray-200 transition"
                >
                  منسوخ کریں
                </button>
              </div>
            </div>
          </div>
        )}

        {/* کتاب شامل یا ترمیم کریں موڈل */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? "کتاب میں ترمیم کریں" : "نئی کتاب شامل کریں"}</h3>

              {saveError && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">
                  {saveError}
                </div>
              )}

              <label className="mt-5 block">
                <span className="text-sm text-gray-600">کتاب کی تصویر (اختیاری)</span>
                {imagePreview && (
                  <div className="mt-2 relative h-32 w-full">
                    <Image src={imagePreview} alt="preview" fill className="rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        setExistingImageUrl(null);
                      }}
                      className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:bg-red-600 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-emerald-400 transition cursor-pointer relative text-gray-500">
                    <Upload size={20} />
                    <span className="text-xs font-medium">تصویر اپلوڈ کریں</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>
              </label>

              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="کتاب کا عنوان"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />

                <input
                  type="text"
                  placeholder="مصنف کا نام"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />

                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="">زمرہ منتخب کریں</option>
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__new__">+ نیا زمرہ شامل کریں</option>
                </select>

                {newCategory === "__new__" && (
                  <input
                    type="text"
                    placeholder="نیا زمرہ لکھیں"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                )}

                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="اردو">اردو</option>
                  <option value="عربی">عربی</option>
                  <option value="انگلش">English</option>
                  <option value="فارسی">فارسی</option>
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="قیمت (Rs)"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <input
                    type="number"
                    placeholder="وزن (کلو گرام)"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="سٹاک تعداد"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <input
                    type="number"
                    placeholder="خرید قیمت (Cost Price)"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <input
                  type="text"
                  placeholder="سلگ (Slug - اختیاری)"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleAddBook}
                  disabled={uploading || compressing}
                  className="flex-1 rounded-xl bg-emerald-700 text-white py-3 font-medium hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  {uploading ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 font-medium hover:bg-gray-200 transition"
                >
                  منسوخ کریں
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ٹوکری / آرڈر موڈل */}
        {showCartModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingCart size={22} className="text-emerald-700" /> آپ کی ٹوکری ({cartCount})
                </h3>
                <button onClick={closeCartModal} className="text-gray-400 hover:text-gray-600">
                  <X size={22} />
                </button>
              </div>

              {cartSuccess ? (
                <div className="py-8 text-center">
                  <span className="text-6xl">🎉</span>
                  <h4 className="text-2xl font-bold text-emerald-800 mt-4">آرڈر موصول ہو گیا ہے!</h4>
                  <p className="text-gray-600 mt-2 text-sm">
                    آپ کا آرڈر کامیابی سے سسٹم میں شامل کر دیا گیا ہے۔ واٹس ایپ پر پیغام بھیج کر تصدیق کر سکتے ہیں۔
                  </p>

                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      onClick={sendCartToWhatsApp}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white py-3.5 font-bold hover:bg-emerald-700 transition shadow-md"
                    >
                      <MessageCircle size={20} /> واٹس ایپ پر آرڈر بھیجیں
                    </button>
                    <button
                      onClick={closeCartModal}
                      className="w-full rounded-xl bg-gray-100 text-gray-700 py-3 font-medium hover:bg-gray-200 transition"
                    >
                      بند کریں
                    </button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="text-5xl">🛒</span>
                  <p className="text-gray-500 mt-3 font-medium">ٹوکری خالی ہے</p>
                  <button
                    onClick={closeCartModal}
                    className="mt-5 rounded-xl bg-emerald-700 text-white px-6 py-2.5 text-sm font-medium hover:bg-emerald-800 transition"
                  >
                    کتابیں منتخب کریں
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-6">
                  {/* پروڈکٹس کی فہرست */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-800 text-sm truncate">{item.title}</h4>
                          <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                            Rs {item.price} × {item.quantity} = Rs {item.price * item.quantity}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                            <button
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="p-1 hover:bg-gray-100 text-gray-600 rounded-r-lg"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-2 text-xs font-bold text-gray-800">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, 1)}
                              disabled={item.quantity >= item.stock}
                              className="p-1 hover:bg-gray-100 text-gray-600 rounded-l-lg disabled:opacity-30"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="حذف کریں"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* بل کا حساب کتاب */}
                  <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>کتابوں کی قیمت:</span>
                      <span className="font-semibold text-gray-800">Rs {cartSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>کل وزن:</span>
                      <span className="font-semibold text-gray-800">{cartTotalWeight} کلو</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>ڈیلیوری چارجز:</span>
                      <span className="font-semibold text-gray-800">Rs {cartDeliveryCharge}</span>
                    </div>
                    <div className="border-t border-emerald-200/80 pt-2 flex justify-between font-bold text-base text-emerald-900">
                      <span>کل بل:</span>
                      <span>Rs {cartTotalBill.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* آرڈر فارم */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-gray-800 text-sm">کسٹمر کی تفصیلات:</h4>
                    <input
                      type="text"
                      placeholder="آپ کا نام *"
                      value={cartName}
                      onChange={(e) => setCartName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <input
                      type="tel"
                      placeholder="فون نمبر *"
                      value={cartPhone}
                      onChange={(e) => setCartPhone(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <textarea
                      placeholder="مکمل پتہ (شہر، علاقہ، گلی نمبر) *"
                      rows={2}
                      value={cartAddress}
                      onChange={(e) => setCartAddress(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSubmitCartOrder}
                      disabled={cartSubmitting || !cartName.trim() || !cartPhone.trim()}
                      className="flex-1 rounded-xl bg-emerald-700 text-white py-3.5 font-bold hover:bg-emerald-800 transition disabled:opacity-50"
                    >
                      {cartSubmitting ? "آرڈر بھیجا جا رہا ہے..." : "آرڈر مکمل کریں"}
                    </button>
                    <button
                      onClick={closeCartModal}
                      className="rounded-xl bg-gray-100 text-gray-700 px-5 py-3.5 font-medium hover:bg-gray-200 transition"
                    >
                      منسوخ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ریویو دینے کا موڈل */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">ریویو دیں</h3>
                <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {reviewSuccess ? (
                <div className="py-8 text-center">
                  <span className="text-5xl">👍</span>
                  <h4 className="text-xl font-bold text-emerald-800 mt-3">شکریہ!</h4>
                  <p className="text-gray-600 text-sm mt-1">آپ کا ریویو موصول ہو گیا ہے، منظوری کے بعد شائع کر دیا جائے گا۔</p>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="mt-6 rounded-xl bg-emerald-700 text-white px-6 py-2.5 text-sm font-medium hover:bg-emerald-800 transition"
                  >
                    بند کریں
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-600 font-medium">کتاب: <span className="text-emerald-800 font-bold">{reviewBookTitle}</span></p>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">آپ کی درجہ بندی (Rating)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition"
                        >
                          <Star
                            size={26}
                            className={star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="آپ کا نام *"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />

                  <textarea
                    placeholder="کتاب کے بارے میں اپنے خیالات لکھیں... *"
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting || !reviewName.trim() || !reviewComment.trim()}
                      className="flex-1 rounded-xl bg-emerald-700 text-white py-3 font-medium hover:bg-emerald-800 transition disabled:opacity-50"
                    >
                      {reviewSubmitting ? "جمع ہو رہا ہے..." : "ریویو جمع کریں"}
                    </button>
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 font-medium hover:bg-gray-200 transition"
                    >
                      منسوخ
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