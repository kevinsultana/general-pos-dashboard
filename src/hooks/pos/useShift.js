"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../../lib/api";

/**
 * useShift – mengelola state shift kasir (buka / tutup shift).
 *
 * @param {object|null} activeBranch – data cabang aktif dari useAuth
 * @param {object|null} user         – data user dari useAuth
 *
 * Returns:
 *   shift           – objek shift aktif | null
 *   setShift        – setter manual (untuk integrasi eksternal)
 *   shiftLoading    – boolean, true saat fetch sedang berjalan
 *   fetchActiveShift– () => Promise<void>
 *   closingCash     – string, nilai input uang penutup shift
 *   setClosingCash  – setter
 *   isClosingShift  – boolean, true saat API tutup shift sedang diproses
 *   showCloseShift  – boolean, toggle modal tutup shift
 *   setShowCloseShift – setter
 *   showShiftRecap  – boolean, toggle modal Z-Report setelah shift ditutup
 *   setShowShiftRecap – setter
 *   closedShiftData – data shift yang sudah ditutup (untuk Z-Report) | null
 *   handleCloseShift– (e: FormEvent) => Promise<void>
 */
export function useShift(activeBranch, user) {
  const [shift, setShift] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(true);

  // ── Tutup shift ──────────────────────────────────────────────────────────────
  const [closingCash, setClosingCash] = useState("");
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);

  // ── Z-Report (Shift Recap) ──────────────────────────────────────────────────
  const [showShiftRecap, setShowShiftRecap] = useState(false);
  const [closedShiftData, setClosedShiftData] = useState(null);

  // ── Fetch shift aktif ────────────────────────────────────────────────────────
  const fetchActiveShift = useCallback(async () => {
    try {
      setShiftLoading(true);
      const res = await api.get("/shifts/active");
      setShift(res?.data || null);
    } catch {
      setShift(null);
    } finally {
      setShiftLoading(false);
    }
  }, []);

  // ── Tutup shift ──────────────────────────────────────────────────────────────

  /**
   * Handler form tutup shift.
   * Setelah berhasil: set shift=null, tampilkan Z-Report modal.
   *
   * @param {React.FormEvent}  e
   * @param {Function}         onClosed – callback(closedData) dipanggil setelah shift ditutup
   *                                      gunakan untuk clearCart di POSPage
   */
  const handleCloseShift = useCallback(
    async (e, onClosed) => {
      e.preventDefault();
      try {
        setIsClosingShift(true);
        const res = await api.put(`/shifts/${shift.id}/close`, {
          endingCash: parseFloat(closingCash) || 0,
        });
        if (res?.success) {
          toast.success("Shift berhasil ditutup.");
          const closedData = {
            ...res.data,
            endingCash: parseFloat(closingCash) || 0,
            startTime: res.data.startTime || shift.startTime,
            endTime: res.data.endTime || new Date().toISOString(),
            user: res.data.user || shift.user || { name: user?.name || "Kasir" },
            branch: res.data.branch || shift.branch || activeBranch,
          };
          setClosedShiftData(closedData);
          setShift(null);
          setShowCloseShift(false);
          setClosingCash("");
          setShowShiftRecap(true);
          // Beri tahu POSPage untuk clearCart, resetPromo, dll.
          onClosed?.();
        }
      } catch (err) {
        toast.error(err.message || "Gagal menutup shift.");
      } finally {
        setIsClosingShift(false);
      }
    },
    [shift, closingCash, user, activeBranch]
  );

  return {
    shift,
    setShift,
    shiftLoading,
    fetchActiveShift,
    closingCash,
    setClosingCash,
    isClosingShift,
    showCloseShift,
    setShowCloseShift,
    showShiftRecap,
    setShowShiftRecap,
    closedShiftData,
    handleCloseShift,
  };
}
