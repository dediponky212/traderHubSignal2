import PageHeader from "../../components/ui/PageHeader";
import MarketTicker from "../../components/dashboard/MarketTicker";
import AIInsightPanel from "../../components/dashboard/aiInsight/AIInsightPanel";
import EconomicCalendar from "../../components/dashboard/EconomicCalender";
import RobotCarousel from "../../components/dashboard/RobotCarousel";
import PortfolioCarousel from "../../components/dashboard/PortFolioCarousel";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
// import { useEffect } from "react";

import { useState } from "react";

export default function DashboardPage() {
 
    const [trades, setTrades] = useState([]);
    return (
        <>
            <div className="space-y-6">
                 <MarketTicker />
                 <RobotCarousel />
                 <PortfolioCarousel />
                 <AIInsightPanel />
                 <EconomicCalendar />
                 <DashboardFooter />
            </div>
        </>
    );
}
