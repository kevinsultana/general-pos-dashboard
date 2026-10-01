"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Package,
  Tags,
  Sliders,
  Plus,
  Search,
  Edit2,
  Trash2,
  Boxes,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../lib/api";
import CategoryModal from "../../../components/products/CategoryModal";
import ModifierModal from "../../../components/products/ModifierModal";
import ProductModal from "../../../components/products/ProductModal";
import QuickStockModal from "../../../components/products/QuickStockModal";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtCurrency = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v || 0);

function CategoryBadge({ category }) {
  if (!category) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: category.color || "#64748b" }}
    >
      {category.name}
    </span>
  );
}

function StockBadge({ stocks, branchId, minStock }) {
  const stockEntry = stocks?.find((s) => s.branchId === branchId);
  const qty = stockEntry?.quantity ?? null;
  const min = stockEntry?.minStock ?? minStock ?? 5;

  if (qty === null) return <span className="text-xs text-slate-400">—</span>;

  const isLow = qty <= min && qty > 0;
  const isEmpty = qty === 0;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold tabular-nums border ${
        isEmpty
          ? "bg-red-50 border-red-200 text-red-700"
          : isLow
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"
      }`}
    >
      {isEmpty && <AlertTriangle className="w-3 h-3" />}
      {qty.toLocaleString("id-ID")}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-3.5 bg-slate-100 rounded-lg"
            style={{ width: `${40 + ((i * 13) % 50)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Tab Styles ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "products", label: "Katalog Produk", icon: Package },
  { id: "categories", label: "Kategori", icon: Tags },
  { id: "modifiers", label: "Grup Modifier", icon: Sliders },
];

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { user, tenant, hasPermission, activeBranchId, branches } = useAuth();

  const canView = user?.isOwner || hasPermission("inventory:view");
  const canManage = user?.isOwner || hasPermission("inventory:manage");

  const [activeTab, setActiveTab] = useState("products");

  // Products state
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodSearch, setProdSearch] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodPage, setProdPage] = useState(1);
  const [prodTotal, setProdTotal] = useState(0);
  const PROD_LIMIT = 20;
  const searchTimeout = useRef(null);
  const fetchAbortController = useRef(null); // [H-4] AbortController untuk cancel fetch sebelumnya

  // Categories state
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  // Modifiers state
  const [modifiers, setModifiers] = useState([]);
  const [modLoading, setModLoading] = useState(false);

  // Modals
  const [productModal, setProductModal] = useState({
    open: false,
    product: null,
  });
  const [categoryModal, setCategoryModal] = useState({
    open: false,
    category: null,
  });
  const [modifierModal, setModifierModal] = useState({
    open: false,
    modifier: null,
  });
  const [quickStockModal, setQuickStockModal] = useState({
    open: false,
    product: null,
  });
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch helpers ──

  const fetchProducts = useCallback(
    async (page = 1, search = "", catId = "") => {
      // [H-4] Cancel fetch sebelumnya jika masih berjalan
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }
      const controller = new AbortController();
      fetchAbortController.current = controller;

      setProdLoading(true);
      try {
        const res = await api.get("/products", {
          params: {
            page,
            limit: PROD_LIMIT,
            search: search || undefined,
            categoryId: catId || undefined,
            branchId: activeBranchId || undefined,
          },
          signal: controller.signal,
        });
        setProducts(res.data || []);
        setProdTotal(res.pagination?.total || 0);
      } catch (err) {
        // Jangan tampilkan error jika fetch sengaja dibatalkan (race condition prevention)
        if (err.name !== "AbortError") {
          toast.error("Gagal memuat daftar produk.");
        }
      } finally {
        setProdLoading(false);
      }
    },
    [activeBranchId],
  );

  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await api.get("/categories");
      setCategories(res.data || []);
    } catch {
      toast.error("Gagal memuat kategori.");
    } finally {
      setCatLoading(false);
    }
  }, []);

  const fetchModifiers = useCallback(async () => {
    setModLoading(true);
    try {
      const res = await api.get("/modifiers");
      setModifiers(res.data || []);
    } catch {
      toast.error("Gagal memuat modifier.");
    } finally {
      setModLoading(false);
    }
  }, []);

  // Initial load & tab change
  useEffect(() => {
    if (!canView) return;
    fetchCategories();
    fetchModifiers();
  }, [canView, fetchCategories, fetchModifiers]);

  useEffect(() => {
    if (!canView || activeTab !== "products") return;
    fetchProducts(prodPage, prodSearch, prodCategory);
  }, [
    canView,
    activeTab,
    prodPage,
    prodCategory,
    activeBranchId,
    fetchProducts,
  ]);

  // [L-4] Cleanup: batalkan fetch & hapus pending search timeout saat komponen unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (fetchAbortController.current) fetchAbortController.current.abort();
    };
  }, []);

  // Debounced search
  const handleSearchChange = (value) => {
    setProdSearch(value);
    setProdPage(1);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchProducts(1, value, prodCategory);
    }, 380);
  };

  // ── Delete handlers ──

  const handleDeleteProduct = async (product) => {
    if (
      !confirm(
        `Hapus produk "${product.name}"? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;
    setDeletingId(product.id);
    try {
      await api.delete(`/products/${product.id}`);
      toast.success(`"${product.name}" berhasil dihapus.`);
      fetchProducts(prodPage, prodSearch, prodCategory);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus produk.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (
      !confirm(
        `Hapus kategori "${cat.name}"? Produk terkait tidak akan dihapus.`,
      )
    )
      return;
    setDeletingId(cat.id);
    try {
      await api.delete(`/categories/${cat.id}`);
      toast.success(`Kategori "${cat.name}" dihapus.`);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus kategori.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteModifier = async (mod) => {
    if (!confirm(`Hapus modifier group "${mod.name}"?`)) return;
    setDeletingId(mod.id);
    try {
      await api.delete(`/modifiers/${mod.id}`);
      toast.success(`Modifier "${mod.name}" dihapus.`);
      fetchModifiers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus modifier.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Unauthorized ──

  if (!canView) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">
            Akses Ditolak
          </h2>
          <p className="text-sm text-slate-500">
            Anda tidak memiliki izin untuk mengakses halaman Manajemen Produk.
          </p>
        </div>
      </div>
    );
  }

  const activeBranch = branches?.find((b) => b.id === activeBranchId);
  const totalPages = Math.ceil(prodTotal / PROD_LIMIT);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100/80 p-4 sm:p-6">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Produk & Inventori
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Kelola produk, kategori, modifier, varian, dan satuan bertingkat.
        </p>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1.5 mb-5 bg-white/70 backdrop-blur-sm border border-white/80 shadow-sm rounded-2xl p-1.5 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-slate-400"}`}
              />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════
          TAB 1: KATALOG PRODUK
      ══════════════════════════════════════════════ */}
      {activeTab === "products" && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Control Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={prodSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari nama, SKU, barcode..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={prodCategory}
                onChange={(e) => {
                  setProdCategory(e.target.value);
                  setProdPage(1);
                }}
                className="pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white/80 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition appearance-none"
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Branch Indicator */}
            {activeBranch && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-xs font-semibold text-emerald-700 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {activeBranch.name}
              </div>
            )}

            <div className="flex items-center gap-2 sm:ml-auto">
              <button
                onClick={() =>
                  fetchProducts(prodPage, prodSearch, prodCategory)
                }
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {canManage && (
                <button
                  onClick={() => setProductModal({ open: true, product: null })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors shadow-sm shadow-amber-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Produk</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    SKU / Barcode
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Harga Jual
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    Modal (HPP)
                  </th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {prodLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-400">
                        {prodSearch || prodCategory
                          ? "Tidak ada produk yang cocok."
                          : "Belum ada produk."}
                      </p>
                      {canManage && !prodSearch && !prodCategory && (
                        <button
                          onClick={() =>
                            setProductModal({ open: true, product: null })
                          }
                          className="mt-3 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors"
                        >
                          + Tambah produk pertama
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const variantCount = p.variants?.length || 0;
                    const unitCount = p.unitPrices?.length || 0;
                    const isDeleting = deletingId === p.id;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* Produk */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-400/20 to-amber-600/10 border border-amber-200/50 flex items-center justify-center shrink-0 text-sm font-extrabold text-amber-700">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate max-w-44">
                                {p.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {p.isService && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-100 text-cyan-700 border border-cyan-200">
                                    Jasa
                                  </span>
                                )}
                                {variantCount > 0 && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                    {variantCount} varian
                                  </span>
                                )}
                                {unitCount > 0 && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600">
                                    {unitCount} satuan
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="px-4 py-3.5">
                          <CategoryBadge category={p.category} />
                        </td>

                        {/* SKU / Barcode */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <div className="space-y-0.5">
                            {p.sku && (
                              <p className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                {p.sku}
                              </p>
                            )}
                            {p.barcode && (
                              <p className="text-[11px] font-mono text-slate-400">
                                {p.barcode}
                              </p>
                            )}
                            {!p.sku && !p.barcode && (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </div>
                        </td>

                        {/* Harga Jual */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-sm font-bold text-slate-800 tabular-nums">
                            {fmtCurrency(p.basePrice)}
                          </span>
                        </td>

                        {/* Modal HPP */}
                        <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                          <span className="text-xs text-slate-500 tabular-nums">
                            {fmtCurrency(p.cogs)}
                          </span>
                        </td>

                        {/* Stok */}
                        <td className="px-4 py-3.5 text-center">
                          {p.isService || !p.trackStock ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <StockBadge
                              stocks={p.stocks}
                              branchId={activeBranchId}
                            />
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            {canManage && (
                              <>
                                <button
                                  onClick={() =>
                                    setProductModal({ open: true, product: p })
                                  }
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Edit Produk"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {p.trackStock && !p.isService && (
                                  <button
                                    onClick={() =>
                                      setQuickStockModal({
                                        open: true,
                                        product: p,
                                      })
                                    }
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                    title="Sesuaikan Stok"
                                  >
                                    <Boxes className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteProduct(p)}
                                  disabled={isDeleting}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                                  title="Hapus Produk"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40">
              <p className="text-xs text-slate-500">
                Menampilkan {(prodPage - 1) * PROD_LIMIT + 1}–
                {Math.min(prodPage * PROD_LIMIT, prodTotal)} dari {prodTotal}{" "}
                produk
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setProdPage((p) => Math.max(1, p - 1))}
                  disabled={prodPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-600 px-2">
                  {prodPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setProdPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={prodPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 2: MANAJEMEN KATEGORI
      ══════════════════════════════════════════════ */}
      {activeTab === "categories" && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Kategori Produk
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {categories.length} kategori terdaftar
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => setCategoryModal({ open: true, category: null })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors shadow-sm shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                Tambah Kategori
              </button>
            )}
          </div>

          {catLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-16 text-center">
              <Tags className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-semibold">
                Belum ada kategori.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl shadow-sm flex items-center justify-center text-white font-extrabold text-sm"
                      style={{ backgroundColor: cat.color || "#64748b" }}
                    >
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {cat.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {cat._count?.products ?? 0} produk
                        <span className="ml-1.5 font-mono text-slate-300">
                          {cat.color}
                        </span>
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setCategoryModal({ open: true, category: cat })
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        disabled={deletingId === cat.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Hapus"
                      >
                        {deletingId === cat.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 3: MODIFIER GROUPS
      ══════════════════════════════════════════════ */}
      {activeTab === "modifiers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Grup Modifier & Add-on
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {modifiers.length} grup terdaftar
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => setModifierModal({ open: true, modifier: null })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors shadow-sm shadow-violet-600/20"
              >
                <Plus className="w-4 h-4" />
                Tambah Modifier
              </button>
            )}
          </div>

          {modLoading ? (
            <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
            </div>
          ) : modifiers.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-16 text-center">
              <Sliders className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-semibold">
                Belum ada modifier group.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modifiers.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white/80 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="px-4 py-3.5 border-b border-slate-100 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {mod.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {mod.isRequired && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                            Wajib
                          </span>
                        )}
                        {mod.isMultiple && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                            Multi-pilih
                          </span>
                        )}
                        {!mod.isRequired && !mod.isMultiple && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            Opsional
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {mod._count?.products || 0} produk
                        </span>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            setModifierModal({ open: true, modifier: mod })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteModifier(mod)}
                          disabled={deletingId === mod.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {deletingId === mod.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="divide-y divide-slate-50">
                    {(mod.options || []).slice(0, 5).map((opt) => (
                      <div
                        key={opt.id}
                        className="px-4 py-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {opt.name}
                          </p>
                          {opt.trackStock && opt.inventoryProduct && (
                            <p className="text-[10px] text-emerald-600 mt-0.5">
                              ✂️ Potong {opt.deductQty}x{" "}
                              {opt.inventoryProduct.name}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs font-bold tabular-nums shrink-0 ${opt.price > 0 ? "text-slate-700" : "text-slate-400"}`}
                        >
                          {opt.price > 0
                            ? `+${fmtCurrency(opt.price)}`
                            : "Gratis"}
                        </span>
                      </div>
                    ))}
                    {mod.options?.length > 5 && (
                      <div className="px-4 py-2 text-center">
                        <span className="text-[11px] text-slate-400 font-medium">
                          +{mod.options.length - 5} opsi lainnya
                        </span>
                      </div>
                    )}
                    {(!mod.options || mod.options.length === 0) && (
                      <div className="px-4 py-3 text-center">
                        <span className="text-xs text-slate-400">
                          Belum ada opsi
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <ProductModal
        isOpen={productModal.open}
        product={productModal.product}
        categories={categories}
        modifierGroups={modifiers}
        onClose={() => setProductModal({ open: false, product: null })}
        onSuccess={() => fetchProducts(prodPage, prodSearch, prodCategory)}
      />

      <CategoryModal
        isOpen={categoryModal.open}
        category={categoryModal.category}
        onClose={() => setCategoryModal({ open: false, category: null })}
        onSuccess={() => {
          fetchCategories();
          fetchProducts(prodPage, prodSearch, prodCategory);
        }}
      />

      <ModifierModal
        isOpen={modifierModal.open}
        modifier={modifierModal.modifier}
        products={products}
        onClose={() => setModifierModal({ open: false, modifier: null })}
        onSuccess={fetchModifiers}
      />

      <QuickStockModal
        isOpen={quickStockModal.open}
        product={quickStockModal.product}
        branchId={activeBranchId}
        onClose={() => setQuickStockModal({ open: false, product: null })}
        onSuccess={() => fetchProducts(prodPage, prodSearch, prodCategory)}
      />
    </div>
  );
}
