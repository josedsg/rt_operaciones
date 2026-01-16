import { Metadata } from "next";
import GridTipoCliente from "@/components/Clientes/grid-tipo-cliente";

export const metadata: Metadata = {
    title: "Tipos de Cliente | Rio Tapezco",
    description: "Configuración de Tipos de Cliente",
};

export default function TiposClientePage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-black dark:text-white">Lista de Tipos</h3>
                {/* Button to add new type could go here */}
            </div>
            <GridTipoCliente />
        </div>
    );
}
