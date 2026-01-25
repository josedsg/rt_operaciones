import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GridVariante } from "@/components/Variantes/grid-variante";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Variantes | Rio Tapezco",
    description: "Gestión de Variantes",
};

const VariantesPage = () => {
    return (
        <>
            <Breadcrumb pageName="Variantes" />

            <div className="flex flex-col gap-10">
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
                    <GridVariante />
                </div>
            </div>
        </>
    );
};

export default VariantesPage;
