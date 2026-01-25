import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Configuración | RT Operaciones",
    description: "Sección de configuración del sistema",
};

export default function ConfiguracionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
        </div>
    );
}
