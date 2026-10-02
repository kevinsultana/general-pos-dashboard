"use client";

import { useMemo } from "react";

/**
 * Tabel Pola Code 128 (Subtipe B - cocok untuk alfanumerik ASCII seperti "ORD-882194")
 * Setiap pola adalah string panjang 11 karakter (bar & space)
 */
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (106 is STOP)
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/**
 * Menghasilkan representasi biner (1=bar, 0=space) untuk teks ASCII menggunakan Code 128B
 */
function encodeCode128B(text) {
  if (!text) return "";

  const codes = [START_CODE_B];
  let checksum = START_CODE_B;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Code 128B memetakan ASCII 32 - 127 ke nilai 0 - 95
    const value = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(value);
    checksum += value * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(STOP_CODE);

  // Ubah ke pola bar/space
  let binaryString = "";
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code];
    if (!pattern) continue;

    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      binaryString += (isBar ? "1" : "0").repeat(width);
      isBar = !isBar;
    }
  }

  return binaryString;
}

/**
 * Komponen Barcode SVG Standar Code 128
 * Ringan, tanpa dependensi eksternal, dan langsung dapat dibaca oleh barcode scanner kasir
 */
export default function BarcodeSvg({
  value = "",
  width = 2,
  height = 64,
  showText = true,
  className = "",
}) {
  const binary = useMemo(() => encodeCode128B(value), [value]);

  if (!value || !binary) {
    return null;
  }

  const quietZone = 10 * width;
  const totalWidth = binary.length * width + quietZone * 2;
  const totalHeight = showText ? height + 20 : height;

  // Bangun elemen-elemen bar
  const bars = [];
  let currentRun = 0;
  let startX = 0;
  let inBar = false;

  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === "1") {
      if (!inBar) {
        inBar = true;
        startX = quietZone + i * width;
        currentRun = width;
      } else {
        currentRun += width;
      }
    } else {
      if (inBar) {
        bars.push({ x: startX, w: currentRun });
        inBar = false;
        currentRun = 0;
      }
    }
  }
  if (inBar) {
    bars.push({ x: startX, w: currentRun });
  }

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="w-full h-auto max-w-full"
        style={{ aspectRatio: `${totalWidth} / ${totalHeight}` }}
      >
        <rect width={totalWidth} height={totalHeight} fill="#ffffff" />
        {bars.map((b, idx) => (
          <rect
            key={idx}
            x={b.x}
            y={4}
            width={b.w}
            height={height}
            fill="#0f172a"
          />
        ))}
        {showText && (
          <text
            x={totalWidth / 2}
            y={height + 16}
            textAnchor="middle"
            fill="#0f172a"
            fontSize="12"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="2"
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
}
