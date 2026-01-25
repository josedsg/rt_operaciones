import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GridFamilia } from "@/components/Familias/grid-familia";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Familias de Productos | Rio Tapezco",
    description: "Configuración de familias de productos",
};

const FamiliasPage = () => {
    return (
        <>
            <Breadcrumb pageName="Familias de Productos" />

            <div className="flex flex-col gap-10">
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
                    <GridFamilia />
                </div>
            </div>
        </>
    );
};

export default FamiliasPage;
