'use client';

import React from 'react';
import { cn, formatRupiah, formatDateTime } from '@/lib/utils';

/**
 * Komponen Khusus Pencetakan Struk Thermal (58mm / 80mm).
 * Menggunakan CSS @media print: tersembunyi di layar normal (`hidden print:block`),
 * dan hanya tampil saat proses cetak berjalan.
 *
 * @param {Object} props
 * @param {Object} props.order - Objek Transaksi/Order lengkap beserta items, payment, customer
 * @param {Object} props.store - Objek Informasi Toko (name, logoUrl, printerWidth, address, dll)
 * @param {'CUSTOMER'|'KITCHEN'} props.printMode - Mode cetak ('CUSTOMER' atau 'KITCHEN')
 */
export default function ThermalReceipt({ order, store = {}, printMode = 'CUSTOMER' }) {
  if (!order) return null;

  const isKitchen = printMode === 'KITCHEN';
  const is80mm = store?.printerWidth === 80;
  const isSmallFont = store?.receiptFontSize === 'SMALL';
  const isDoubleHeight = store?.receiptDoubleHeight !== false;

  const orderNum = order.receiptNumber || order.orderNumber || '-';
  const rawQueue =
    order.queueNumber ||
    order.queue_number ||
    order.queue ||
    order.queueNo ||
    (order.tableNumber ? `Meja ${order.tableNumber}` : (orderNum ? orderNum.slice(-4) : '-'));

  const isTakeaway =
    order.orderType === 'TAKEAWAY' ||
    String(rawQueue).toUpperCase().startsWith('TA');

  const customerName =
    order.customerName ||
    order.customerNameSnapshot ||
    order.customer?.name ||
    'Umum';

  const cashierName =
    order.cashierName ||
    order.createdBy?.name ||
    'Kasir';

  const total = parseFloat(order.totalAmount || order.grandTotal || 0);

  return (
    <div id="thermal-receipt-print-area" className="hidden print:block font-mono text-black">
      <div
        className={cn(
          'mx-auto p-1 leading-tight',
          is80mm
            ? isSmallFont
              ? 'w-[80mm] max-w-[80mm] text-[10.5px]'
              : 'w-[80mm] max-w-[80mm] text-xs'
            : isSmallFont
            ? 'w-[58mm] max-w-[58mm] text-[9.5px]'
            : 'w-[58mm] max-w-[58mm] text-[11px]'
        )}
      >
        {isKitchen ? (
          /* ══════════════════════════════════════════════════════════════════
             MODE KITCHEN (TIKET DAPUR):
             Font lebih besar. HANYA Nomor Antrean/Meja, Waktu, Item, Catatan.
             TIDAK ADA HARGA SAMA SEKALI.
             ══════════════════════════════════════════════════════════════════ */
          <div>
            {/* Header Tiket Dapur */}
            <div className="text-center font-black text-xs sm:text-sm border-2 border-black p-1 uppercase tracking-wider mb-1">
              TIKET DAPUR / KITCHEN
            </div>

            {/* Banner Tipe Pesanan */}
            <div className="text-center font-black text-xs py-0.5 border-2 border-black uppercase tracking-wider mb-2">
              {isTakeaway ? '[ BUNGKUS / TAKEAWAY ]' : '[ DINE IN / DI TEMPAT ]'}
            </div>

            {/* Nomor Antrean / Meja Menonjol & Besar */}
            <div className="text-center border-2 border-black rounded p-1.5 my-2">
              <div className="text-[10px] uppercase font-bold tracking-widest text-gray-700">
                {order.tableNumber ? 'NOMOR MEJA' : 'NOMOR ANTREAN'}
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight">
                {order.tableNumber ? `MEJA ${order.tableNumber}` : rawQueue}
              </div>
            </div>

            {/* Metadata Pesanan */}
            <div className="text-[10px] sm:text-[11px] space-y-0.5 my-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Tipe:</span>
                <span className="font-bold">{isTakeaway ? 'Takeaway / Bungkus' : 'Dine In / Di Tempat'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">No. Struk:</span>
                <span className="font-bold">{orderNum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Waktu:</span>
                <span>{formatDateTime(order.createdAt || new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Pelanggan:</span>
                <span className="font-bold truncate max-w-[150px]">{customerName}</span>
              </div>
            </div>

            {/* Pembatas Tebal */}
            <div className="border-b-2 border-dashed border-black my-2" />

            {/* Daftar Pesanan Dapur (Qty, Menu, Varian, Catatan) — TANPA HARGA */}
            <div className="space-y-2.5">
              {(order.items || []).map((item, idx) => {
                const qty = item.quantity || item.qty || 1;
                const pName = item.productName || item.productNameSnapshot || 'Menu';
                const vName = item.variantName || item.variantNameSnapshot || '';
                const notes = item.notes || '';

                return (
                  <div key={item.id || idx} className="border-b border-gray-400 pb-2">
                    <div className="flex items-start gap-1.5">
                      <span className="text-sm sm:text-base font-black px-1.5 py-0.5 border border-black rounded bg-white shrink-0">
                        {qty}x
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-black leading-tight uppercase">
                          {pName}
                        </div>
                        {vName && vName !== 'Standard' && vName !== 'Regular' && (
                          <div className="text-[11px] font-bold text-gray-800 mt-0.5">
                            Varian: {vName}
                          </div>
                        )}
                        {notes && (
                          <div className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded mt-1 inline-block">
                            Catatan: {notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Penutup Tiket Dapur */}
            <div className="border-t-2 border-black pt-2 text-center text-[10px] font-bold uppercase tracking-widest mt-4">
              *** SELESAIKAN PESANAN ***
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════════
             MODE CUSTOMER (STRUK PELANGGAN):
             Lengkap: Logo, Nama Toko, Kasir, Waktu, Item, Qty, Harga, Subtotal,
             Total, dan Informasi Pembayaran.
             ══════════════════════════════════════════════════════════════════ */
          <div>
            {/* Logo Toko */}
            {store?.receiptShowLogo !== false && (store?.receiptLogoUrl || store?.logoUrl) && (
              <div className="text-center mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={store.receiptLogoUrl || store.logoUrl}
                  alt={store.name || 'Logo'}
                  className="mx-auto max-h-12 max-w-[40mm] object-contain filter grayscale"
                />
              </div>
            )}

            {/* Nama Toko */}
            {store?.receiptShowStoreName !== false && (
              <div
                className={cn(
                  'text-center font-bold uppercase tracking-wider',
                  isDoubleHeight ? 'text-xs sm:text-sm' : 'text-[11px]'
                )}
              >
                {store?.name || 'OMNI POS'}
              </div>
            )}

            {/* Sub-Header / Alamat Toko */}
            {store?.receiptHeader && store.receiptHeader.trim() ? (
              <div
                className={cn(
                  'text-[10px] text-gray-700 whitespace-pre-line my-0.5',
                  store?.receiptHeaderAlign === 'LEFT'
                    ? 'text-left'
                    : store?.receiptHeaderAlign === 'RIGHT'
                    ? 'text-right'
                    : 'text-center',
                  store?.receiptHeaderBold && 'font-bold'
                )}
              >
                {store.receiptHeader}
              </div>
            ) : (
              <div className="text-center text-[10px] text-gray-600">
                {store?.address || store?.branchName || 'Cabang Utama'}
              </div>
            )}

            <div className="border-b border-dashed border-black my-1.5" />

            {/* Nomor Antrean / Meja untuk Pelanggan */}
            {(order.tableNumber || rawQueue) && (
              <div className="text-center border border-black rounded p-1 my-1">
                <div className="text-[9px] uppercase font-bold tracking-widest text-gray-700">
                  {order.tableNumber ? 'NOMOR MEJA' : 'NOMOR ANTREAN'}
                </div>
                <div className="text-2xl font-black tracking-tight">
                  {order.tableNumber ? `MEJA ${order.tableNumber}` : rawQueue}
                </div>
              </div>
            )}

            {/* Info Transaksi */}
            <div className="text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDateTime(order.createdAt || new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold">{orderNum}</span>
              </div>
              <div className="flex justify-between">
                <span>Pesanan:</span>
                <span className="font-bold">
                  {isTakeaway ? 'Takeaway / Bungkus' : 'Dine In / Di Tempat'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-semibold truncate max-w-[140px]">{customerName}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-black my-1.5" />

            {/* Daftar Item Menu */}
            <div className="space-y-1.5">
              {(order.items || []).map((item, idx) => {
                const qty = item.quantity || item.qty || 1;
                const unitPrice = parseFloat(item.price || item.unitPrice || 0);
                const subtotal = parseFloat(item.subtotal || unitPrice * qty);
                const pName = item.productName || item.productNameSnapshot || 'Item';
                const vName = item.variantName || item.variantNameSnapshot || '';
                const notes = item.notes || '';

                return (
                  <div key={item.id || idx}>
                    <div className="font-semibold leading-tight">
                      {pName}
                      {vName && vName !== 'Standard' && vName !== 'Regular' && (
                        <span className="font-normal text-[10px] text-gray-700 ml-1">
                          ({vName})
                        </span>
                      )}
                    </div>
                    {notes && (
                      <div className="text-[9px] italic text-gray-700 pl-1">
                        * Catatan: {notes}
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] mt-0.5">
                      <span>
                        {qty} x {formatRupiah(unitPrice)}
                      </span>
                      <span className="font-semibold">{formatRupiah(subtotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-b border-dashed border-black my-1.5" />

            {/* Ringkasan Finansial */}
            <div className="text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(total)}</span>
              </div>

              {order.discountAmount && Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-gray-800">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(order.discountAmount)}</span>
                </div>
              )}

              {order.taxAmount && Number(order.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span>Pajak:</span>
                  <span>{formatRupiah(order.taxAmount)}</span>
                </div>
              )}
            </div>

            {/* Garis Pembatas Total */}
            <div className="border-b border-black my-1" />

            <div
              className={cn(
                'flex justify-between font-black my-0.5',
                isDoubleHeight ? 'text-xs sm:text-sm' : 'text-[11px]'
              )}
            >
              <span>TOTAL</span>
              <span>{formatRupiah(total)}</span>
            </div>

            <div className="border-b border-black my-1" />

            {/* Info Pembayaran */}
            <div className="text-[10px] space-y-0.5 mt-1">
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-bold">{order.paymentMethod || order.payment?.method || 'CASH'}</span>
              </div>

              {(order.paymentMethod === 'CASH' || order.payment?.method === 'CASH' || !order.paymentMethod) && (
                <>
                  <div className="flex justify-between">
                    <span>Uang Diterima:</span>
                    <span>
                      {formatRupiah(
                        order.cashReceived || order.payment?.cashReceived || total
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembalian:</span>
                    <span>
                      {formatRupiah(
                        order.changeAmount || order.payment?.changeAmount || Math.max(0, (order.cashReceived || total) - total)
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="border-b border-dashed border-black my-2" />

            {/* Footer Ucapan Dinamis */}
            {store?.receiptFooter && store.receiptFooter.trim() ? (
              <div
                className={cn(
                  'text-[10px] space-y-0.5 whitespace-pre-line text-gray-800',
                  store?.receiptFooterAlign === 'LEFT'
                    ? 'text-left'
                    : store?.receiptFooterAlign === 'RIGHT'
                    ? 'text-right'
                    : 'text-center',
                  store?.receiptFooterBold && 'font-bold'
                )}
              >
                {store.receiptFooter}
              </div>
            ) : (
              <div className="text-center text-[10px] space-y-0.5 text-gray-700">
                <div className="font-semibold">Terima kasih atas kunjungan Anda!</div>
                <div className="text-[9px]">Simpan struk ini sebagai bukti pembayaran sah.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
