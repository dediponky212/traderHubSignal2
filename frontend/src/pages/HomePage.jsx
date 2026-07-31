import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Database, Share2, ArrowRight, Cpu } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Header/Navbar */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              ForexHub <span className="text-slate-400 font-normal">Platform</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Infrastruktur</a>
          </div>
          <div>
            <Link to="/dashboard" className="inline-flex items-center justify-center text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 h-9 px-4 rounded-lg transition-colors gap-1.5">
              Console Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium mb-6">
          <Cpu className="w-3.5 h-3.5" /> Next-Gen MT5 Bridge Infrastructure
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
          Jembatan Otomatisasi Trading dari <span className="text-indigo-600">MetaTrader</span> ke Komunitas Anda
        </h1>
        <p className="mt-6 text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Eksekusi transaksi di MT5 dan biarkan sistem kami mencatatnya ke database permanen, menghitung analitik performa, serta meneruskannya ke Telegram secara real-time.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link to="/dashboard" className="h-11 px-6 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-xl inline-flex items-center justify-center shadow-xs transition-all">
            Mulai Sinkronisasi Akun
          </Link>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-200/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Arsitektur Hulu ke Hilir yang Andal</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Eksekusi Ultra Kilat</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Sinyal terkirim ke Telegram kurang dari 200 milidetik setelah dieksekusi di terminal MT5 Anda.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Buku Besar Absolut</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Setiap aksi Open, Modify, dan Close terekam permanen secara mandiri ke dalam SQLite.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 mb-4">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Multi-Channel Broadcasting</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Cukup satu kali pasang EA robot, sinyal Anda langsung terdistribusi serentak ke saluran Telegram.
            </p>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-8 text-center text-xs text-slate-400">
        © 2026 ForexHub Infrastructure Node. All rights reserved.
      </footer>
    </div>
  );
}