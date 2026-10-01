'use client';

import { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, DollarSign, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

/**
 * Modal Multi-Aksi Shift Kasir (Buka Shift, Catat Kas Masuk/Keluar, Tutup Shift & Rekonsiliasi)
 * @param {boolean} isOpen - Status modal terbuka
 * @param {'open' | 'movement' | 'close'} mode - Aksi shift
 * @param {object} currentShift - Data shift aktif
 * @param {function} onClose - Handler tutup modal
 * @param {function} onSuccess - Callback ketika aksi berhasil
 * @param {boolean} isRequired - Jika true, modal buka shift tidak bisa ditutup sebelum kasir input modal awal
 */
export default function ShiftModal({
  isOpen,
  mode = 'open',
  currentShift,
  onClose,
  onSuccess,
  isRequired = false,
}) {
  const [loading, setLoading] = useState(false);

  // State Buka Shift
  const [startingCash, setStartingCash] = useState(300000);
  const [openNotes, setOpenNotes] = useState('');

  // State Mutasi Kas
  const [movementType, setMovementType] = useState('CASH_OUT');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  // State Tutup Shift
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  if (!isOpen) return null;

  // Expected Cash calculation
  const startingFloat = currentShift?.startingCash || 0;
  const cashSales = currentShift?.totalCashSales || 0;
  const cashIn = currentShift?.totalCashIn || 0;
  const cashOut = currentShift?.totalCashOut || 0;
  const expectedCash = startingFloat + cashSales + cashIn - cashOut;

  const parsedActualCash = actualCash === '' ? 0 : parseInt(actualCash, 10) || 0;
  const cashDifference = parsedActualCash - expectedCash;

  // 1. Submit Buka Shift
  const handleOpenShift = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/shifts/open', {
        startingCash: parseInt(startingCash, 10) || 0,
        notes: openNotes,
      });
      if (res.data.success) {
        toast.success('Shift kasir berhasil dibuka! Selamat bertugas.');
        if (onSuccess) onSuccess(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuka shift kasir.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Mutasi Kas
  const handleRecordMovement = async (e) => {
    e.preventDefault();
    if (!movementAmount || parseInt(movementAmount, 10) <= 0) {
      return toast.error('Nominal mutasi kas harus lebih dari 0.');
    }
    if (!movementReason.trim()) {
      return toast.error('Alasan mutasi kas wajib disertakan.');
    }

    setLoading(true);
    try {
      const res = await api.post('/shifts/movement', {
        type: movementType,
        amount: parseInt(movementAmount, 10),
        reason: movementReason.trim(),
      });
      if (res.data.success) {
        toast.success(`Mutasi kas ${movementType === 'CASH_IN' ? 'Masuk' : 'Keluar'} berhasil dicatat.`);
        setMovementAmount('');
        setMovementReason('');
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mencatat mutasi kas.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Tutup Shift
  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (actualCash === '') {
      return toast.error('Uang fisik aktual di laci kasir wajib diinput.');
    }

    setLoading(true);
    try {
      const res = await api.post('/shifts/close', {
        actualCash: parsedActualCash,
        notes: closeNotes,
      });
      if (res.data.success) {
        toast.success('Shift kasir berhasil ditutup dan direkonsiliasi.');
        if (onSuccess) onSuccess(null);
        if (onClose) onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menutup shift kasir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl overflow-hidden text-slate-800">
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              mode === 'open'
                ? 'bg-amber-100 text-amber-600'
                : mode === 'movement'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}>
              {mode === 'open' && <DollarSign className="w-5 h-5" />}
              {mode === 'movement' && <ArrowDownRight className="w-5 h-5" />}
              {mode === 'close' && <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {mode === 'open' && 'Buka Shift Kasir Baru'}
                {mode === 'movement' && 'Catat Arus Kas Laci (In / Out)'}
                {mode === 'close' && 'Tutup Shift & Rekonsiliasi Kas'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {mode === 'open' && 'Masukkan modal kas awal untuk memulai transaksi penjualan.'}
                {mode === 'movement' && 'Catat uang masuk atau uang keluar yang diambil dari laci.'}
                {mode === 'close' && 'Hitung uang fisik di laci kasir dan selesaikan sesi shift.'}
              </p>
            </div>
          </div>
          {!isRequired && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body Modal Berdasarkan Mode */}
        {mode === 'open' && (
          <form onSubmit={handleOpenShift} className="p-6 space-y-4">
            {isRequired && (
              <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Akses Terkunci:</strong> Anda wajib membuka shift kasir dan mengisi modal kas awal sebelum dapat menggunakan terminal kasir.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Modal Kas Awal (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                  placeholder="300000"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[100000, 200000, 300000, 500000].map((nominal) => (
                  <button
                    key={nominal}
                    type="button"
                    onClick={() => setStartingCash(nominal)}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-lg border border-slate-200/80 transition-colors"
                  >
                    Rp {(nominal / 1000).toLocaleString('id-ID')}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan Shift (Opsional)
              </label>
              <input
                type="text"
                value={openNotes}
                onChange={(e) => setOpenNotes(e.target.value)}
                placeholder="Contoh: Shift Pagi - Kasir Utama"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
              >
                {loading ? 'Membuka Shift...' : 'Buka Shift Kasir Sekarang'}
              </button>
            </div>
          </form>
        )}

        {mode === 'movement' && (
          <form onSubmit={handleRecordMovement} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tipe Mutasi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMovementType('CASH_OUT')}
                  className={`py-3 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    movementType === 'CASH_OUT'
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  Kas Keluar
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('CASH_IN')}
                  className={`py-3 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    movementType === 'CASH_IN'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                  Kas Masuk
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nominal (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="25000"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alasan / Keperluan
              </label>
              <input
                type="text"
                required
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder="Contoh: Beli Es Batu Kristal 2 Pack, Tukar Uang Pecahan"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Catat Mutasi Kas'}
              </button>
            </div>
          </form>
        )}

        {mode === 'close' && (
          <form onSubmit={handleCloseShift} className="p-6 space-y-4">
            {/* Kartu Ringkasan Rekonsiliasi */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Modal Kas Awal:</span>
                <span className="font-bold text-slate-900">Rp {startingFloat.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Penjualan Tunai:</span>
                <span className="font-bold text-emerald-600">+ Rp {cashSales.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Kas Masuk (Cash In):</span>
                <span className="font-bold text-blue-600">+ Rp {cashIn.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Kas Keluar (Cash Out):</span>
                <span className="font-bold text-rose-600">- Rp {cashOut.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold">
                <span className="text-slate-800">Kas Seharusnya di Laci (Expected):</span>
                <span className="text-slate-900">Rp {expectedCash.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Uang Fisik Kasir (Actual Cash)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder={expectedCash.toString()}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Status Selisih */}
              {actualCash !== '' && (
                <div className={`mt-2.5 p-3 rounded-xl flex items-center justify-between text-xs font-bold ${
                  cashDifference === 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : cashDifference > 0
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <span className="flex items-center gap-1.5">
                    {cashDifference === 0 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {cashDifference === 0
                      ? 'Kas Seimbang (Sesuai)'
                      : cashDifference > 0
                      ? 'Kas Lebih (Surplus)'
                      : 'Kas Kurang (Defisit)'}
                  </span>
                  <span>
                    {cashDifference > 0 ? '+' : ''} Rp {cashDifference.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan Penutupan Shift
              </label>
              <input
                type="text"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Penjelasan selisih atau catatan serah terima shift..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                {loading ? 'Menutup Shift...' : 'Konfirmasi Tutup Shift & Rekonsiliasi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
