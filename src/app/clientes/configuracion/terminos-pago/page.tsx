import { Metadata } from "next";
import GridTerminosPago from "@/components/Clientes/grid-terminos-pago";

export const metadata: Metadata = {
    title: "Términos de Pago | Rio Tapezco",
    description: "Configuración de Términos de Pago",
};

export default function TerminosPagoPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-black dark:text-white">Lista de Términos de Pago</h3>
            </div>
            <GridTerminosPago />
        </div>
    );
}
