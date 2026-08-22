import MarketTicker from "../dashboard/MarketTicker";
import DashboardFooter from "../dashboard/DashboardFooter";
import DashboardSidebar from "../sidebarRight/DashboardSidebar";

export default function General() {
    return (
        <div className="min-h-full">
            <MarketTicker />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                {/* Main Content */}
                <main className="min-w-0">
        

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                       
                    </div>
                </main>

                {/* Right Sidebar */}
               <DashboardSidebar/>
            </div>

            <DashboardFooter />
        </div>
    );
}