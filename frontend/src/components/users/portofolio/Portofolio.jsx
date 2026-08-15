import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import PageHeader from "../../ui/PageHeader";
import MarketTicker from "../../dashboard/MarketTicker";
import SidebarRight from "../../layout/SidebarRight";
import DashboardFooter from "../../dashboard/DashboardFooter";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

export default function Portfolio() {
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadPortfolio = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/portfolio`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            setPortfolio(res.data);
        } catch (error) {
            console.error("Failed to load portfolio:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPortfolio();
    }, []);

    const summary = portfolio?.summary || {};
    const trades = portfolio?.recentTrades || [];
    const performance = portfolio?.performance || [];
    const monthly = portfolio?.monthly || [];

    return (
        <div className="min-h-full">
            <MarketTicker />

            <div className="p-4 md:p-6">
                <PageHeader title="Portfolio" description="Trading performance and account statistics." />

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="min-w-0 space-y-6">
                        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <SummaryCard title="Balance" value={formatNumber(summary.balance)} />
                            <SummaryCard title="Equity" value={formatNumber(summary.equity)} />
                            <SummaryCard title="Total Profit" value={formatNumber(summary.totalProfit)} />
                            <SummaryCard title="Max Drawdown" value={`${formatNumber(summary.maxDrawdown)}%`} />
                        </section>

                        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                            <Card title="Performance" description="Portfolio equity and profit performance.">
                                <PerformanceChart data={performance} loading={loading} />
                            </Card>

                            <Card title="Portfolio Summary">
                                <div className="space-y-4">
                                    <StatRow label="Return" value={`${formatNumber(summary.return)}%`} />
                                    <StatRow label="Win Rate" value={`${formatNumber(summary.winRate)}%`} />
                                    <StatRow label="Profit Factor" value={formatNumber(summary.profitFactor)} />
                                    <StatRow label="Average Trade" value={formatNumber(summary.averageTrade)} />
                                    <StatRow label="Max Drawdown" value={`${formatNumber(summary.maxDrawdown)}%`} />
                                    <StatRow label="Total Trades" value={summary.totalTrades ?? 0} />
                                </div>
                            </Card>
                        </section>

                        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                            <Card title="Monthly Performance">
                                <MonthlyChart data={monthly} loading={loading} />
                            </Card>

                            <Card title="Trading Activity">
                                <div className="space-y-4">
                                    <StatRow label="Open Positions" value={summary.openPositions ?? 0} />
                                    <StatRow label="Closed Trades" value={summary.closedTrades ?? 0} />
                                    <StatRow label="Winning Trades" value={summary.winningTrades ?? 0} />
                                    <StatRow label="Losing Trades" value={summary.losingTrades ?? 0} />
                                </div>
                            </Card>
                        </section>

                        <Card title="Recent Trades" description="Latest trading transactions.">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                                            <th className="pb-3">Symbol</th>
                                            <th className="pb-3">Type</th>
                                            <th className="pb-3">Open</th>
                                            <th className="pb-3">Close</th>
                                            <th className="pb-3">Volume</th>
                                            <th className="pb-3">Profit</th>
                                            <th className="pb-3">Duration</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {trades.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="py-8 text-center text-slate-400">
                                                    No trading data available.
                                                </td>
                                            </tr>
                                        ) : (
                                            trades.map((trade) => (
                                                <tr key={trade.id} className="border-b border-slate-50">
                                                    <td className="py-3 font-medium text-slate-700">{trade.symbol}</td>
                                                    <td className={`py-3 ${trade.type === "BUY" ? "text-emerald-600" : "text-red-600"}`}>{trade.type}</td>
                                                    <td className="py-3 text-slate-600">{formatNumber(trade.open_price)}</td>
                                                    <td className="py-3 text-slate-600">{formatNumber(trade.close_price)}</td>
                                                    <td className="py-3 text-slate-600">{trade.volume}</td>
                                                    <td className={`py-3 font-medium ${trade.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatNumber(trade.profit)}</td>
                                                    <td className="py-3 text-slate-500">{trade.duration || "-"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </main>

                    <SidebarRight />
                </div>
            </div>

            <DashboardFooter />
        </div>
    );
}

function Card({ title, description, children }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            <div className="mt-5">{children}</div>
        </section>
    );
}

function SummaryCard({ title, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-400">{title}</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        </div>
    );
}

function StatRow({ label, value }) {
    return (
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-semibold text-slate-700">{value}</span>
        </div>
    );
}

function PerformanceChart({ data, loading }) {
    if (loading) return <div className="h-64 animate-pulse rounded-xl bg-slate-50" />;
    if (!data.length) return <div className="flex h-64 items-center justify-center text-sm text-slate-400">No performance data.</div>;

    const values = data.map((item) => Number(item.value) || 0);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const points = values.map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="h-64 rounded-xl bg-slate-50 p-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-600" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
}

function MonthlyChart({ data, loading }) {
    if (loading) return <div className="h-64 animate-pulse rounded-xl bg-slate-50" />;
    if (!data.length) return <div className="flex h-64 items-center justify-center text-sm text-slate-400">No monthly data.</div>;

    const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);

    return (
        <div className="flex h-64 items-end gap-3 rounded-xl bg-slate-50 p-4">
            {data.map((item) => (
                <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-48 w-full items-end">
                        <div className="w-full rounded-t-lg bg-blue-500" style={{ height: `${Math.max((Number(item.value) / max) * 100, 3)}%` }} />
                    </div>
                    <span className="truncate text-xs text-slate-400">{item.label}</span>
                </div>
            ))}
        </div>
    );
}

function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "-";
    return Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}