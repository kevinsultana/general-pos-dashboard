'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Calendar,
  Building,
  Tag,
  DollarSign,
  TrendingDown,
  FileSpreadsheet,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';
import ExpenseModal from '../../../components/expenses/ExpenseModal';
import UnauthorizedState from '../../../components/common/UnauthorizedState';

export default function ExpensesPage() {
  const { user, hasPermission, activeBranch } = useAuth();
  const { t } = useLanguage();

  const isAllowed = user?.isOwner || hasPermission('reports:view');

  const [expenses, setExpenses] = useState([]);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st day of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState(null);

  // Fetch branches
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
    if (isAllowed) {
      fetchBranches();
    }
  }, [isAllowed]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/expenses/categories');
      if (res.data?.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load expense categories:', err);
    }
  }, []);

  useEffect(() => {
    if (isAllowed) {
      fetchCategories();
    }
  }, [isAllowed, fetchCategories]);

  // Fetch expenses list
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        categoryId: selectedCategory || undefined,
        branchId: selectedBranch || undefined,
      };

      const res = await api.get('/expenses', { params });
      if (res.data?.success) {
        setExpenses(res.data.data || []);
        setTotalExpenseAmount(res.data.totalExpenseAmount || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalRecords(res.data.pagination?.total || 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat catatan pengeluaran.');
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, selectedCategory, selectedBranch]);

  useEffect(() => {
    if (isAllowed) {
      fetchExpenses();
    }
  }, [isAllowed, fetchExpenses]);

  // Delete Expense
  const handleDelete = async (exp) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus catatan biaya ${exp.expenseNo} senilai Rp ${exp.amount?.toLocaleString('id-ID')}?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/expenses/${exp.id}`);
      toast.success('Catatan pengeluaran berhasil dihapus.');
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengeluaran.');
    }
  };

  if (!isAllowed && user) {
    return <UnauthorizedState requiredPermission="reports:view" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-400/40 text-rose-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md mb-2">
            <Wallet className="w-3.5 h-3.5 text-rose-600" />
            <span>Operational Expenditure (OPEX)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Biaya Operasional Usaha
          </h1>
          <p className="text-sm text-slate-600 font-normal">
            Catat dan pantau seluruh beban pengeluaran outlet (listrik, gaji, sewa, bahan, operasional) untuk akurasi laporan laba rugi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedExpenseForEdit(null);
            setIsModalOpen(true);
          }}
          className="py-2.5 px-5 rounded-2xl bg-linear-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Pengeluaran Baru</span>
        </button>
      </div>

      {/* 2. KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-black shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pengeluaran
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              Rp {totalExpenseAmount.toLocaleString('id-ID')}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Berdasarkan filter aktif saat ini</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Catatan Biaya
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {totalRecords} Transaksi
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Pengeluaran tercatat</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rata-rata per Catatan
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              Rp{' '}
              {totalRecords > 0
                ? Math.round(totalExpenseAmount / totalRecords).toLocaleString('id-ID')
                : 0}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Rata-rata pengeluaran</p>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Cabang Filter */}
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Semua Cabang</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Kategori Filter */}
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Semua Kategori Biaya</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <span className="text-xs text-slate-400">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* 4. Expenses Table */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Memuat catatan pengeluaran...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800">Belum ada catatan pengeluaran operasional</p>
            <p className="text-xs text-slate-500">
              Klik &quot;Catat Pengeluaran Baru&quot; untuk mencatat biaya listrik, gaji, belanja bahan, dsb.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">No. Pengeluaran & Tanggal</th>
                  <th className="py-3 px-4">Kategori Biaya</th>
                  <th className="py-3 px-4">Penerima / Vendor</th>
                  <th className="py-3 px-4">Cabang</th>
                  <th className="py-3 px-4">Dicatat Oleh</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-900 font-mono">{exp.expenseNo}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(exp.expenseDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px]">
                        {exp.category?.name || 'Operasional'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {exp.recipient || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {exp.branch?.name || 'Cabang'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {exp.user?.name || 'Staf'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate italic">
                      {exp.notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 text-sm">
                      Rp {(exp.amount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExpenseForEdit(exp);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(exp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Halaman <strong className="text-slate-900">{page}</strong> dari{' '}
              <strong className="text-slate-900">{totalPages}</strong> (Total {totalRecords} Data)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expense={selectedExpenseForEdit}
        categories={categories}
        onSuccess={fetchExpenses}
        onCategoryCreated={fetchCategories}
      />
    </div>
  );
}
