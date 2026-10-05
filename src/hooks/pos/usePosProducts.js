"use client";

import { useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../../lib/api";

/**
 * usePosProducts - Mengelola katalog produk kasir, loading, pencarian instan, dan filter kategori.
 *
 * @param {string|null} activeBranchId - ID cabang aktif
 * @returns {object}
 */
export function usePosProducts(activeBranchId) {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  /**
   * Mengambil daftar produk aktif dari API backend.
   */
  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const res = await api.get("/products");
      if (res?.success && Array.isArray(res.data)) {
        // Ambil produk dan simpan
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat produk.");
    } finally {
      setProductsLoading(false);
    }
  }, [activeBranchId]);

  /**
   * Reset data produk saat cabang berganti.
   */
  const resetProductsForBranch = useCallback(() => {
    setSearch("");
    setSelectedCategory("ALL");
    setProducts([]);
  }, []);

  /**
   * Daftar kategori unik yang diekstrak dari produk yang tersedia.
   */
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category?.name) cats.add(p.category.name);
      else if (p.categoryName) cats.add(p.categoryName);
    });
    return Array.from(cats);
  }, [products]);

  /**
   * Produk terfilter berdasarkan search query dan kategori terpilih.
   */
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      // Filter kategori
      if (selectedCategory !== "ALL") {
        const catName = p.category?.name || p.categoryName || "";
        if (catName !== selectedCategory) return false;
      }
      // Filter teks pencarian (nama produk atau barcode varian)
      if (!q) return true;
      const matchName = p.name?.toLowerCase().includes(q);
      const matchVariant = p.variants?.some((v) =>
        v.name?.toLowerCase().includes(q) || v.barcode?.toLowerCase().includes(q)
      );
      return matchName || matchVariant;
    });
  }, [products, search, selectedCategory]);

  return {
    products,
    setProducts,
    productsLoading,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
    fetchProducts,
    resetProductsForBranch,
  };
}
