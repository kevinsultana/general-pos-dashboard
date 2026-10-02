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
