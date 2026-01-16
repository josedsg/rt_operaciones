import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import GridProveedor from "@/components/Proveedores/grid-proveedor";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Proveedores | RT Operaciones",
    description: "Gestión de proveedores de la empresa",
};

export default function ProveedoresPage() {
    return (
        <>
            <Breadcrumb pageName="Proveedores" />

            <div className="flex flex-col gap-10">
                <GridProveedor />
            </div>
        </>
    );
}
