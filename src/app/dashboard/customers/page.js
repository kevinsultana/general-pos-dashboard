'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Banknote,
  BookOpen,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';
import CustomerModal from '../../../components/customers/CustomerModal';
import PayDebtModal from '../../../components/customers/PayDebtModal';
import DebtLedgerModal from '../../../components/customers/DebtLedgerModal';
import UnauthorizedState from '../../../components/common/UnauthorizedState';

export default function CustomersPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();

  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
    overallTotalDebt: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debtFilter, setDebtFilter] = useState('ALL'); // 'ALL' | 'HAS_DEBT' | 'NO_DEBT'
  const [page, setPage] = useState(1);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState(null);

  const [isPayDebtModalOpen, setIsPayDebtModalOpen] = useState(false);
  const [selectedCustomerForPay, setSelectedCustomerForPay] = useState(null);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState(null);

  const isAllowed = user?.isOwner || hasPermission('pos:access') || hasPermission('reports:view');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        hasDebt:
          debtFilter === 'HAS_DEBT'
            ? 'true'
            : debtFilter === 'NO_DEBT'
            ? 'false'
            : undefined,
      };

      const res = await api.get('/customers', { params });
      if (res.data?.success) {
        setCustomers(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat data pelanggan.');
    } finally {
      setLoading(false);
    }
  }, [page, search, debtFilter]);

  useEffect(() => {
    if (isAllowed) {
      fetchCustomers();
    }
  }, [fetchCustomers, isAllowed]);

  const handleDeleteCustomer = async (cust) => {
    if (cust.totalDebt > 0) {
      toast.error(
        `Pelanggan tidak dapat dihapus karena masih memiliki kasbon aktif sebesar Rp ${cust.totalDebt.toLocaleString(
          'id-ID'
        )}.`
      );
      return;
    }

    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus data pelanggan "${cust.name}"?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/customers/${cust.id}`);
      toast.success('Pelanggan berhasil dihapus.');
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pelanggan.');
    }
  };

  if (!isAllowed && user) {
    return <UnauthorizedState requiredPermission="pos:access" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md mb-2">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>CRM & Manajemen Piutang</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('customers.customersTitle') || 'Pelanggan & Buku Kasbon'}
          </h1>
          <p className="text-sm text-slate-600 font-normal">
            {t('customers.customersSubtitle') ||
              'Kelola database pelanggan toko, pantau riwayat belanja, dan kelola pelunasan kasbon.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedCustomerForEdit(null);
            setIsCustomerModalOpen(true);
          }}
          className="py-3 px-5 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('customers.addCustomerBtn') || 'Tambah Pelanggan'}</span>
        </button>
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pelanggan */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Pelanggan
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{meta.total} Orang</p>
          <p className="text-[11px] text-slate-500">Terdaftar di database toko</p>
        </div>

        {/* Total Kasbon Toko */}
        <div
          className={`p-5 rounded-3xl backdrop-blur-xl border shadow-2xs space-y-2 ${
            meta.overallTotalDebt > 0
              ? 'bg-rose-50/70 border-rose-200/80 text-rose-950'
              : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('customers.debtTotalLabel') || 'Total Piutang Belum Lunas'}
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                meta.overallTotalDebt > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black">
            Rp {(meta.overallTotalDebt || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] opacity-80">
            {meta.overallTotalDebt > 0
              ? 'Tagihan kasbon belum diselesaikan'
              : 'Semua pelanggan lunas tertib'}
          </p>
        </div>

        {/* Filter Cepat Kasbon */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Status Kasbon
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center">
              <Filter className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setDebtFilter('ALL');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                debtFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => {
                setDebtFilter('HAS_DEBT');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                debtFilter === 'HAS_DEBT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Ada Kasbon
            </button>
            <button
              type="button"
              onClick={() => {
                setDebtFilter('NO_DEBT');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                debtFilter === 'NO_DEBT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Lunas
            </button>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('customers.searchCustomer') || 'Cari nama, no. HP, atau email...'}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* 4. Tabel Pelanggan */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Memuat data pelanggan...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Belum ada pelanggan ditemukan</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Daftarkan pelanggan baru atau ubah kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Pelanggan</th>
                  <th className="py-3.5 px-4">Kontak</th>
                  <th className="py-3.5 px-4">Total Belanja</th>
                  <th className="py-3.5 px-4">Status Kasbon</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customers.map((cust) => {
                  const hasDebt = cust.totalDebt > 0;

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-amber-50/30 transition-colors group"
                    >
                      {/* Nama & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 p-0.5 shadow-2xs shrink-0">
                            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-amber-700">
                              {(cust.name || 'P').charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">
                              {cust.name}
                            </p>
                            {cust.notes && (
                              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">
                                {cust.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kontak */}
                      <td className="py-4 px-4 space-y-1">
                        {cust.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{cust.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Tanpa telepon
                          </span>
                        )}
                        {cust.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-36">{cust.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Total Belanja */}
                      <td className="py-4 px-4">
                        <p className="font-black text-slate-900">
                          Rp {(cust.totalSpent || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {cust.totalOrders || 0} Transaksi
                        </p>
                      </td>

                      {/* Status Kasbon */}
                      <td className="py-4 px-4">
                        {hasDebt ? (
                          <div className="inline-flex flex-col">
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black tracking-wide border border-rose-200">
                              Kasbon Rp {cust.totalDebt.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-rose-600 mt-0.5 font-semibold">
                              Belum Lunas
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>Lunas Tertib</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Bayar Kasbon */}
                          {hasDebt && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomerForPay(cust);
                                setIsPayDebtModalOpen(true);
                              }}
                              className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Bayar</span>
                            </button>
                          )}

                          {/* Tombol Buku Kasbon */}
                          <button
                            type="button"
                            title="Buku Kasbon & Riwayat"
                            onClick={() => {
                              setSelectedCustomerForLedger(cust);
                              setIsLedgerModalOpen(true);
                            }}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>

                          {/* Tombol Ubah */}
                          <button
                            type="button"
                            title="Ubah Data"
                            onClick={() => {
                              setSelectedCustomerForEdit(cust);
                              setIsCustomerModalOpen(true);
                            }}
                            className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            title={
                              hasDebt
                                ? 'Tidak bisa dihapus: masih memiliki kasbon'
                                : 'Hapus Pelanggan'
                            }
                            onClick={() => handleDeleteCustomer(cust)}
                            disabled={hasDebt}
                            className={`p-2 rounded-xl transition-colors ${
                              hasDebt
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Menampilkan Halaman {meta.page} dari {meta.totalPages} ({meta.total} total)
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

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={selectedCustomerForEdit}
        onSuccess={fetchCustomers}
      />

      <PayDebtModal
        isOpen={isPayDebtModalOpen}
        onClose={() => setIsPayDebtModalOpen(false)}
        customer={selectedCustomerForPay}
        onSuccess={fetchCustomers}
      />

      <DebtLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        customer={selectedCustomerForLedger}
        onPayDebtClick={(c) => {
          setSelectedCustomerForPay(c);
          setIsPayDebtModalOpen(true);
        }}
      />
    </div>
  );
}
