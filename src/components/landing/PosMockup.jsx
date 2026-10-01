"use client";

import { useState } from "react";
import {
  Printer,
  Store,
  Clock,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Espresso Double Shot",
    category: "Coffee",
    price: 28000,
    code: "ESP-01",
    stock: 45,
  },
  {
    id: 2,
    name: "Signature Gula Aren Latte",
    category: "Coffee",
    price: 34000,
    code: "AREN-02",
    stock: 38,
  },
  {
    id: 3,
    name: "Artisan Butter Croissant",
    category: "Pastry",
    price: 32000,
    code: "PAS-04",
    stock: 12,
  },
  {
    id: 4,
    name: "Kyoto Ceremonial Matcha",
    category: "Non-Coffee",
    price: 38000,
    code: "MTC-03",
    stock: 24,
  },
  {
    id: 5,
    name: "Vanilla Cold Foam Nitro",
    category: "Coffee",
    price: 42000,
    code: "NIT-05",
    stock: 19,
  },
  {
    id: 6,
    name: "Smoked Beef Panini",
    category: "Food",
    price: 48000,
    code: "PAN-01",
    stock: 8,
  },
];

export default function PosMockup() {
  const [selectedBranch, setSelectedBranch] = useState(
    "Outlet 01 - Sudirman Central",
  );
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [cart, setCart] = useState([
    { id: 2, name: "Signature Gula Aren Latte", price: 34000, qty: 2 },
    { id: 3, name: "Artisan Butter Croissant", price: 32000, qty: 1 },
  ]);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const categories = ["Semua", "Coffee", "Non-Coffee", "Pastry", "Food"];

  const filteredProducts =
    activeCategory === "Semua"
      ? INITIAL_PRODUCTS
      : INITIAL_PRODUCTS.filter((p) => p.category === activeCategory);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [
        ...prev,
        { id: product.id, name: product.name, price: product.price, qty: 1 },
      ];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  const handleCheckout = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setCart([]);
    }, 2200);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Specular Glow behind iPad Frame */}
      <div className="absolute -inset-1.5 rounded-[36px] bg-linear-to-r from-amber-200/50 via-rose-100/40 to-emerald-100/50 blur-2xl opacity-80 pointer-events-none" />

      {/* Main Glass Screen Container (Light Frosted Acrylic Tablet) */}
      <div className="relative rounded-4xl bg-white/75 backdrop-blur-2xl border border-white/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] ring-1 ring-inset ring-white/70 overflow-hidden">
        {/* Top Control Bar / OS Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-slate-200/60 bg-white/40">
          <div className="flex items-center gap-3">
            {/* macOS-style Dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-xs" />
            </div>

            {/* Outlet Switcher */}
            <div className="ml-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60 text-xs font-semibold text-slate-700">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>{selectedBranch}</span>
              <span className="text-[10px] text-slate-500 ml-1 px-1.5 py-0.2 rounded-full bg-white font-medium border border-slate-200/50">
                Tenant #049
              </span>
            </div>
          </div>

          {/* Right Status Indicators */}
          <div className="flex items-center gap-3.5 mt-2 sm:mt-0">
            {/* Thermal Printer Live Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px]">Thermal 80mm Siaga</span>
            </div>

            {/* Shift & Time Status */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Shift Siang: Budi S.</span>
            </div>
          </div>
        </div>

        {/* POS Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-145">
          {/* Left Column: Product Catalog & Categories (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/60 bg-slate-50/30">
            <div>
              {/* Search & Category Tabs */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    placeholder="Cari menu, SKU barcode..."
                    className="w-full bg-white/80 border border-slate-200/70 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none shadow-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        activeCategory === cat
                          ? "bg-slate-900 text-white font-semibold shadow-sm"
                          : "bg-white/70 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="group relative flex flex-col justify-between p-3.5 rounded-2xl bg-white/70 hover:bg-white border border-slate-200/60 hover:border-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] text-left transition-all duration-200 active:scale-95"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                          {product.code}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          Stok: {product.stock}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {product.category}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-extrabold text-amber-600">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-amber-50 group-hover:bg-amber-500 flex items-center justify-center text-amber-700 group-hover:text-white transition-colors border border-amber-200/60 group-hover:border-transparent">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Quick Metric strip */}
            <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Tekan produk untuk simulasi kasir instan</span>
              </span>
              <span className="text-slate-400">Offline-First Engine Siap</span>
            </div>
          </div>

          {/* Right Column: Active Cart / Order Receipt Panel */}
          <div className="lg:col-span-5 xl:col-span-4 p-6 flex flex-col justify-between bg-white/60">
            <div>
              {/* Slip Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Pesanan Meja #08
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  #ORD-8921
                </span>
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-slate-100 max-h-65 overflow-y-auto pr-1 my-3 scrollbar-none">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Keranjang kosong. Pilih menu di sebelah kiri.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Rp {item.price.toLocaleString("id-ID")}
                        </p>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded hover:bg-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 px-1">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded hover:bg-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total Item Price */}
                      <span className="text-xs font-bold text-slate-800 text-right min-w-16.25">
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Calculations & Payment Action */}
            <div className="pt-3 border-t border-slate-200/60 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>PB1 / Pajak (10%)</span>
                  <span className="font-medium text-slate-700">
                    Rp {tax.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200/60">
                  <span>Total Tagihan</span>
                  <span className="text-base text-amber-600 font-extrabold">
                    Rp {total.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Payment Methods Pill */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/70 text-slate-700 text-[11px] font-medium transition-colors shadow-2xs">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>QRIS</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/70 text-slate-700 text-[11px] font-medium transition-colors shadow-2xs">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>EDC Debit</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/70 text-slate-700 text-[11px] font-medium transition-colors shadow-2xs">
                  <Banknote className="w-4 h-4 text-slate-600" />
                  <span>Tunai</span>
                </button>
              </div>

              {/* Checkout Trigger */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || paymentSuccess}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                  paymentSuccess
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                    : cart.length === 0
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-linear-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/25 active:scale-98"
                }`}
              >
                {paymentSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Transaksi Tersimpan & Struk Dicetak!</span>
                  </>
                ) : (
                  <>
                    <span>Bayar & Cetak Struk (F10)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
