import PageHeader from "../ui/PageHeader";
import MarketTicker from "../dashboard/MarketTicker";
import DashboardFooter from "../dashboard/DashboardFooter";
import { useAuth } from "../../context/AuthContext";
import SidebarRight from "../dashboard/SidebarRight";

export default function General() {
    const { user } = useAuth();

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
               <SidebarRight/>
            </div>

            <DashboardFooter />
        </div>
    );
}