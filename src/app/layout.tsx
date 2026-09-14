import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

export const metadata: Metadata = {
  title: 'General POS Pro — Cloud Web Dashboard',
  description: 'Pusat Manajemen Transaksi, Inventori, Laporan, dan Kasir Terintegrasi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full bg-[#090d16]">
      <body className="min-h-full bg-[#090d16] text-slate-100 flex flex-col antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
