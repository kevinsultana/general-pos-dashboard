"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { promptHoldCart, confirmRecallCart } from "../../lib/alerts";

/**
 * useCart – mengelola state keranjang belanja POS.
 *
 * @param {string|null} activeBranchId – ID cabang aktif (dari useAuth)
 *
 * Returns:
 *   cart               – Array<CartItem>
 *   editingNoteKey     – string|null, key item yang sedang diedit catatan
 *   setEditingNoteKey  – setter
 *   selectedCustomer   – objek customer terpilih | null
 *   setSelectedCustomer– setter
 *   activeOrder        – pesanan meja/self-order yang dikaitkan | null
 *   setActiveOrder     – setter
 *   appliedPromo       – promo yang diterapkan | null
 *   setAppliedPromo    – setter
 *   heldCarts          – Array<HeldCart>
 *   addToCart          – (product, variant) => void
 *   updateQty          – (key, delta) => void
 *   updateNotes        – (key, notes) => void
 *   removeItem         – (key) => void
 *   clearCart          – () => void
 *   holdCart           – () => Promise<void>
 *   recallCart         – (heldItem) => Promise<void>
 *   deleteHeldCart     – (id) => void
 *   handleSelectOrder  – (order) => void
 *   handleUnlinkOrder  – () => void
 *   cartSubtotal       – number
 *   cartCount          – number
 *   discountAmount     – number
 *   finalTotal         – number
 */
