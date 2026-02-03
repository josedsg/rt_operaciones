import { Metadata } from "next";
import GridTerminals from "@/components/Terminals/grid-terminals";

export const metadata: Metadata = {
    title: "Terminales | Rio Tapezco",
    description: "Configuración de Terminales",
};

export default function TerminalesPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-black dark:text-white">Lista de Terminales</h3>
            </div>
            <GridTerminals />
        </div>
    );
}
