'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  CheckCircle2,
  Printer,
  User,
  Users,
  Calendar,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Receipt,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Tunai (Cash)', icon: Banknote },
  { id: 'QRIS', label: 'QRIS', icon: QrCode },
  { id: 'TRANSFER', label: 'Transfer', icon: Building },
  { id: 'DEBIT', label: 'Debit', icon: CreditCard },
];

export default function PaymentModal({
  isOpen,
  onClose,
  cart = [],
  totals = { subtotal: 0, discount: 0, tax: 0, grandTotal: 0 },
  tableNumber = '',
  orderType = 'DIRECT',
  businessConfig = {},
  tenant = {},
  user = {},
  onSuccess,
}) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Kasbon / Pelanggan State
  const [isDebt, setIsDebt] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerList, setCustomerList] = useState([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Receipt Settings State
  const [receiptSettings, setReceiptSettings] = useState({
    paperSize: '58mm',
    headerText: '',
    footerText: 'Terima kasih atas kunjungan Anda!',
    showCashierName: true,
    showCustomerName: true,
    showTableNumber: true,
  });

  // Flow State: 'input' | 'success'
  const [step, setStep] = useState('input');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const receiptPrintRef = useRef(null);

  // Load customer search
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsSearchingCustomer(true);
      try {
        const res = await api.get('/customers', {
          params: { limit: 10, search: customerSearch.trim() || undefined },
        });
        if (res.data?.success) {
          setCustomerList(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        setIsSearchingCustomer(false);
      }
    };

    if (isOpen) {
      fetchCustomers();
    }
  }, [customerSearch, isOpen]);

  // Load receipt settings
  useEffect(() => {
    const fetchReceiptSettings = async () => {
      try {
        const res = await api.get('/receipt-settings');
        if (res.data?.success && res.data?.data) {
          setReceiptSettings((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        console.error('Failed to load receipt settings:', err);
      }
    };
    if (isOpen) {
      fetchReceiptSettings();
    }
  }, [isOpen]);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setCompletedOrder(null);
      setPaymentMethod('CASH');
      setPaidAmount(totals.grandTotal.toString());
      setIsDebt(false);
      setDueDate('');
      setSelectedCustomer(null);
      setCustomerSearch('');
      setNotes('');
    }
  }, [isOpen, totals.grandTotal]);

  if (!isOpen) return null;

  const grandTotal = totals.grandTotal || 0;
  const numPaid = parseInt(paidAmount, 10) || 0;
  const change = Math.max(0, numPaid - grandTotal);
  const remainingDebt = Math.max(0, grandTotal - numPaid);

  const handleQuickAmount = (val) => {
    if (val === 'PAS') {
      setPaidAmount(grandTotal.toString());
    } else {
      setPaidAmount(val.toString());
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (isDebt && !selectedCustomer) {
      toast.error('Pilih pelanggan terdaftar untuk transaksi Kasbon.');
      return;
    }

    if (!isDebt && paymentMethod === 'CASH' && numPaid < grandTotal) {
      toast.error('Uang tunai yang dibayarkan kurang dari total pesanan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        orderType,
        tableNumber: tableNumber?.trim() || null,
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || null,
        isDebt,
        dueDate: isDebt && dueDate ? dueDate : null,
        paymentMethod,
        paidAmount: isDebt ? numPaid : paymentMethod === 'CASH' ? numPaid : grandTotal,
        discount: totals.discount || 0,
        tax: totals.tax || 0,
        notes: notes.trim() || null,
        items: cart.map((item) => ({
          productId: item.id,
          variantId: item.variantId || null,
          unitId: item.unitId || null,
          quantity: item.quantity,
          selectedModifiers: item.selectedModifiers || [],
        })),
      };

      const res = await api.post('/orders', payload);
      if (res.data?.success) {
        setCompletedOrder(res.data.data);
        setStep('success');
        toast.success('Transaksi penjualan berhasil diproses!');
        onSuccess?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Gagal memproses transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (window) {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden text-slate-800">
        {/* STEP 1: INPUT PEMBAYARAN */}
        {step === 'input' && (
          <>
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-linear-to-r from-amber-500/10 to-transparent shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Proses Pembayaran Kasir</h3>
                  <p className="text-xs text-slate-500">
                    Pilih metode bayar atau gunakan opsi Kasbon Pelanggan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitOrder} className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
              {/* Grand Total Display */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                    Total Tagihan Pesanan
                  </span>
                  <span className="text-2xl font-black text-amber-950">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right text-xs text-amber-800">
                  <p className="font-semibold">{cart.length} Jenis Item</p>
                  {tableNumber && <p className="font-bold">Meja: {tableNumber}</p>}
                </div>
              </div>

              {/* Pelanggan CRM & Opsi Kasbon */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pelanggan (Member / Kasbon)</span>
                  </label>

                  {/* Toggle Kasbon (Jika diizinkan di config) */}
                  {businessConfig?.enableCustomerDebt !== false && (
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-xs font-bold text-rose-700">Kasbon / Bayar Nanti</span>
                      <input
                        type="checkbox"
                        checked={isDebt}
                        onChange={(e) => {
                          setIsDebt(e.target.checked);
                          if (e.target.checked && numPaid >= grandTotal) {
                            setPaidAmount('0');
                          }
                        }}
                        className="w-4 h-4 text-rose-600 rounded-md focus:ring-rose-500"
                      />
                    </label>
                  )}
                </div>

                {/* Pilih / Cari Pelanggan */}
                <div className="space-y-2">
                  {selectedCustomer ? (
                    <div className="p-3 rounded-xl bg-white border border-amber-300 shadow-2xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                          {(selectedCustomer.name || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{selectedCustomer.name}</p>
                          <p className="text-[10px] text-slate-500">{selectedCustomer.phone || 'Tanpa no. telepon'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700"
                      >
                        Ganti
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="Cari pelanggan berdasarkan nama / no. HP..."
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      {customerList.length > 0 && (
                        <div className="mt-1.5 max-h-32 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 shadow-xs">
                          {customerList.map((cust) => (
                            <div
                              key={cust.id}
                              onClick={() => setSelectedCustomer(cust)}
                              className="p-2 hover:bg-amber-50/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                            >
                              <span className="font-bold text-slate-800">{cust.name}</span>
                              <span className="text-[10px] text-slate-500">{cust.phone || '-'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {isDebt && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Uang Muka / DP (Rp)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={grandTotal}
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Tanggal Jatuh Tempo
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Metode Pembayaran (Jika bukan kasbon penuh) */}
              {(!isDebt || numPaid > 0) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Metode Pembayaran {isDebt ? 'Uang Muka (DP)' : ''}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map((m) => {
                      const Icon = m.icon;
                      const isSelected = paymentMethod === m.id;

                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500/20 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Input Nominal Pembayaran Tunai & Quick Buttons */}
              {!isDebt && paymentMethod === 'CASH' && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Uang Diterima Kasir (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-base font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Tombol Cepat Uang */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAmount('PAS')}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Uang Pas (Rp {grandTotal.toLocaleString('id-ID')})
                    </button>
                    {[20000, 50000, 100000, 200000, 500000]
                      .filter((val) => val >= grandTotal || val >= 50000)
                      .slice(0, 4)
                      .map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleQuickAmount(val)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {val.toLocaleString('id-ID')}
                        </button>
                      ))}
                  </div>

                  {/* Info Kembalian */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800">Kembalian Kasir:</span>
                    <span className="text-base font-black text-emerald-700">
                      Rp {change.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Info Kasbon Sisa */}
              {isDebt && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-800">Sisa Kasbon Pelanggan:</span>
                  <span className="text-base font-black text-rose-700">
                    Rp {remainingDebt.toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses...' : 'Selesaikan Transaksi'}</span>
                </button>
              </div>
            </form>
          </>
        )}

        {/* STEP 2: SUKSES & CETAK STRUK */}
        {step === 'success' && completedOrder && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Transaksi Berhasil!</h3>
              <p className="text-xs font-mono font-bold text-amber-700">{completedOrder.orderNo}</p>
              <p className="text-xs text-slate-500">
                Total:{' '}
                <strong className="text-slate-900">
                  Rp {completedOrder.grandTotal.toLocaleString('id-ID')}
                </strong>
                {completedOrder.changeAmount > 0 && (
                  <span>
                    {' '}
                    • Kembalian:{' '}
                    <strong className="text-emerald-700">
                      Rp {completedOrder.changeAmount.toLocaleString('id-ID')}
                    </strong>
                  </span>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Cetak Struk ({receiptSettings.paperSize || '58mm'})</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Transaksi Baru</span>
              </button>
            </div>
          </div>
        )}

        {/* PRINTABLE THERMAL RECEIPT (Rendered on window.print()) */}
        {completedOrder && (
          <div
            ref={receiptPrintRef}
            className={`hidden print:block text-slate-950 font-mono text-[10px] leading-tight p-4 bg-white ${
              receiptSettings.paperSize === '80mm' ? 'w-[80mm]' : 'w-[58mm]'
            }`}
          >
            {/* Header Toko */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
              <p className="font-black text-xs uppercase">{tenant?.name || 'OMNI POS'}</p>
              {receiptSettings.headerText && <p className="text-[9px]">{receiptSettings.headerText}</p>}
            </div>

            {/* Meta Order */}
            <div className="py-2 space-y-0.5 border-b border-dashed border-slate-400 text-[9px]">
              <div className="flex justify-between">
                <span>No: {completedOrder.orderNo}</span>
                <span>
                  {new Date().toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {receiptSettings.showCashierName && (
                <div>Kasir: {user?.name || 'Kasir'}</div>
              )}
              {receiptSettings.showCustomerName && completedOrder.customerName && (
                <div>Pelanggan: {completedOrder.customerName}</div>
              )}
              {receiptSettings.showTableNumber && completedOrder.tableNumber && (
                <div>Meja: {completedOrder.tableNumber}</div>
              )}
            </div>

            {/* Items */}
            <div className="py-2 space-y-1 border-b border-dashed border-slate-400">
              {completedOrder.items?.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold">
                    <span>
                      {item.quantity}x {item.product?.name || item.productName || 'Item'}
                    </span>
                    <span>{(item.subtotal || 0).toLocaleString('id-ID')}</span>
                  </div>
                  {item.variantName && (
                    <div className="text-[8px] pl-2 text-slate-600">[{item.variantName}]</div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2 space-y-0.5 border-b border-dashed border-slate-400 text-[9px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{(completedOrder.subtotal || 0).toLocaleString('id-ID')}</span>
              </div>
              {completedOrder.discount > 0 && (
                <div className="flex justify-between">
                  <span>Diskon:</span>
                  <span>-{(completedOrder.discount || 0).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-[10px] pt-1">
                <span>TOTAL:</span>
                <span>Rp {(completedOrder.grandTotal || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span>Bayar ({completedOrder.paymentMethod}):</span>
                <span>{(completedOrder.paidAmount || 0).toLocaleString('id-ID')}</span>
              </div>
              {completedOrder.changeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Kembali:</span>
                  <span>{(completedOrder.changeAmount || 0).toLocaleString('id-ID')}</span>
                </div>
              )}
              {completedOrder.remainingDebt > 0 && (
                <div className="flex justify-between font-bold text-rose-700">
                  <span>Sisa Kasbon:</span>
                  <span>{(completedOrder.remainingDebt || 0).toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 text-center text-[8px] whitespace-pre-line">
              {receiptSettings.footerText || 'Terima kasih atas kunjungan Anda!'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
