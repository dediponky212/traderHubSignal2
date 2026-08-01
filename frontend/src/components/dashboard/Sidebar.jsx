import { useSidebar } from "../../context/SidebarContext";
import {
    LayoutDashboard,
    BrainCircuit,
    CandlestickChart,
    Users,
    BarChart3,
    Bell,
    Settings,
    LogOut,
    ChevronRight,
    TrendingUp,
} from "lucide-react";
import { navigation } from "../../config/navigation";

export default function Sidebar() {
    const { isOpen, closeSidebar } = useSidebar();
    return (
        <aside
            className={`
                fixed
                top-0
                left-0
                z-50
                flex
                h-screen
                w-72
                flex-col
                border-r
                border-slate-200
                bg-white
                transition-transform
                duration-300

                ${isOpen ? "translate-x-0" : "-translate-x-full"}

                lg:static
                lg:translate-x-0
            `}
        >

            {/* Logo */}
            <div className="flex h-16 items-center border-b border-slate-200 px-6">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <TrendingUp size={20} />
                </div>

                <div className="ml-3">
                    <h1 className="font-bold text-slate-900">
                        Forex Hub
                    </h1>

                    <p className="text-xs text-slate-500">
                        AI Trading Platform
                    </p>
                </div>

            </div>

            {/* Menu */}
            <div className="flex-1 px-4 py-6">

                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Main Menu
                </p>

                <nav className="space-y-2">

                    {navigation.map((menu) => {
                        const Icon = menu.icon;

                        return (
                            <button
                                onClick={closeSidebar}
                                key={menu.title}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                                <div className="flex items-center gap-3">

                                    <Icon size={20} />

                                    <span className="font-medium">
                                        {menu.title}
                                    </span>

                                </div>

                                <ChevronRight size={16} />

                            </button>
                        );
                    })}

                </nav>

            </div>

            {/* User */}
            <div className="border-t border-slate-200 p-4">

                <div className="mb-4 flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                        A
                    </div>

                    <div>

                        <h4 className="font-semibold">
                            Admin
                        </h4>

                        <p className="text-sm text-slate-500">
                            admin@forexhub.ai
                        </p>

                    </div>

                </div>

                <button onClick={closeSidebar} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 transition hover:bg-slate-100">
                    <LogOut size={18} />
                    Logout
                </button>

            </div>

        </aside>
    );
}