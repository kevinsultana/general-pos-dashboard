"use client";

import { useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";
import { User, Phone, Mail, Plus, X, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { customStyles } from "./AppSelect";

/**
 * Komponen Pemilih & Pendaftaran Cepat Pelanggan untuk Kasir POS
 */
export default function CustomerSelect({ value, onChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load pelanggan berdasarkan pencarian (nama / no hp)
  const loadOptions = async (inputValue) => {
    try {
      const res = await api.get(`/customers?search=${encodeURIComponent(inputValue || "")}&limit=15`);
      if (res?.success) {
        const fetched = (res.data || []).map((c) => ({
          value: c.id,
          label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`,
          customer: c,
        }));

        // Opsi bawaan: Pelanggan Umum (Guest)
        if (!inputValue) {
          return [
            {
              value: null,
              label: "Pelanggan Umum (Guest)",
              customer: null,
            },
            ...fetched,
          ];
        }
        return fetched;
      }
      return [];
    } catch {
      return [];
    }
  };

  // Kasir memilih opsi "Daftarkan nama baru"
  const handleCreateOption = (inputValue) => {
    setNewName(inputValue);
    setNewPhone("");
    setNewEmail("");
    setIsModalOpen(true);
  };

  // Simpan data pelanggan baru dari popup cepat
  const handleSaveCustomer = async (e) => {
    e?.preventDefault();
    if (!newName.trim()) {
      toast.error("Nama pelanggan wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/customers", {
        name: newName.trim(),
        phone: newPhone.trim() || null,
        email: newEmail.trim() || null,
      });

      if (res?.success) {
        toast.success(`Pelanggan "${res.data.name}" berhasil didaftarkan!`);
        const newOption = {
          value: res.data.id,
          label: `${res.data.name} ${res.data.phone ? `(${res.data.phone})` : ""}`,
          customer: res.data,
        };
        onChange(newOption);
        setIsModalOpen(false);
      }
    } catch (err) {
      toast.error(err.message || "Gagal mendaftarkan pelanggan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-500" />
            Pelanggan
          </span>
          <button
            type="button"
            onClick={() => {
              setNewName("");
              setNewPhone("");
              setNewEmail("");
              setIsModalOpen(true);
            }}
            className="text-[11px] font-extrabold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Baru
          </button>
        </div>

        <AsyncCreatableSelect
          instanceId="pos-customer-select"
          cacheOptions
          defaultOptions
          loadOptions={loadOptions}
          value={value}
          onChange={onChange}
          onCreateOption={handleCreateOption}
          placeholder="Cari / daftarkan pelanggan..."
          styles={{
            ...customStyles,
            control: (base, state) => ({
              ...customStyles.control(base, state),
              borderRadius: "0.85rem",
              padding: "1px 2px",
            }),
          }}
          formatCreateLabel={(inputValue) => `+ Daftarkan "${inputValue}" sebagai pelanggan baru`}
          noOptionsMessage={() => "Ketik nama/no HP untuk mendaftar..."}
        />
      </div>

      {/* Modal Cepat Tambah Pelanggan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Daftar Pelanggan Cepat</h3>
                  <p className="text-[10px] text-slate-400">Database pelanggan toko</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nama pelanggan..."
                    required
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Unik per pelanggan toko</p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Alamat Email (Opsional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="pelanggan@email.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-98 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Daftarkan & Pilih</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
