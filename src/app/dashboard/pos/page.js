'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Store,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  CreditCard,
  DollarSign,
  AlertCircle,
  Layers,
  Barcode,
  Utensils,
  Coffee,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';
import ShiftModal from '../../../components/pos/ShiftModal';
import PaymentModal from '../../../components/pos/PaymentModal';
import UnauthorizedState from '../../../components/common/UnauthorizedState';

export default function PosTerminalPage() {
  const { tenant, user, hasPermission, activeBranch } = useAuth();
  const { t } = useLanguage();

  // Shift State
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState('open'); // 'open' | 'movement' | 'close'

  // Products & Categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productsLoading, setProductsLoading] = useState(true);

  // Cart & Order State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('DIRECT'); // 'DIRECT' | 'DINE_IN' | 'TAKEAWAY'
  const [tableNumber, setTableNumber] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Modifier Customization Modal State for Cart Item
  const [selectedProductForMod, setSelectedProductForMod] = useState(null);
  const [activeVariant, setActiveVariant] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState([]);

  const isAllowed = user?.isOwner || hasPermission('pos:access');
  const businessConfig = tenant?.businessConfig || {};

  // 1. Fetch Current Shift
  const fetchCurrentShift = useCallback(async () => {
    setShiftLoading(true);
    try {
      const res = await api.get('/shifts/current');
      if (res.data?.success) {
        setCurrentShift(res.data.data);
      }
    } catch (err) {
      setCurrentShift(null);
    } finally {
      setShiftLoading(false);
    }
  }, []);

  // 2. Fetch Products & Categories
  const fetchCatalog = useCallback(async () => {
    setProductsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params: { limit: 200 } }),
        api.get('/categories').catch(() => ({ data: { data: [] } })),
      ]);

      if (prodRes.data?.success) {
        setProducts(prodRes.data.data || []);
      }
      if (catRes.data?.success) {
        setCategories(catRes.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat katalog produk.');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAllowed) {
      fetchCurrentShift();
      fetchCatalog();
    }
  }, [fetchCurrentShift, fetchCatalog, isAllowed]);

  // 3. Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // 4. Cart Calculations
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    cart.forEach((item) => {
      let itemPrice = item.basePrice;
      if (item.variant) {
        itemPrice += item.variant.priceAdj || 0;
      }
      if (Array.isArray(item.selectedModifiers)) {
        item.selectedModifiers.forEach((m) => {
          itemPrice += m.price || 0;
        });
      }
      subtotal += itemPrice * item.quantity;
    });

    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const grandTotal = Math.max(0, subtotal - discountAmount);

    return {
      subtotal,
      discount: discountAmount,
      grandTotal,
    };
  }, [cart, discountPercent]);

  // 5. Add to Cart Handler
  const handleAddToCart = (product) => {
    // If product has variants or modifiers and businessConfig enables modifiers, open customization drawer
    if (
      (product.variants?.length > 0 || product.modifiers?.length > 0) &&
      businessConfig.enableModifiers !== false
    ) {
      setSelectedProductForMod(product);
      setActiveVariant(product.variants?.[0] || null);
      setSelectedModifiers([]);
      return;
    }

    // Direct add default product
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.id === product.id && !it.variantId && (!it.selectedModifiers || it.selectedModifiers.length === 0)
      );

      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          basePrice: product.basePrice,
          quantity: 1,
          variantId: null,
          variant: null,
          selectedModifiers: [],
        },
      ];
    });
  };

  // 6. Confirm Customization (Variants & Modifiers)
  const handleConfirmCustomization = () => {
    if (!selectedProductForMod) return;

    setCart((prev) => {
      return [
        ...prev,
        {
          id: selectedProductForMod.id,
          name: selectedProductForMod.name,
          basePrice: selectedProductForMod.basePrice,
          quantity: 1,
          variantId: activeVariant?.id || null,
          variant: activeVariant || null,
          selectedModifiers: [...selectedModifiers],
        },
      ];
    });

    setSelectedProductForMod(null);
    setActiveVariant(null);
    setSelectedModifiers([]);
  };

  // 7. Cart Quantity Controls
  const handleUpdateQty = (index, delta) => {
    setCart((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index].quantity = newQty;
      return copy;
    });
  };

  const handleRemoveFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan semua pesanan di keranjang?')) {
      setCart([]);
      setTableNumber('');
      setDiscountPercent(0);
    }
  };

  // 8. Fast Barcode Scan Support
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) =>
        p.sku?.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        p.barcode?.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      handleAddToCart(matched);
      toast.success(`+1 ${matched.name}`);
      setBarcodeInput('');
    } else {
      toast.error(`Produk dengan barcode "${barcodeInput}" tidak ditemukan.`);
    }
  };

  if (!isAllowed && user) {
    return <UnauthorizedState requiredPermission="pos:access" />;
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 animate-in fade-in duration-300">
      {/* 1. Header Bar: Shift Status & Quick Actions */}
      <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
            <Store className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900">
                Terminal Kasir POS
              </h1>
              {currentShift ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Shift Aktif (Modal: Rp {currentShift.startingCash.toLocaleString('id-ID')})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Shift Belum Dibuka</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Gerai: <strong>{activeBranch?.name || 'Cabang Utama'}</strong> • Kasir: {user?.name}
            </p>
          </div>
        </div>

        {/* Shift Buttons */}
        <div className="flex items-center gap-2">
          {currentShift ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setShiftModalMode('movement');
                  setIsShiftModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Kas Masuk/Keluar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShiftModalMode('close');
                  setIsShiftModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Tutup Shift
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShiftModalMode('open');
                setIsShiftModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Buka Shift Kasir</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main POS Layout: Grid Katalog (Kiri) & Keranjang Belanja (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* KOLOM KIRI: KATALOG PRODUK (7 KOLOM / 8 KOLOM) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search Bar & Barcode Scanner */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk atau SKU..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
            </div>

            {businessConfig.enableBarcodeFastScan && (
              <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-48">
                <Barcode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan Barcode..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white/80 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </form>
            )}
          </div>

          {/* Kategori Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Semua Menu
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grid Produk */}
          {productsLoading ? (
            <div className="py-24 text-center">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Memuat menu produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center p-6 bg-white/60 rounded-3xl border border-slate-200">
              <p className="text-sm font-bold text-slate-700">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Ubah kata kunci pencarian atau pilih kategori lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((prod) => {
                const hasVariants = prod.variants?.length > 0;
                const hasModifiers = prod.modifiers?.length > 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleAddToCart(prod)}
                    className="p-4 rounded-2xl bg-white/85 hover:bg-white border border-white/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between select-none active:scale-98 group"
                  >
                    <div>
                      {/* Product Header / Icon */}
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 font-black flex items-center justify-center text-sm mb-2 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        {(prod.name || 'P').charAt(0).toUpperCase()}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {prod.name}
                      </h4>
                      {prod.sku && (
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {prod.sku}
                        </span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-amber-800">
                        Rp {prod.basePrice.toLocaleString('id-ID')}
                      </span>

                      {(hasVariants || hasModifiers) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          Opsi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* KOLOM KANAN: KERANJANG BELANJA & TOTAL (5 KOLOM / 4 KOLOM) */}
        <div className="lg:col-span-5 xl:col-span-4 p-5 rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/70 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-black text-slate-900">Pesanan Pelanggan</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                {cart.length}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Opsi Tipe Pesanan & Nomor Meja */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none"
            >
              <option value="DIRECT">Langsung (Bawa Pulang)</option>
              <option value="DINE_IN">Makan di Tempat (Dine-in)</option>
              <option value="TAKEAWAY">Takeaway / Bungkus</option>
            </select>

            {businessConfig.enableTableManagement !== false && (
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="No. Meja..."
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none"
              />
            )}
          </div>

          {/* Daftar Item Keranjang */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                Keranjang masih kosong. Klik menu produk di sebelah kiri untuk menambahkan.
              </div>
            ) : (
              cart.map((item, idx) => {
                let itemSinglePrice = item.basePrice;
                if (item.variant) itemSinglePrice += item.variant.priceAdj || 0;
                if (Array.isArray(item.selectedModifiers)) {
                  item.selectedModifiers.forEach((m) => {
                    itemSinglePrice += m.price || 0;
                  });
                }
                const itemTotal = itemSinglePrice * item.quantity;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 leading-tight">
                          {item.name}
                        </h5>
                        {item.variant && (
                          <span className="text-[10px] text-amber-700 font-bold block">
                            [{item.variant.name}]
                          </span>
                        )}
                        {item.selectedModifiers?.map((m, mIdx) => (
                          <span key={mIdx} className="text-[10px] text-slate-500 block">
                            + {m.optionName} (Rp {m.price})
                          </span>
                        ))}
                      </div>

                      <span className="text-xs font-black text-slate-900 shrink-0">
                        Rp {itemTotal.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        @ Rp {itemSinglePrice.toLocaleString('id-ID')}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Rincian Subtotal, Diskon & Total */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold">Rp {cartTotals.subtotal.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Diskon (%):</span>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                className="w-16 px-2 py-0.5 rounded-lg border border-slate-200 text-right font-bold text-xs"
              />
            </div>

            <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL BAYAR:</span>
              <span className="text-base text-amber-700">
                Rp {cartTotals.grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Tombol Proses Pembayaran */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              if (!currentShift) {
                toast.error('Anda harus membuka shift kasir terlebih dahulu sebelum memproses pembayaran.');
                setShiftModalMode('open');
                setIsShiftModalOpen(true);
                return;
              }
              setIsPaymentModalOpen(true);
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-4 h-4" />
            <span>Bayar (Rp {cartTotals.grandTotal.toLocaleString('id-ID')})</span>
          </button>
        </div>
      </div>

      {/* Modal Shift Kasir */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        mode={shiftModalMode}
        currentShift={currentShift}
        onClose={() => setIsShiftModalOpen(false)}
        onSuccess={() => {
          fetchCurrentShift();
        }}
      />

      {/* Modal Pembayaran & Cetak Struk */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cart={cart}
        totals={cartTotals}
        tableNumber={tableNumber}
        orderType={orderType}
        businessConfig={businessConfig}
        tenant={tenant}
        user={user}
        onSuccess={() => {
          setCart([]);
          setTableNumber('');
          setDiscountPercent(0);
          fetchCurrentShift();
        }}
      />

      {/* Modal Customization (Varian & Modifiers) */}
      {selectedProductForMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-white/90 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900">{selectedProductForMod.name}</h4>
                <p className="text-xs text-slate-500">Pilih varian atau topping tambahan</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForMod(null)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Varian Selection */}
            {selectedProductForMod.variants?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Pilih Varian
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProductForMod.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVariant(v)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                        activeVariant?.id === v.id
                          ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>{v.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {v.priceAdj > 0 ? `+Rp ${v.priceAdj.toLocaleString('id-ID')}` : 'Harga Pokok'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modifiers Selection */}
            {selectedProductForMod.modifiers?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Topping / Add-on Tambahan
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {selectedProductForMod.modifiers.map((mod) => {
                    const isSelected = selectedModifiers.some((m) => m.modifierOptionId === mod.id);

                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedModifiers((prev) =>
                              prev.filter((m) => m.modifierOptionId !== mod.id)
                            );
                          } else {
                            setSelectedModifiers((prev) => [
                              ...prev,
                              {
                                modifierOptionId: mod.id,
                                optionName: mod.name,
                                price: mod.price,
                                deductQty: mod.deductQty || 1,
                                inventoryProductId: mod.inventoryProductId || null,
                              },
                            ]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{mod.name}</span>
                        <span className="font-mono text-amber-800">+Rp {mod.price.toLocaleString('id-ID')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmCustomization}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20"
            >
              Tambahkan ke Pesanan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
