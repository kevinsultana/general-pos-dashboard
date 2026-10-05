/**
 * generateZReportPdf.js
 * Generator PDF murni sisi-klien untuk Rekap Tutup Shift (Z-Report).
 * Menghasilkan file PDF standar (PDF-1.4) beresolusi vektor tajam tanpa ketergantungan library eksternal.
 */

// Format Rupiah
const fmtIdr = (val) => {
  const num = Math.round(Number(val) || 0);
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(num);
};

// Format Tanggal & Jam
const fmtDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Sanitasi string untuk encoding PDF Type1 font (escape parentheses and backslashes)
 */
function pdfEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' '); // Ganti karakter di luar ASCII standar
}

/**
 * Bangun buffer PDF-1.4 dalam bentuk Blob
 */
export function buildZReportPdfBlob(reportData) {
  const {
    storeName = 'OMNIPOS STORE',
    branchName = 'Cabang Utama',
    storeAddress = '',
    storePhone = '',
    shiftId = '',
    cashierName = 'Kasir',
    startTime = '',
    endTime = '',
    duration = '-',
    startingCash = 0,
    endingCash = 0,
    totalTransactions = 0,
    grossSales = 0,
    totalDiscounts = 0,
    netSales = 0,
    cashSales = 0,
    qrisSales = 0,
    transferSales = 0,
    expectedCash = 0,
    cashDifference = 0,
    differenceStatus = 'SESUAI',
  } = reportData;

  // Ukuran A4 standar (point): 595.28 x 841.89
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 45;
  const contentWidth = pageWidth - margin * 2; // 505.28

  let pdfStream = '';

  // Helper untuk menambah perintah ke stream
  const addOp = (op) => {
    pdfStream += op + '\n';
  };

  // 1. Gambar Background Kartu Header
  addOp('0.96 0.97 0.98 rg'); // Light slate bg
  addOp(`${margin} 740 ${contentWidth} 60 re f`); // Header box
  addOp('0.85 0.88 0.92 RG'); // Border
  addOp('1 w');
  addOp(`${margin} 740 ${contentWidth} 60 re S`);

  // Teks Header Toko
  addOp('BT');
  addOp('/F2 14 Tf'); // Helvetica-Bold 14
  addOp('0.06 0.09 0.16 rg'); // Slate 900
  addOp(`${margin + 16} 775 Td`);
  addOp(`(${pdfEscape(storeName.toUpperCase())} - ${pdfEscape(branchName.toUpperCase())}) Tj`);
  addOp('ET');

  addOp('BT');
  addOp('/F1 9 Tf'); // Helvetica 9
  addOp('0.38 0.44 0.52 rg'); // Slate 500
  addOp(`${margin + 16} 755 Td`);
  const storeSub = [storeAddress, storePhone ? `Telp: ${storePhone}` : ''].filter(Boolean).join(' | ') || 'OmniPOS Modern Cloud POS System';
  addOp(`(${pdfEscape(storeSub)}) Tj`);
  addOp('ET');

  // Badge Z-REPORT di kanan header
  addOp('0.93 0.95 0.99 rg');
  addOp(`${pageWidth - margin - 120} 752 105 24 re f`);
  addOp('0.20 0.35 0.85 RG');
  addOp('0.8 w');
  addOp(`${pageWidth - margin - 120} 752 105 24 re S`);

  addOp('BT');
  addOp('/F2 10 Tf');
  addOp('0.15 0.25 0.75 rg');
  addOp(`${pageWidth - margin - 110} 760 Td`);
  addOp('(Z-REPORT SHIFT) Tj');
  addOp('ET');

  // 2. Info Detail Shift (Grid 2 Kolom)
  let y = 710;
  addOp('0.98 0.98 0.99 rg');
  addOp(`${margin} ${y - 45} ${contentWidth} 55 re f`);
  addOp('0.88 0.90 0.94 RG');
  addOp('0.8 w');
  addOp(`${margin} ${y - 45} ${contentWidth} 55 re S`);

  const infoRows = [
    [
      `ID Shift: #${pdfEscape(shiftId.slice(-8).toUpperCase() || 'SHIFT')}`,
      `Waktu Buka: ${pdfEscape(fmtDateTime(startTime))}`,
    ],
    [
      `Kasir: ${pdfEscape(cashierName)}`,
      `Waktu Tutup: ${pdfEscape(fmtDateTime(endTime))}`,
    ],
    [
      `Durasi: ${pdfEscape(duration)}`,
      `Dicetak: ${pdfEscape(fmtDateTime(new Date().toISOString()))}`,
    ],
  ];

  let infoY = y - 5;
  infoRows.forEach(([col1, col2]) => {
    addOp('BT');
    addOp('/F1 9 Tf');
    addOp('0.25 0.30 0.38 rg');
    addOp(`${margin + 12} ${infoY} Td`);
    addOp(`(${col1}) Tj`);
    addOp('ET');

    addOp('BT');
    addOp('/F1 9 Tf');
    addOp('0.25 0.30 0.38 rg');
    addOp(`${margin + 260} ${infoY} Td`);
    addOp(`(${col2}) Tj`);
    addOp('ET');

    infoY -= 14;
  });

  y -= 60;

  // Helper untuk Gambar Baris Tabel Seksi
  const drawSectionHeader = (title, currentY) => {
    addOp('0.10 0.15 0.25 rg');
    addOp(`${margin} ${currentY - 18} ${contentWidth} 20 re f`);

    addOp('BT');
    addOp('/F2 10 Tf');
    addOp('1 1 1 rg');
    addOp(`${margin + 12} ${currentY - 13} Td`);
    addOp(`(${pdfEscape(title)}) Tj`);
    addOp('ET');

    return currentY - 22;
  };

  const drawRow = (label, value, currentY, isBold = false, isHighlight = false) => {
    if (isHighlight) {
      addOp('0.96 0.98 0.95 rg');
      addOp(`${margin} ${currentY - 14} ${contentWidth} 17 re f`);
    }

    addOp('0.90 0.92 0.95 RG');
    addOp('0.5 w');
    addOp(`${margin} ${currentY - 14} m ${pageWidth - margin} ${currentY - 14} l S`);

    addOp('BT');
    addOp(isBold ? '/F2 9.5 Tf' : '/F1 9 Tf');
    addOp('0.15 0.20 0.28 rg');
    addOp(`${margin + 12} ${currentY - 10} Td`);
    addOp(`(${pdfEscape(label)}) Tj`);
    addOp('ET');

    addOp('BT');
    addOp(isBold ? '/F2 9.5 Tf' : '/F1 9 Tf');
    addOp(isBold ? '0.05 0.45 0.25 rg' : '0.15 0.20 0.28 rg');
    // Rata kanan manual estimasi lebar teks
    const valStr = pdfEscape(value);
    const approxWidth = valStr.length * (isBold ? 5.8 : 5.0);
    const xPos = Math.max(margin + 200, pageWidth - margin - 15 - approxWidth);
    addOp(`${xPos} ${currentY - 10} Td`);
    addOp(`(${valStr}) Tj`);
    addOp('ET');

    return currentY - 17;
  };

  // 3. SEKSI I: MODAL AWAL & PENJUALAN
  y = drawSectionHeader('I. RINGKASAN PENJUALAN (SALES SUMMARY)', y);
  y = drawRow('Modal Awal Laci (Starting Cash)', fmtIdr(startingCash), y);
  y = drawRow('Total Transaksi Berhasil', `${totalTransactions} Transaksi`, y);
  y = drawRow('Penjualan Kotor (Gross Sales)', fmtIdr(grossSales), y);
  y = drawRow('Total Potongan Diskon / Promo', `- ${fmtIdr(totalDiscounts)}`, y);
  y = drawRow('Penjualan Bersih (Net Sales)', fmtIdr(netSales), y, true, true);

  y -= 8;

  // 4. SEKSI II: RINCIAN METODE PEMBAYARAN
  y = drawSectionHeader('II. RINCIAN METODE PEMBAYARAN (PAYMENT METHODS)', y);
  y = drawRow('1. Tunai (Cash)', fmtIdr(cashSales), y);
  y = drawRow('2. QRIS (Digital Payment)', fmtIdr(qrisSales), y);
  y = drawRow('3. Transfer / Kartu', fmtIdr(transferSales), y);
  y = drawRow('Total Pembayaran Diterima', fmtIdr(netSales), y, true, true);

  y -= 8;

  // 5. SEKSI III: REKONSILIASI KAS LACI (CASH RECONCILIATION)
  y = drawSectionHeader('III. REKONSILIASI KAS LACI (CASH DRAWER RECONCILIATION)', y);
  y = drawRow('Modal Awal Laci', fmtIdr(startingCash), y);
  y = drawRow('Penerimaan Penjualan Tunai (+)', fmtIdr(cashSales), y);
  y = drawRow('Total Kas Seharusnya di Laci (Expected Cash)', fmtIdr(expectedCash), y, true);
  y = drawRow('Uang Kas Aktual Dihitung Kasir (Ending Cash)', fmtIdr(endingCash), y, true);

  const selisihLabel =
    cashDifference === 0
      ? 'Selisih Kas: PAS / SESUAI (0)'
      : cashDifference > 0
      ? `Selisih Kas: SURPLUS (+${fmtIdr(cashDifference)})`
      : `Selisih Kas: MINUS (${fmtIdr(cashDifference)})`;

  // Kotak Penegasan Selisih
  if (cashDifference === 0) {
    addOp('0.90 0.98 0.92 rg'); // Green
  } else if (cashDifference > 0) {
    addOp('0.99 0.96 0.89 rg'); // Amber
  } else {
    addOp('0.99 0.92 0.92 rg'); // Red
  }
  addOp(`${margin} ${y - 24} ${contentWidth} 24 re f`);
  addOp('0.75 0.80 0.85 RG');
  addOp(`${margin} ${y - 24} ${contentWidth} 24 re S`);

  addOp('BT');
  addOp('/F2 10.5 Tf');
  if (cashDifference === 0) addOp('0.08 0.50 0.20 rg');
  else if (cashDifference > 0) addOp('0.70 0.45 0.05 rg');
  else addOp('0.75 0.15 0.15 rg');
  addOp(`${margin + 16} ${y - 17} Td`);
  addOp(`(${pdfEscape(selisihLabel)}) Tj`);
  addOp('ET');

  y -= 45;

  // 6. AREA TANDA TANGAN (SIGNATURES)
  addOp('0.85 0.88 0.92 RG');
  addOp('0.8 w');
  addOp(`${margin} ${y} m ${pageWidth - margin} ${y} l S`);

  y -= 18;
  addOp('BT');
  addOp('/F1 9 Tf');
  addOp('0.40 0.45 0.52 rg');
  addOp(`${margin + 40} ${y} Td`);
  addOp('(Diserahkan oleh Kasir,) Tj');
  addOp('ET');

  addOp('BT');
  addOp('/F1 9 Tf');
  addOp('0.40 0.45 0.52 rg');
  addOp(`${pageWidth - margin - 170} ${y} Td`);
  addOp('(Diterima oleh Supervisor / Owner,) Tj');
  addOp('ET');

  // Garis Tanda Tangan
  y -= 50;
  addOp('0.60 0.65 0.72 RG');
  addOp('1 w');
  addOp(`${margin + 20} ${y} m ${margin + 180} ${y} l S`);
  addOp(`${pageWidth - margin - 190} ${y} m ${pageWidth - margin - 30} ${y} l S`);

  y -= 14;
  addOp('BT');
  addOp('/F2 9 Tf');
  addOp('0.15 0.20 0.28 rg');
  addOp(`${margin + 45} ${y} Td`);
  addOp(`(${pdfEscape(cashierName)}) Tj`);
  addOp('ET');

  addOp('BT');
  addOp('/F2 9 Tf');
  addOp('0.15 0.20 0.28 rg');
  addOp(`${pageWidth - margin - 160} ${y} Td`);
  addOp('(Manager / Store Owner) Tj');
  addOp('ET');

  // Catatan Kaki Dokumen
  addOp('BT');
  addOp('/F1 8 Tf');
  addOp('0.60 0.65 0.72 rg');
  addOp(`${margin} 35 Td`);
  addOp('(Dokumen resmi rekonsiliasi kas shift dicetak secara otomatis melalui OmniPOS Cloud System.) Tj');
  addOp('ET');

  // ─── Konstruksi Objek PDF-1.4 ───
  const streamLength = pdfStream.length;

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`
  );
  objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${pdfStream}\nendstream\nendobj`);
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  let body = '%PDF-1.4\n';
  const offsets = [];

  objects.forEach((obj) => {
    offsets.push(body.length);
    body += obj + '\n';
  });

  const xrefOffset = body.length;
  body += 'xref\n';
  body += `0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  offsets.forEach((off) => {
    body += String(off).padStart(10, '0') + ' 00000 n \n';
  });

  body += 'trailer\n';
  body += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  body += 'startxref\n';
  body += `${xrefOffset}\n`;
  body += '%%EOF';

  return new Blob([body], { type: 'application/pdf' });
}

/**
 * Trigger download file PDF langsung ke browser pengguna
 */
export function downloadZReportPdf(reportData) {
  try {
    const blob = buildZReportPdfBlob(reportData);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeBranch = (reportData.branchName || 'toko').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `Z-Report-${safeBranch}-${dateStr}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (err) {
    console.error('Error generating Z-Report PDF:', err);
    throw err;
  }
}
