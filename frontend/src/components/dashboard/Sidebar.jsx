import { useSidebar } from "../../context/SidebarContext";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LayoutDashboard,
    BrainCircuit,
    CandlestickChart,
    Users,
    BarChart3,
    Bell,
    Settings,
    LogOut,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import { navigation } from "../../config/navigation";
import useMediaQuery from "../../hooks/useMediaQuery";
import { useAuth } from "../../context/AuthContext";
import SidebarDropdown from "./SidebarDropdown";

export default function Sidebar() {
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const {
    isOpen,
    closeSidebar,
    collapsed,
    toggleCollapse,
    sidebarWidth,
} = useSidebar();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };
    return (
        <aside style={{
                width: `${sidebarWidth}px`,
            }}
            className={`
                fixed
                top-0
                left-0
                z-50
                h-screen
                flex
                flex-col
                border-r
                border-slate-200
                bg-white
                transition-all
                duration-300
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0
                lg:translate-x-0
            `}>

            {/* Logo */}
            <div className={`flex h-16 items-center border-b border-slate-200 ${
                    collapsed ? "justify-center px-2" : "justify-between px-6"
                }`}
            >
                <div className="flex items-center">
                    <img src="/img/logo.png" alt="TraderHub" className="h-10 w-10 rounded-xl shadow-md" />

                    {!collapsed && (
                        <div className="ml-3">
                            <h1 className="font-bold text-slate-900">
                                Forex Hub
                            </h1>

                            <p className="text-xs text-slate-500">
                                AI Trading Platform
                            </p>
                        </div>
                    )}

                </div>
            </div>

            {/* Menu */}
            <div className="flex-1 px-4 py-6">
                {!collapsed && (
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Main Menu</p>
                )}
                <nav className="space-y-2">
                    {navigation.map((menu) => {
                        const Icon = menu.icon;

                        if (menu.children) {
                            return (
                                <SidebarDropdown key={menu.title} item={menu} collapsed={collapsed} />
                            );
                        }

                        return (
                            <NavLink
                                key={menu.title} to={menu.path}
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `group relative flex w-full items-center ${
                                        collapsed ? "justify-center" : "justify-between"
                                    } rounded-xl px-3 py-3 transition ${
                                        isActive
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                                    }`
                                }
                            >
                                <div className={`flex items-center ${
                                    collapsed ? "justify-center" : "gap-3"
                                    }`}>
                                    {collapsed && (
                                    <div
                                        className="
                                            pointer-events-none
                                            absolute
                                            left-16
                                            rounded-lg
                                            bg-slate-900
                                            text-sm
                                            whitespace-nowrap
                                            text-white
                                            opacity-0
                                            shadow-lg
                                            transition-all
                                            group-hover:opacity-100
                                            pl-2
                                            pr-2
                                        "
                                    >
                                        {menu.title}
                                    </div>
                                )}
                                    <Icon size={20} />
                                    {!collapsed && (
                                    <span className="font-medium">
                                        {menu.title}
                                    </span>
                                    )}
                                </div>
                                {!collapsed && (
                                <ChevronRight size={16} />
                                )}
                            </NavLink>
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
                    {!collapsed && (
                    <div>
                        <h4 className="font-semibold">{user?.fullname}</h4>
                        <p className="text-sm text-slate-500">{user?.email}</p>

                    </div>
                    )}
                </div>

                <button onClick={closeSidebar} className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 transition hover:bg-slate-100">
                    <LogOut size={18} />
                    {!collapsed && <span onClick={handleLogout}>Logout</span>}
                </button>

            </div>

        </aside>

        
    );
}
