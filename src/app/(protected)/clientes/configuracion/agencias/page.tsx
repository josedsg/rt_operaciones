import { Metadata } from "next";
import GridAgencias from "@/components/Agencias/grid-agencias";

export const metadata: Metadata = {
    title: "Agencias | Rio Tapezco",
    description: "Configuración de Agencias",
};

export default function AgenciasPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-black dark:text-white">Lista de Agencias</h3>
            </div>
            <GridAgencias />
        </div>
    );
}
