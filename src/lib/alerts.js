import Swal from 'sweetalert2';

/**
 * Konfigurasi kustom SweetAlert2 dengan sentuhan Light-Mode Glassmorphism
 */
const GlassSwal = Swal.mixin({
  customClass: {
    popup:
      '!rounded-3xl !border !border-white/90 !bg-white/95 !backdrop-blur-2xl !shadow-[0_20px_50px_rgba(0,0,0,0.12)] !p-7',
    title: '!text-lg !font-extrabold !text-slate-900 !tracking-tight',
    htmlContainer: '!text-xs !text-slate-600 !leading-relaxed',
    confirmButton:
      '!rounded-xl !px-5 !py-2.5 !text-xs !font-bold !text-white !bg-slate-900 hover:!bg-slate-800 !shadow-md !transition-all !mx-1.5',
    cancelButton:
      '!rounded-xl !px-5 !py-2.5 !text-xs !font-semibold !text-slate-700 !bg-slate-100 hover:!bg-slate-200 !border !border-slate-200 !transition-all !mx-1.5',
    actions: '!gap-2 !mt-5',
  },
  buttonsStyling: false,
});

/**
 * Dialog Pengesahan (Confirmation)
 * @param {object} options
 */
export const showConfirmDialog = async ({
  title = 'Adakah anda pasti?',
  text = 'Tindakan ini tidak boleh dibatalkan.',
  confirmButtonText = 'Ya, Teruskan',
  cancelButtonText = 'Batal',
  icon = 'warning',
}) => {
  return GlassSwal.fire({
    title,
    text,
    icon,
    iconColor: '#f59e0b',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  });
};

/**
 * Dialog Pengesahan Log Keluar (Logout Confirmation)
 */
export const confirmLogout = async (options = {}) => {
  return showConfirmDialog({
    title: options.title || 'Log Keluar dari Omni POS?',
    text: options.text || 'Sesi kerja dan sambungan terminal aktif anda pada peranti ini akan ditamatkan.',
    confirmButtonText: options.confirmButtonText || 'Ya, Log Keluar',
    cancelButtonText: options.cancelButtonText || 'Kekal di Sistem',
    icon: 'question',
  });
};

/**
 * Dialog Maklumat / Notis Pentadbiran
 */
export const showAlertNotice = async ({
  title,
  text,
  icon = 'info',
  confirmButtonText = 'Faham',
}) => {
  return GlassSwal.fire({
    title,
    text,
    icon,
    confirmButtonText,
  });
};

let isHandlingSessionExpired = false;

/**
 * Dialog SweetAlert2 Notifikasi Sesi Habis & Auto Redirect ke Halaman Login
 */
export const handleSessionExpired = (message) => {
  if (typeof window === 'undefined') return;
  if (isHandlingSessionExpired) return;
  if (window.location.pathname === '/login') return;

  // Hanya picu jika pengguna sedang berada di halaman internal dashboard
  if (!window.location.pathname.startsWith('/dashboard')) return;

  isHandlingSessionExpired = true;

  // Bersihkan data sesi lokal agar fresh saat login kembali
  localStorage.removeItem('omnipos_token');
  localStorage.removeItem('omnipos_user');
  localStorage.removeItem('omnipos_tenant');

  showAlertNotice({
    title: 'Sesi Telah Habis',
    text: message || 'Sesi login Anda telah habis atau belum terotentikasi. Silakan login kembali.',
    icon: 'warning',
    confirmButtonText: 'Login Sekarang',
  }).then(() => {
    isHandlingSessionExpired = false;
    window.location.href = '/login';
  });

  // Otomatis arahkan ke /login dalam 2.5 detik jika tombol dialog tidak ditekan
  setTimeout(() => {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    isHandlingSessionExpired = false;
  }, 2500);
};

/**
 * Dialog SweetAlert2 untuk Tahan Pesanan (Hold Cart)
 * Mengumpulkan Label Antrean dan Catatan Opsional
 */
