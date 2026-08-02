import {
    ArrowUp,
    ArrowDown,
    Shield,
    Target,
    CircleStop,
    Brain,
    CheckCircle2,
} from "lucide-react";

export default function AIInsightResult({ result }) {
    const buy = result.action === "BUY";
    return (
        <div
            className="
                mx-auto
                mt-8
                max-w-4xl
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-lg
            "
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span
                        className={`
                            rounded-full
                            px-4
                            py-2
                            text-sm
                            font-semibold
                            ${
                                buy
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-600"
                            }
                        `}
                    >
                        {buy ? "🟢 BUY" : "🔴 SELL"}
                    </span>
                    <div>
                        <h2 className="text-2xl font-bold">
                            {result.pair}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {result.timeframe}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-xs uppercase text-slate-400">AI SCORE</p>
                    <h2 className="text-3xl font-bold text-violet-600">
                        {result.score}<span className="text-lg">/100</span>
                    </h2>
                </div>
            </div>

            {/* Confidence */}
            <div className="mt-6">
                <div className="mb-2 flex justify-between">
                    <span className="font-medium">
                        Confidence
                    </span>
                    <span>
                        {result.confidence}%
                    </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                            width: `${result.confidence}%`,
                        }}
                    />
                </div>
            </div>

            {/* Signals */}
            <div className="mt-5 grid grid-cols-2 gap-y-2 gap-x-6">
                {result.reasons.map((item)=>(
                    <div
                        key={item}
                        className="flex items-center gap-2 text-sm"
                    >
                        <CheckCircle2
                            size={16}
                            className="text-emerald-500"
                        />
                        {item}
                    </div>
                ))}
            </div>

            {/* Stats */}

            <div className="mt-8 grid md:grid-cols-3 grid-cols-1 gap-4">
                <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                        <Shield
                            size={18}
                            className="text-orange-500"
                        />
                        <span className="text-sm text-slate-500">
                            Risk
                        </span>
                    </div>
                    <p className="mt-2 text-base font-bold">
                        {result.risk}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                        <Target
                            size={18}
                            className="text-emerald-600"
                        />
                        <span className="text-sm text-slate-500">
                            Take Profit
                        </span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-emerald-600">
                        {result.tp}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                        <CircleStop
                            size={18}
                            className="text-red-500"
                        />
                        <span className="text-sm text-slate-500">
                            Stop Loss
                        </span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-red-600">
                        {result.sl}
                    </p>
                </div>
            </div>

            {/* AI Summary */}
            <div className="my-5 border-t border-slate-200"></div>
            <div className="mt-8 rounded-2xl bg-violet-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                    <Brain
                        size={22}
                        className="text-blue-600"
                    />
                    <span className="font-semibold">
                        AI Summary
                    </span>
                </div>
                <p className="leading-6 text-sm text-slate-700">
                    {result.summary}
                </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <span>Risk : {result.risk}</span>
                <span>Updated {result.updated}</span>
            </div>

        </div>

    );

}