import { Metadata } from "next";
import GridGeografia from "@/components/Clientes/grid-geografia";

export const metadata: Metadata = {
    title: "Geografía | Rio Tapezco",
    description: "Visualizador de División Territorial",
};

export default function GeografiaPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-black dark:text-white">División Territorial Administrativa</h3>
            </div>
            <GridGeografia />
        </div>
    );
}
