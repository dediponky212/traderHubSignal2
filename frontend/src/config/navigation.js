import {
    LayoutDashboard,
    BrainCircuit,
    CandlestickChart,
    Users,
    BarChart3,
    Bell,
    Settings,
    Calendar,
    Inbox,
    MessageCircle,
    UsersIcon,
} from "lucide-react";

export const navigation = [
    {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
    },
    {
        title: "AI Robots",
        icon: BrainCircuit,
        path: "/robots",
    },
    {
        title: "Signals",
        icon: CandlestickChart,
        path: "/signals",
    },
    {
        title: "Copy Trading",
        icon: Users,
        path: "/copy-trading",
    },
    {
        title: "Portfolio",
        icon: BarChart3,
        path: "/portfolio",
    },
    {
        title: "Calendar",
        icon: Calendar,
        path: "/calendar",
    },
    {
        title: "Messege",
        icon: MessageCircle,
        path: "/notifications",
    },
    {
        title: "Community",
        icon: UsersIcon,
        path: "/community",
    },
    {
        title: "Settings",
        icon: Settings,
        path: "/settings",
    },
];