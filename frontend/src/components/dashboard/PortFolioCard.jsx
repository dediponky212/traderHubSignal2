import { BriefcaseBusiness, Star, Users } from "lucide-react";

export default function PortfolioCard({ portfolio }) {
    return (
        <div
    className="
        robot-card
        snap-center
        shrink-0

        min-w-[290px]

        rounded-2xl
        border
        border-slate-200
        bg-white
        p-3

        shadow-sm
        transition-all
        duration-300

        hover:-translate-y-1
        hover:shadow-xl
        hover:border-blue-500
    "
>
            <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    {portfolio.badge}
                </span>

                <div className="flex items-center gap-1 text-amber-500">
                    <Star
                        size={14}
                        fill="currentColor"
                    />
                    <span className="text-sm font-semibold">
                        {portfolio.rating}
                    </span>
                </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <BriefcaseBusiness size={22} />
                </div>
                <div>
                    <h4 className="font-semibold">
                        {portfolio.name}
                    </h4>
                    <p className="text-sm text-slate-500">
                        {portfolio.type}
                    </p>
                </div>
            </div>

            <div className="mt-2 flex justify-between">
                <div className="text-center flex-col items-center flex-1">
                    <p className="text-md font-bold text-blue-600">
                        +{portfolio.monthly}%
                    </p>
                    <p className="text-[11px] text-slate-400">
                        Month
                    </p>
                </div>

                <div className="text-center flex-col items-center flex-1">
                    <p className="text-md font-bold text-orange-500">
                        {portfolio.drawdown}%
                    </p>
                    <p className="text-[11px] text-slate-400">
                        DrawDown
                    </p>
                </div>
                

                <div className="text-center flex-col items-center flex-1">
                    <p className="text-md font-bold text-blue-600">
                        +{portfolio.winRate}%
                    </p>
                    <p className="text-[11px] text-slate-400">
                        WinRate
                    </p>
                </div>

            </div>

            <div className="mt-3 flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users size={16} />
                    {portfolio.investors.toLocaleString()}
                </div>
                <button
                    className="
                        cursor-pointer
                        rounded-lg
                        bg-emerald-600
                        px-3
                        py-1.5
                        text-xs
                        font-medium
                        text-white
                        hover:bg-emerald-700
                    "
                >
                    Detail
                </button>

            </div>

        </div>

    );

}