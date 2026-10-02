'use client';

/**
 * BluetoothPrinterContext
 * ─────────────────────────────────────────────────────────────────────────────
 * Global React Context untuk koneksi Web Bluetooth Thermal Printer (BLE).
 * Di-mount di DashboardLayout agar koneksi printer tetap hidup selama sesi kerja kasir.
 *
 * Mengekspos:
 *  - btStatus        : 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnecting' | 'error' | 'unsupported'
 *  - btDeviceName    : string nama printer yang terhubung
 *  - btServiceUuid   : UUID profile yang dipilih ('auto', '18f0', 'ffe0', dll)
 *  - btErrorMsg      : pesan error terakhir
 *  - isConnected     : boolean apakah siap mencetak
 *  - isReconnecting  : boolean sedang reconnect otomatis
 *  - connect()       : buka BLE device picker & hubungkan printer
 *  - disconnect()    : putus koneksi printer
 *  - printBytes()    : kirim array bytes ESC/POS ke printer
 *  - buildReceiptBytes() : generate ESC/POS bytes untuk struk pelanggan atau tiket dapur
 *  - buildQrCardBytes()  : generate ESC/POS bytes untuk cetak QR meja
 */

import { createContext, useContext, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

// ── BLE Profile Definitions ──────────────────────────────────────────────────
export const BLE_PROFILES = [
  {
    label: 'Auto-Detect (Coba Semua Profile)',
    serviceUuid: 'auto',
    services: [
      { svc: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb' },
      { svc: '0000ffe0-0000-1000-8000-00805f9b34fb', char: '0000ffe1-0000-1000-8000-00805f9b34fb' },
      { svc: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', char: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f' },
      { svc: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-1e4d-4bd9-ba61-23c647249616' },
      { svc: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af0-0000-1000-8000-00805f9b34fb' },
    ],
  },
  {
    label: 'HM-10 / Generic BLE UART (FFE0)',
    serviceUuid: '0000ffe0-0000-1000-8000-00805f9b34fb',
    services: [{ svc: '0000ffe0-0000-1000-8000-00805f9b34fb', char: '0000ffe1-0000-1000-8000-00805f9b34fb' }],
  },
  {
    label: 'Zjiang / GOOJPRT / RONGTA / Panda (18F0)',
    serviceUuid: '000018f0-0000-1000-8000-00805f9b34fb',
    services: [
      { svc: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb' },
      { svc: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af0-0000-1000-8000-00805f9b34fb' },
    ],
  },
  {
    label: 'SUNMI / iMin POS Terminal (E7810A71)',
    serviceUuid: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    services: [{ svc: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', char: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f' }],
  },
  {
    label: 'Microchip RN4870/71 (49535343)',
    serviceUuid: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    services: [{ svc: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-1e4d-4bd9-ba61-23c647249616' }],
  },
];

const ALL_BLE_SERVICE_UUIDS = BLE_PROFILES.flatMap((p) =>
  p.services.map((s) => s.svc)
).filter((v, i, a) => a.indexOf(v) === i);

// ── Context ──────────────────────────────────────────────────────────────────
const BluetoothPrinterContext = createContext(null);

// ── ESC/POS Helpers ──────────────────────────────────────────────────────────
const ESC = 0x1b;
const GS = 0x1d;

function enc(text) {
  // Ganti non-breaking space atau whitespace Unicode dengan spasi standar ASCII (0x20)
  const sanitized = String(text ?? '').replace(/[   -​]/g, ' ');
  return new TextEncoder().encode(sanitized);
}

function concat(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const a of arrays) {
    out.set(a, pos);
    pos += a.length;
  }
  return out;
}

function padRight(str, len) {
  return String(str).padEnd(len, ' ').slice(0, len);
}

/** Format angka ke Rupiah ringkas (ASCII murni untuk ESC/POS printer) */
function fmtRp(num) {
  if (num === null || num === undefined || isNaN(Number(num))) return 'Rp 0';
  const n = Math.round(Number(num));
  const formatted = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 ? '-Rp ' : 'Rp ') + formatted;
}

/** Format tanggal & waktu lokal (ASCII murni) */
function fmtDt(dateVal) {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// ── In-Memory Cache untuk ESC/POS Raster Bytes ────────────────────────────────
const rasterCache = new Map();

export function clearRasterCache() {
  rasterCache.clear();
}

/**
 * Konversi URL gambar ke format ESC/POS raster bit image (GS v 0).
 */
export async function rasterizeImageUrl(imageUrl, maxDots = 224, maxH = 130) {
  if (typeof window === 'undefined' || !imageUrl) return null;

  const cacheKey = `${imageUrl}@${maxDots}x${maxH}`;
  if (rasterCache.has(cacheKey)) {
    return rasterCache.get(cacheKey);
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const origW = img.naturalWidth || img.width;
          const origH = img.naturalHeight || img.height;
          if (!origW || !origH) return resolve(null);

          let scale = 1.0;
          if (origW > maxDots) {
            scale = Math.min(scale, maxDots / origW);
          }
          if (maxH && (origH * scale) > maxH) {
            scale = Math.min(scale, maxH / origH);
          }

          let targetW = Math.round(origW * scale);
          targetW = Math.max(8, Math.floor(targetW / 8) * 8);
          let targetH = Math.round((origH * targetW) / origW);
          if (targetH <= 0) return resolve(null);

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const imgData = ctx.getImageData(0, 0, targetW, targetH);
          const data = imgData.data;

          const bytesWidth = targetW / 8;
          const rasterBytes = new Uint8Array(8 + bytesWidth * targetH);

          rasterBytes[0] = GS;
          rasterBytes[1] = 0x76;
          rasterBytes[2] = 0x30;
          rasterBytes[3] = 0x00;
          rasterBytes[4] = bytesWidth & 0xff;
          rasterBytes[5] = (bytesWidth >> 8) & 0xff;
          rasterBytes[6] = targetH & 0xff;
          rasterBytes[7] = (targetH >> 8) & 0xff;

          let offset = 8;
          for (let y = 0; y < targetH; y++) {
            for (let b = 0; b < bytesWidth; b++) {
              let byteVal = 0;
              for (let bit = 0; bit < 8; bit++) {
                const x = b * 8 + bit;
                const idx = (y * targetW + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const bl = data[idx + 2];
                const a = data[idx + 3];

                const lum = a < 128 ? 255 : 0.299 * r + 0.587 * g + 0.114 * bl;
                if (lum < 165) {
                  byteVal |= 0x80 >> bit;
                }
              }
              rasterBytes[offset++] = byteVal;
            }
          }

          rasterCache.set(cacheKey, rasterBytes);
          resolve(rasterBytes);
        } catch (canvasErr) {
          console.warn('[rasterizeImageUrl] Canvas error:', canvasErr);
          resolve(null);
        }
      };
      img.onerror = (e) => {
        console.warn('[rasterizeImageUrl] Image load error:', e);
        resolve(null);
      };
      img.src = imageUrl;
    } catch (err) {
      console.warn('[rasterizeImageUrl] Error:', err);
      resolve(null);
    }
  });
}

/**
 * Build ESC/POS bytes untuk Struk Pelanggan (CUSTOMER) atau Tiket Dapur (KITCHEN)
 */
export async function buildReceiptBytes(order, store = {}, mode = 'CUSTOMER') {
  const isSmallFont = store?.receiptFontSize === 'SMALL';
  const defaultCols = (store?.printerWidth || 58) === 80
    ? (isSmallFont ? 64 : 48)
    : (isSmallFont ? 42 : 32);
  const cols = (store?.receiptCols && Number(store.receiptCols) > 0)
    ? Number(store.receiptCols)
    : defaultCols;
  const sep = '-'.repeat(cols);
  const isKitchen = mode === 'KITCHEN';

  const orderNum = order?.receiptNumber || order?.orderNumber || '-';
  const rawQueue =
    order?.queueNumber ||
    order?.queue_number ||
    order?.queue ||
    order?.tableNumber ? `Meja ${order.tableNumber}` : (orderNum ? orderNum.slice(-4) : '-');

  const isTakeaway =
    order?.orderType === 'TAKEAWAY' ||
    String(rawQueue).toUpperCase().startsWith('TA');

  const parts = [];

  // Init printer
  parts.push(new Uint8Array([ESC, 0x40]));

  // Font style
  if (isSmallFont) {
    parts.push(new Uint8Array([ESC, 0x4D, 0x01]));
  } else {
    parts.push(new Uint8Array([ESC, 0x4D, 0x00]));
  }

  if (isKitchen) {
    // ══════════════════════════════════════════════════════════════════════════
    // MODE KITCHEN (TIKET DAPUR) — HANYA ITEM & CATATAN, TANPA HARGA
    // ══════════════════════════════════════════════════════════════════════════
    parts.push(new Uint8Array([ESC, 0x61, 0x01])); // center
    parts.push(new Uint8Array([ESC, 0x45, 0x01])); // bold on
    parts.push(new Uint8Array([ESC, 0x21, 0x10])); // double height
    parts.push(enc('== TIKET DAPUR ==\n'));
    parts.push(new Uint8Array([ESC, 0x21, 0x00])); // normal
    const typeBadge = isTakeaway ? '[ BUNGKUS / TAKEAWAY ]' : '[ DINE IN / DI TEMPAT ]';
    parts.push(enc(typeBadge + '\n'));
    parts.push(new Uint8Array([ESC, 0x45, 0x00])); // bold off
    parts.push(enc(sep + '\n'));

    // Nomor Antrean / Meja Besar
    parts.push(new Uint8Array([ESC, 0x61, 0x01])); // center
    parts.push(enc('NOMOR ANTREAN / MEJA\n'));
    parts.push(new Uint8Array([ESC, 0x45, 0x01])); // bold on
    parts.push(new Uint8Array([ESC, 0x21, 0x30])); // double width & height
    parts.push(enc((order?.tableNumber ? `MEJA ${order.tableNumber}` : rawQueue) + '\n'));
    parts.push(new Uint8Array([ESC, 0x21, 0x00])); // normal
    parts.push(new Uint8Array([ESC, 0x45, 0x00])); // bold off
    parts.push(enc(sep + '\n'));

    // Metadata
    parts.push(new Uint8Array([ESC, 0x61, 0x00])); // left
    parts.push(enc('No. Struk : ' + orderNum + '\n'));
    parts.push(enc('Waktu     : ' + fmtDt(order?.createdAt || new Date()) + '\n'));
    parts.push(enc('Pelanggan : ' + (order?.customerName || order?.customer?.name || 'Umum') + '\n'));
    parts.push(enc('Tipe      : ' + (isTakeaway ? 'Takeaway / Bungkus' : 'Dine In / Di Tempat') + '\n'));
    parts.push(enc(sep + '\n'));

    // Daftar Pesanan (Item, Qty, Catatan)
    for (const item of (order?.items || [])) {
      const q = item.quantity || item.qty || 1;
      const pName = item.productName || item.productNameSnapshot || 'Menu';
      const vName = item.variantName || item.variantNameSnapshot || '';
      const notes = item.notes || '';

      parts.push(new Uint8Array([ESC, 0x45, 0x01])); // bold on
      parts.push(enc(`${q}x ${pName.toUpperCase()}\n`));
      parts.push(new Uint8Array([ESC, 0x45, 0x00])); // bold off

      if (vName && vName !== 'Standard' && vName !== 'Regular') {
        parts.push(enc(`   Varian: ${vName}\n`));
      }
      if (notes) {
        parts.push(new Uint8Array([ESC, 0x45, 0x01]));
        parts.push(enc(`   *Catatan: ${notes}\n`));
        parts.push(new Uint8Array([ESC, 0x45, 0x00]));
      }
    }

    parts.push(enc(sep + '\n'));
    parts.push(new Uint8Array([ESC, 0x61, 0x01])); // center
    parts.push(new Uint8Array([ESC, 0x45, 0x01]));
    parts.push(enc('*** SELESAIKAN PESANAN ***\n'));
    parts.push(new Uint8Array([ESC, 0x45, 0x00]));
  } else {
    // ══════════════════════════════════════════════════════════════════════════
    // MODE CUSTOMER (STRUK PELANGGAN LENGKAP)
    // ══════════════════════════════════════════════════════════════════════════
    const activeLogoUrl = store?.receiptLogoUrl || store?.logoUrl;
    if (store?.receiptShowLogo !== false && activeLogoUrl) {
      try {
        const is80 = (store?.printerWidth === 80);
        const maxDots = is80 ? 320 : 224;
        const maxH = is80 ? 160 : 130;
        const logoBytes = await rasterizeImageUrl(activeLogoUrl, maxDots, maxH);
        if (logoBytes) {
          parts.push(new Uint8Array([ESC, 0x61, 0x01])); // center
          parts.push(logoBytes);
          parts.push(enc('\n'));
        }
      } catch (err) {
        console.warn('[buildReceiptBytes] Logo print error:', err);
      }
    }

    // Nama Toko
    if (store?.receiptShowStoreName !== false) {
      parts.push(new Uint8Array([ESC, 0x61, 0x01])); // center
      parts.push(new Uint8Array([ESC, 0x45, 0x01])); // bold on
      if (store?.receiptDoubleHeight !== false) {
        parts.push(new Uint8Array([ESC, 0x21, 0x10])); // double height
      }
      parts.push(enc((store?.name || 'OMNI POS').toUpperCase() + '\n'));
      if (store?.receiptDoubleHeight !== false) {
        parts.push(new Uint8Array([ESC, 0x21, 0x00])); // normal
      }
      parts.push(new Uint8Array([ESC, 0x45, 0x00])); // bold off
    }

    // Sub-header / Alamat Toko
    if (store?.receiptHeader && store.receiptHeader.trim()) {
      const headerAlign = store?.receiptHeaderAlign === 'LEFT' ? 0x00 : store?.receiptHeaderAlign === 'RIGHT' ? 0x02 : 0x01;
      parts.push(new Uint8Array([ESC, 0x61, headerAlign]));
      if (store?.receiptHeaderBold) parts.push(new Uint8Array([ESC, 0x45, 0x01]));
      for (const line of store.receiptHeader.split('\n')) {
        if (line.trim()) parts.push(enc(line.trim() + '\n'));
      }
      if (store?.receiptHeaderBold) parts.push(new Uint8Array([ESC, 0x45, 0x00]));
    } else {
      parts.push(new Uint8Array([ESC, 0x61, 0x01]));
      parts.push(enc((store?.address || store?.branchName || 'Cabang Utama') + '\n'));
    }

    parts.push(new Uint8Array([ESC, 0x61, 0x01]));
    parts.push(enc(sep + '\n'));

    // Nomor Antrean / Meja
    if (order?.tableNumber || rawQueue) {
      parts.push(new Uint8Array([ESC, 0x61, 0x01]));
      parts.push(enc('NOMOR ANTREAN / MEJA\n'));
      parts.push(new Uint8Array([ESC, 0x45, 0x01]));
      parts.push(new Uint8Array([ESC, 0x21, 0x10]));
      parts.push(enc((order?.tableNumber ? `MEJA ${order.tableNumber}` : rawQueue) + '\n'));
      parts.push(new Uint8Array([ESC, 0x21, 0x00]));
      parts.push(new Uint8Array([ESC, 0x45, 0x00]));
      parts.push(enc(sep + '\n'));
    }

    // Metadata Transaksi
    parts.push(new Uint8Array([ESC, 0x61, 0x00])); // left
    parts.push(enc('Waktu    : ' + fmtDt(order?.createdAt || new Date()) + '\n'));
    parts.push(enc('No.Struk : ' + orderNum + '\n'));
    parts.push(enc('Kasir    : ' + (order?.cashierName || order?.createdBy?.name || 'Kasir') + '\n'));
    parts.push(enc('Pelanggan: ' + (order?.customerName || order?.customer?.name || 'Umum') + '\n'));
    parts.push(enc('Pesanan  : ' + (isTakeaway ? 'Takeaway / Bungkus' : 'Dine In / Di Tempat') + '\n'));
    parts.push(enc(sep + '\n'));

    // Rincian Item Belanja
    let calculatedSubtotal = 0;
    for (const item of (order?.items || [])) {
      const q = item.quantity || item.qty || 1;
      const price = parseFloat(item.price || item.unitPrice || 0);
      const subtotal = parseFloat(item.subtotal || price * q);
      calculatedSubtotal += subtotal;

      const pName = item.productName || item.productNameSnapshot || 'Item';
      const vName = item.variantName || item.variantNameSnapshot || '';
      const fullName = pName + (vName && vName !== 'Standard' && vName !== 'Regular' ? ` (${vName})` : '');

      if (fullName.length > cols) {
        parts.push(enc(fullName.slice(0, cols) + '\n'));
      } else {
        parts.push(enc(fullName + '\n'));
      }

      const qtyStr = `${q}x ${fmtRp(price)}`;
      const subStr = fmtRp(subtotal);
      const gap = cols - qtyStr.length - subStr.length;
      parts.push(enc(qtyStr + ' '.repeat(Math.max(1, gap)) + subStr + '\n'));

      // Catatan produk jika ada
      if (item.notes) {
        parts.push(enc(`  *Catatan: ${item.notes}\n`));
      }
    }

    parts.push(enc(sep + '\n'));

    // Ringkasan Finansial
    const printRow = (label, value) => {
      const valStr = String(value);
      parts.push(enc(padRight(label, cols - valStr.length) + valStr + '\n'));
    };

    const finalTotal = parseFloat(order?.totalAmount || order?.grandTotal || calculatedSubtotal);
    printRow('Subtotal:', fmtRp(calculatedSubtotal));

    if (order?.taxAmount && Number(order.taxAmount) > 0) {
      printRow('Pajak:', fmtRp(order.taxAmount));
    }
    if (order?.discountAmount && Number(order.discountAmount) > 0) {
      printRow('Diskon:', '-' + fmtRp(order.discountAmount));
    }

    parts.push(enc(sep + '\n'));

    // TOTAL (Bold + Double Height)
    parts.push(new Uint8Array([ESC, 0x45, 0x01]));
    if (store?.receiptDoubleHeight !== false) {
      parts.push(new Uint8Array([ESC, 0x21, 0x10]));
    }
    const totalStr = fmtRp(finalTotal);
    parts.push(enc(padRight('TOTAL', cols - totalStr.length) + totalStr + '\n'));
    if (store?.receiptDoubleHeight !== false) {
      parts.push(new Uint8Array([ESC, 0x21, 0x00]));
    }
    parts.push(new Uint8Array([ESC, 0x45, 0x00]));
    parts.push(enc(sep + '\n'));

    // Pembayaran
    const method = order?.paymentMethod || order?.payment?.method || 'CASH';
    printRow('Metode Bayar:', method);

    if (method === 'CASH') {
      const received = order?.cashReceived || order?.payment?.cashReceived || finalTotal;
      const change = order?.changeAmount || order?.payment?.changeAmount || Math.max(0, received - finalTotal);
      printRow('Uang Diterima:', fmtRp(received));
      printRow('Kembalian:', fmtRp(change));
    }

    parts.push(enc(sep + '\n'));

    // Footer
    const footerAlign = store?.receiptFooterAlign === 'LEFT' ? 0x00 : store?.receiptFooterAlign === 'RIGHT' ? 0x02 : 0x01;
    parts.push(new Uint8Array([ESC, 0x61, footerAlign]));
    if (store?.receiptFooterBold) parts.push(new Uint8Array([ESC, 0x45, 0x01]));

    if (store?.receiptFooter && store.receiptFooter.trim()) {
      for (const line of store.receiptFooter.split('\n')) {
        if (line.trim()) parts.push(enc(line.trim() + '\n'));
      }
    } else {
      parts.push(enc('Terima kasih atas kunjungan Anda!\n'));
      parts.push(enc('Simpan struk sebagai bukti pembayaran sah.\n'));
    }

    if (store?.receiptFooterBold) parts.push(new Uint8Array([ESC, 0x45, 0x00]));
    parts.push(new Uint8Array([ESC, 0x61, 0x00]));
  }

  // Reset font
  if (isSmallFont) {
    parts.push(new Uint8Array([ESC, 0x4D, 0x00]));
  }

  // Feed 5 baris & cut paper
  parts.push(new Uint8Array([ESC, 0x64, 0x05]));
  parts.push(new Uint8Array([GS, 0x56, 0x00]));

  return concat(...parts);
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function BluetoothPrinterProvider({ children }) {
  const deviceRef = useRef(null);
  const charRef = useRef(null);
  const profilesRef = useRef(BLE_PROFILES[0].services);
  const isManualDisconnectRef = useRef(false);

  const [btStatus, setBtStatus] = useState('idle');
  const [btDeviceName, setBtDeviceName] = useState('');
  const [btServiceUuid, setBtServiceUuid] = useState('auto');
  const [btErrorMsg, setBtErrorMsg] = useState('');

  // Cari characteristic BLE yang mendukung penulisan (write / writeWithoutResponse)
  const findChar = useCallback(async (server, profiles) => {
    let fallback = null;
    for (const { svc, char } of profiles) {
      try {
        const service = await server.getPrimaryService(svc);
        const characteristic = await service.getCharacteristic(char);
        if (characteristic.properties.writeWithoutResponse) return characteristic;
        if (characteristic.properties.write && !fallback) fallback = characteristic;
      } catch {
        /* coba profile berikutnya */
      }
    }
    return fallback;
  }, []);

  // Tulis array bytes dalam chunk 20 bytes (standar BLE MTU) dengan delay adaptif
  const writeBytes = useCallback(async (data) => {
    const ch = charRef.current;
    if (!ch) throw new Error('Printer belum terhubung.');

    const CHUNK = 20;
    const isNoResponse = Boolean(ch.properties.writeWithoutResponse);
    const delayMs = isNoResponse ? 12 : 5;

    for (let offset = 0; offset < data.length; offset += CHUNK) {
      const chunk = data.slice(offset, offset + CHUNK);
      try {
        if (isNoResponse) {
          await ch.writeValueWithoutResponse(chunk);
        } else {
          await ch.writeValue(chunk);
        }
      } catch (e) {
        if (ch.properties.write) {
          await ch.writeValue(chunk);
        } else {
          throw e;
        }
      }
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }, []);

  // Auto-reconnect otomatis jika koneksi GATT terputus setelah potong kertas
  const reconnectDevice = useCallback(async (silent = false) => {
    const device = deviceRef.current;
    if (!device) return false;

    if (!silent) setBtStatus('reconnecting');

    const MAX_ATTEMPTS = 4;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await new Promise((r) => setTimeout(r, attempt * 800));
        const server = await device.gatt.connect();
        const char = await findChar(server, profilesRef.current);
        if (char) {
          charRef.current = char;
          setBtStatus('connected');
          if (!silent) toast.success('Printer terhubung kembali!', { icon: '🖨️' });
          return true;
        }
      } catch {
        // coba percobaan berikutnya
      }
    }

    charRef.current = null;
    deviceRef.current = null;
    setBtStatus('error');
    setBtErrorMsg('Koneksi printer terputus. Silakan hubungkan ulang.');
    setBtDeviceName('');
    if (!silent) toast.error('Printer terputus. Silakan scan ulang.', { duration: 4000 });
    return false;
  }, [findChar]);

  // Connect BLE Printer
  const connect = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.bluetooth) {
      setBtStatus('unsupported');
      setBtErrorMsg('Browser Anda belum mendukung Web Bluetooth API. Disarankan menggunakan Google Chrome atau Microsoft Edge.');
      toast.error('Browser tidak mendukung Bluetooth. Gunakan Chrome atau Edge.');
      return;
    }
    setBtStatus('connecting');
    setBtErrorMsg('');

    try {
      const profile = BLE_PROFILES.find((p) => p.serviceUuid === btServiceUuid);
      const profilesToTry = profile?.services || BLE_PROFILES[0].services;
      profilesRef.current = profilesToTry;

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ALL_BLE_SERVICE_UUIDS,
      });

      setBtDeviceName(device.name || 'Printer Thermal');
      isManualDisconnectRef.current = false;

      device.addEventListener('gattserverdisconnected', () => {
        if (isManualDisconnectRef.current) {
          deviceRef.current = null;
          charRef.current = null;
          setBtDeviceName('');
          setBtStatus('idle');
          return;
        }
        reconnectDevice(false);
      });

      const server = await device.gatt.connect();
      const char = await findChar(server, profilesToTry);

      if (!char) {
        throw new Error(
          'Tidak ditemukan BLE characteristic yang dapat ditulis. Pastikan printer thermal dalam keadaan menyala dan Bluetooth aktif.'
        );
      }

      deviceRef.current = device;
      charRef.current = char;
      setBtStatus('connected');
      toast.success(`Terhubung ke ${device.name || 'Printer Thermal'}!`, { icon: '🖨️' });
    } catch (err) {
      if (err.name === 'NotFoundError') {
        setBtStatus('idle'); // user membatalkan dialog bluetooth
      } else {
        setBtStatus('error');
        setBtErrorMsg(err.message || 'Gagal menghubungkan ke printer Bluetooth.');
        toast.error('Gagal menghubungkan: ' + (err.message || 'Error'));
      }
    }
  }, [btServiceUuid, findChar, reconnectDevice]);

  // Disconnect BLE Printer
  const disconnect = useCallback(async () => {
    setBtStatus('disconnecting');
    isManualDisconnectRef.current = true;
    try {
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
    } catch {
      /* ignore */
    }
    deviceRef.current = null;
    charRef.current = null;
    setBtDeviceName('');
    setBtStatus('idle');
    toast('Printer Bluetooth diputuskan.', { icon: '🔌' });
  }, []);

  // Print raw bytes
  const printBytes = useCallback(async (bytes) => {
    if (!deviceRef.current) {
      throw new Error('Printer Bluetooth belum terhubung.');
    }

    if (!deviceRef.current.gatt.connected) {
      const ok = await reconnectDevice(true);
      if (!ok) {
        throw new Error('Gagal reconnect ke printer. Pastikan printer menyala.');
      }
    }

    if (!charRef.current) {
      throw new Error('Characteristic printer belum siap.');
    }

    await writeBytes(bytes);
  }, [reconnectDevice, writeBytes]);

  const value = {
    btStatus,
    btDeviceName,
    btServiceUuid,
    btErrorMsg,
    isConnected: btStatus === 'connected' || btStatus === 'reconnecting',
    isReconnecting: btStatus === 'reconnecting',
    connect,
    disconnect,
    printBytes,
    buildReceiptBytes,
    setBtServiceUuid,
    clearRasterCache,
  };

  return (
    <BluetoothPrinterContext.Provider value={value}>
      {children}
    </BluetoothPrinterContext.Provider>
  );
}

export function useBluetooth() {
  const context = useContext(BluetoothPrinterContext);
  if (!context) {
    throw new Error('useBluetooth must be used within a BluetoothPrinterProvider');
  }
  return context;
}
