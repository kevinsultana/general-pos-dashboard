"use client";

import React, { useEffect, useState } from "react";
import {
  Boxes,
  ArrowUpDown,
  PlusCircle,
  AlertCircle,
  History,
  PackageCheck,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Topbar } from "../../../components/Topbar";
import { Modal } from "../../../components/Modal";
import { api } from "../../../lib/api";
import { Product, StockMovement } from "../../../types";
import {
  formatNumber,
  formatDate,
  formatRupiah,
} from "../../../lib/formatters";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);

  const [adjustForm, setAdjustForm] = useState({
    productId: "",
    variantId: "",
    deltaType: "ADD", // 'ADD' or 'DEDUCT'
    quantity: "",
    reason: "",
  });

  const [stockInForm, setStockInForm] = useState({
    productId: "",
    variantId: "",
    quantity: "",
    unitCost: "",
    reason: "Restock Pembelian",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, moves] = await Promise.all([
        api.getProducts(),
        api.getStockMovements(30),
      ]);
      setProducts(prods || []);
      setMovements(moves || []);
    } catch (err) {
      console.error("Failed to load inventory data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.productId || !adjustForm.quantity || !adjustForm.reason) {
      alert("Semua field wajib diisi");
      return;
    }

    const qty = parseFloat(adjustForm.quantity);
    const quantityDelta = adjustForm.deltaType === "ADD" ? qty : -qty;

    try {
      await api.adjustStock({
        productId: adjustForm.productId,
        variantId: adjustForm.variantId || undefined,
        type: "ADJUSTMENT",
        quantityDelta,
        reason: adjustForm.reason,
      });
      setIsAdjustOpen(false);
      setAdjustForm({
        productId: "",
        variantId: "",
        deltaType: "ADD",
        quantity: "",
        reason: "",
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menyesuaikan stok");
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !stockInForm.productId ||
      !stockInForm.quantity ||
      !stockInForm.unitCost
    ) {
      alert("Produk, kuantitas masuk, dan harga beli satuan wajib diisi");
      return;
    }

    const qty = parseFloat(stockInForm.quantity);
    const unitCost = parseFloat(stockInForm.unitCost);

    try {
      await api.adjustStock({
        productId: stockInForm.productId,
        variantId: stockInForm.variantId || undefined,
        type: "STOCK_IN",
        quantityDelta: qty,
        unitCost,
        reason: stockInForm.reason || "Restock Pembelian Gudang",
      });
      setIsStockInOpen(false);
      setStockInForm({
        productId: "",
        variantId: "",
        quantity: "",
        unitCost: "",
        reason: "Restock Pembelian",
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menambahkan stok masuk");
    }
  };

  // Preview WAC untuk Stock In modal
  const selectedProduct = products.find((p) => p.id === stockInForm.productId);
  const selectedVariant = selectedProduct?.variants?.find(
    (v) => v.id === stockInForm.variantId,
  );
  const currentStock = selectedVariant
    ? selectedVariant.stock
    : (selectedProduct?.stock ?? 0);
  const currentCost = selectedVariant
    ? selectedVariant.cost
    : (selectedProduct?.cost ?? 0);
  const inQty = parseFloat(stockInForm.quantity) || 0;
  const inCost = parseFloat(stockInForm.unitCost) || 0;
  const previewNewWac =
    inQty > 0 && inCost > 0
      ? currentStock <= 0
        ? inCost
        : (currentStock * currentCost + inQty * inCost) / (currentStock + inQty)
      : currentCost;

  // Selected product for adjustment modal
  const adjustSelectedProduct = products.find(
    (p) => p.id === adjustForm.productId,
  );

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Inventori & Penyesuaian Stok"
        description="Audit perpindahan stok barang, riwayat opname, dan penyesuaian fisik gudang"
      />

      <main className="p-6 space-y-6 flex-1">
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Manajemen Inventori Terpusat
            </h3>
            <p className="text-xs text-slate-400">
              Sinkronisasi stok langsung ke seluruh kasir mobile
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAdjustOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-xl font-semibold border border-slate-700 transition"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Penyesuaian Stok</span>
            </button>
            <button
              onClick={() => setIsStockInOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Stok Masuk (Stock In)</span>
            </button>
          </div>
        </div>

        {/* 2 Column Grid: Stock Status & Movement Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Balances Table (1.5 cols) */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-semibold text-slate-100">
                  Posisi Stok Saat Ini
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {products.length} item terdaftar
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Nama Produk</th>
                    <th className="pb-3 font-medium">SKU</th>
                    <th className="pb-3 font-medium text-center">Batas Min</th>
                    <th className="pb-3 font-medium text-right">Stok Fisik</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.map((p) => {
                    const isLow = p.stock <= p.lowStockThreshold;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-800/30 transition"
                      >
                        <td className="py-3 font-medium text-slate-200">
                          {p.name}
                        </td>
                        <td className="py-3 text-slate-400 font-mono text-[11px]">
                          {p.sku || "-"}
                        </td>
                        <td className="py-3 text-center text-slate-400 font-mono">
                          {p.lowStockThreshold}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-100">
                          {formatNumber(p.stock)}
                        </td>
                        <td className="py-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              Menipis
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                              Aman
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Movement Audit Log (1 col) */}
          <div className="glass-card p-5 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-slate-100">
                  Buku Mutasi Stok
                </h4>
              </div>
              <span className="text-[10px] text-slate-500">30 Terakhir</span>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto max-h-150 pr-1">
              {movements.length > 0 ? (
                movements.map((m) => {
                  const isPositive = m.quantityDelta > 0;
                  return (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">
                          {m.product?.name || "Produk"}
                        </span>
                        <span
                          className={`font-mono font-bold text-xs ${
                            isPositive ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isPositive ? `+${m.quantityDelta}` : m.quantityDelta}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {m.type}
                        </span>
                        <span>{formatDate(m.createdAt)}</span>
                      </div>
                      {m.reason && (
                        <p className="mt-1 text-[11px] text-slate-400 italic">
                          &quot;{m.reason}&quot;
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Belum ada catatan mutasi stok
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Adjust Stock */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Formulir Penyesuaian Stok (Stock Adjustment)"
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Pilih Produk *
            </label>
            <select
              required
              value={adjustForm.productId}
              onChange={(e) =>
                setAdjustForm({
                  ...adjustForm,
                  productId: e.target.value,
                  variantId: "",
                })
              }
              className="pos-select w-full px-3 py-2 text-xs"
            >
              <option value="">Pilih Produk...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok Saat Ini: {p.stock})
                </option>
              ))}
            </select>
          </div>

          {adjustSelectedProduct &&
            adjustSelectedProduct.variants &&
            adjustSelectedProduct.variants.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pilih Varian *
                </label>
                <select
                  required
                  value={adjustForm.variantId}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, variantId: e.target.value })
                  }
                  className="pos-select w-full px-3 py-2 text-xs"
                >
                  <option value="">Pilih Varian...</option>
                  {adjustSelectedProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Stok: {v.stock})
                    </option>
                  ))}
                </select>
              </div>
            )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Aksi Penyesuaian
              </label>
              <select
                value={adjustForm.deltaType}
                onChange={(e) =>
                  setAdjustForm({ ...adjustForm, deltaType: e.target.value })
                }
                className="pos-select w-full px-3 py-2 text-xs"
              >
                <option value="ADD">
                  + Tambah Stok (Masuk / Opname Lebih)
                </option>
                <option value="DEDUCT">
                  - Kurangi Stok (Rusak / Hilang / Kadaluwarsa)
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Jumlah Kuantitas *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={adjustForm.quantity}
                onChange={(e) =>
                  setAdjustForm({ ...adjustForm, quantity: e.target.value })
                }
                className="pos-input w-full px-3 py-2 text-xs font-mono"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Alasan Penyesuaian *
            </label>
            <input
              type="text"
              required
              value={adjustForm.reason}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, reason: e.target.value })
              }
              className="pos-input w-full px-3 py-2 text-xs"
              placeholder="Contoh: Stok opname bulanan / barang rusak / kadaluwarsa"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdjustOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              Terapkan Penyesuaian
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Stok Masuk (Stock In) dengan Kalkulasi WAC Otomatis */}
      <Modal
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        title="Penerimaan Stok Masuk (Stock In & WAC)"
      >
        <form onSubmit={handleStockIn} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Pilih Produk *
            </label>
            <select
              required
              value={stockInForm.productId}
              onChange={(e) =>
                setStockInForm({
                  ...stockInForm,
                  productId: e.target.value,
                  variantId: "",
                })
              }
              className="pos-select w-full px-3 py-2 text-xs"
            >
              <option value="">Pilih Produk...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.stock} | HPP: {formatRupiah(p.cost)})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct &&
            selectedProduct.variants &&
            selectedProduct.variants.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pilih Varian *
                </label>
                <select
                  required
                  value={stockInForm.variantId}
                  onChange={(e) =>
                    setStockInForm({
                      ...stockInForm,
                      variantId: e.target.value,
                    })
                  }
                  className="pos-select w-full px-3 py-2 text-xs"
                >
                  <option value="">Pilih Varian...</option>
                  {selectedProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Stok: {v.stock} | HPP: {formatRupiah(v.cost)})
                    </option>
                  ))}
                </select>
              </div>
            )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Jumlah Masuk (Qty) *
              </label>
              <input
                type="number"
                min="0.001"
                step="any"
                required
                value={stockInForm.quantity}
                onChange={(e) =>
                  setStockInForm({ ...stockInForm, quantity: e.target.value })
                }
                className="pos-input w-full px-3 py-2 text-xs font-mono"
                placeholder="Contoh: 20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Harga Beli Satuan Baru (Rp) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={stockInForm.unitCost}
                onChange={(e) =>
                  setStockInForm({ ...stockInForm, unitCost: e.target.value })
                }
                className="pos-input w-full px-3 py-2 text-xs font-mono"
                placeholder="Contoh: 15000"
              />
            </div>
          </div>

          {/* Live Preview Perhitungan WAC */}
          {inQty > 0 && inCost > 0 && (
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-indigo-300 font-semibold">
                <TrendingUp className="w-4 h-4" />
                <span>Simulasi Biaya Rata-Rata Tertimbang (WAC)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div>
                  <span className="text-slate-400">Stok Saat Ini:</span>{" "}
                  <span className="font-mono font-bold">{currentStock}</span>
                </div>
                <div>
                  <span className="text-slate-400">HPP Saat Ini:</span>{" "}
                  <span className="font-mono font-bold">
                    {formatRupiah(currentCost)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Total Unit Baru:</span>{" "}
                  <span className="font-mono font-bold text-emerald-400">
                    {currentStock + inQty}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">HPP Baru (WAC):</span>{" "}
                  <span className="font-mono font-bold text-indigo-300">
                    {formatRupiah(previewNewWac)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Catatan / No. Faktur Supplier
            </label>
            <input
              type="text"
              value={stockInForm.reason}
              onChange={(e) =>
                setStockInForm({ ...stockInForm, reason: e.target.value })
              }
              className="pos-input w-full px-3 py-2 text-xs"
              placeholder="Contoh: Pembelian PO-2026/04/001"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsStockInOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center space-x-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Konfirmasi Stok Masuk</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
