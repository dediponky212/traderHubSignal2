import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function SidebarDropdown({ item, collapsed }) {
    const [open, setOpen] = useState(false);
    const Icon = item.icon;

    return (
        <div>
            <button
                type="button"
                onClick={() => !collapsed && setOpen(!open)}
                className={`group relative flex w-full items-center rounded-xl px-3 py-3 transition ${
                    collapsed ? "justify-center" : "justify-between"
                } text-slate-600 hover:bg-blue-50 hover:text-blue-600`}
            >
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                    {collapsed && (
                        <div className="pointer-events-none absolute left-16 rounded-lg bg-slate-900 px-2 text-sm whitespace-nowrap text-white opacity-0 shadow-lg transition-all group-hover:opacity-100">
                            {item.title}
                        </div>
                    )}

                    <Icon size={20} />

                    {!collapsed && <span className="font-medium">{item.title}</span>}
                </div>

                {!collapsed && (
                    <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                )}
            </button>

            {!collapsed && open && (
                <div className="ml-8 mt-1 space-y-1">
                    {item.children?.map((child) => {
                        const ChildIcon = child.icon;

                        return (
                            <NavLink
                                key={child.path}
                                to={child.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                                        isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                    }`
                                }
                            >
                                <ChildIcon size={16} />
                                <span>{child.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            )}
        </div>
    );
}