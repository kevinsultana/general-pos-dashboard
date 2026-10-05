"use client";

import { useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useBluetooth, buildReceiptBytes } from "../../contexts/BluetoothPrinterContext";

/**
 * usePrintReceipt - Mengelola seluruh alur pencetakan struk transaksi POS.
 *
 * Mendukung 2 metode cetak:
 * 1. Web Bluetooth ESC/POS Thermal Print (58mm/80mm) via BluetoothPrinterContext.
 * 2. Browser Print / Thermal Receipt dialog fallback (@media print).
 *
 * @param {object} options
 * @param {object|null} options.tenant - data tenant toko
 * @param {object|null} options.activeBranch - data cabang aktif
 * @returns {object}
 */
export function usePrintReceipt({ tenant, activeBranch }) {
  const { btStatus, btDeviceName, isConnected, isReconnecting, printBytes } = useBluetooth();

  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [activePrintOrder, setActivePrintOrder] = useState(null);
  const [printMode, setPrintMode] = useState("CUSTOMER"); // "CUSTOMER" | "KITCHEN"
  const [isPrinting, setIsPrinting] = useState(false);

  // Konfigurasi profil toko untuk struk
  const storeInfo = useMemo(
    () => ({
      name: tenant?.name || activeBranch?.name || "OMNI POS",
      address: activeBranch?.address || "Cabang Utama",
      phone: activeBranch?.phone || "",
      printerWidth: 58,
      branchName: activeBranch?.name,
      receiptShowStoreName: true,
    }),
    [tenant, activeBranch]
  );

  /**
   * Cetak struk via Web Bluetooth ESC/POS printer.
   *
   * @param {object} orderData - data transaksi lengkap
   * @param {"CUSTOMER" | "KITCHEN"} [mode="CUSTOMER"]
   */
  const handlePrintBluetooth = useCallback(
    async (orderData, mode = "CUSTOMER") => {
      if (!orderData) return false;

      if (!isConnected) {
        setShowBluetoothModal(true);
        return false;
      }

      setIsPrinting(true);
      const toastId = toast.loading(
        `Mengirim ${mode === "KITCHEN" ? "tiket dapur" : "struk"} ke printer Bluetooth...`
      );

      try {
        const bytes = await buildReceiptBytes(orderData, storeInfo, mode);
        await printBytes(bytes);
        toast.success(
          `${mode === "KITCHEN" ? "Tiket dapur" : "Struk pelanggan"} berhasil dicetak!`,
          { id: toastId }
        );
        return true;
      } catch (err) {
        toast.error(`Gagal mencetak: ${err.message || "Cek koneksi printer."}`, {
          id: toastId,
        });
        return false;
      } finally {
        setIsPrinting(false);
      }
    },
    [isConnected, storeInfo, printBytes]
  );

  /**
   * Cetak struk via Browser Print (@media print).
   *
   * @param {object} orderData - data transaksi lengkap
   * @param {"CUSTOMER" | "KITCHEN"} [mode="CUSTOMER"]
   */
  const handlePrintBrowser = useCallback((orderData, mode = "CUSTOMER") => {
    if (!orderData) return;
    setActivePrintOrder(orderData);
    setPrintMode(mode);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.print();
      }
    }, 150);
  }, []);

  return {
    // Bluetooth context data
    btStatus,
    btDeviceName,
    isConnected,
    isReconnecting,
    // Modals & print states
    showBluetoothModal,
    setShowBluetoothModal,
    showSuccessModal,
    setShowSuccessModal,
    completedOrder,
    setCompletedOrder,
    activePrintOrder,
    setActivePrintOrder,
    printMode,
    setPrintMode,
    isPrinting,
    // Store metadata
    storeInfo,
    // Action handlers
    handlePrintBluetooth,
    handlePrintBrowser,
  };
}
