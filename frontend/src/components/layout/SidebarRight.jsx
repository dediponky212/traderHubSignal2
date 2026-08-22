import { useLocation } from "react-router-dom";
import DashboardSidebar from "../sidebarRight/DashboardSidebar";
import PortfolioSidebar from "../sidebarRight/PortofolioSidebar";
import RemoteEASidebar from "../sidebarRight/RemoteEASidebar";
import AiRobotSidebar from "../sidebarRight/AiRobotSidebar";

export default function SidebarRight() {
    const { pathname } = useLocation();

    if (pathname === "/portfolio") {
        return <PortfolioSidebar />;
    }

    if (pathname === "/settings/remote-ea") {
        return <RemoteEASidebar />;
    }

    if (pathname === "/robots") {
        return <AiRobotSidebar />;
    }

    return <DashboardSidebar />;
}



