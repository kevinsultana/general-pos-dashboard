"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useHoldCart } from "./useHoldCart";

/**
 * useCart – Mengelola state keranjang belanja kasir POS, kuantitas item, catatan, kaitan pesanan, dan kalkulasi diskon promo.
 *
 * Menggunakan useHoldCart untuk persistensi antrean pesanan tertahan ke localStorage.
 * Seluruh rumus matematika (subtotal, diskon tipe PERCENTAGE/FIXED/scope, finalTotal) 100% identik dan zero-regression.
 *
 * @param {string|null} activeBranchId – ID cabang aktif (dari useAuth)
 * @returns {object}
 */
export function useCart(activeBranchId) {
  // ── Sub-hook: Antrean tertahan (Hold Cart) ──────────────────────────────────
  const {
    heldCarts,
    setHeldCarts,
    holdCart: holdCartFn,
    recallCart: recallCartFn,
    deleteHeldCart,
    resetHeldCartsForBranch,
  } = useHoldCart(activeBranchId);

  // ── Core cart state ──────────────────────────────────────────────────────────
  const [cart, setCart] = useState([]);
  const [editingNoteKey, setEditingNoteKey] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  // ── Promo state ──────────────────────────────────────────────────────────────
  const [appliedPromo, setAppliedPromo] = useState(null);

  // ── Reset cart saat cabang berganti ──────────────────────────────────────────
  const resetForBranch = useCallback(
    (newBranchId) => {
      setCart([]);
      setSelectedCustomer(null);
      setActiveOrder(null);
      setAppliedPromo(null);
      setEditingNoteKey(null);
      resetHeldCartsForBranch(newBranchId);
    },
    [resetHeldCartsForBranch]
  );

  // ── Cart mutations ───────────────────────────────────────────────────────────

  /** Tambah item ke cart. Jika varian sudah ada di keranjang, kuantitas +1. */
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

  /** Update qty item. Item dengan qty <= 0 otomatis dihapus dari keranjang. */
  const updateQty = useCallback((key, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }, []);

  /** Update catatan khusus pada item tertentu. */
  const updateNotes = useCallback((key, notes) => {
    setCart((prev) =>
      prev.map((i) => (i.key === key ? { ...i, notes } : i))
    );
  }, []);

  /** Hapus satu item dari keranjang. */
  const removeItem = useCallback((key) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }, []);

  /** Kosongkan seluruh isi keranjang belanja. */
  const clearCart = useCallback(() => {
    setCart([]);
    setActiveOrder(null);
    setEditingNoteKey(null);
  }, []);

  // ── Hold & Recall Cart Bridge ────────────────────────────────────────────────

  /** Tahan pesanan aktif ke daftar antrean. */
  const holdCart = useCallback(async () => {
    return holdCartFn(cart, selectedCustomer, () => {
      clearCart();
      setAppliedPromo(null);
    });
  }, [cart, selectedCustomer, holdCartFn, clearCart]);

  /** Muat kembali pesanan dari antrean tertahan ke keranjang aktif. */
  const recallCart = useCallback(
    async (heldItem) => {
      return recallCartFn(heldItem, cart.length, (item) => {
        setCart(item.items || []);
        setAppliedPromo(null);
        if (item.customerName) {
          setSelectedCustomer({
            value: null,
            label: item.customerName,
            customer: { id: null, name: item.customerName, phone: null },
          });
        } else {
          setSelectedCustomer(null);
        }
        setActiveOrder(null);
      });
    },
    [cart.length, recallCartFn]
  );

  // ── Order Kaitan (Self-Order / QR Meja) ───────────────────────────────────────

  /** Muat pesanan masuk dari QR self-order ke keranjang kasir. */
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

    // Otomatis tentukan customer dari order
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

  /** Lepas kaitan pesanan dari keranjang kasir. */
  const handleUnlinkOrder = useCallback(() => {
    setActiveOrder(null);
    toast("Kaitan pesanan dilepas dari keranjang.", { icon: "ℹ️" });
  }, []);

  // ── Kalkulasi Matematika Keranjang (100% Identik & Zero Regression) ──────────
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const discountAmount = (() => {
    if (!appliedPromo) return 0;
    let eligibleSubtotal = cartSubtotal;

    // Scope produk spesifik
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
    setCart,
    editingNoteKey,
    setEditingNoteKey,
    selectedCustomer,
    setSelectedCustomer,
    activeOrder,
    setActiveOrder,
    appliedPromo,
    setAppliedPromo,
    heldCarts,
    setHeldCarts,
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
