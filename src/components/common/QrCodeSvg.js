"use client";

import { useMemo } from "react";

/**
 * Generator QR Code Matrix sederhana & mandiri (Pure JS, Zero Dependencies)
 * Menghasilkan representasi matriks 2D boolean untuk dirender menjadi SVG tajam
 */

// Format informasi & mask pattern QR Code
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF256_EXP[i] = GF256_EXP[i - 255];
  }
})();

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function polyMul(p, q) {
  const r = new Uint8Array(p.length + q.length - 1);
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) {
      r[i + j] ^= gfMul(p[i], q[j]);
    }
  }
  return r;
}

function getGeneratorPoly(degree) {
  let g = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    g = polyMul(g, new Uint8Array([1, GF256_EXP[i]]));
  }
  return g;
}

function calcEcc(data, eccCount) {
  const gen = getGeneratorPoly(eccCount);
  const res = new Uint8Array(data.length + eccCount);
  res.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return res.slice(data.length);
}

// Konfigurasi Versi QR Code (Version 1 - 6, Error Correction Level M)
const VERSIONS = [
  null,
  { version: 1, size: 21, dataCap: 14, eccCount: 10, totalBytes: 26 },
  { version: 2, size: 25, dataCap: 26, eccCount: 16, totalBytes: 44 },
  { version: 3, size: 29, dataCap: 42, eccCount: 26, totalBytes: 70 },
  { version: 4, size: 33, dataCap: 62, eccCount: 36, totalBytes: 100 },
  { version: 5, size: 37, dataCap: 84, eccCount: 48, totalBytes: 134 },
  { version: 6, size: 41, dataCap: 106, eccCount: 64, totalBytes: 172 },
  { version: 7, size: 45, dataCap: 122, eccCount: 72, totalBytes: 196 },
  { version: 8, size: 49, dataCap: 152, eccCount: 88, totalBytes: 242 },
];

function encodeQrMatrix(text) {
  if (!text) return null;
  const utf8 = new TextEncoder().encode(text);
  const dataLen = utf8.length;

  // Pilih versi terkecil yang mencukupi
  let verInfo = null;
  for (let v = 1; v < VERSIONS.length; v++) {
    const candidate = VERSIONS[v];
    // Mode Byte: 4 bit mode + 8 bit length + data bytes
    const requiredBits = 4 + 8 + dataLen * 8;
    const requiredBytes = Math.ceil(requiredBits / 8);
    if (requiredBytes <= candidate.dataCap) {
      verInfo = candidate;
      break;
    }
  }

  if (!verInfo) {
    verInfo = VERSIONS[VERSIONS.length - 1];
  }

  const { size, dataCap, eccCount } = verInfo;

  // 1. Bitstream packing (Mode Byte 0100)
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(dataLen, 8); // Character count
  for (let i = 0; i < dataLen; i++) {
    pushBits(utf8[i], 8);
  }

  // Terminator (hingga 4 bit nol)
  const padCapacity = dataCap * 8;
  const termLen = Math.min(4, padCapacity - bits.length);
  pushBits(0, termLen);

  // Pad ke kelipatan 8
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Byte pad bytes (0xEC, 0x11 bergantian)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < padCapacity) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Ubah bits ke Uint8Array
  const dataBytes = new Uint8Array(dataCap);
  for (let i = 0; i < dataCap; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataBytes[i] = b;
  }

  // Hitung Error Correction
  const eccBytes = calcEcc(dataBytes, eccCount);

  // Gabungkan Data + ECC
  const finalCodewords = new Uint8Array(dataBytes.length + eccBytes.length);
  finalCodewords.set(dataBytes);
  finalCodewords.set(eccBytes, dataBytes.length);

  // 2. Bangun Matriks QR
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r, c, val) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      isFunction[r][c] = true;
    }
  };

  // Finder Patterns (3 sudut)
  const drawFinder = (top, left) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            setModule(row, col, isBorder || isCenter);
          } else {
            setModule(row, col, false); // Separator
          }
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Alignment Pattern untuk Versi >= 2
  if (verInfo.version >= 2) {
    const alignPos = size - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        setModule(alignPos + r, alignPos + c, isBorder || isCenter);
      }
    }
  }

  // Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setModule(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setModule(i, 6, i % 2 === 0);
  }

  // Dark module
  setModule(size - 8, 8, true);

  // Format info area (placeholder)
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) isFunction[8][size - 1 - i] = true;
    if (!isFunction[size - 1 - i][8]) isFunction[size - 1 - i][8] = true;
  }

  // 3. Masukkan Data ke Grid (Z-pattern)
  let bitIdx = 0;
  const allBits = [];
  for (let i = 0; i < finalCodewords.length; i++) {
    for (let b = 7; b >= 0; b--) {
      allBits.push((finalCodewords[i] >> b) & 1);
    }
  }

  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Lewati timing column
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (!isFunction[row][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          // Terapkan mask pattern default (row + col) % 2 === 0
          const mask = (row + c) % 2 === 0;
          matrix[row][c] = (bit ^ (mask ? 1 : 0)) === 1;
        }
      }
    }
    upward = !upward;
  }

  // 4. Format Information (Level M, Mask 0) = 0b101010000010010
  const formatInfo = 0b101010000010010;
  for (let i = 0; i < 15; i++) {
    const bit = ((formatInfo >> (14 - i)) & 1) === 1;
    // Top-left
    if (i <= 5) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    // Bottom-left / Top-right
    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }

  return matrix;
}

/**
 * Komponen QR Code SVG
 * Ringan, cepat, 100% offline, dan menghasilkan vektor tajam untuk dicetak pada kartu meja toko
 */
export default function QrCodeSvg({
  value = "",
  size = 200,
  fgColor = "#0f172a",
  bgColor = "#ffffff",
  className = "",
}) {
  const matrix = useMemo(() => encodeQrMatrix(value), [value]);

  if (!value || !matrix) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-slate-100 rounded-2xl text-xs text-slate-400 font-bold"
      >
        QR Belum Tersedia
      </div>
    );
  }

  const moduleCount = matrix.length;
  const quietZone = 2; // Gutter 2 modul
  const totalGrid = moduleCount + quietZone * 2;

  // Bangun modul-modul hitam
  const rects = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        rects.push({
          x: c + quietZone,
          y: r + quietZone,
        });
      }
    }
  }

  return (
    <div className={`inline-block select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalGrid} ${totalGrid}`}
        width={size}
        height={size}
        className="w-full h-auto max-w-full block"
        style={{ aspectRatio: "1 / 1" }}
      >
        <rect width={totalGrid} height={totalGrid} fill={bgColor} />
        {rects.map((rc, idx) => (
          <rect
            key={idx}
            x={rc.x}
            y={rc.y}
            width={1}
            height={1}
            fill={fgColor}
          />
        ))}
      </svg>
    </div>
  );
}
