import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Award, BarChart3, Activity, ArrowUpRight, ArrowDownRight, Zap, ArrowLeft, LogOut, Home } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState({ totalProfit: 0, winRate: 0, totalTrades: 0 });

  // Tarik data dari Backend Node.js secara berkala
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:3000/api/trades');
        if (response.data.status === 'success') {
          const data = response.data.data;
          setTrades(data);
          hitungStatistik(data);
        }
      } catch (error) {
        console.error("Gagal terhubung ke API backend:", error);
      }
    };

    fetchTrades();
    const interval = setInterval(fetchTrades, 5000); // Auto-refresh setiap 5 detik
    return () => clearInterval(interval);
  }, []);

  // Logika Matematika Performa Akun
// Logika Matematika Performa Akun yang Kebal Error Data Kosong
  const hitungStatistik = (data) => {
    if (!Array.isArray(data) || data.length === 0) return;
    
    const closedTrades = data.filter(t => t && t.status === 'CLOSE');
    const totalPnl = closedTrades.reduce((acc, curr) => acc + (Number(curr.pnl) || 0), 0);
    const winTrades = closedTrades.filter(t => (Number(t.pnl) || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? (winTrades / closedTrades.length) * 100 : 0;

    setStats({
      totalProfit: totalPnl,
      winRate: Math.round(winRate),
      totalTrades: data.length
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="font-semibold text-lg tracking-tight">ForexHub <span className="text-slate-400 font-normal">Console</span></span>
          </div>

  <div>
    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
      ForexHub Analytics
    </h1>
    <p className="text-xs sm:text-sm text-slate-500 mt-1">
      Monitoring data transaksi MT5 secara real-time
    </p>
  </div>

    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t border-slate-100 sm:border-t-0">
    <a href="/" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
      <Home className="w-4 h-4 text-slate-400" />
      Home Page
    </a>
    
    {/* Garis Pembatas Vertikal (Otomatis disembunyikan di HP, muncul di Desktop) */}
    <div className="hidden sm:block h-4 w-[1px] bg-slate-200"></div> 
    
    <button 
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95"
    >
      <LogOut className="w-4 h-4" />
      Logout
    </button>
  </div>





        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trading Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau performa eksekusi robot dan sinyal Anda secara real-time.</p>
        </div>

        {/* 3 Analytics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Net Accumulation</span>
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            {/* GANTI BLOK DIV TOTAL PROFIT ANDA DENGAN VERSI AMAN INI */}
            <div className={`text-3xl font-bold tracking-tight ${(stats?.totalProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {(stats?.totalProfit || 0) >= 0 
                ? `+$${(Number(stats?.totalProfit) || 0).toFixed(2)}` 
                : `-$${Math.abs(Number(stats?.totalProfit) || 0).toFixed(2)}`}
            </div>
            <p className="text-xs text-slate-400 mt-2">Berdasarkan data closed positions</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Win Rate Accuracy</span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-slate-900">{stats.winRate}%</div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${Math.round(stats?.winRate || 0)}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Total Operations</span>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-slate-900">{stats.totalTrades}</div>
            <p className="text-xs text-slate-400 mt-2">Termasuk Open, Modify, & Close</p>
          </div>
        </div>

        {/* Live Transaction Ledger Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Real-time Transaction Ledger</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-500 tracking-wider">
                  <th className="py-3 px-6">Ticket</th>
                  <th className="py-3 px-6">Symbol</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Execution Status</th>
                  <th className="py-3 px-6 text-right">Volume</th>
                  <th className="py-3 px-6 text-right">Price</th>
                  <th className="py-3 px-6 text-right">P&L ($)</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 font-medium">
                      Menunggu data masuk dari MetaTrader 5...
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => {
                    // Amankan variabel data dari null/undefined sebelum dirender
                    const actionText = trade?.action || '';
                    const isBuy = actionText.includes('BUY');
                    const volumeValue = Number(trade?.volume || 0).toFixed(2);
                    const priceValue = Number(trade?.price || 0).toFixed(5);
                    const pnlValue = Number(trade?.pnl || 0);

                    return (
                      <tr key={trade?.id || trade?.ticket} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-xs text-slate-400">#{trade?.ticket || '0000'}</td>
                        <td className="py-3.5 px-6 font-semibold text-slate-900">{trade?.symbol || '-'}</td>
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex items-center gap-1 font-medium ${isBuy ? 'text-indigo-600' : 'text-amber-700'}`}>
                            {isBuy ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {actionText || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            trade?.status === 'OPEN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            trade?.status === 'MODIFY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {trade?.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-slate-600">{volumeValue}</td>
                        <td className="py-3.5 px-6 text-right font-mono text-slate-600">{priceValue}</td>
                        <td className={`py-3.5 px-6 text-right font-mono font-semibold ${
                          trade?.status !== 'CLOSE' ? 'text-slate-400 font-normal' :
                          pnlValue >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {trade?.status !== 'CLOSE' ? '-' : pnlValue >= 0 ? `+$${pnlValue.toFixed(2)}` : `-$${Math.abs(pnlValue).toFixed(2)}`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}