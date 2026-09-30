'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Barcode, Package, X } from 'lucide-react';
import { Product, Category, ProductVariant } from '../../../../types';
import { formatRupiah } from '../../../../lib/formatters';

interface ProductCatalogGridProps {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  onSelectProduct: (product: Product, variant?: ProductVariant | null) => void;
}

export function ProductCatalogGrid({
  products,
  categories,
  isLoading,
  onSelectProduct,
}: ProductCatalogGridProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount for barcode scanner readiness
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Barcode / Enter Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;

      // Exact barcode or SKU match
      const matchedProduct = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === q) ||
          (p.sku && p.sku.toLowerCase() === q) ||
          p.variants?.some(
            (v) => (v.barcode && v.barcode.toLowerCase() === q) || (v.sku && v.sku.toLowerCase() === q)
          )
      );

      if (matchedProduct) {
        e.preventDefault();
        // Check if matched variant
        const matchedVariant = matchedProduct.variants?.find(
          (v) => (v.barcode && v.barcode.toLowerCase() === q) || (v.sku && v.sku.toLowerCase() === q)
        );
        if (matchedVariant) {
          onSelectProduct(matchedProduct, matchedVariant);
        } else if (matchedProduct.variants && matchedProduct.variants.length > 0) {
          setVariantModalProduct(matchedProduct);
        } else {
          onSelectProduct(matchedProduct, null);
        }
        setSearchQuery('');
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategoryId !== 'ALL' && p.categoryId !== selectedCategoryId) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = p.name.toLowerCase().includes(q);
    const matchSku = p.sku?.toLowerCase().includes(q) || false;
    const matchBarcode = p.barcode?.toLowerCase().includes(q) || false;
    const matchVariant = p.variants?.some(
      (v) => v.name.toLowerCase().includes(q) || v.sku?.toLowerCase().includes(q) || v.barcode?.toLowerCase().includes(q)
    );
    return matchName || matchSku || matchBarcode || matchVariant;
  });

  const handleProductClick = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setVariantModalProduct(product);
    } else {
      onSelectProduct(product, null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d121f] border-r border-slate-800">
      {/* Search & Barcode Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari produk atau scan barcode (Enter)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 flex items-center gap-1">
            <Barcode className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-2.5 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategoryId('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategoryId === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          Semua ({products.length})
        </button>
        {categories.map((c) => {
          const count = products.filter((p) => p.categoryId === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryId(c.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategoryId === c.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Product Grid Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Memuat katalog produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Package className="w-12 h-12 stroke-[1.2]" />
            <p className="text-sm font-medium text-slate-400">Tidak ada produk ditemukan</p>
            <p className="text-xs text-slate-500">Coba ganti kata kunci atau pilih kategori lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const productStock = Number(product.stock) || 0;
              const hasVariants = product.variants && product.variants.length > 0;
              const isOutOfStock = !hasVariants && productStock <= 0;
              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => handleProductClick(product)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isOutOfStock
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                      : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-medium text-indigo-400 truncate">
                        {product.category?.name || 'Katalog'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : productStock <= 5 && !hasVariants
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : hasVariants ? 'Varian' : `Stok: ${productStock}`}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-100 text-sm line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    {product.sku && (
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">SKU: {product.sku}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-100">
                      {formatRupiah(product.sellingPrice)}
                    </span>
                    {hasVariants && (
                      <span className="text-[10px] bg-slate-800 text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-slate-700">
                        +{product.variants!.length} Varian
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Variant Selection Modal */}
      {variantModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Pilih Varian</h3>
                <p className="text-xs text-indigo-400 mt-0.5">{variantModalProduct.name}</p>
              </div>
              <button
                onClick={() => setVariantModalProduct(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {variantModalProduct.variants?.map((v) => {
                const varStock = Number(v.stock) || 0;
                const varOutOfStock = varStock <= 0;
                return (
                  <button
                    key={v.id}
                    disabled={varOutOfStock}
                    onClick={() => {
                      onSelectProduct(variantModalProduct, v);
                      setVariantModalProduct(null);
                    }}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                      varOutOfStock
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-800 hover:border-indigo-500/80 hover:bg-slate-850 cursor-pointer'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-100">{v.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Stok: <span className={varOutOfStock ? 'text-rose-400' : 'text-slate-300'}>{varStock}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-400">
                        {formatRupiah(v.sellingPrice)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
