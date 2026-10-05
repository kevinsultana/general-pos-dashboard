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
  Utensils,
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
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // State Pesanan (Tipe & Meja)
  const [orderType] = useState("DINE_IN");
  const [tableNumber, setTableNumber] = useState(tableParam || "");

  // Keranjang Belanja Pelanggan: { [variantId]: { product, variant, quantity, notes } }
  const [cart, setCart] = useState({});

  // Sinkronkan keranjang dari LocalStorage
  useEffect(() => {
    if (!tenantSlug) return;
    try {
      const saved = localStorage.getItem(`omnipos_cart_${tenantSlug}`);
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, [tenantSlug]);

  // Simpan perubahan ke LocalStorage
  const updateCart = (nextCart) => {
    setCart(nextCart);
    try {
      localStorage.setItem(`omnipos_cart_${tenantSlug}`, JSON.stringify(nextCart));
    } catch (e) {
      console.error(e);
    }
  };

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

    const existing = cart[variant.id];
    const newQty = (existing?.quantity || 0) + 1;
    const nextCart = {
      ...cart,
      [variant.id]: {
        product,
        variant,
        quantity: newQty,
        notes: existing?.notes || "",
      },
    };
    updateCart(nextCart);

    toast.success(`${product.name} (${variant.name}) ditambahkan`, {
      id: `add-${variant.id}`,
      duration: 1500,
    });
  };

  // Kurangi item dari keranjang
  const handleRemoveFromCart = (variantId) => {
    const existing = cart[variantId];
    if (!existing) return;
    if (existing.quantity <= 1) {
      const copy = { ...cart };
      delete copy[variantId];
      updateCart(copy);
      return;
    }
    const nextCart = {
      ...cart,
      [variantId]: {
        ...existing,
        quantity: existing.quantity - 1,
      },
    };
    updateCart(nextCart);
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

  // Daftar kategori unik dari produk
  const categories = useMemo(() => {
    if (!storeData?.products) return [];
    const map = new Map();
    storeData.products.forEach((p) => {
      if (p.category?.id && p.category?.name) {
        if (!map.has(p.category.id)) {
          map.set(p.category.id, {
            id: p.category.id,
            name: p.category.name,
            sortOrder: p.category.sortOrder ?? 0,
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [storeData?.products]);

  // Filter produk berdasarkan pencarian dan kategori
  const filteredProducts = useMemo(() => {
    if (!storeData?.products) return [];
    const q = searchQuery.trim().toLowerCase();
    return storeData.products.filter((p) => {
      // Filter kategori
      if (selectedCategory !== "ALL") {
        if (p.category?.id !== selectedCategory) return false;
      }
      // Filter pencarian
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });
  }, [storeData?.products, searchQuery, selectedCategory]);

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

        {/* Filter Kategori Menu */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Semua Menu
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? "bg-amber-500 text-white shadow-xs shadow-amber-500/25"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* 3. Daftar Produk Menu (Grid 2 Kolom Card) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-2 p-8 rounded-3xl bg-white border border-slate-200/80 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">
                {searchQuery ? "Menu tidak ditemukan" : "Belum ada menu yang tersedia"}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isOutOfStock = product.isActive === false;
              const hasSingleVariant = product.variants.length === 1;

              return (
                <div
                  key={product.id}
                  className={`flex flex-col justify-between p-3 rounded-2xl bg-white border shadow-xs transition-all ${
                    isOutOfStock
                      ? "border-slate-200/60 bg-slate-50/70 opacity-80"
                      : "border-slate-200/80 hover:shadow-md hover:border-amber-300/80"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Gambar Menu */}
                    <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                      {product.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            isOutOfStock ? "grayscale" : ""
                          }`}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-linear-to-br from-slate-50 to-slate-100">
                          <Utensils className="w-6 h-6 stroke-[1.5]" />
                        </div>
                      )}

                      {/* Badge Kategori & Status Habis */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[9px] font-black uppercase tracking-wider backdrop-blur-xs shadow-xs">
                            Habis
                          </span>
                        ) : product.category?.name ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-900/70 text-white text-[9px] font-bold backdrop-blur-xs shadow-xs truncate max-w-25">
                            {product.category.name}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Info Menu */}
                    <div className="space-y-0.5">
                      <h3
                        className={`text-xs sm:text-sm font-black leading-snug line-clamp-2 ${
                          isOutOfStock
                            ? "text-slate-400 line-through decoration-slate-400"
                            : "text-slate-900"
                        }`}
                        title={product.name}
                      >
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Varian & Tombol Aksi */}
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    {hasSingleVariant ? (
                      (() => {
                        const v = product.variants[0];
                        const inCartQty = cart[v.id]?.quantity || 0;

                        return (
                          <div className="flex flex-col gap-2">
                            <div>
                              <p
                                className={`text-xs sm:text-sm font-black ${
                                  isOutOfStock ? "text-slate-400" : "text-amber-700"
                                }`}
                              >
                                Rp {parseFloat(v.price).toLocaleString("id-ID")}
                              </p>
                            </div>

                            {/* Tombol Aksi Single Variant */}
                            <div className="flex items-center justify-end">
                              {isOutOfStock ? (
                                <span className="w-full text-center py-1 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-bold border border-slate-200 select-none">
                                  Habis
                                </span>
                              ) : inCartQty > 0 ? (
                                <div className="w-full flex items-center justify-between bg-slate-50 p-1 rounded-xl border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromCart(v.id)}
                                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-black text-slate-900">
                                    {inCartQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(product, v)}
                                    className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-2xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(product, v)}
                                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold active:scale-95 transition-all shadow-xs cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Tambah</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      /* Multi-variants: Tampilkan tiap varian dalam baris ringkas */
                      <div className="space-y-1.5">
                        {product.variants.map((v) => {
                          const inCartQty = cart[v.id]?.quantity || 0;

                          return (
                            <div
                              key={v.id}
                              className="flex items-center justify-between gap-1 p-1.5 rounded-xl bg-slate-50 border border-slate-100/80"
                            >
                              <div className="min-w-0 pr-1">
                                <p className="text-[10px] font-bold text-slate-700 truncate">
                                  {v.name !== "Regular" ? v.name : "Standar"}
                                </p>
                                <p className="text-[10px] font-black text-amber-700">
                                  Rp {parseFloat(v.price).toLocaleString("id-ID")}
                                </p>
                              </div>

                              <div className="shrink-0">
                                {isOutOfStock ? (
                                  <span className="text-[9px] text-slate-400 font-bold">Habis</span>
                                ) : inCartQty > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFromCart(v.id)}
                                      className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 cursor-pointer shadow-2xs"
                                    >
                                      <Minus className="w-2.5 h-2.5" />
                                    </button>
                                    <span className="w-3.5 text-center text-[10px] font-black text-slate-900">
                                      {inCartQty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAddToCart(product, v)}
                                      className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold hover:bg-slate-800 active:scale-95 cursor-pointer shadow-2xs"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(product, v)}
                                    className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold active:scale-95 transition-all shadow-2xs cursor-pointer flex items-center justify-center"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 4. Floating Bottom Bar (Keranjang Belanja) */}
      {cartSummary.totalItems > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-linear-to-t from-slate-900/40 via-white/80 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                router.push(
                  `/order/${tenantSlug}/cart?branch=${selectedBranchId || branchParam || ""}${
                    tableParam ? `&table=${tableParam}` : ""
                  }`
                );
              }}
              className="w-full p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center justify-between gap-3 active:scale-98 transition-all hover:bg-slate-800 cursor-pointer"
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
    </div>
  );
}
