import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import MarketTicker from "../components/dashboard/MarketTicker";
import DashboardFooter from "../components/dashboard/DashboardFooter";
import SidebarRight from "../components/layout/SidebarRight";
import { getNavLabel } from "../config/navigation";

// Fallback for any dashboard route that's in the sidebar/nav but doesn't
// have a real page built yet - matched by App.jsx's wildcard route, so a
// broken/future nav link never renders a blank page.
export default function ComingSoon() {
    const { pathname } = useLocation();
    const title = getNavLabel(pathname) || "This page";

    return (
        <div className="min-h-full">
            <MarketTicker />

            <div className="p-4 md:p-6">
                <PageHeader title={title} subtitle="This feature is still being built." />

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="min-w-0">
                        <Card className="flex flex-col items-center gap-4 py-14 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                <Construction size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Coming Soon</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                                    {title} isn't ready yet — we're still building it. Check back soon.
                                </p>
                            </div>
                        </Card>
                    </main>

                    <SidebarRight />
                </div>
            </div>

            <DashboardFooter />
        </div>
    );
}
