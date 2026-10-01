"use client";

import { useState } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Pricing from "../components/landing/Pricing";
import RegisterModal from "../components/landing/RegisterModal";
import Footer from "../components/landing/Footer";

export default function Home() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "register", // 'register' | 'login'
    tier: "FREE",
  });

  const handleOpenModal = (mode = "register", tier = "FREE") => {
    setModalState({
      isOpen: true,
      mode,
      tier,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden">
      {/* Background Soft Liquid Aura Blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Liquid Orb 1: Soft Peach / Muted Apricot */}
        <div className="absolute -top-32 -left-32 w-150 h-150 rounded-full bg-[#fed7aa]/55 blur-[120px] mix-blend-multiply" />

        {/* Liquid Orb 2: Frosted Sage / Mint Glaze */}
        <div className="absolute top-1/3 -right-32 w-137.5 h-137.5 rounded-full bg-[#bbf7d0]/45 blur-[130px] mix-blend-multiply" />

        {/* Liquid Orb 3: Cream Rose / Lavender Mist */}
        <div className="absolute top-2/3 left-1/4 w-150 h-150 rounded-full bg-[#f5d0fe]/40 blur-[130px] mix-blend-multiply" />

        {/* Liquid Orb 4: Soft Warm Amber Glow at Bottom */}
        <div className="absolute -bottom-32 right-1/4 w-125 h-125 rounded-full bg-[#fed7aa]/40 blur-[120px] mix-blend-multiply" />
      </div>

      {/* Floating Liquid Capsule Navbar */}
      <Navbar onOpenRegister={handleOpenModal} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section & Glass POS Dashboard Mockup */}
        <Hero onOpenRegister={handleOpenModal} />

        {/* Core Features & Value Metrics */}
        <Features />

        {/* Subscription Pricing */}
        <Pricing onOpenRegister={handleOpenModal} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Tenant Registration & Login Onboarding Modal */}
      <RegisterModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        initialMode={modalState.mode}
        selectedTier={modalState.tier}
      />
    </div>
  );
}
