'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  Layers,
  KeyRound,
} from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { Modal } from '../../../components/Modal';
import { api } from '../../../lib/api';
import { User, Role, Permission } from '../../../types';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isOpenAddUser, setIsOpenAddUser] = useState(false);
  const [isOpenAddRole, setIsOpenAddRole] = useState(false);

  // User form state
  const [userForm, setUserForm] = useState({
    username: '',
    displayName: '',
    password: '',
    roleId: '',
  });

  // Role form state
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    selectedPermissions: [] as string[],
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uData, rData, pData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getPermissions().catch(() => []),
      ]);
      setUsers(uData || []);
      setRoles(rData || []);
      setPermissions(pData || []);
    } catch (err) {
      console.error('Failed to load users & roles:', err);
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
      await api.createUser(userForm);
      setIsOpenAddUser(false);
      setUserForm({ username: '', displayName: '', password: '', roleId: '' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan staf');
    }
  };

  const handleToggleUserStatus = async (u: User) => {
    try {
      await api.updateUser(u.id, { active: !u.active });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status karyawan');
    }
  };

  const handleTogglePermission = (key: string) => {
    setRoleForm((prev) => {
      const exists = prev.selectedPermissions.includes(key);
      return {
        ...prev,
        selectedPermissions: exists
          ? prev.selectedPermissions.filter((k) => k !== key)
          : [...prev.selectedPermissions, key],
      };
    });
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roleForm.selectedPermissions.length === 0) {
      alert('Pilih minimal satu hak akses untuk peran ini');
      return;
    }

    try {
      await api.createRole({
        name: roleForm.name.trim(),
        description: roleForm.description.trim() || undefined,
        permissions: roleForm.selectedPermissions,
      });
      setIsOpenAddRole(false);
      setRoleForm({ name: '', description: '', selectedPermissions: [] });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat peran kustom');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Hapus peran "${role.name}"? Karyawan dengan peran ini harus dialihkan terlebih dahulu.`)) {
      return;
    }

    try {
      await api.deleteRole(role.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus peran');
    }
  };

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, p) => {
    const cat = p.category || 'LAINNYA';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Staf & Hak Akses (RBAC)"
        description="Kelola akun karyawan toko, penetapan peran kasir/admin, dan kustomisasi izin akses"
      />

      <main className="p-6 space-y-6 flex-1">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Daftar Karyawan ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
                activeTab === 'roles'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Peran & Hak Akses RBAC ({roles.length})</span>
            </button>
          </div>

          {activeTab === 'users' ? (
            <button
              onClick={() => setIsOpenAddUser(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Karyawan</span>
            </button>
          ) : (
            <button
              onClick={() => setIsOpenAddRole(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Peran Kustom</span>
            </button>
          )}
        </div>

        {/* TAB 1: USERS LIST */}
        {activeTab === 'users' && (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400">
                  <th className="py-3 px-4 font-semibold">Nama Karyawan</th>
                  <th className="py-3 px-4 font-semibold">Username Login</th>
                  <th className="py-3 px-4 font-semibold">Peran (Role)</th>
                  <th className="py-3 px-4 font-semibold text-center">Status Akun</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Memuat daftar karyawan...
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-200 flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-indigo-400">
                          {u.displayName.charAt(0).toUpperCase()}
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
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {u.active ? 'Aktif' : 'Diblokir'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-medium transition ${
                            u.active
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Belum ada staf terdaftar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: ROLES & RBAC */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                Memuat data peran dan hak akses...
              </div>
            ) : roles.length > 0 ? (
              roles.map((r) => (
                <div
                  key={r.id}
                  className="glass-card p-5 flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-100 text-sm">{r.name}</h4>
                            {r.isSystem ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                Sistem Bawaan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                Peran Kustom
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {r.description || 'Tidak ada deskripsi peran'}
                          </p>
                        </div>
                      </div>

                      {!r.isSystem && (
                        <button
                          onClick={() => handleDeleteRole(r)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Hapus Peran Kustom"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                        Hak Akses Diizinkan ({r.permissions?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {r.permissions && r.permissions.length > 0 ? (
                          r.permissions.map((pKey) => (
                            <span
                              key={pKey}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-indigo-300"
                            >
                              {pKey}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">Tidak ada hak akses</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Digunakan oleh:{' '}
                      <strong className="text-slate-200">{r.userCount ?? 0} pengguna</strong>
                    </span>
                    {r.isSystem && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Dilindungi Sistem
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                Belum ada peran terdaftar
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Add User */}
      <Modal isOpen={isOpenAddUser} onClose={() => setIsOpenAddUser(false)} title="Tambah Akun Karyawan Baru">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={userForm.displayName}
              onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
              className="pos-input px-3 py-2 text-xs"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Username Login *</label>
            <input
              type="text"
              required
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase() })}
              className="pos-input px-3 py-2 text-xs font-mono"
              placeholder="budi_kasir"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password *</label>
            <input
              type="password"
              required
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              className="pos-input px-3 py-2 text-xs"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Peran Akses (Role) *</label>
            <select
              required
              value={userForm.roleId}
              onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
              className="pos-select px-3 py-2 text-xs w-full"
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
              onClick={() => setIsOpenAddUser(false)}
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

      {/* Modal Add Role */}
      <Modal
        isOpen={isOpenAddRole}
        onClose={() => setIsOpenAddRole(false)}
        title="Buat Peran Kustom Baru"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nama Peran *</label>
            <input
              type="text"
              required
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              className="pos-input px-3 py-2 text-xs"
              placeholder="Contoh: Supervisor Gudang, Asisten Kasir"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Deskripsi Singkat</label>
            <input
              type="text"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              className="pos-input px-3 py-2 text-xs"
              placeholder="Menjelaskan tanggung jawab peran ini"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-300">
                Pilih Hak Akses (Permissions) *
              </label>
              <span className="text-[11px] text-indigo-400 font-semibold">
                {roleForm.selectedPermissions.length} izin dipilih
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <div key={category} className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                    {category}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((p) => {
                      const isChecked = roleForm.selectedPermissions.includes(p.key);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                            isChecked
                              ? 'bg-indigo-600/10 border-indigo-500/30 text-slate-100'
                              : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(p.key)}
                            className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="font-mono text-[11px] font-bold text-slate-200">{p.key}</p>
                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                              {p.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpenAddRole(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              Simpan Peran Baru
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
