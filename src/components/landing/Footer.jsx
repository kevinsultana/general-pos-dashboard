import { Layers, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-slate-200/60 bg-white/40 backdrop-blur-xl text-slate-600 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-linear-to-brrom-amber-500 to-amber-600 p-0.5 shadow-xs">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <Layers className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Omni<span className="text-amber-600">POS</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                  Multi-Tenant
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-sm leading-relaxed">
              Platform Point of Sale SaaS generasi mutakhir dengan arsitektur
              multi-tenant, menjamin keamanan data terisolasi, kasir
              offline-first super cepat, dan pemantauan multi-cabang tanpa
              batasan.
            </p>

            {/* Cloud Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-slate-200/80 text-xs font-medium text-slate-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[11px]">
                All API Clusters Operational
              </span>
            </div>
          </div>

          {/* Produk */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Produk & Modul
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <a
                  href="#fitur"
                  className="hover:text-amber-700 transition-colors"
                >
                  Aplikasi Kasir POS
                </a>
              </li>
              <li>
                <a
                  href="#fitur"
                  className="hover:text-amber-700 transition-colors"
                >
                  Manajemen Shift & Kas
                </a>
              </li>
              <li>
                <a
                  href="#solusi"
                  className="hover:text-amber-700 transition-colors"
                >
                  Multi-Outlet Sync
                </a>
              </li>
              <li>
                <a
                  href="#harga"
                  className="hover:text-amber-700 transition-colors"
                >
                  Paket Langganan
                </a>
              </li>
              <li>
                <a
                  href="/api-docs"
                  target="_blank"
                  className="hover:text-amber-700 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Dokumentasi API</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Solusi */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Solusi Industri
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <span className="hover:text-amber-700 cursor-pointer transition-colors">
                  Kedai Kopi & Cafe
                </span>
              </li>
              <li>
                <span className="hover:text-amber-700 cursor-pointer transition-colors">
                  Restoran Mandiri (Dine-in)
                </span>
              </li>
              <li>
                <span className="hover:text-amber-700 cursor-pointer transition-colors">
                  Bakery & Pastry Shop
                </span>
              </li>
              <li>
                <span className="hover:text-amber-700 cursor-pointer transition-colors">
                  Franchise & Multi-Branch
                </span>
              </li>
              <li>
                <span className="hover:text-amber-700 cursor-pointer transition-colors">
                  Cloud Kitchen Hub
                </span>
              </li>
            </ul>
          </div>

          {/* Keamanan & Legal */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Keamanan & Dukungan
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <span className="hover:text-amber-700 cursor-pointer transition-colors">
                  Isolasi Row-Level Tenant
                </span>
              </li>
              <li>
                <span className="hover:text-amber-700 cursor-pointer transition-colors">
                  Kebijakan Privasi
                </span>
              </li>
              <li>
                <span className="hover:text-amber-700 cursor-pointer transition-colors">
                  Ketentuan Layanan
                </span>
              </li>
              <li>
                <span className="hover:text-amber-700 cursor-pointer transition-colors">
                  Bantuan WhatsApp 24/7
                </span>
              </li>
              <li>
                <span className="hover:text-amber-700 cursor-pointer transition-colors">
                  Status Sistem Cloud
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {currentYear} Omni POS Technologies. Seluruh hak cipta dilindungi
            undang-undang.
          </p>
          <div className="flex items-center gap-6">
            <span>
              Didesain dengan True Light Glassmorphism & Cloud Multi-Tenant
              Architecture
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
