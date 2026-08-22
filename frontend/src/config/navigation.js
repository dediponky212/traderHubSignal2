import {
    LayoutDashboard,
    BrainCircuit,
    CandlestickChart,
    Users,
    BarChart3,
    Bell,
    Settings,
    Calendar,
    MessageCircle,
    UsersIcon,
    SlidersHorizontal,
    Copy,
    Radio,
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
        children: [
            {
                label: "General",
                path: "/settings/general",
                icon: SlidersHorizontal,
            },
            {
                label: "Remote EA",
                path: "/settings/remote-ea",
                icon: SlidersHorizontal,
            },
            {
                label: "Copy Trading",
                path: "/settings/copy-trading",
                icon: Copy,
            },
            {
                label: "Signal",
                path: "/settings/signal",
                icon: Radio,
            },
            {
                label: "Notifications",
                path: "/settings/notifications",
                icon: Bell,
            },
        ],
    },
];