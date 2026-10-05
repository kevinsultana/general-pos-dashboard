"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  MapPin,
  Phone,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  Layers,
  ArrowRight,
  X,
  User,
  Check,
  Loader2,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../lib/api";

export default function PublicOrderPage({ params }) {
  // Next.js 15+ params promise unwrap
  const resolvedParams = use(params);
  const tenantSlug = resolvedParams?.tenantSlug;

  const searchParams = useSearchParams();
  const router = useRouter();

  const branchParam = searchParams.get("branch");
  const tableParam = searchParams.get("table");

  // State Data Toko & Produk
  const [storeData, setStoreData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState(branchParam || "");
  const [searchQuery, setSearchQuery] = useState("");

  // State Pesanan (Tipe & Meja)
  const [orderType] = useState("DINE_IN");
  const [tableNumber, setTableNumber] = useState(tableParam || "");

  // Keranjang Belanja Pelanggan: { [variantId]: { product, variant, quantity, notes } }
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modal Checkout Pelanggan
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Katalog Toko
  const fetchCatalog = async (slug, branchId) => {
    try {
      setIsLoading(true);
      const queryStr = branchId ? `?branchId=${branchId}` : "";
      const res = await api.get(`/public/store/${slug}${queryStr}`);
      if (res?.success) {
        setStoreData(res.data);
        if (res.data.activeBranch) {
          setSelectedBranchId(res.data.activeBranch.id);
        }
      }
    } catch (err) {
      toast.error(err.message || "Toko tidak ditemukan atau sedang offline.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchCatalog(tenantSlug, branchParam);
    }
  }, [tenantSlug, branchParam]);

  // Tambah item ke keranjang
  const handleAddToCart = (product, variant) => {
    if (product.isActive === false) {
      toast.error(`Menu "${product.name}" sedang habis stok.`, { duration: 2000 });
      return;
    }

    setCart((prev) => {
      const existing = prev[variant.id];
      const newQty = (existing?.quantity || 0) + 1;
      return {
        ...prev,
        [variant.id]: {
          product,
          variant,
          quantity: newQty,
          notes: existing?.notes || "",
        },
      };
    });
    toast.success(`${product.name} (${variant.name}) ditambahkan`, {
      id: `add-${variant.id}`,
      duration: 1500,
    });
  };

  // Kurangi item dari keranjang
  const handleRemoveFromCart = (variantId) => {
    setCart((prev) => {
      const existing = prev[variantId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[variantId];
        return copy;
      }
      return {
        ...prev,
        [variantId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  };

  // Hitung total item & total belanja
  const cartSummary = useMemo(() => {
    const items = Object.values(cart);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + parseFloat(item.variant.price) * item.quantity,
      0
    );
    return { items, totalItems, totalPrice };
  }, [cart]);

  // Submit Pesanan Mandiri Pelanggan
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Silakan isi nama Anda untuk pemesanan.");
      return;
    }
    if (cartSummary.totalItems === 0) {
      toast.error("Keranjang belanja masih kosong.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        tenantSlug,
        branchId: selectedBranchId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        orderType,
        tableNumber: orderType === "DINE_IN" ? tableNumber?.trim() || null : null,
        notes: orderNotes.trim() || null,
        items: cartSummary.items.map((item) => ({
          productVariantId: item.variant.id,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      };

      const res = await api.post("/public/orders", payload);
      if (res?.success && res.data?.orderNumber) {
        toast.success("Pesanan berhasil dibuat!");
        // Arahkan ke halaman tiket digital barcode
        router.push(`/order/${tenantSlug}/status/${res.data.orderNumber}`);
      }
    } catch (err) {
      toast.error(err.message || "Gagal membuat pesanan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter produk berdasarkan pencarian
  const filteredProducts = useMemo(() => {
    if (!storeData?.products) return [];
    if (!searchQuery.trim()) return storeData.products;
    const q = searchQuery.toLowerCase();
    return storeData.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [storeData?.products, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <h2 className="text-base font-extrabold text-slate-800">Menyiapkan Menu Toko...</h2>
        <p className="text-xs text-slate-400 mt-1">Mengambil katalog produk terkini</p>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Toko Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
          Halaman pemesanan untuk toko ini belum aktif atau tautan yang Anda buka tidak valid.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 pb-28 text-slate-800 antialiased selection:bg-amber-100">
      {/* 1. Header Banner Toko */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 shrink-0 overflow-hidden">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-amber-600 overflow-hidden">
                {storeData.tenant?.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={storeData.tenant.logoUrl}
                    alt={storeData.tenant.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Store className="w-5 h-5" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-slate-900 truncate tracking-tight">
                {storeData.tenant.name}
              </h1>
              <p className="text-[11px] font-bold text-slate-500 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{storeData.activeBranch?.name || "Cabang Utama"}</span>
              </p>
            </div>
          </div>

          {/* Info Meja (jika diakses melalui QR Meja) */}
          {tableParam && (
            <span className="text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
              Meja {tableParam}
            </span>
          )}
        </div>
      </header>

      {/* 2. Container Konten Utama */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Bar Pencarian Menu */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari makanan atau minuman favorit..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 focus:border-amber-400 text-xs sm:text-sm font-bold text-slate-900 outline-none shadow-xs placeholder:text-slate-400 placeholder:font-normal"
          />
        </div>

        {/* 3. Daftar Produk Menu */}
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">
                {searchQuery ? "Menu tidak ditemukan" : "Belum ada menu yang tersedia"}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isOutOfStock = product.isActive === false;

              return (
                <div
                  key={product.id}
                  className={`p-4 rounded-3xl bg-white border shadow-xs space-y-3 transition-all ${
                    isOutOfStock
                      ? "border-slate-200/60 bg-slate-50/70 opacity-80"
                      : "border-slate-200/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {product.imageUrl && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.parentElement.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm font-black ${
                            isOutOfStock
                              ? "text-slate-500 line-through decoration-slate-400"
                              : "text-slate-900"
                          }`}
                        >
                          {product.name}
                        </h3>
                        {isOutOfStock && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black border border-rose-200 shrink-0">
                            Habis
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Varian & Tombol Pesan */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {product.variants.map((v) => {
                      const inCartQty = cart[v.id]?.quantity || 0;

                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-slate-50/70 border border-slate-100"
                        >
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-bold truncate ${
                                isOutOfStock ? "text-slate-400" : "text-slate-800"
                              }`}
                            >
                              {v.name !== "Regular" ? v.name : "Porsi Standar"}
                            </p>
                            <p
                              className={`text-xs font-black ${
                                isOutOfStock ? "text-slate-400" : "text-amber-700"
                              }`}
                            >
                              Rp {parseFloat(v.price).toLocaleString("id-ID")}
                            </p>
                          </div>

                          {/* Kontrol Kuantitas */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isOutOfStock ? (
                              <span className="px-3 py-1.5 rounded-xl bg-slate-200/70 text-slate-500 text-xs font-bold border border-slate-300/80 cursor-not-allowed select-none">
                                Habis
                              </span>
                            ) : inCartQty > 0 ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromCart(v.id)}
                                  className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 transition-all"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 text-center text-xs font-black text-slate-900">
                                  {inCartQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(product, v)}
                                  className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(product, v)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 4. Floating Bottom Bar (Keranjang Belanja) */}
      {cartSummary.totalItems > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-linear-to-t from-slate-900/40 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsCheckoutModalOpen(true)}
              className="w-full p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center justify-between gap-3 active:scale-98 transition-all hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                  {cartSummary.totalItems}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {tableNumber ? `Meja ${tableNumber}` : "Pesanan Menu"}
                  </p>
                  <p className="text-sm font-black text-white">
                    Rp {cartSummary.totalPrice.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-extrabold text-xs bg-white/10 px-3 py-2 rounded-xl text-amber-400">
                <span>Lanjut Pesan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 5. Modal Konfirmasi & Checkout Pesanan */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 max-h-[92vh] flex flex-col">
            {/* Header Dialog */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Konfirmasi Pesanan</h3>
                  <p className="text-[11px] text-slate-400">Isi data pemesan untuk kasir</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Ringkasan Item */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <p className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider">
                  Daftar Pesanan ({cartSummary.totalItems} item)
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {cartSummary.items.map((item) => (
                    <div key={item.variant.id} className="flex justify-between items-center text-slate-800">
                      <span className="truncate pr-2">
                        {item.quantity}x {item.product.name} ({item.variant.name})
                      </span>
                      <span className="font-black shrink-0">
                        Rp {(parseFloat(item.variant.price) * item.quantity).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                  <span>Total Bayar</span>
                  <span className="text-amber-700">
                    Rp {cartSummary.totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Data Pemesan */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Nama Pemesan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Nomor WhatsApp (Opsional)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Nomor Anda akan otomatis terhubung ke sistem pelanggan toko
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Catatan Pesanan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Contoh: Es dipisah, sambal sedikit"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Membuat Pesanan & Tiket Barcode...</span>
                    </>
                  ) : (
                    <span>Pesan Sekarang & Dapatkan Barcode</span>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Setelah klik pesan, tunjukkan barcode tiket di HP Anda ke kasir untuk proses pembayaran.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