export function useCart(activeBranchId) {
  const HOLD_CART_KEY = `omnipos_held_carts_${activeBranchId || "default"}`;

  // ── Core cart state ──────────────────────────────────────────────────────────
  const [cart, setCart] = useState([]);
  const [editingNoteKey, setEditingNoteKey] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  // ── Promo state ──────────────────────────────────────────────────────────────
  const [appliedPromo, setAppliedPromo] = useState(null);

  // ── Hold cart state (persisted ke localStorage) ──────────────────────────────
  const [heldCarts, setHeldCarts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HOLD_CART_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Sync heldCarts ke localStorage setiap kali berubah
  useEffect(() => {
    try {
      localStorage.setItem(HOLD_CART_KEY, JSON.stringify(heldCarts));
    } catch {
      // localStorage unavailable (private mode)
    }
  }, [heldCarts, HOLD_CART_KEY]);

  // Reset + reload saat cabang ganti
  const resetForBranch = useCallback((newBranchId) => {
    const newKey = `omnipos_held_carts_${newBranchId || "default"}`;
    setCart([]);
    setSelectedCustomer(null);
    setActiveOrder(null);
    setAppliedPromo(null);
    setEditingNoteKey(null);
    try {
      setHeldCarts(JSON.parse(localStorage.getItem(newKey) || "[]"));
    } catch {
      setHeldCarts([]);
    }
  }, []);

  // ── Cart helpers ─────────────────────────────────────────────────────────────

  /** Tambah item ke cart. Jika varian sudah ada, qty +1. */
  const addToCart = useCallback((product, variant) => {
    const key = variant.id || `${product.id}-${variant.name}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          key,
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          price: parseFloat(variant.price),
          costPrice: parseFloat(variant.costPrice || 0),
          qty: 1,
          notes: "",
        },
      ];
    });
  }, []);

  /** Update qty item. Item dengan qty <= 0 otomatis dihapus. */
  const updateQty = useCallback((key, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }, []);

  /** Update catatan item. */
  const updateNotes = useCallback((key, notes) => {
    setCart((prev) =>
      prev.map((i) => (i.key === key ? { ...i, notes } : i))
    );
  }, []);

  /** Hapus item dari cart. */
  const removeItem = useCallback((key) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }, []);

  /** Kosongkan seluruh cart + reset order & note. */
  const clearCart = useCallback(() => {
    setCart([]);
    setActiveOrder(null);
    setEditingNoteKey(null);
  }, []);

  // ── Hold cart ────────────────────────────────────────────────────────────────

  /** Tahan keranjang aktif ke antrian (membuka dialog SweetAlert2). */
  const holdCart = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong, tidak ada yang bisa ditahan.");
      return;
    }
    const defaultLabel =
      selectedCustomer?.customer?.name || `Antrean ${heldCarts.length + 1}`;
    const result = await promptHoldCart(defaultLabel);
    if (!result.isConfirmed || !result.value) return;

    const { label, notes } = result.value;
    const heldItem = {
      id: `hold_${Date.now()}`,
      label: label.trim() || `Antrean ${heldCarts.length + 1}`,
      customerName:
        selectedCustomer?.customer?.name || selectedCustomer?.label || "",
      notes: notes || "",
      heldAt: new Date().toISOString(),
      items: [...cart],
    };
    setHeldCarts((prev) => [heldItem, ...prev]);
    clearCart();
    setAppliedPromo(null);
    toast.success(`Keranjang "${heldItem.label}" berhasil ditahan.`, {
      icon: "⏸️",
    });
  }, [cart, selectedCustomer, heldCarts.length, clearCart]);

  /** Muat kembali antrean tertahan ke kasir. */
  const recallCart = useCallback(
    async (heldItem) => {
      if (cart.length > 0) {
        const result = await confirmRecallCart(heldItem.label);
        if (!result.isConfirmed) return;
      }
      setCart(heldItem.items);
      setAppliedPromo(null);
      if (heldItem.customerName) {
        setSelectedCustomer({
          value: null,
          label: heldItem.customerName,
          customer: { id: null, name: heldItem.customerName, phone: null },
        });
      } else {
        setSelectedCustomer(null);
      }
      setActiveOrder(null);
      setHeldCarts((prev) => prev.filter((h) => h.id !== heldItem.id));
      toast.success(`Antrean "${heldItem.label}" dimuat ke kasir.`, {
        icon: "▶️",
      });
    },
    [cart.length]
  );

  /** Hapus antrean tertahan tanpa memuat ke cart. */
  const deleteHeldCart = useCallback((id) => {
    setHeldCarts((prev) => prev.filter((h) => h.id !== id));
    toast("Antrean dihapus dari daftar tertahan.", { icon: "🗑️" });
  }, []);

  // ── Order (self-order / QR meja) ─────────────────────────────────────────────

  /** Muat pesanan masuk (dari scanner / antrean) ke keranjang. */
  const handleSelectOrder = useCallback((order) => {
    if (!order) return;
    setActiveOrder(order);

    const newCart = (order.items || []).map((item, idx) => {
      const vId =
        item.productVariantId ||
        item.variantId ||
        item.id ||
        `order-item-${idx}`;
      return {
        key: vId,
        variantId: item.productVariantId || item.variantId || item.id,
        productName: item.productName,
        variantName: item.variantName,
        price: parseFloat(item.price),
        costPrice: parseFloat(item.costPrice || 0),
        qty: item.quantity,
        notes: item.notes || "",
      };
    });
    setCart(newCart);

    // Set customer otomatis
    const custData =
      order.customer ||
      (order.customerId
        ? {
            id: order.customerId,
            name: order.customerName,
            phone: order.customerPhone || "",
          }
        : null);

    if (custData) {
      setSelectedCustomer({
        value: custData.id,
        label: `${custData.name} ${custData.phone ? `(${custData.phone})` : ""}`,
        customer: custData,
      });
      toast.success(
        `Pelanggan terdaftar: ${custData.name} (${custData.phone || "No HP terhubung"})`,
        { icon: "✅", duration: 4000 }
      );
    } else if (order.customerName) {
      setSelectedCustomer({
        value: null,
        label: `${order.customerName} ${order.customerPhone ? `(${order.customerPhone})` : ""}`,
        customer: {
          id: null,
          name: order.customerName,
          phone: order.customerPhone || null,
        },
      });
      toast.success(
        `Pesanan #${order.orderNumber} dimuat untuk ${order.customerName}`,
        { icon: "📋", duration: 3000 }
      );
    }
  }, []);

  /** Lepas kaitan pesanan dari keranjang. */
  const handleUnlinkOrder = useCallback(() => {
    setActiveOrder(null);
    toast("Kaitan pesanan dilepas dari keranjang.", { icon: "ℹ️" });
  }, []);

  // ── Computed values ──────────────────────────────────────────────────────────
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const discountAmount = (() => {
    if (!appliedPromo) return 0;
    let eligibleSubtotal = cartSubtotal;
    if (
      appliedPromo.scope === "PRODUCT" &&
      Array.isArray(appliedPromo.scopeVariantIds) &&
      appliedPromo.scopeVariantIds.length > 0
    ) {
      eligibleSubtotal = cart
        .filter(
          (it) =>
            appliedPromo.scopeVariantIds.includes(it.variantId) ||
            appliedPromo.scopeVariantIds.includes(it.productId)
        )
        .reduce(
          (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1),
          0
        );
    }
    if (appliedPromo.discountType === "PERCENTAGE") {
      const raw = (eligibleSubtotal * appliedPromo.discountValue) / 100;
      return appliedPromo.maxDiscount
        ? Math.min(raw, appliedPromo.maxDiscount)
        : raw;
    }
    if (appliedPromo.discountType === "FIXED") {
      return Math.min(appliedPromo.discountValue, eligibleSubtotal);
    }
    return Number(appliedPromo.estimatedSavings) || 0;
  })();

  const finalTotal = Math.max(0, cartSubtotal - discountAmount);

  return {
    // State
    cart,
    editingNoteKey,
    setEditingNoteKey,
    selectedCustomer,
    setSelectedCustomer,
    activeOrder,
    setActiveOrder,
    appliedPromo,
    setAppliedPromo,
    heldCarts,
    // Actions
    addToCart,
    updateQty,
    updateNotes,
    removeItem,
    clearCart,
    holdCart,
    recallCart,
    deleteHeldCart,
    handleSelectOrder,
    handleUnlinkOrder,
    resetForBranch,
    // Computed
    cartSubtotal,
    cartCount,
    discountAmount,
    finalTotal,
  };
}