export const promptHoldCart = async (defaultLabel = 'Antrean') => {
  return GlassSwal.fire({
    title: 'Tahan Pesanan (Hold Cart)',
    html: `
      <div style="text-align: left; margin-top: 8px;">
        <label style="display:block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">
          Nama / Label Antrean <span style="color: #ef4444;">*</span>
        </label>
        <input
          id="swal-hold-label"
          class="swal2-input"
          placeholder="Cth: Meja 3, Bu Sari, Walk-in 1"
          value="${defaultLabel}"
          style="width: 100%; box-sizing: border-box; margin: 0 0 14px 0; padding: 10px 14px; font-size: 13px; font-weight: 700; border-radius: 12px; border: 1px solid #cbd5e1; outline: none; background: #f8fafc;"
        />
        <label style="display:block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">
          Catatan Tambahan (Opsional)
        </label>
        <input
          id="swal-hold-notes"
          class="swal2-input"
          placeholder="Cth: Ambil dompet di mobil, tambah pesanan..."
          style="width: 100%; box-sizing: border-box; margin: 0; padding: 10px 14px; font-size: 12px; font-weight: 500; border-radius: 12px; border: 1px solid #cbd5e1; outline: none; background: #f8fafc;"
        />
      </div>
    `,
    icon: 'info',
    iconColor: '#f59e0b',
    showCancelButton: true,
    confirmButtonText: 'Tahan Sekarang',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    focusConfirm: false,
    preConfirm: () => {
      const labelEl = document.getElementById('swal-hold-label');
      const notesEl = document.getElementById('swal-hold-notes');
      const label = labelEl ? labelEl.value.trim() : '';
      const notes = notesEl ? notesEl.value.trim() : '';
      if (!label) {
        Swal.showValidationMessage('Nama / label antrean wajib diisi!');
        return false;
      }
      return { label, notes };
    },
  });
};

/**
 * Konfirmasi Timpa Keranjang saat Recall
 */
export const confirmRecallCart = async (label) => {
  return GlassSwal.fire({
    title: 'Timpa Keranjang Aktif?',
    text: `Keranjang aktif saat ini akan digantikan oleh antrean "${label}". Pesanan aktif yang belum disimpan akan hilang.`,
    icon: 'warning',
    iconColor: '#f59e0b',
    showCancelButton: true,
    confirmButtonText: 'Ya, Muat Antrean',
    cancelButtonText: 'Batal',
    reverseButtons: true,
  });
};

/**
 * Konfirmasi Hapus Keranjang Tertahan (Hold Cart)
 * Menampilkan nama/label antrean yang akan dihapus permanen
 */
export const confirmDeleteHeldCart = async (label) => {
  return GlassSwal.fire({
    title: 'Hapus Antrean Tertahan?',
    html: `
      <div style="text-align: center; padding: 4px 0;">
        <div style="display: inline-block; margin: 8px auto 16px; padding: 8px 18px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; font-family: monospace; font-size: 14px; font-weight: 900; color: #78350f; letter-spacing: 0.05em;">
          ${label || 'Antrean Ini'}
        </div>
        <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 0;">
          Antrean tertahan ini beserta seluruh item pesanannya akan <strong style="color: #dc2626;">dihapus permanen</strong>.<br/>
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </div>
    `,
    icon: 'warning',
    iconColor: '#ef4444',
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus Antrean',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    customClass: {
      popup:
        '!rounded-3xl !border !border-white/90 !bg-white/95 !backdrop-blur-2xl !shadow-[0_20px_50px_rgba(0,0,0,0.12)] !p-7',
      title: '!text-lg !font-extrabold !text-slate-900 !tracking-tight',
      htmlContainer: '!text-xs !text-slate-600 !leading-relaxed',
      confirmButton:
        '!rounded-xl !px-5 !py-2.5 !text-xs !font-bold !text-white !bg-rose-600 hover:!bg-rose-700 !shadow-md !transition-all !mx-1.5',
      cancelButton:
        '!rounded-xl !px-5 !py-2.5 !text-xs !font-semibold !text-slate-700 !bg-slate-100 hover:!bg-slate-200 !border !border-slate-200 !transition-all !mx-1.5',
      actions: '!gap-2 !mt-5',
    },
    buttonsStyling: false,
  });
};

export default GlassSwal;
