'use client';

import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { Modal } from '../../../components/Modal';
import { api } from '../../../lib/api';
import { User } from '../../../types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpenAdd, setIsOpenAdd] = useState(false);

  const [form, setForm] = useState({
    username: '',
    displayName: '',
    password: '',
    roleId: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uData, rData] = await Promise.all([api.getUsers(), api.getRoles()]);
      setUsers(uData || []);
      setRoles(rData || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(form);
      setIsOpenAdd(false);
      setForm({ username: '', displayName: '', password: '', roleId: '' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan staf');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Staf & Hak Akses (RBAC)"
        description="Kelola akun kasir, admin gudang, dan peran pengguna POS"
      />

      <main className="p-6 space-y-6 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Daftar Karyawan Toko</h3>
            <p className="text-xs text-slate-400">Setiap pengguna memiliki akses sesuai perannya</p>
          </div>
          <button
            onClick={() => setIsOpenAdd(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Karyawan</span>
          </button>
        </div>

        {/* User Table */}
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400">
                <th className="py-3 px-4 font-semibold">Nama Karyawan</th>
                <th className="py-3 px-4 font-semibold">Username</th>
                <th className="py-3 px-4 font-semibold">Peran (Role)</th>
                <th className="py-3 px-4 font-semibold text-center">Status Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    Memuat daftar karyawan...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-200 flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-indigo-400">
                        {u.displayName.charAt(0)}
                      </div>
                      <span>{u.displayName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{u.username}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {u.role?.name || 'Staf'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.active ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-rose-400 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Diblokir</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    Belum ada staf terdaftar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Add User */}
      <Modal isOpen={isOpenAdd} onClose={() => setIsOpenAdd(false)} title="Tambah Akun Staf Baru">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Username Login *</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono"
              placeholder="budi_kasir"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password *</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Peran Akses (Role) *</label>
            <select
              required
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
            >
              <option value="">Pilih Peran...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpenAdd(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              Simpan Karyawan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
