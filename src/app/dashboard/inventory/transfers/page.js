'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck,
  ArrowRight,
  Plus,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Package,
  Calendar,
  User,
  AlertCircle,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLanguage } from '../../../../contexts/LanguageContext';
import api from '../../../../lib/api';
import CreateTransferModal from '../../../../components/inventory/CreateTransferModal';
import UnauthorizedState from '../../../../components/common/UnauthorizedState';

export default function StockTransfersPage() {
  const { tenant, user, hasPermission } = useAuth();
  const { t } = useLanguage();

  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'RECEIVED' | 'CANCELLED'
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const isPro = tenant?.plan === 'PRO';
  const isAllowed = user?.isOwner || hasPermission('inventory:view');
  const canManage = user?.isOwner || hasPermission('inventory:manage');

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/branches');
        if (res.data?.success) {
          setBranches(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    };
    if (isPro && isAllowed) {
      fetchBranches();
    }
  }, [isPro, isAllowed]);

  // Load transfers list
  const fetchTransfers = useCallback(async () => {
    if (!isPro) return;
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      };

      const res = await api.get('/transfers', { params });
      if (res.data?.success) {
        setTransfers(res.data.data || []);
        setMeta(res.data.meta || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat data transfer stok.');
    } finally {
      setLoading(false);
    }
  }, [isPro, page, statusFilter]);

  useEffect(() => {
    if (isPro && isAllowed) {
      fetchTransfers();
    }
  }, [fetchTransfers, isPro, isAllowed]);

  // Handle Receive Transfer
  const handleReceive = async (transfer) => {
    if (!canManage) {
      toast.error('Akses Ditolak: Anda tidak memiliki hak akses mengubah stok.');
      return;
    }

    if (
      !window.confirm(
        `Konfirmasi penerimaan barang untuk transfer ${transfer.transferNo}? Stok akan otomatis ditambahkan ke ${transfer.toBranch?.name}.`
      )
    ) {
      return;
    }

    setProcessingId(transfer.id);
    try {
      const res = await api.patch(`/transfers/${transfer.id}/receive`);
      if (res.data?.success) {
        toast.success('Transfer stok berhasil diterima dan stok cabang tujuan telah bertambah!');
        fetchTransfers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menerima transfer stok.');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Cancel Transfer
  const handleCancel = async (transfer) => {
    if (!canManage) {
      toast.error('Akses Ditolak: Anda tidak memiliki hak akses mengubah stok.');
      return;
    }

    if (
      !window.confirm(
        `Apakah Anda yakin ingin membatalkan transfer ${transfer.transferNo}? Stok yang sempat dipotong akan dikembalikan ke ${transfer.fromBranch?.name}.`
      )
    ) {
      return;
    }

    setProcessingId(transfer.id);
    try {
      const res = await api.patch(`/transfers/${transfer.id}/cancel`);
      if (res.data?.success) {
        toast.success('Transfer stok berhasil dibatalkan dan stok telah direstorasi!');
        fetchTransfers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan transfer stok.');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAllowed && user) {
    return <UnauthorizedState requiredPermission="inventory:view" />;
  }

  // Jika Bukan Paket PRO: Tampilkan Banner Khusus Upgrade PRO
  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-300">
        <div className="p-8 sm:p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(31,38,135,0.08)] ring-1 ring-inset ring-white/70 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-linear-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider">
              Fitur Eksklusif Paket PRO
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Transfer Stok Multi-Cabang
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kirim dan alokasikan stok produk antar outlet secara instan dengan verifikasi dua arah (pengirim & penerima) untuk mencegah kebocoran barang.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/upgrade"
              className="py-3 px-8 rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <span>Upgrade ke Paket PRO</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/inventory"
              className="py-3 px-6 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors"
            >
              Kembali ke Inventori
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-400/40 text-purple-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md mb-2">
            <Truck className="w-3.5 h-3.5 text-purple-600" />
            <span>Inventori Multi-Outlet (PRO)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Transfer Stok Antar Cabang
          </h1>
          <p className="text-sm text-slate-600 font-normal">
            Kirim mutasi stok barang antar gerai cabang dengan validasi penerimaan fisik barang.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="py-3 px-5 rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Kirim Transfer Stok</span>
        </button>
      </div>

      {/* 2. Status Filter Tabs */}
      <div className="flex p-1 bg-white/80 backdrop-blur-xl border border-white/90 shadow-2xs rounded-2xl self-start w-fit">
        {[
          { id: 'ALL', label: 'Semua Status' },
          { id: 'PENDING', label: 'Dalam Pengiriman (Pending)' },
          { id: 'RECEIVED', label: 'Sudah Diterima' },
          { id: 'CANCELLED', label: 'Dibatalkan' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setStatusFilter(tab.id);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tabel Transfer Stok */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Memuat riwayat transfer...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Belum ada riwayat transfer stok</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Kirim mutasi stok barang antar cabang dengan menekan tombol &ldquo;Kirim Transfer Stok&rdquo;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">No. Dokumen & Tanggal</th>
                  <th className="py-3.5 px-4">Rute Pengiriman</th>
                  <th className="py-3.5 px-4">Barang Ditransfer</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transfers.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isProcessing = processingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-purple-50/20 transition-colors">
                      {/* No & Tanggal */}
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-900 font-mono text-xs">{item.transferNo}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(item.sentAt || item.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Oleh: {item.sender?.name || 'Staf'}
                        </p>
                      </td>

                      {/* Rute Cabang */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{item.fromBranch?.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-purple-700">{item.toBranch?.name}</span>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-slate-500 italic mt-1 max-w-xs truncate">
                            &ldquo;{item.notes}&rdquo;
                          </p>
                        )}
                      </td>

                      {/* Item Barang */}
                      <td className="py-4 px-4 space-y-1">
                        {item.items?.map((it) => (
                          <div key={it.id} className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                            <span>
                              {it.product?.name || 'Produk'} (<strong>{it.quantity}</strong>)
                            </span>
                          </div>
                        ))}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {item.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            <span>Dalam Pengiriman</span>
                          </span>
                        )}
                        {item.status === 'RECEIVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Diterima</span>
                          </span>
                        )}
                        {item.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Dibatalkan</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-5 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReceive(item)}
                              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isProcessing ? 'Memproses...' : 'Konfirmasi Terima'}
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleCancel(item)}
                              className="py-1.5 px-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Batalkan
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Halaman {meta.page} dari {meta.totalPages} ({meta.total} total)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Kirim Transfer */}
      <CreateTransferModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchTransfers}
        branches={branches}
      />
    </div>
  );
}
