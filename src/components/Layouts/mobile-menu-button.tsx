"use client";

import { useSidebarContext } from "@/components/Layouts/sidebar/sidebar-context";
import { MenuIcon } from "@/components/Layouts/header/icons";

export function MobileMenuButton() {
    const { toggleSidebar } = useSidebarContext();

    return (
        <button
            onClick={toggleSidebar}
            className="absolute left-4 top-4 z-40 rounded-lg border border-stroke bg-white px-1.5 py-1 text-dark-4 hover:text-dark-4 dark:border-stroke-dark dark:bg-dark dark:text-white lg:hidden"
        >
            <MenuIcon />
            <span className="sr-only">Toggle Sidebar</span>
        </button>
    );
}
