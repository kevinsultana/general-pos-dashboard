/**
 * Utility functions for OmniPOS
 */

/**
 * Combines class names, filtering out falsy values.
 * @param {...any} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes
    .flatMap((item) => {
      if (!item) return [];
      if (typeof item === 'string') return [item];
      if (Array.isArray(item)) return item;
      if (typeof item === 'object') {
        return Object.entries(item)
          .filter(([, val]) => Boolean(val))
          .map(([key]) => key);
      }
      return [String(item)];
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Formats a number as Indonesian Rupiah currency.
 * @param {number|string} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

/**
 * Formats a raw number into Indonesian thousand-separated string (e.g. 1500000 -> "1.500.000")
 * @param {number|string} val
 * @returns {string}
 */
export function formatThousand(val) {
  if (val === undefined || val === null || val === '') return '';
  const numStr = String(val).replace(/\D/g, '');
  if (!numStr) return '';
  return Number(numStr).toLocaleString('id-ID');
}

/**
 * Parses a thousand-separated string into a pure integer/number (e.g. "1.500.000" -> 1500000)
 * @param {string|number} val
 * @returns {number}
 */
export function parseThousand(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/\D/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * Kompres gambar via Canvas API hingga di bawah `maxKB` kilobyte.
 * Iteratif turunkan kualitas JPEG 0.05/step sampai target tercapai atau q < 0.15.
 * PNG yang sudah kecil dikembalikan apa adanya jika sudah di bawah limit.
 *
 * @param {File} file          - File gambar input (PNG/JPEG/WebP)
 * @param {number} maxKB       - Target ukuran maksimal dalam KB (default 300)
 * @returns {Promise<File>}    - File terkompresi
 */
export async function compressImage(file, maxKB = 300) {
  const maxBytes = maxKB * 1024;
  if (file.size <= maxBytes) return file; // sudah kecil, langsung pakai

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Skala dimensi proporsional jika lebar > 1200px
      const MAX_DIM = 1200;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.85;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Gagal mengompres gambar.'));
            if (blob.size <= maxBytes || quality < 0.15) {
              resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }));
            } else {
              quality = Math.max(quality - 0.05, 0.1);
              tryCompress();
            }
          },
          'image/jpeg',
          quality,
        );
      };
      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal membaca file gambar.'));
    };
    img.src = url;
  });
}

/**
 * Formats a date to include time (ID format).
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
