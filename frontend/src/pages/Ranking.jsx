import { useEffect, useState } from "react";
import { Trophy, Info } from "lucide-react";

import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import MarketTicker from "../components/dashboard/MarketTicker";
import DashboardFooter from "../components/dashboard/DashboardFooter";
import SidebarRight from "../components/layout/SidebarRight";
import { getRanking } from "../services/rankingService";

const RANK_STYLES = {
    1: "bg-amber-100 text-amber-700",
    2: "bg-slate-200 text-slate-700",
    3: "bg-orange-100 text-orange-700",
};

function RankBadge({ rank }) {
    return (
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${RANK_STYLES[rank] || "bg-slate-100 text-slate-500"}`}>
            {rank}
        </span>
    );
}

export default function Ranking() {
    const [ranking, setRanking] = useState([]);
    const [minTrades, setMinTrades] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadRanking = async () => {
        try {
            const { data } = await getRanking();
            setRanking(data.ranking || []);
            setMinTrades(data.minTradesRequired ?? 10);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load ranking.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRanking();
    }, []);

    const columns = [
        { key: "rank", title: "#" },
        { key: "trader", title: "Trader" },
        { key: "winRate", title: "Win Rate" },
        { key: "profitFactor", title: "Profit Factor" },
        { key: "drawdown", title: "Max Drawdown" },
        { key: "sharpe", title: "Sharpe" },
        { key: "score", title: "Score" },
    ];

    const data = ranking.map((entry) => ({
        rank: <RankBadge rank={entry.rank} />,
        trader: (
            <div>
                <p className="font-medium text-slate-800">{entry.displayName}</p>
                {entry.broker && <p className="text-xs text-slate-400">{entry.broker}</p>}
            </div>
        ),
        winRate: `${entry.metrics.winRate}%`,
        profitFactor: entry.metrics.profitFactor,
        drawdown: `${entry.metrics.maxDrawdownPercent}%`,
        sharpe: entry.metrics.sharpeRatio,
        score: <span className="font-semibold text-blue-600">{entry.score}</span>,
    }));

    return (
        <div className="min-h-full">
            <MarketTicker />

            <div className="p-4 md:p-6">
                <PageHeader
                    title="Performance Ranking"
                    subtitle="Trader dengan portofolio publik, diberi skor dari performa trading nyata."
                />

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="min-w-0 space-y-6">
                        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                            <Info size={18} className="mt-0.5 shrink-0" />
                            <p>
                                Skor dihitung dari win rate, profit factor, max drawdown, recovery factor, Sharpe ratio, average RR, dan konsistensi profit — dibandingkan relatif antar trader publik lain, bukan angka absolut tetap.
                                Hanya trader dengan portofolio publik (diaktifkan sendiri lewat halaman Portfolio) dan minimal {minTrades} trade tertutup yang muncul di sini.
                            </p>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
                        ) : ranking.length === 0 ? (
                            <Card className="flex flex-col items-center gap-4 py-14 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                    <Trophy size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Belum ada trader di ranking</h3>
                                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                                        Belum ada portofolio publik dengan cukup riwayat trade. Aktifkan visibilitas publik di halaman Portfolio untuk ikut serta.
                                    </p>
                                </div>
                            </Card>
                        ) : (
                            <Table columns={columns} data={data} />
                        )}
                    </main>

                    <SidebarRight />
                </div>
            </div>

            <DashboardFooter />
        </div>
    );
}
