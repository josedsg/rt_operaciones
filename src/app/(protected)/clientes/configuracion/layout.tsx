"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const configMenu = [
    { name: "Tipos de Cliente", href: "/clientes/configuracion/tipos-cliente" },
    { name: "Términos de Pago", href: "/clientes/configuracion/terminos-pago" },
    { name: "Geografía", href: "/clientes/configuracion/geografia" },
];

export default function ConfigLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                    Configuración de Clientes
                </h2>

                <div className="flex flex-wrap gap-4 border-b border-stroke dark:border-strokedark pb-4">
                    {configMenu.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-white ${isActive
                                        ? "bg-primary text-white"
                                        : "bg-gray-2 text-dark dark:bg-meta-4 dark:text-white"
                                    }`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="w-full">{children}</div>
        </div>
    );
}
