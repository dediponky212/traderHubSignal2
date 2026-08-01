import { Menu } from "lucide-react";
import Button from "../ui/Button";
import { useSidebar } from "../../context/SidebarContext";
import {
    Bell,
    Search,
    Cpu,
    Circle,
} from "lucide-react";

import Input from "../form/Input";

export default function Topbar() {
    const { toggleSidebar } = useSidebar();
    return (
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div className="flex items-center gap-3">

            <Button
                className="lg:hidden p-2"
                onClick={toggleSidebar}
            >
                <Menu size={20} />
            </Button>

        </div>

            {/* Search */}
            <div className="w-full max-w-md">
                <div className="relative">
                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                        placeholder="Search..."
                        className="pl-11 py-2"
                    />
                </div>
            </div>

            {/* Right */}
            <div className="ml-auto flex items-center gap-2 md:gap-4">
                <div className="hidden lg:flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">
                    <Circle
                        size={10}
                        className="fill-emerald-500 text-emerald-500"
                    />
                    AI Online
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer">
                    <Cpu size={18} />
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer">
                    <Bell size={18} />
                </div>

                <div className="hidden md:flex items-center gap-3 border-l border-slate-200 pl-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                        A
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-900"></p>
                        <p className="text-xs text-slate-500">Premium Member</p>
                    </div>

                </div>
            </div>
        </header>
    );
}