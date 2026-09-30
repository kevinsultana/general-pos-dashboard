import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  sku?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  total: number;
  stock: number;
}

function calculateCartTotals(
  items: CartItem[],
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | null,
  discountValue: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  let discountTotal = 0;
  if (discountType === 'PERCENTAGE') {
    discountTotal = Math.round((subtotal * Math.min(100, discountValue)) / 100);
  } else if (discountType === 'FIXED_AMOUNT') {
    discountTotal = Math.min(subtotal, discountValue);
  }
  const total = Math.max(0, subtotal - discountTotal);
  return { subtotal, discountTotal, total };
}

describe('useCart calculation logic', () => {
  it('correctly calculates subtotal and totals with fixed discount', () => {
    const items: CartItem[] = [
      { productId: 'p1', name: 'Kopi', unitPrice: 15000, quantity: 2, subtotal: 30000, total: 30000, stock: 10 },
      { productId: 'p2', name: 'Roti', unitPrice: 10000, quantity: 1, subtotal: 10000, total: 10000, stock: 5 },
    ];
    const { subtotal, discountTotal, total } = calculateCartTotals(items, 'FIXED_AMOUNT', 5000);
    assert.equal(subtotal, 40000);
    assert.equal(discountTotal, 5000);
    assert.equal(total, 35000);
  });

  it('correctly calculates subtotal and totals with percentage discount', () => {
    const items: CartItem[] = [
      { productId: 'p1', name: 'Kopi', unitPrice: 20000, quantity: 1, subtotal: 20000, total: 20000, stock: 10 },
    ];
    const { subtotal, discountTotal, total } = calculateCartTotals(items, 'PERCENTAGE', 10);
    assert.equal(subtotal, 20000);
    assert.equal(discountTotal, 2000);
    assert.equal(total, 18000);
  });

  it('prevents discount from making total negative', () => {
    const items: CartItem[] = [
      { productId: 'p1', name: 'Kopi', unitPrice: 10000, quantity: 1, subtotal: 10000, total: 10000, stock: 5 },
    ];
    const { subtotal, discountTotal, total } = calculateCartTotals(items, 'FIXED_AMOUNT', 15000);
    assert.equal(subtotal, 10000);
    assert.equal(discountTotal, 10000);
    assert.equal(total, 0);
  });
});
