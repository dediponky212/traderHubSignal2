import { Outlet } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import useMediaQuery from "../hooks/useMediaQuery";
import { useSidebar } from "../context/SidebarContext";

export default function DashboardLayout() {
const isDesktop = useMediaQuery("(min-width: 1024px)");
    const {
        isOpen,
        closeSidebar,
        sidebarWidth,
    } = useSidebar();
    return (
        <div className="h-screen overflow-hidden bg-slate-100">
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}
            <Sidebar />

            <div
                className="flex h-screen flex-col transition-all duration-300"
                style={{
                    marginLeft: isDesktop ? `${sidebarWidth}px` : "0",
                    width: isDesktop
                        ? `calc(100% - ${sidebarWidth}px)`
                        : "100%",
                }}
            >

                <Topbar />

                <main
                    className="
                        mt-16
                        flex-1
                        overflow-y-auto
                        p-4
                        md:p-6
                    "
                >

                    <Outlet />

                </main>

            </div>

        </div>
    );
}