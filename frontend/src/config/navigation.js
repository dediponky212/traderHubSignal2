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
    Trophy,
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
        title: "Ranking",
        icon: Trophy,
        path: "/ranking",
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

// Looks up the human-readable title/label for a route path from the nav
// structure above (used by ComingSoon.jsx so a placeholder page always has
// a sensible heading instead of a raw path). Falls back to null if the path
// isn't in the nav at all (e.g. a typo'd URL).
export function getNavLabel(pathname) {
    for (const item of navigation) {
        if (item.path === pathname) return item.title;
        if (item.children) {
            const child = item.children.find((c) => c.path === pathname);
            if (child) return child.label;
        }
    }
    return null;
}