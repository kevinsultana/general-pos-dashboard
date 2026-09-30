'use client';

import { useState, useCallback } from 'react';
import { Product, ProductVariant, Customer } from '../types';

export interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  total: number;
  stock: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT' | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const addToCart = useCallback((product: Product, variant?: ProductVariant | null) => {
    const effectiveId = variant ? variant.id : product.id;
    const unitPrice = variant ? variant.sellingPrice : product.sellingPrice;
    const stock = variant ? variant.stock : product.stock;
    const itemName = variant ? `${product.name} (${variant.name})` : product.name;
    const itemSku = variant ? variant.sku || product.sku : product.sku;
    const itemBarcode = variant ? variant.barcode || product.barcode : product.barcode;

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.productId === product.id && (variant ? it.variantId === variant.id : !it.variantId)
      );

      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        if (existing.quantity >= stock) {
          return prev; // stock cap reached
        }
        const updated = [...prev];
        const newQty = existing.quantity + 1;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          subtotal: newQty * existing.unitPrice,
          total: newQty * existing.unitPrice,
        };
        return updated;
      }

      if (stock <= 0) return prev; // Cannot add out of stock

      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant?.id || null,
          name: itemName,
          sku: itemSku,
          barcode: itemBarcode,
          unitPrice,
          quantity: 1,
          subtotal: unitPrice,
          total: unitPrice,
          stock,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string | null | undefined, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter(
          (it) => !(it.productId === productId && (variantId ? it.variantId === variantId : !it.variantId))
        );
      }
      return prev.map((it) => {
        if (it.productId === productId && (variantId ? it.variantId === variantId : !it.variantId)) {
          const finalQty = Math.min(quantity, it.stock);
          return {
            ...it,
            quantity: finalQty,
            subtotal: finalQty * it.unitPrice,
            total: finalQty * it.unitPrice,
          };
        }
        return it;
      });
    });
  }, []);

  const removeFromCart = useCallback((productId: string, variantId?: string | null) => {
    setItems((prev) =>
      prev.filter((it) => !(it.productId === productId && (variantId ? it.variantId === variantId : !it.variantId)))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCustomer(null);
    setDiscountType(null);
    setDiscountValue(0);
    setNotes('');
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  let discountTotal = 0;
  if (discountType === 'PERCENTAGE' && discountValue > 0) {
    discountTotal = Math.round((subtotal * Math.min(100, discountValue)) / 100);
  } else if (discountType === 'FIXED_AMOUNT' && discountValue > 0) {
    discountTotal = Math.min(subtotal, discountValue);
  }

  const total = Math.max(0, subtotal - discountTotal);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    customer,
    discountType,
    discountValue,
    notes,
    subtotal,
    discountTotal,
    total,
    totalItemCount,
    setCustomer,
    setDiscountType,
    setDiscountValue,
    setNotes,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}
