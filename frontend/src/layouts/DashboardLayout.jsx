import { Outlet } from "react-router-dom";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import { useSidebar } from "../context/SidebarContext";

export default function DashboardLayout() {

    const { isOpen, closeSidebar } = useSidebar();

    return (
        <div className="flex min-h-screen bg-slate-100">

            {/* Overlay Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            <Sidebar />

            <div className="flex min-w-0 flex-1 flex-col">

                <Topbar />

                <main className="flex-1 p-4 md:p-6">
                    <Outlet />
                </main>

            </div>

        </div>
    );
}