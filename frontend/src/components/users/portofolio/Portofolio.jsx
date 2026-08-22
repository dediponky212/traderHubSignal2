import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, TrendingUp, DollarSign, BarChart3, Eye, EyeOff, Radio } from "lucide-react";
import axios from "axios";
import MonthlyPerformanceChart from "../../charts/MonthlyPerformanceChart";
import PortfolioPerformanceChart from "../../charts/PortfolioPerformanceChart";

import PageHeader from "../../ui/PageHeader";
import Card from "../../ui/Card";
import StatCard from "../../ui/StartCard";
import Table from "../../ui/Table";
import MarketTicker from "../../dashboard/MarketTicker";
import DashboardFooter from "../../dashboard/DashboardFooter";
import SidebarRight from "../../layout/SidebarRight";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

export default function Portfolio() {
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [historyRange, setHistoryRange] = useState("today");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [historyTrades, setHistoryTrades] = useState([]);
    const [tradingStyle, setTradingStyle] = useState(null);
    const [visibility, setVisibility] = useState("private");
    const [savingVisibility, setSavingVisibility] = useState(false);

    const loadPortfolio = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/portfolio`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            setPortfolio(data);
            setVisibility(data.visibility || "private");
        } catch (error) {
            console.error("Failed to load portfolio:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPortfolio();
    }, []);

    const toggleVisibility = async () => {
        if (savingVisibility) return;
        const next = visibility === "public" ? "private" : "public";

        setSavingVisibility(true);
        try {
            const { data } = await axios.patch(
                `${API_URL}/api/portfolio/visibility`,
                { visibility: next },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            setVisibility(data.visibility);
        } catch (error) {
            console.error("Failed to update portfolio visibility:", error);
        } finally {
            setSavingVisibility(false);
        }
    };

    const loadHistory = async (range = historyRange, from = customFrom, to = customTo) => {
        try {
            const params = { range };

            if (range === "custom") {
                if (!from || !to) return;
                params.from = from;
                params.to = to;
            }

            const { data } = await axios.get(`${API_URL}/api/portfolio/history`, {
                params,
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            setHistoryTrades(data.trades || []);
        } catch (error) {
            console.error("Failed to load trade history:", error);
            setHistoryTrades([]);
        }
    };

    useEffect(() => {
        loadHistory("today");
    }, []);

    const loadTradingStyle = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/portfolio/trading-style`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            setTradingStyle(data);
        } catch (error) {
            console.error("Failed to load trading style:", error);
        }
    };

    useEffect(() => {
        loadTradingStyle();
    }, []);

    const summary = portfolio?.summary || {};
    const trades = portfolio?.recentTrades || [];
    const performance = portfolio?.performance || [];
    const monthly = portfolio?.monthly || [];

    return (
        <div className="min-h-full">
            <MarketTicker />

            <div className="p-4 md:p-6">
                <PageHeader
                    title="Portfolio"
                    subtitle="Trading performance and account statistics."
                    actions={
                        <>
                            <button
                                type="button"
                                onClick={toggleVisibility}
                                disabled={savingVisibility}
                                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    visibility === "public"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                                title={visibility === "public" ? "Visible to other users. Click to make it private." : "Only visible to you. Click to make it public."}
                            >
                                {visibility === "public" ? <Eye size={16} /> : <EyeOff size={16} />}
                                {visibility === "public" ? "Public" : "Private"}
                            </button>

                            <Link
                                to="/settings/remote-ea"
                                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                            >
                                <Radio size={16} />
                                Remote EA
                            </Link>
                        </>
                    }
                />

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="min-w-0 space-y-6">

                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <StatCard icon={<Wallet size={34} />} title="Balance" value={formatNumber(summary.balance)} color="text-cyan-600" />

                            <StatCard icon={<TrendingUp size={34} />} title="Equity" value={formatNumber(summary.equity)} color="text-cyan-600" />

                            <StatCard icon={<DollarSign size={34} />} title="Total Profit" value={formatNumber(summary.totalProfit)} color={profitColor(summary.totalProfit)} bg={profitBg(summary.totalProfit)} />
                            
                            <StatCard icon={<BarChart3 size={34} />} title="Max Drawdown" value={`${formatNumber(summary.maxDrawdown)}%`} color={drawdownColor(summary.maxDrawdown)} bg={drawdownBg(summary.maxDrawdown)} />
                        </div>

<aside className="space-y-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
    <div className="flex flex-col gap-3 xl:flex-row">
        <div className="flex items-center justify-between rounded-sm bg-slate-50 px-3 py-2">
            <span className="text-sm text-slate-500 pr-5">Style Trade</span>    
            <span className="text-sm font-semibold text-slate-700">{tradingStyle?.style || "-"}</span>
        </div>

        <div className="flex items-center justify-between rounded-sm bg-slate-50 px-3 py-2">
            <span className="text-sm text-slate-400 pr-5">Fast Trades</span>
            <span className={`text-sm font-semibold ${tradingStyle?.fastTradeRate >= 50 ? "text-red-600" : tradingStyle?.fastTradeRate >= 25 ? "text-amber-600" : "text-emerald-600"}`}>
            {tradingStyle?.fastTradeRate ?? 0}%
        </span>
        </div>

        <div className="flex items-center justify-between rounded-sm bg-slate-50 px-3 py-2">
            <span className="text-sm text-slate-400 pr-5">Risk</span>
            <span className={`text-sm font-semibold ${tradingStyle?.risk === "High" ? "text-red-600" : tradingStyle?.risk === "Medium" ? "text-amber-600" : "text-emerald-600"}`}>
            {tradingStyle?.risk || "-"}
        </span>
        </div>
    </div>
</aside>

                        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">

                            <Card className="min-w-0 overflow-hidden">
                                <h2 className="text-lg font-semibold text-slate-800">Performance</h2>
                                <p className="mt-1 text-sm text-slate-500">Portfolio equity and profit performance.</p>

                                <div className="mt-5 min-w-0">
                                    <PortfolioPerformanceChart data={performance} />
                                </div>
                            </Card>

                            {/* Portfolio SSummary */}
                            <Card>
                                <h2 className="text-lg font-semibold text-slate-800">Portfolio Summary</h2>

                                <div className="mt-5 space-y-3">
                                    <MetricRow label="Return" value={`${formatNumber(summary.return)}%`} condition={getCondition("return", summary.return)} />
                                    <MetricRow label="Win Rate" value={`${formatNumber(summary.winRate)}%`} condition={getCondition("winRate", summary.winRate)} />
                                    <MetricRow label="Profit Factor" value={formatNumber(summary.profitFactor)} condition={getCondition("profitFactor", summary.profitFactor)} />
                                    <MetricRow label="Average Trade" value={formatNumber(summary.averageTrade)} condition={getCondition("profit", summary.averageTrade)} />
                                    <MetricRow label="Max Drawdown" value={`${formatNumber(summary.maxDrawdown)}%`} condition={getCondition("drawdown", summary.maxDrawdown)} />
                                    <MetricRow label="Total Trades" value={summary.totalTrades ?? 0} />
                                </div>
                            </Card>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                            <Card className="min-w-0 overflow-hidden">
                                <h2 className="text-lg font-semibold text-slate-800">Monthly Performance</h2>

                                <div className="mt-5">
                                    <MonthlyPerformanceChart data={monthly} />
                                </div>
                            </Card>

                            <Card>
                                <h2 className="text-lg font-semibold text-slate-800">Trading Activity</h2>

                                <div className="mt-5 space-y-3">
                                    <MetricRow label="Open Positions" value={summary.openPositions ?? 0} />
                                    <MetricRow label="Closed Trades" value={summary.closedTrades ?? 0} />
                                    <MetricRow label="Winning Trades" value={summary.winningTrades ?? 0} condition={summary.winningTrades > summary.losingTrades ? "good" : "bad"} />
                                    <MetricRow label="Losing Trades" value={summary.losingTrades ?? 0} condition={summary.losingTrades > summary.winningTrades ? "bad" : "good"} />
                                </div>
                            </Card>
                        </div>

                        <Card>
                            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800">Recent Trades</h2>
                                    <p className="mt-1 text-sm text-slate-500">Trading history.</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {[
                                        ["today", "Today"],
                                        ["week", "This Week"],
                                        ["month", "This Month"],
                                        ["custom", "Custom"],
                                    ].map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => {
                                                setHistoryRange(value);
                                                if (value !== "custom") loadHistory(value);
                                            }}
                                            className={`rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer ${
                                                historyRange === value
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                                {historyRange === "custom" && (
                                    <div className="mt-4 flex flex-wrap items-end gap-3">
                                        <div>
                                            <label className="mb-1 block text-xs text-slate-400">From</label>
                                            <input
                                                type="date"
                                                value={customFrom}
                                                onChange={(e) => setCustomFrom(e.target.value)}
                                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs text-slate-400">To</label>
                                            <input
                                                type="date"
                                                value={customTo}
                                                onChange={(e) => setCustomTo(e.target.value)}
                                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => loadHistory("custom", customFrom, customTo)}
                                            disabled={!customFrom || !customTo}
                                            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}

                            <Table
                                columns={[
                                    { key: "symbol", title: "Symbol" },
                                    { key: "type", title: "Type" },
                                    { key: "volume", title: "Volume" },
                                    { key: "open_price", title: "Open" },
                                    { key: "close_price", title: "Close" },
                                    { key: "open_time", title: "Open Time" },
                                    { key: "close_time", title: "Close Time" },
                                    { key: "profit", title: "Profit" },
                                ]}

                                data={historyTrades.map((trade) => ({
                                    ...trade,
                                    open_price: formatNumber(trade.open_price),
                                    close_price: formatNumber(trade.close_price),
                                    open_time: formatDateTime(trade.open_time),
                                    close_time: formatDateTime(trade.close_time),
                                    profit: (
                                        <span className={trade.profit >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                                            {formatNumber(trade.profit)}
                                        </span>
                                    ),
                                    type: (
                                        <span className={trade.type === "BUY" ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
                                            {trade.type}
                                        </span>
                                    ),
                                }))}

                                emptyText="No trading data available."
                                maxHeight="480px"/>
                        </Card>
                    </main>

                    <SidebarRight />
                </div>
            </div>

            <DashboardFooter />
        </div>
    );
}

function MetricRow({ label, value, condition }) {
    const styles = {
        good: "bg-emerald-50 text-emerald-600",
        warning: "bg-amber-50 text-amber-600",
        bad: "bg-red-50 text-red-600",
        neutral: "bg-slate-50 text-slate-700",
    };

    return (
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[condition] || styles.neutral}`}>
                {value}
            </span>
        </div>
    );
}

