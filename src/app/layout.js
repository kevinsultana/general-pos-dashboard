import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import ToastProvider from "../components/providers/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Omni POS — Platform SaaS POS Multi-Tenant Modern",
  description:
    "Solusi POS Point of Sale pintar berbasis Cloud & Multi-Tenant untuk kedai rintisan hingga jaringan ratusan cabang bisnis F&B dan retail.",
  keywords: [
    "Omni POS",
    "POS Multi-Tenant",
    "SaaS POS Indonesia",
    "Aplikasi Kasir Online",
    "Point of Sale F&B",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-amber-100 selection:text-amber-900">
        <AuthProvider>
          <ToastProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
