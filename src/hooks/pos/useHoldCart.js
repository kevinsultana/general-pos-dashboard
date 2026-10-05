"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { promptHoldCart, confirmRecallCart } from "../../lib/alerts";

/**
 * useHoldCart - Mengelola antrean keranjang kasir yang ditahan (Hold & Recall Cart).
 *
 * Persistensi otomatis ke localStorage dengan key: `omnipos_held_carts_${activeBranchId || "default"}`.
 * Format data identik 100% dengan versi sebelumnya untuk mencegah rusaknya data kasir lokal.
 *
 * @param {string|null} activeBranchId - ID cabang aktif
 * @returns {object} {
 *   heldCarts: Array,
 *   setHeldCarts: Function,
 *   holdCart: (currentCart, selectedCustomer, onSuccess) => Promise<void>,
 *   recallCart: (heldItem, currentCartLength, onSuccess) => Promise<void>,
 *   deleteHeldCart: (id) => void,
 *   resetHeldCartsForBranch: (newBranchId) => void
 * }
 */
export function useHoldCart(activeBranchId) {
  const HOLD_CART_KEY = `omnipos_held_carts_${activeBranchId || "default"}`;

  // State antrean tertahan (load awal dari localStorage)
  const [heldCarts, setHeldCarts] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(HOLD_CART_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Sinkronisasi otomatis ke localStorage setiap kali heldCarts berubah
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(HOLD_CART_KEY, JSON.stringify(heldCarts));
    } catch {
      // localStorage diblokir (private browsing)
    }
  }, [heldCarts, HOLD_CART_KEY]);

  // Reset antrean saat cabang berganti
  const resetHeldCartsForBranch = useCallback((newBranchId) => {
    const newKey = `omnipos_held_carts_${newBranchId || "default"}`;
    try {
      setHeldCarts(JSON.parse(localStorage.getItem(newKey) || "[]"));
    } catch {
      setHeldCarts([]);
    }
  }, []);

  /**
   * Tahan pesanan aktif ke antrean (membuka dialog konfirmasi label).
   *
   * @param {Array} currentCart - item keranjang yang sedang aktif
   * @param {object|null} selectedCustomer - customer terpilih
   * @param {Function} [onSuccess] - callback setelah berhasil ditahan (misal: clearCart)
   */
  const holdCart = useCallback(
    async (currentCart = [], selectedCustomer = null, onSuccess) => {
      if (!currentCart || currentCart.length === 0) {
        toast.error("Keranjang kosong, tidak ada yang bisa ditahan.");
        return false;
      }

      const defaultLabel =
        selectedCustomer?.customer?.name || `Antrean ${heldCarts.length + 1}`;
      const result = await promptHoldCart(defaultLabel);
      if (!result.isConfirmed || !result.value) return false;

      const { label, notes } = result.value;
      const heldItem = {
        id: `hold_${Date.now()}`,
        label: label?.trim() || `Antrean ${heldCarts.length + 1}`,
        customerName:
          selectedCustomer?.customer?.name || selectedCustomer?.label || "",
        notes: notes || "",
        heldAt: new Date().toISOString(),
        items: [...currentCart],
      };

      setHeldCarts((prev) => [heldItem, ...prev]);
      onSuccess?.(heldItem);
      toast.success(`Keranjang "${heldItem.label}" berhasil ditahan.`, {
        icon: "⏸️",
      });
      return true;
    },
    [heldCarts.length]
  );

  /**
   * Muat kembali antrean tertahan ke kasir.
   *
   * @param {object} heldItem - antrean yang dipilih untuk dipulihkan
   * @param {number} currentCartLength - jumlah item di keranjang saat ini
   * @param {Function} onSuccess - callback yang menerima items antrean & customer
   */
  const recallCart = useCallback(
    async (heldItem, currentCartLength = 0, onSuccess) => {
      if (!heldItem) return false;

      if (currentCartLength > 0) {
        const result = await confirmRecallCart(heldItem.label);
        if (!result.isConfirmed) return false;
      }

      onSuccess?.(heldItem);
      setHeldCarts((prev) => prev.filter((h) => h.id !== heldItem.id));
      toast.success(`Antrean "${heldItem.label}" dimuat ke kasir.`, {
        icon: "▶️",
      });
      return true;
    },
    []
  );

  /**
   * Hapus antrean tertahan tanpa memuat ke cart.
   *
   * @param {string} id - ID antrean
   */
  const deleteHeldCart = useCallback((id) => {
    setHeldCarts((prev) => prev.filter((h) => h.id !== id));
    toast("Antrean dihapus dari daftar tertahan.", { icon: "🗑️" });
  }, []);

  return {
    heldCarts,
    setHeldCarts,
    holdCart,
    recallCart,
    deleteHeldCart,
    resetHeldCartsForBranch,
  };
}
