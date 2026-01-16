import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GridTamano } from "@/components/Tamanos/grid-tamano";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tamaños | Rio Tapezco",
    description: "Gestión de Tamaños de Productos",
};

const TamanosPage = () => {
    return (
        <>
            <Breadcrumb pageName="Tamaños" />

            <div className="flex flex-col gap-10">
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
                    <GridTamano />
                </div>
            </div>
        </>
    );
};

export default TamanosPage;
