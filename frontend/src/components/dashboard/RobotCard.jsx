import Button from "../ui/Button";
import {
    Bot,
    Star,
    TrendingUp,
    Shield,
    Users,
} from "lucide-react";

export default function RobotCard({ robot }) {
    return (
        <div
            className="
                min-w-[300px]
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-xl
                hover:border-blue-500
                z-20
            "
        >
        <div className="flex items-center justify-between">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                {robot.badge}
            </span>
            <div className="flex items-center gap-1 text-amber-500">
                <Star
                    size={14}
                    fill="currentColor"
                />
                <span className="text-sm font-semibold">
                    {robot.rating}
                </span>
            </div>
        </div>

            <div className="mt-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Bot size={28} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">
                        {robot.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {robot.strategy}
                    </p>
                </div>
            </div>

            <div className="mt-5 flex justify-between">
                <div className="flex flex-col items-center flex-1">
                    <span className="text-lg font-bold text-emerald-600">
                        {robot.winRate}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                        WinRate
                    </span>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <span className="text-lg font-bold text-blue-600">
                        +{robot.monthly}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                        Month
                    </span>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <span className="text-lg font-bold text-orange-500">
                        {robot.drawdown}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                        DrowDown
                    </span>
                </div>

            </div>
           <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} />
                <span>
                    {robot.users.toLocaleString()} Users
                </span>
            </div>
            <Button size="sm">Detail</Button>
        </div>

    </div>
    );
}