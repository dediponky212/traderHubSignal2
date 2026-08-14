import Button from "../ui/Button";
import { useSidebar } from "../../context/SidebarContext";
import useMediaQuery from "../../hooks/useMediaQuery";
import {PanelLeftClose, PanelLeftOpen,Menu,
    Bell,
    Search,
    Cpu,
    Circle,
    User,
    Settings,
    LogOut,
} from "lucide-react";
import Input from "../form/Input";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";

export default function Topbar() {
    
const isDesktop = useMediaQuery("(min-width: 1024px)");
    const {toggleSidebar,
        isOpen,
        closeSidebar,
        collapsed,
        toggleCollapse,
        sidebarWidth,
    } = useSidebar();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [openProfile, setOpenProfile] = useState(false);
    const profileRef = useRef(null);
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                profileRef.current &&
                !profileRef.current.contains(e.target)
            ) {
                setOpenProfile(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };
    return (
            <header
                style={{
                    left: isDesktop ? `${sidebarWidth}px` : "0",
                    width: isDesktop
                        ? `calc(100% - ${sidebarWidth}px)`
                        : "100%",
                }}
                className="
                    fixed
                    top-0
                    right-0
                    z-30
                    h-16
                    border-b
                    border-slate-200
                    bg-white
                    px-6
                    flex
                    items-center
                    justify-between
                    transition-all
                    duration-300
                "
            >
            <div className="flex items-center gap-3">
                <Button className="lg:hidden p-2" onClick={toggleSidebar}>
                    <Menu size={20} />
                </Button>
            </div>

            <Button
                unstyled
                className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white cursor-pointer"
                onClick={toggleCollapse}
            >
                {collapsed ? (
                    <PanelLeftOpen size={20} />
                ) : (
                    <PanelLeftClose size={20} />
                )}
            </Button>

            {/* Search */}
            {/* <div className="flex flex-1 px-4"> */}
            <div className="w-full max-w-md pl-2">
                <div className="relative">
                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                        placeholder="Search..."
                        className="pl-11 py-2"
                    />
                </div>
            </div>

            {/* Right */}
            <div className="ml-auto flex items-center gap-2 md:gap-4">
                <div className="hidden lg:flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">
                    <Circle
                        size={10}
                        className="fill-emerald-500 text-emerald-500"
                    />
                    AI Online
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer ml-2">
                    <Cpu size={18} />
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer">
                    <Bell size={18} />
                </div>

                <div ref={profileRef} className="relative hidden md:block border-l border-slate-200 pl-4">
                    <button
                        onClick={() => setOpenProfile(!openProfile)}
                        className="flex items-center gap-3 cursor-pointer">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                            {user?.fullname?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-slate-900">{user?.fullname}</p>
                            <p className="text-xs text-slate-500">{user?.email}</p>
                        </div>
                    </button>

                    {openProfile && (
                        <div
                            className="
                                absolute
                                right-0
                                mt-3
                                w-64
                                overflow-hidden
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                shadow-xl
                            ">
                                
                            <button onClick={() => navigate("/profile")} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                                <User size={18} />
                                My Profile
                            </button>
                            <button onClick={() => navigate("/accountSetting")} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                                <Settings size={18} />
                                Account Settings
                            </button>

                            <div className="border-t" />
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 cursor-pointer">
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}