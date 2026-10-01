'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Layers,
  ShoppingCart,
  ClipboardCheck,
  Building,
  Truck,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  Calendar,
  User,
  Phone,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';
import SupplierModal from '../../../components/inventory/SupplierModal';
import CreatePoModal from '../../../components/inventory/CreatePoModal';
import StockOpnameModal from '../../../components/inventory/StockOpnameModal';
import UnauthorizedState from '../../../components/common/UnauthorizedState';

export default function InventoryPage() {
  const { tenant, user, hasPermission, activeBranch } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('po'); // 'po' | 'opname' | 'suppliers'

  // Purchase Orders State
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poLoading, setPoLoading] = useState(true);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);

  // Stock Opnames State
  const [opnames, setOpnames] = useState([]);
  const [opnameLoading, setOpnameLoading] = useState(true);
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);

  // Suppliers State
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState(null);

  // Branches
  const [branches, setBranches] = useState([]);

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
    if (isAllowed) {
      fetchBranches();
    }
  }, [isAllowed]);

  // Load Purchase Orders
  const fetchPurchaseOrders = useCallback(async () => {
    setPoLoading(true);
    try {
      const res = await api.get('/purchase-orders', { params: { limit: 50 } });
      if (res.data?.success) {
        setPurchaseOrders(res.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat Purchase Orders.');
    } finally {
      setPoLoading(false);
    }
  }, []);

  // Load Stock Opnames
  const fetchOpnames = useCallback(async () => {
    setOpnameLoading(true);
    try {
      const res = await api.get('/opnames');
      if (res.data?.success) {
        setOpnames(res.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat riwayat opname.');
    } finally {
      setOpnameLoading(false);
    }
  }, []);

  // Load Suppliers
  const fetchSuppliers = useCallback(async () => {
    setSuppliersLoading(true);
    try {
      const res = await api.get('/suppliers', {
        params: { search: supplierSearch.trim() || undefined },
      });
      if (res.data?.success) {
        setSuppliers(res.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat data supplier.');
    } finally {
      setSuppliersLoading(false);
    }
  }, [supplierSearch]);

  useEffect(() => {
    if (isAllowed) {
      if (activeTab === 'po') fetchPurchaseOrders();
      if (activeTab === 'opname') fetchOpnames();
      if (activeTab === 'suppliers') fetchSuppliers();
    }
  }, [activeTab, fetchPurchaseOrders, fetchOpnames, fetchSuppliers, isAllowed]);

  // Handle PO Receive
  const handleReceivePo = async (po) => {
    if (!canManage) {
      toast.error('Akses Ditolak: Anda tidak memiliki hak akses mengubah stok.');
      return;
    }

    if (
      !window.confirm(
        `Konfirmasi penerimaan barang untuk PO ${po.poNumber}? Stok fisik di cabang tujuan akan otomatis ditambahkan.`
      )
    ) {
      return;
    }

    try {
      const res = await api.patch(`/purchase-orders/${po.id}/receive`);
      if (res.data?.success) {
        toast.success('Barang PO berhasil diterima dan stok fisik telah bertambah!');
        fetchPurchaseOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menerima barang PO.');
    }
  };

  // Handle PO Cancel
  const handleCancelPo = async (po) => {
    if (!canManage) {
      toast.error('Akses Ditolak: Anda tidak memiliki hak akses mengubah PO.');
      return;
    }

    if (!window.confirm(`Batalkan pesanan pembelian ${po.poNumber}?`)) {
      return;
    }

    try {
      const res = await api.patch(`/purchase-orders/${po.id}/cancel`);
      if (res.data?.success) {
        toast.success('Purchase Order berhasil dibatalkan.');
        fetchPurchaseOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan PO.');
    }
  };

  // Handle Delete Supplier
  const handleDeleteSupplier = async (sup) => {
    if (!canManage) {
      toast.error('Akses Ditolak: Anda tidak memiliki hak akses mengelola supplier.');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus supplier "${sup.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/suppliers/${sup.id}`);
      toast.success('Supplier berhasil dihapus.');
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus supplier.');
    }
  };

  if (!isAllowed && user) {
    return <UnauthorizedState requiredPermission="inventory:view" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-800 text-xs font-extrabold tracking-wide uppercase shadow-2xs backdrop-blur-md mb-2">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>Manajemen Rantai Pasok (Supply Chain)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Pengadaan & Audit Stok
          </h1>
          <p className="text-sm text-slate-600 font-normal">
            Kelola pesanan barang masuk (PO), audit fisik stok opname, dan daftar supplier rekanan.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex p-1 bg-white/80 backdrop-blur-xl border border-white/90 shadow-2xs rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('po')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'po'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Pengadaan (PO)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('opname')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'opname'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Stok Opname
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Pemasok (Suppliers)
          </button>
        </div>
      </div>

      {/* PRO Shortcut Banner: Inter-Branch Stock Transfers */}
      <div className="p-4 rounded-3xl bg-linear-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-200/80 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <Truck className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-900">Transfer Stok Antar Cabang</h4>
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Kirim mutasi barang antar outlet dengan sistem persetujuan dua arah.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/inventory/transfers"
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-colors self-end sm:self-auto"
        >
          <span>Buka Modul Transfer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* TAB 1: PENGADAAN (PURCHASE ORDERS) */}
      {activeTab === 'po' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsPoModalOpen(true)}
              className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Purchase Order Baru</span>
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl overflow-hidden">
            {poLoading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Memuat data PO...</p>
              </div>
            ) : purchaseOrders.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800">Belum ada pesanan pembelian (PO)</p>
                <p className="text-xs text-slate-500">Klik tombol di atas untuk membuat PO ke supplier.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-5">No. PO & Tanggal</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Cabang Masuk</th>
                      <th className="py-3 px-4">Item Dipesan</th>
                      <th className="py-3 px-4">Total Biaya</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseOrders.map((po) => (
                      <tr key={po.id} className="hover:bg-amber-50/20">
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-slate-900 font-mono">{po.poNumber}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(po.orderDate || po.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {po.supplier?.name || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {po.branch?.name || 'Cabang Utama'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {po.items?.length || 0} Jenis Item
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          Rp {(po.totalAmount || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              po.status === 'RECEIVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : po.status === 'ORDERED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {po.status === 'ORDERED' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleReceivePo(po)}
                                className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs"
                              >
                                Terima Barang
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelPo(po)}
                                className="py-1 px-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-[11px]"
                              >
                                Batal
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT STOK (STOCK OPNAME) */}
      {activeTab === 'opname' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpnameModalOpen(true)}
              className="py-2.5 px-4 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Mulai Sesi Stok Opname</span>
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl overflow-hidden">
            {opnameLoading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Memuat riwayat audit stok...</p>
              </div>
            ) : opnames.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800">Belum ada riwayat audit stok opname</p>
                <p className="text-xs text-slate-500">
                  Lakukan stok opname berkala untuk mendeteksi selisih barang dan mencegah kerugian.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-5">No. Opname & Tanggal</th>
                      <th className="py-3 px-4">Cabang</th>
                      <th className="py-3 px-4">Auditor</th>
                      <th className="py-3 px-4">Item Diaudit</th>
                      <th className="py-3 px-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {opnames.map((op) => (
                      <tr key={op.id} className="hover:bg-amber-50/20">
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-slate-900 font-mono">{op.opnameNo}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(op.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {op.branch?.name || 'Cabang'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {op.creator?.name || 'Staf'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-black text-slate-900">{op.items?.length || 0}</span> Produk
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">
                          {op.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PEMASOK (SUPPLIERS) */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder="Cari nama supplier..."
                className="w-full pl-9 pr-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedSupplierForEdit(null);
                setIsSupplierModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pemasok Baru</span>
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-3xl overflow-hidden">
            {suppliersLoading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Memuat data supplier...</p>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800">Belum ada rekanan supplier terdaftar</p>
                <p className="text-xs text-slate-500">
                  Daftarkan vendor bahan baku atau produk jadi untuk memudahkan proses restock.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-5">Nama Pemasok / Perusahaan</th>
                      <th className="py-3 px-4">Kontak PIC</th>
                      <th className="py-3 px-4">Telepon</th>
                      <th className="py-3 px-4">Alamat</th>
                      <th className="py-3 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-amber-50/20">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          {sup.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{sup.contactName || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-700">{sup.phone || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{sup.address || '-'}</td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSupplierForEdit(sup);
                                setIsSupplierModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSupplier(sup)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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
          </div>
        </div>
      )}

      {/* Modals */}
      <CreatePoModal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        onSuccess={fetchPurchaseOrders}
        suppliers={suppliers}
        branches={branches}
      />

      <StockOpnameModal
        isOpen={isOpnameModalOpen}
        onClose={() => setIsOpnameModalOpen(false)}
        onSuccess={fetchOpnames}
        branchId={activeBranch?.id || branches[0]?.id}
      />

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplier={selectedSupplierForEdit}
        onSuccess={fetchSuppliers}
      />
    </div>
  );
}
