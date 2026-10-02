'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Printer,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Power,
} from 'lucide-react';
import { useBluetooth, BLE_PROFILES, buildReceiptBytes } from '@/contexts/BluetoothPrinterContext';
import { cn } from '@/lib/utils';

/**
 * Modal Koneksi Cepat & Uji Coba Printer Bluetooth (Web Bluetooth BLE)
 */
export default function BluetoothModal({
  isOpen,
  onClose,
  userName = 'Kasir',
  storeInfo = null,
  onConnectedContinue,
  continueButtonText = 'Lanjutkan & Cetak Struk',
}) {
  const {
    btStatus,
    btDeviceName,
    btServiceUuid,
    setBtServiceUuid,
    btErrorMsg,
    isConnected,
    isReconnecting,
    connect,
    disconnect,
    printBytes,
  } = useBluetooth();

  const [isTestPrinting, setIsTestPrinting] = useState(false);

  if (!isOpen) return null;

  const handleTestPrint = async () => {
    if (!isConnected) {
      toast.error('Printer belum terhubung.');
      return;
    }
    setIsTestPrinting(true);
    const toastId = toast.loading('Mengirim data struk uji coba ke printer...');
    try {
      const testOrder = {
        receiptNumber: 'TEST-001',
        createdAt: new Date().toISOString(),
        customerName: 'Uji Coba Printer',
        cashierName: userName || 'Kasir',
        orderType: 'DINE_IN',
        items: [
          {
            productName: 'KONEKSI BLUETOOTH BLE',
            variantName: 'Standar',
            quantity: 1,
            price: 0,
            subtotal: 0,
            notes: 'Thermal test OK',
          },
        ],
        totalAmount: 0,
        paymentMethod: 'CASH',
        cashReceived: 0,
        changeAmount: 0,
      };
      const activeStore = storeInfo || { name: 'OMNI POS', printerWidth: 58, address: 'Cabang Utama' };
      const bytes = await buildReceiptBytes(testOrder, activeStore, 'CUSTOMER');
      await printBytes(bytes);
      toast.success('Struk percobaan berhasil dicetak!', { id: toastId });
    } catch (err) {
      toast.error('Gagal mencetak: ' + (err.message || 'Cek koneksi Bluetooth.'), { id: toastId });
    } finally {
      setIsTestPrinting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Printer className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Koneksi Thermal Printer</h3>
              <p className="text-[11px] text-slate-500 font-medium">Web Bluetooth API (BLE Direct Print)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifikasi jika dibuka dari alur checkout */}
        {onConnectedContinue && !isConnected && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Printer Belum Terhubung</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Hubungkan printer thermal Bluetooth Anda sekarang agar struk transaksi dapat langsung dicetak.
            </p>
          </div>
        )}

        {/* Status Card */}
        <div
          className={cn(
            'p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors',
            isConnected
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : isReconnecting
              ? 'bg-amber-50/80 border-amber-200 text-amber-800'
              : btStatus === 'connecting'
              ? 'bg-blue-50/80 border-blue-200 text-blue-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {isConnected ? (
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            ) : isReconnecting ? (
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            ) : btStatus === 'connecting' ? (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            ) : (
              <span className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 truncate">
                {isConnected
                  ? btDeviceName || 'Printer Terhubung'
                  : isReconnecting
                  ? 'Reconnecting otomatis...'
                  : btStatus === 'connecting'
                  ? 'Sedang mencari printer...'
                  : 'Printer Belum Terhubung'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isConnected
                  ? 'Siap digunakan untuk cetak struk kasir'
                  : 'Klik tombol di bawah untuk memilih printer Bluetooth'}
              </p>
            </div>
          </div>

          {isConnected && (
            <button
              type="button"
              onClick={disconnect}
              className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Putus</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {(btStatus === 'error' || btStatus === 'unsupported') && btErrorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{btErrorMsg}</span>
          </div>
        )}

        {/* Action Button: Scan & Connect */}
        {!isConnected && (
          <button
            type="button"
            onClick={connect}
            disabled={btStatus === 'connecting' || isReconnecting}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {btStatus === 'connecting' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Printer className="w-4 h-4 text-amber-400" />
            )}
            <span>Scan &amp; Hubungkan Printer Bluetooth</span>
          </button>
        )}

        {/* Tombol Lanjut saat sudah terhubung (Checkout Mode) */}
        {isConnected && onConnectedContinue && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onConnectedContinue();
            }}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{continueButtonText}</span>
          </button>
        )}

        {/* Test Print (jika terhubung) */}
        {isConnected && (
          <button
            type="button"
            onClick={handleTestPrint}
            disabled={isTestPrinting}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isTestPrinting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mencetak Struk Percobaan...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Cetak Struk Test Percobaan</span>
              </>
            )}
          </button>
        )}

        {/* Pilihan Bluetooth Profile (Advanced) */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sliders className="w-3 h-3 text-slate-400" />
            <span>Profile UUID Printer</span>
          </label>
          <select
            value={btServiceUuid}
            onChange={(e) => setBtServiceUuid(e.target.value)}
            disabled={isConnected || btStatus === 'connecting'}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-amber-400 transition-colors disabled:opacity-60"
          >
            {BLE_PROFILES.map((p) => (
              <option key={p.serviceUuid} value={p.serviceUuid}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 leading-tight">
            Pilih Auto-Detect untuk sebagian besar printer (Zjiang, GOOJPRT, Panda, RONGTA).
          </p>
        </div>
      </div>
    </div>
  );
}
