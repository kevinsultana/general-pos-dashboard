'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Calendar,
  FileText,
} from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { Modal } from '../../../components/Modal';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';
import { Customer } from '../../../types';
import { formatDate } from '../../../lib/formatters';

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      toast.error('Gagal memuat data pelanggan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setForm({ name: '', phone: '', email: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      notes: customer.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('Nama pelanggan wajib diisi');
      return;
    }

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, {
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        toast.success(`Data pelanggan "${form.name}" berhasil diperbarui!`);
      } else {
        await api.createCustomer({
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        toast.success(`Pelanggan "${form.name}" berhasil didaftarkan!`);
      }
      setIsModalOpen(false);
      await loadCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data pelanggan');
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Hapus pelanggan "${customer.name}"? Data ini tidak dapat dikembalikan.`)) return;
    try {
      await api.deleteCustomer(customer.id);
      toast.success(`Pelanggan "${customer.name}" berhasil dihapus`);
      await loadCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data pelanggan');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Manajemen Pelanggan"
        description="Kelola basis data pembeli, kontak pelanggan, dan riwayat pesanan program loyalitas"
      />

      <main className="p-6 space-y-6 flex-1">
        {/* Top Actions & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama, no. HP, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pos-input pl-9 pr-4 py-2"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="pos-btn-primary"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pelanggan</span>
          </button>
        </div>

        {/* Customer Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800/80">
                <tr>
                  <th className="py-3.5 px-4">Nama Pelanggan</th>
                  <th className="py-3.5 px-4">Kontak</th>
                  <th className="py-3.5 px-4">Catatan Khusus</th>
                  <th className="py-3.5 px-4">Terdaftar Sejak</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Memuat daftar pelanggan...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-slate-600" />
                        <p>{search ? 'Tidak ada pelanggan yang cocok dengan pencarian' : 'Belum ada data pelanggan'}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center text-xs">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="space-y-1">
                          {c.phone && (
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-300">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span className="font-mono">{c.phone}</span>
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                              <Mail className="w-3 h-3 text-indigo-400" />
                              <span>{c.email}</span>
                            </div>
                          )}
                          {!c.phone && !c.email && (
                            <span className="text-slate-600 text-[11px]">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {c.notes ? (
                          <div className="flex items-center space-x-1.5">
                            <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{c.notes}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{formatDate(c.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition"
                            title="Edit Pelanggan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Add / Edit Customer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nama Lengkap <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="pos-input px-3 py-2 text-xs"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                No. WhatsApp / Telepon
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="pos-input px-3 py-2 text-xs font-mono"
                placeholder="08123456789"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pos-input px-3 py-2 text-xs"
                placeholder="budi@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Catatan Tambahan</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="pos-input px-3 py-2 text-xs"
              placeholder="Preferensi pesanan, alamat antar, atau catatan VIP..."
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="pos-btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="pos-btn-primary"
            >
              {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
