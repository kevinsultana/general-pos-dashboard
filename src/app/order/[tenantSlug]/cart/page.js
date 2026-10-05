"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Utensils,
  CheckCircle2,
  Store,
  MapPin,
  Clock,
  User,
  Phone,
  Layers,
  ChevronRight,
  AlertCircle,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../../lib/api";

export default function CartOrderPage({ params }) {
  const resolvedParams = use(params);
  const tenantSlug = resolvedParams?.tenantSlug;

  const searchParams = useSearchParams();
  const router = useRouter();

  const branchParam = searchParams.get("branch");
  const tableParam = searchParams.get("table");

  // State Keranjang & Detail Toko
  const [cart, setCart] = useState({});
  const [storeData, setStoreData] = useState(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState(branchParam || "");

  // Form Data Pemesan
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Muat Keranjang dari LocalStorage
  useEffect(() => {
    if (!tenantSlug) return;
    try {
      const storageKey = `omnipos_cart_${tenantSlug}`;
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (err) {
      console.error("Gagal membaca keranjang:", err);
    }
  }, [tenantSlug]);

  // Simpan perubahan keranjang ke LocalStorage
  const updateCartAndStorage = (newCart) => {
    setCart(newCart);
    try {
      const storageKey = `omnipos_cart_${tenantSlug}`;
      localStorage.setItem(storageKey, JSON.stringify(newCart));
    } catch (err) {
      console.error("Gagal menyimpan keranjang:", err);
    }
  };

  // 2. Fetch Informasi Toko & Cabang
  useEffect(() => {
    if (!tenantSlug) return;
    const fetchStore = async () => {
      try {
        setIsLoadingStore(true);
        const queryStr = branchParam ? `?branchId=${branchParam}` : "";
        const res = await api.get(`/public/store/${tenantSlug}${queryStr}`);
        if (res?.success && res.data) {
          setStoreData(res.data);
          if (res.data.activeBranch) {
            setSelectedBranchId(res.data.activeBranch.id);
          }
        }
      } catch (err) {
        toast.error("Gagal memuat informasi toko.");
      } finally {
        setIsLoadingStore(false);
      }
    };
    fetchStore();
  }, [tenantSlug, branchParam]);

  // Handler Kontrol Kuantitas
  const handleIncreaseQty = (variantId) => {
    const item = cart[variantId];
    if (!item) return;
    const updated = {
      ...cart,
      [variantId]: {
        ...item,
        quantity: item.quantity + 1,
      },
    };
    updateCartAndStorage(updated);
  };

  const handleDecreaseQty = (variantId) => {
    const item = cart[variantId];
    if (!item) return;
    if (item.quantity <= 1) {
      handleRemoveItem(variantId);
      return;
    }
    const updated = {
      ...cart,
      [variantId]: {
        ...item,
        quantity: item.quantity - 1,
      },
    };
    updateCartAndStorage(updated);
  };

  const handleRemoveItem = (variantId) => {
    const updated = { ...cart };
    delete updated[variantId];
    updateCartAndStorage(updated);
    toast.success("Menu dihapus dari keranjang.");
  };

  // Handler Edit Catatan Per Item
  const handleUpdateItemNotes = (variantId, notes) => {
    const item = cart[variantId];
    if (!item) return;
    const updated = {
      ...cart,
      [variantId]: {
        ...item,
        notes: notes,
      },
    };
    updateCartAndStorage(updated);
  };

  // Ringkasan Keranjang
  const cartSummary = useMemo(() => {
    const items = Object.values(cart);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + parseFloat(item.variant.price) * item.quantity,
      0
    );
    return { items, totalItems, totalPrice };
  }, [cart]);

  // Submit Pesanan Mandiri
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Nama pemesan wajib diisi.");
      return;
    }
    if (cartSummary.totalItems === 0) {
      toast.error("Keranjang belanja Anda masih kosong.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        tenantSlug,
        branchId: selectedBranchId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        orderType: "DINE_IN",
        tableNumber: null,
        notes: generalNotes.trim() || null,
        items: cartSummary.items.map((item) => ({
          productVariantId: item.variant.id,
          quantity: item.quantity,
          notes: item.notes?.trim() || null,
        })),
      };

      const res = await api.post("/public/orders", payload);
      if (res?.success && res.data?.orderNumber) {
        // Bersihkan keranjang lokal
        try {
          localStorage.removeItem(`omnipos_cart_${tenantSlug}`);
        } catch {}

        toast.success("Pesanan berhasil dikirim!");
        router.push(`/order/${tenantSlug}/status/${res.data.orderNumber}`);
      }
    } catch (err) {
      toast.error(err.message || "Gagal mengirim pesanan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const backUrl = `/order/${tenantSlug}?branch=${selectedBranchId || branchParam || ""}${
    tableParam ? `&table=${tableParam}` : ""
  }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      {/* 1. Header Halaman Keranjang */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href={backUrl}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Kembali ke Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                Keranjang Pesanan
              </h1>
              <p className="text-[11px] text-slate-500 font-bold truncate">
                {storeData?.tenant?.name || "Toko"} •{" "}
                {storeData?.activeBranch?.name || "Cabang"}
              </p>
            </div>
          </div>

          <Link
            href={backUrl}
            className="text-xs font-black text-amber-700 hover:text-amber-800 transition-colors"
          >
            + Tambah Menu
          </Link>
        </div>
      </header>

      {/* 2. Konten Utama Keranjang */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {cartSummary.totalItems === 0 ? (
          /* Keranjang Kosong State */
          <div className="p-12 rounded-3xl bg-white border border-slate-200/80 text-center space-y-4 shadow-xs mt-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-black text-slate-900">
                Keranjang Belanja Masih Kosong
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Anda belum memilih menu makanan atau minuman. Silakan jelajahi katalog toko kami.
              </p>
            </div>
            <Link
              href={backUrl}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all shadow-md active:scale-95"
            >
              <span>Lihat Daftar Menu</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {/* Daftar Item Menu di Keranjang */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Daftar Menu ({cartSummary.totalItems} Item)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    updateCartAndStorage({});
                    toast.success("Keranjang dikosongkan.");
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  Kosongkan Semua
                </button>
              </div>

              {cartSummary.items.map((item) => {
                const variantId = item.variant.id;
                const subtotal = parseFloat(item.variant.price) * item.quantity;

                return (
                  <div
                    key={variantId}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* Foto Menu */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/60 flex items-center justify-center">
                        {item.product.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Utensils className="w-5 h-5 text-slate-400 stroke-[1.5]" />
                        )}
                      </div>

                      {/* Info Nama Menu & Varian */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                              {item.product.name}
                            </h3>
                            {item.variant.name !== "Regular" && (
                              <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                                Varian: {item.variant.name}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(variantId)}
                            title="Hapus Menu"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Harga & Kuantitas */}
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-xs font-black text-amber-700">
                            Rp {parseFloat(item.variant.price).toLocaleString("id-ID")}
                            <span className="text-[10px] font-normal text-slate-400">
                              {" "}
                              × {item.quantity}
                            </span>
                          </p>

                          {/* Tombol Kuantitas [-] [qty] [+] */}
                          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleDecreaseQty(variantId)}
                              className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-black text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncreaseQty(variantId)}
                              className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Input Catatan Khusus Per Produk */}
                    <div className="pt-2 border-t border-slate-100/90">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1">
                        <Edit3 className="w-3 h-3 text-amber-600" />
                        <span>Catatan Khusus Menu Ini:</span>
                      </div>
                      <input
                        type="text"
                        value={item.notes || ""}
                        onChange={(e) => handleUpdateItemNotes(variantId, e.target.value)}
                        placeholder="Contoh: Sedikit pedas, jangan pakai seledri, es dipisah..."
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-amber-400 placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form Informasi Pemesan */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Data Informasi Pemesan
                </h3>
              </div>

              {/* Nama Pemesan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">
                  Nama Pemesan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama Anda..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs sm:text-sm font-bold text-slate-900 outline-none"
                  required
                />
              </div>

              {/* Nomor Telepon / WA */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">
                  No. WhatsApp / HP <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs sm:text-sm font-bold text-slate-900 outline-none"
                />
              </div>

              {/* Catatan Keseluruhan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">
                  Catatan Tambahan untuk Kasir / Dapur <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Pesan tambahan untuk seluruh pesanan..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-semibold text-slate-900 outline-none resize-none"
                />
              </div>
            </div>

            {/* Rincian Pembayaran */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Subtotal Menu ({cartSummary.totalItems} item)</span>
                <span className="font-bold">
                  Rp {cartSummary.totalPrice.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">Total Tagihan</span>
                <span className="text-base font-black text-amber-700">
                  Rp {cartSummary.totalPrice.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Floating Action Bar Kirim Pesanan */}
            <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-linear-to-t from-slate-900/40 via-white/80 to-transparent pointer-events-none">
              <div className="max-w-2xl mx-auto pointer-events-auto">
                <button
                  type="submit"
                  disabled={isSubmitting || cartSummary.totalItems === 0}
                  className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-2xl flex items-center justify-between gap-3 active:scale-98 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
                      {cartSummary.totalItems}
                    </div>
                    <div className="text-left leading-tight">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Total Pesanan
                      </p>
                      <p className="text-sm font-black text-amber-400">
                        Rp {cartSummary.totalPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Mengirim Pesanan...</span>
                      </>
                    ) : (
                      <>
                        <span>Konfirmasi & Pesan</span>
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