function getCondition(type, value) {
    const n = Number(value);

    if (!Number.isFinite(n)) return "neutral";
    if (type === "profit" || type === "return") return n > 0 ? "good" : n < 0 ? "bad" : "warning";
    if (type === "winRate") return n >= 60 ? "good" : n >= 40 ? "warning" : "bad";
    if (type === "profitFactor") return n >= 1.5 ? "good" : n >= 1 ? "warning" : "bad";
    if (type === "drawdown") return n <= 5 ? "good" : n <= 15 ? "warning" : "bad";

    return "neutral";
}

function profitColor(value) {
    return Number(value) > 0 ? "text-emerald-600" : Number(value) < 0 ? "text-red-600" : "text-amber-600";
}
function profitBg(value) {
    return Number(value) > 0 ? "bg-emerald-50" : Number(value) < 0 ? "bg-red-50" : "bg-amber-50";
}
function drawdownColor(value) {
    return Number(value) <= 5 ? "text-emerald-600 bg-emerald-50" : Number(value) <= 15 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
}
function drawdownBg(value) {
    return Number(value) <= 5 ? "text-emerald-600 bg-emerald-50" : Number(value) <= 15 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
}

function PerformanceChart({ data, loading }) {
    if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-50" />;
    if (!data.length) return <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">No performance data.</div>;

    const values = data.map((item) => Number(item.value) || 0);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${100 - ((value - min) / range) * 100}`).join(" ");

    return (
        <div className="h-64 rounded-2xl bg-slate-50 p-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-600" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
}

function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "-";
    return Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatDateTime(value) {
    if (!value) return "-";
    return new Date(value.replace(" ", "T")).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}