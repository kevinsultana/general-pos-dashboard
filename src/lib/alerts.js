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

export default GlassSwal;
