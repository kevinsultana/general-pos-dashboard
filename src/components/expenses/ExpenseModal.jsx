'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  Calendar,
  User,
  FileText,
  DollarSign,
  Tag,
  Plus,
  Save,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function ExpenseModal({
  isOpen,
  onClose,
  expense = null,
  categories = [],
  onSuccess,
  onCategoryCreated,
}) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick category creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    if (expense) {
      setCategoryId(expense.categoryId || '');
      setAmount(expense.amount ? String(expense.amount) : '');
      setExpenseDate(
        expense.expenseDate
          ? new Date(expense.expenseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setRecipient(expense.recipient || '');
      setNotes(expense.notes || '');
    } else {
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setAmount('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setRecipient('');
      setNotes('');
    }
    setIsAddingCategory(false);
    setNewCategoryName('');
  }, [expense, categories, isOpen]);

  if (!isOpen) return null;

  const handleCreateNewCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Nama kategori pengeluaran wajib diisi.');
      return;
    }

    setIsSavingCategory(true);
    try {
      const res = await api.post('/expenses/categories', { name: newCategoryName.trim() });
      if (res.data?.success) {
        toast.success(`Kategori "${res.data.data.name}" berhasil dibuat!`);
        onCategoryCreated?.();
        setCategoryId(res.data.data.id);
        setIsAddingCategory(false);
        setNewCategoryName('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat kategori baru.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error('Pilih kategori pengeluaran.');
      return;
    }

    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Masukkan nominal pengeluaran yang valid (> 0).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        categoryId,
        amount: parsedAmount,
        expenseDate: new Date(expenseDate).toISOString(),
        recipient: recipient.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (expense?.id) {
        await api.put(`/expenses/${expense.id}`, payload);
        toast.success('Data pengeluaran berhasil diperbarui!');
      } else {
        await api.post('/expenses', payload);
        toast.success('Pengeluaran operasional berhasil dicatat!');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden text-slate-800">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-linear-to-r from-rose-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-700 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {expense ? 'Ubah Catatan Biaya' : 'Catat Pengeluaran Operasional'}
              </h3>
              <p className="text-xs text-slate-500">
                {expense
                  ? 'Perbarui rincian pengeluaran operasional outlet'
                  : 'Catat biaya listrik, sewa, gaji, bahan, dsb.'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nominal Pengeluaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nominal Biaya (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-400">
                Rp
              </span>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 150000"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
              <p className="text-[11px] font-bold text-rose-600 mt-1">
                Rp {Number(amount).toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {/* Kategori Pengeluaran */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kategori Biaya <span className="text-rose-500">*</span>
              </label>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kategori Baru</span>
                </button>
              )}
            </div>

            {isAddingCategory ? (
              <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nama Kategori (misal: Listrik & Air)"
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewCategory}
                    disabled={isSavingCategory}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    {isSavingCategory ? 'Menyimpan...' : 'Simpan Kategori'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Tag className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">-- Pilih Kategori Biaya --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tanggal & Penerima */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Pengeluaran <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Penerima / Vendor
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Misal: PLN / Toko ATK"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Keterangan / Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan / Keperluan
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Rincian penggunaan dana atau nomor nota fisik..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

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
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
