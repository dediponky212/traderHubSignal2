import { useState } from "react";
import { Search } from "lucide-react";
import { aiPairs } from "../../../data/aiPairs";
import { aiDummyResult } from "../../../data/aiDummyResult";
import AIInsightResult from "./AIInsightResult";

export default function AIInsightPanel() {
    const categories = Object.keys(aiPairs);
    const [category, setCategory] = useState("Metal");
    const [pair, setPair] = useState(aiPairs.Metal[0]);
    const [timeframe, setTimeframe] = useState("H1");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const analyze = () => {
        setLoading(true);
        setResult(null);
        setTimeout(() => {
            setResult({
                ...aiDummyResult,
                pair,
                timeframe,
            });
            setLoading(false);
        }, 1500);
    };

    const handleSearch = (value) => {
    setSearch(value);
    if (!value) return;
    const keyword = value.toUpperCase();
    for (const categoryName of Object.keys(aiPairs)) {
        const found = aiPairs[categoryName].find((item) =>
            item.includes(keyword)
        );
        if (found) {
            setCategory(categoryName);
            setPair(found);
            break;
        }
    }
};

    return (
        <section className="mx-auto mt-10 max-w-4xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-center text-3xl font-bold">
                    🧠 AI Market Insight
                </h2>
                <p className="mt-2 text-center text-slate-500">
                    Analyze any market instantly using AI
                </p>
                {/* Search */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <div className="relative w-full max-w-sm">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search Symbol..."
                            className="
                                w-full
                                rounded-xl
                                border
                                border-slate-200
                                py-3
                                pl-10
                                pr-3
                                outline-none
                                focus:border-blue-500
                            "
                        />
                    </div>

                    <select
                        value={category}
                        onChange={(e) => {
                            setCategory(e.target.value);
                            setPair(aiPairs[e.target.value][0]);
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-3"
                    >

                        {categories.map((item) => (
                            <option key={item}>
                                {item}
                            </option>
                        ))}
                        </select>
                        <select
                            value={pair}
                            onChange={(e) => setPair(e.target.value)}
                            className="rounded-xl border border-slate-200 px-4 py-3"
                        >
                            {aiPairs[category].map((item) => (
                                <option key={item}>
                                    {item}
                                </option>
                            ))}
                        </select>

                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="rounded-xl border border-slate-200 px-4 py-3"
                        >
                            <option>M1</option>
                            <option>M5</option>
                            <option>M15</option>
                            <option>M30</option>
                            <option>H1</option>
                            <option>H4</option>
                            <option>D1</option>
                            <option>W1</option>
                        </select>

                        <button
                            onClick={analyze}
                            disabled={loading}
                            className="
                                rounded-xl
                                bg-violet-600
                                px-6
                                py-3
                                font-semibold
                                text-white
                                transition
                                hover:bg-violet-700
                                disabled:cursor-not-allowed
                                disabled:opacity-70
                            "
                        >
                            {loading ? "Analyzing..." : "Analyze AI"}
                        </button>
                </div>

                {/* RESULT */}
                <div className="mt-8">
                    {!loading && !result && (
                        <div
                            className="
                                mx-auto
                                max-w-3xl
                                rounded-2xl
                                border
                                border-dashed
                                border-violet-200
                                bg-gradient-to-br
                                from-violet-50
                                to-white
                                p-8
                                text-center
                            "
                        >
                        <div className="text-6xl"> 🧠 </div>
                        <h3 className="mt-4 text-2xl font-bold text-slate-800">
                            ForexHub AI Engine
                        </h3>
                        <p className="mx-auto mt-3 max-w-2xl text-slate-600 leading-7">
                            Our Artificial Intelligence analyzes market structure,
                            technical indicators, momentum, volatility, price action,
                            and risk management to generate high-probability trading
                            opportunities.
                        </p>

                        <div className="mt-8 grid grid-cols-2 gap-4 text-left md:grid-cols-3">
                            <div>✅ EMA & SMA Analysis</div>
                            <div>✅ RSI & MACD</div>
                            <div>✅ Volume Analysis</div>
                            <div>✅ Trend Detection</div>
                            <div>✅ TP / SL Calculation</div>
                            <div>✅ AI Confidence Score</div>
                        </div>

                        <div className="mt-8 rounded-xl bg-violet-100 p-4">
                            <p className="font-medium text-violet-700">
                                Select a market, timeframe and press
                                <strong> Analyze AI </strong>
                                to generate a complete trading analysis.
                            </p>
                        </div>

                    </div>
                )}

                {loading && (
                    <div
                        className="
                            mx-auto
                            max-w-3xl
                            rounded-2xl
                            border
                            border-violet-200
                            bg-white
                            p-8
                        "
                    >
                        <h3 className="text-center text-xl font-bold">
                            🤖 AI Engine Working...
                        </h3>

                        <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="
                                    h-full
                                    w-2/3
                                    animate-pulse
                                    rounded-full
                                    bg-violet-600
                                "
                            />
                        </div>

                        <div className="mt-8 space-y-4">
                            <div>📡 Loading Market Data...</div>
                            <div>📈 Checking Trend...</div>
                            <div>📊 Calculating Indicators...</div>
                            <div>🎯 Finding Entry...</div>
                            <div>⚖ Calculating TP / SL...</div>
                            <div>🧠 Generating AI Summary...</div>
                        </div>

                    </div>

                )}

                    {!loading && result && (
                        <div className="animate-[fadeIn_.4s_ease]">
                            <AIInsightResult result={result} />
                        </div>
                    )}
                </div>

            </div>

        </section>

    );

}