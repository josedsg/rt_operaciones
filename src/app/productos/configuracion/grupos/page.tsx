import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GridGrupo } from "@/components/Grupos/grid-grupo";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Grupos de Productos | Rio Tapezco",
    description: "Configuración de grupos de productos",
};

const GruposPage = () => {
    return (
        <>
            <Breadcrumb pageName="Grupos de Productos" />

            <div className="flex flex-col gap-10">
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
                    <GridGrupo />
                </div>
            </div>
        </>
    );
};

export default GruposPage;
