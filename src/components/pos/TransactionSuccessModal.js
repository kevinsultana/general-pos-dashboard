"use client";

import {
  CheckCircle2,
  Printer,
  UtensilsCrossed,
  FileText,
  ArrowRight,
  X,
  RefreshCw,
  Barcode,
  UserCheck,
} from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";

/**
 * Modal Transaksi Berhasil & Cetak Struk / Tiket Dapur
 */
export default function TransactionSuccessModal({
  isOpen,
  onClose,
  orderData,
  storeInfo = {},
  onPrintBluetooth,
  onPrintBrowser,
  isPrinting = false,
  isConnected = false,
  onOpenBluetoothModal,
}) {
  if (!isOpen || !orderData) return null;

  const total = Number(orderData.totalAmount || 0);
  const isCash = orderData.paymentMethod === "CASH";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header Success */}
        <div className="relative text-center pt-2">
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-1 right-0 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-900">
            Transaksi Berhasil!
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            No. Struk:{" "}
            <span className="text-slate-800 font-mono font-bold">
              {orderData.receiptNumber}
            </span>
          </p>
        </div>

        {/* Ringkasan Finansial */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">
              Total Pembayaran
            </span>
            <span className="text-base font-black text-emerald-700">
              {formatRupiah(total)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Metode Bayar</span>
            <span className="font-extrabold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
              {orderData.paymentMethod}
            </span>
          </div>

          {isCash && (
            <>
              <div className="flex items-center justify-between text-slate-600">
                <span>Uang Diterima</span>
                <span className="font-bold">
                  {formatRupiah(orderData.cashReceived || total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-800 font-black">
                <span>Kembalian</span>
                <span className="text-amber-700 font-black text-sm">
                  {formatRupiah(orderData.changeAmount || 0)}
                </span>
              </div>
            </>
          )}

          {orderData.tableNumber && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-amber-800 font-bold">
              <span>Nomor Meja</span>
              <span className="bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                <Barcode className="w-3 h-3 text-amber-700" />
                Meja {orderData.tableNumber}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[11px]">
            <span>{orderData.items?.length || 0} Menu Dipesan</span>
            <span className="flex items-center gap-1 font-semibold text-slate-700 truncate max-w-45">
              <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              {orderData.customerName || "Pelanggan Umum"}
            </span>
          </div>
        </div>

        {/* Status Printer Bluetooth */}
        <div
          className={cn(
            "p-3 rounded-2xl border flex items-center justify-between text-xs transition-colors",
            isConnected
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
              : "bg-slate-50 border-slate-200 text-slate-700",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-300",
              )}
            />
            <span className="font-bold truncate">
              {isConnected
                ? "Printer Bluetooth Terhubung"
                : "Printer Bluetooth Belum Terhubung"}
            </span>
          </div>
          {!isConnected && (
            <button
              type="button"
              onClick={onOpenBluetoothModal}
              className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 underline shrink-0 cursor-pointer"
            >
              Hubungkan
            </button>
          )}
        </div>

        {/* Tombol Cetak Dual Mode */}
        <div className="space-y-2 pt-1">
          {/* Tombol Cetak Struk Pelanggan */}
          <button
            type="button"
            onClick={() => onPrintBluetooth(orderData, "CUSTOMER")}
            disabled={isPrinting}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isPrinting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Printer className="w-4 h-4 text-amber-400" />
            )}
            <span>Cetak Struk Pelanggan (Thermal)</span>
          </button>

          {/* Tombol Cetak Tiket Dapur */}
          <button
            type="button"
            onClick={() => onPrintBluetooth(orderData, "KITCHEN")}
            disabled={isPrinting}
            className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-700" />
            <span>Cetak Tiket Dapur (Tanpa Harga)</span>
          </button>

          {/* Opsi Cetak via Browser (@media print) */}
          <div className="flex items-center justify-center gap-2 pt-1 text-center">
            <span className="text-[11px] text-slate-400">
              Atau cetak via Browser/USB:
            </span>
            <button
              type="button"
              onClick={() => onPrintBrowser(orderData, "CUSTOMER")}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline flex items-center gap-0.5 cursor-pointer"
            >
              <FileText className="w-3 h-3 text-slate-400" />
              <span>Struk</span>
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={() => onPrintBrowser(orderData, "KITCHEN")}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              <span>Tiket Dapur</span>
            </button>
          </div>
        </div>

        {/* Tombol Transaksi Baru / Selesai */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
        >
          <span>Transaksi Baru (Selesai)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
