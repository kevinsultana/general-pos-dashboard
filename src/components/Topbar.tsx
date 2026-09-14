'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Sparkles, Clock, Search, Command } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface TopbarProps {
  title: string;
  description?: string;
}

export function Topbar({ title, description }: TopbarProps) {
  const { store } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        await api.checkHealth();
        if (isMounted) setIsOnline(true);
      } catch {
        if (isMounted) setIsOnline(false);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentTime(`${dateStr} • ${timeStr}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0d121f]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight">{title}</h2>
        {description && <p className="text-[11px] text-slate-400 hidden sm:block">{description}</p>}
      </div>

      <div className="flex items-center space-x-2.5">
        {/* Live Date & Time Clock */}
        {currentTime && (
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentTime}</span>
          </div>
        )}

        {/* Real-time Cloud Status */}
        {isOnline ? (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium shadow-xs shadow-emerald-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Cloud Online</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <WifiOff className="w-3.5 h-3.5" />
            <span>Terputus</span>
          </div>
        )}

        {/* Currency badge */}
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-300 text-xs">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span className="font-mono font-semibold text-[11px]">{store?.currency || 'IDR'}</span>
        </div>
      </div>
    </header>
  );
}
