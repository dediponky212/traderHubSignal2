import {
    Cpu,
    Circle,
    ShieldCheck,
    BookOpen,
    LifeBuoy,
} from "lucide-react";

export default function DashboardFooter() {
    return (
        <footer
            className="
                mt-10
                border-t
                border-slate-200
                py-6
                text-sm
                text-slate-500
            "
        >
            <div className="flex flex-col items-center gap-5">

                <p className="text-center text-slate-400">
                    Powered by <span className="font-semibold text-violet-600">Artificial Intelligence</span> for Smarter Trading
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6">

                    <div className="flex items-center gap-2">
                        <Circle
                            size={10}
                            className="fill-emerald-500 text-emerald-500"
                        />
                        <span>AI Online</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Cpu size={16} />
                        <span>v1.0.0</span>
                    </div>

                    <button
                        className="
                            flex
                            items-center
                            gap-2
                            transition
                            hover:text-violet-600
                        "
                    >
                        <BookOpen size={16} />
                        Docs
                    </button>

                    <button
                        className="
                            flex
                            items-center
                            gap-2
                            transition
                            hover:text-violet-600
                        "
                    >
                        <LifeBuoy size={16} />
                        Support
                    </button>

                    <button
                        className="
                            flex
                            items-center
                            gap-2
                            transition
                            hover:text-violet-600
                        "
                    >
                        <ShieldCheck size={16} />
                        Privacy
                    </button>

                </div>

                <p className="text-center text-xs text-slate-400">
                    © 2026 ForexHub. All rights reserved.
                </p>

            </div>
        </footer>
    );
}