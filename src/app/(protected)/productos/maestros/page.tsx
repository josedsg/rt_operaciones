import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GridProductoMaestro } from "@/components/ProductosMaestros/grid-producto-maestro";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Productos Maestros | Rio Tapezco",
    description: "Gestión de Productos Maestros",
};

const ProductosMaestrosPage = () => {
    return (
        <>
            <Breadcrumb pageName="Productos Maestros" />
            <div className="flex flex-col gap-10">
                <GridProductoMaestro />
            </div>
        </>
    );
};

export default ProductosMaestrosPage;
