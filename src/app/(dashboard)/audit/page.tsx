'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  User,
  Clock,
  FileCode,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Eye,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/formatters';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs({
        entityType: filterEntity || undefined,
        limit: 100,
      });
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filterEntity]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('CANCEL') || act.includes('REFUND')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (act.includes('CREATE') || act.includes('IN')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (act.includes('UPDATE') || act.includes('ADJUST') || act.includes('PRICE')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Audit Trail & Rekam Jejak Sistem"
        description="Pencatatan lengkap perubahan data sensitif, pembatalan transaksi, refund, dan modifikasi harga (Who, What, When)"
      />

      <main className="p-6 space-y-6 flex-1">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-4">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Log Keamanan & Integritas Data
              </h3>
              <p className="text-[11px] text-slate-400">
                Data historis bersifat permanen dan tidak dapat dihapus
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="pos-select text-xs px-3 py-1.5"
            >
              <option value="">Semua Entitas Data</option>
              <option value="TRANSACTION">Transaksi Kasir</option>
              <option value="PRODUCT">Produk & Harga</option>
              <option value="INVENTORY">Stok & Inventori</option>
              <option value="PROMOTION">Promosi & Diskon</option>
              <option value="ROLE">Hak Akses & Staf</option>
              <option value="STORE">Pengaturan Toko</option>
            </select>

            <button
              onClick={loadLogs}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-4 font-semibold w-10"></th>
                  <th className="py-3 px-4 font-semibold">Waktu (When)</th>
                  <th className="py-3 px-4 font-semibold">Pelaku (Who)</th>
                  <th className="py-3 px-4 font-semibold">Aksi (What)</th>
                  <th className="py-3 px-4 font-semibold">Entitas Terkait</th>
                  <th className="py-3 px-4 font-semibold">Alasan / Catatan</th>
                  <th className="py-3 px-4 font-semibold text-right">Rincian Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Memuat rekaman audit log...
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const reason =
                      log.metadata?.reason ||
                      log.metadata?.description ||
                      log.reason ||
                      '-';

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() => toggleExpand(log.id)}
                          className="hover:bg-slate-800/30 transition cursor-pointer"
                        >
                          <td className="py-3 px-4 text-slate-500">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-200">
                                {log.user?.displayName || log.user?.username || 'Sistem Cloud'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadgeColor(
                                log.action
                              )}`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-300 font-medium">
                              {log.entityType}
                            </span>
                            {log.entityId && (
                              <span className="block font-mono text-[10px] text-slate-500 truncate max-w-28">
                                {log.entityId}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                            {reason}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition inline-flex items-center space-x-1"
                            >
                              <FileCode className="w-3 h-3 text-indigo-400" />
                              <span>Diff JSON</span>
                            </button>
                          </td>
                        </tr>

                        {/* Inline Expandable Details */}
                        {isExpanded && (
                          <tr className="bg-slate-950/60">
                            <td colSpan={7} className="p-4 border-y border-slate-800/80">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px]">
                                {log.beforeData && (
                                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-2">
                                      Data Sebelumnya (Before)
                                    </p>
                                    <pre className="overflow-x-auto text-slate-300 text-[10px] max-h-48">
                                      {JSON.stringify(log.beforeData, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.afterData && (
                                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                                      Data Sesudahnya (After)
                                    </p>
                                    <pre className="overflow-x-auto text-slate-300 text-[10px] max-h-48">
                                      {JSON.stringify(log.afterData, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">
                                    Metadata Operasi
                                  </p>
                                  <pre className="overflow-x-auto text-slate-300 text-[10px] max-h-48">
                                    {JSON.stringify(
                                      log.metadata || { note: 'Tidak ada metadata tambahan' },
                                      null,
                                      2
                                    )}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Belum ada rekaman audit log yang tercatat
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal JSON Inspector */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-2xl p-6 space-y-4 border-slate-700 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-slate-100 text-sm">
                    Payload Audit Log: {selectedLog.action}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <p>
                    <span className="text-slate-500">ID Log:</span> {selectedLog.id}
                  </p>
                  <p>
                    <span className="text-slate-500">Waktu:</span> {formatDate(selectedLog.createdAt)}
                  </p>
                  <p>
                    <span className="text-slate-500">User:</span>{' '}
                    {selectedLog.user?.displayName || selectedLog.user?.username || 'System Cloud'}
                  </p>
                  <p>
                    <span className="text-slate-500">Target Entity:</span> {selectedLog.entityType} ({selectedLog.entityId || '-'})
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 overflow-x-auto">
                  <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
