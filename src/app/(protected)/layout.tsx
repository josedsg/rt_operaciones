

import { Sidebar } from "@/components/Layouts/sidebar";
import { MobileMenuButton } from "@/components/Layouts/mobile-menu-button";

import { auth } from "@/auth";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar user={session?.user} />

            {/* Content Area */}
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-gray-2 dark:bg-dark">
                {/* Header / Mobile Menu Button */}
                {/* We can put Header here if we separate it later */}
                <MobileMenuButton />

                <main className="isolate mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
