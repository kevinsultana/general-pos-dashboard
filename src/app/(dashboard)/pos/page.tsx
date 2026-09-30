'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { Product, Category, Customer } from '../../../types';
import { useCart } from '../../../hooks/useCart';
import { ProductCatalogGrid } from './components/ProductCatalogGrid';
import { CartPanel } from './components/CartPanel';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptPrintModal } from './components/ReceiptPrintModal';

export default function PosPage() {
  const { store } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);

  const cart = useCart();

  useEffect(() => {
    async function loadPosData() {
      try {
        setIsLoading(true);
        const [prodRes, catRes, custRes] = await Promise.all([
          api.getProducts(),
          api.getCategories(),
          api.getCustomers(),
        ]);
        setProducts(prodRes || []);
        setCategories(catRes || []);
        setCustomers(custRes || []);
      } catch (err) {
        console.error('Failed to load POS data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPosData();
  }, []);

  const handleTransactionSuccess = (trx: any) => {
    setIsCheckoutOpen(false);
    setCompletedTransaction(trx);
    // Reload catalog to update stock numbers
    api.getProducts().then((res) => setProducts(res || [])).catch(() => {});
  };

  const handleNewTransaction = () => {
    setCompletedTransaction(null);
    cart.clearCart();
  };

  return (
    <div className="flex-1 flex h-screen overflow-hidden">
      {/* Catalog & Search */}
      <ProductCatalogGrid
        products={products}
        categories={categories}
        isLoading={isLoading}
        onSelectProduct={(product, variant) => cart.addToCart(product, variant)}
      />

      {/* Cart & Order Panel */}
      <CartPanel
        items={cart.items}
        customer={cart.customer}
        customers={customers}
        discountType={cart.discountType}
        discountValue={cart.discountValue}
        subtotal={cart.subtotal}
        discountTotal={cart.discountTotal}
        total={cart.total}
        totalItemCount={cart.totalItemCount}
        onSetCustomer={cart.setCustomer}
        onSetDiscount={(type, val) => {
          cart.setDiscountType(type);
          cart.setDiscountValue(val);
        }}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeFromCart}
        onClearCart={cart.clearCart}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <PaymentModal
        isOpen={isCheckoutOpen}
        total={cart.total}
        subtotal={cart.subtotal}
        discountTotal={cart.discountTotal}
        items={cart.items}
        customer={cart.customer}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleTransactionSuccess}
      />

      {/* Thermal Receipt Print Modal */}
      <ReceiptPrintModal
        isOpen={!!completedTransaction}
        transaction={completedTransaction}
        storeName={store?.name}
        storeAddress={store?.address}
        storePhone={store?.phone}
        onNewTransaction={handleNewTransaction}
      />
    </div>
  );
}
