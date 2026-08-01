import { createContext, useContext, useState } from "react";

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const openSidebar = () => setIsOpen(true);
    const closeSidebar = () => setIsOpen(false);
    const toggleSidebar = () => setIsOpen((prev) => !prev);
    const [collapsed, setCollapsed] = useState(false);
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const sidebarWidth = collapsed ? 80 : 288;

    const toggleCollapse = () => {
        setCollapsed((prev) => !prev);
    };
    
    return (
        <SidebarContext.Provider
            value={{
                isOpen,
                openSidebar,
                closeSidebar,
                toggleSidebar,
                collapsed,
                toggleCollapse,
                sidebarWidth,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}