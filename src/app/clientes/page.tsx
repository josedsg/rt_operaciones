import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GridCliente } from "@/components/Clientes/grid-cliente";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Clientes | Rio Tapezco",
    description: "Lista de clientes registrados",
};

const ClientesPage = () => {
    return (
        <>
            <Breadcrumb pageName="Clientes" />

            <div className="flex flex-col gap-10">
                <GridCliente />
            </div>
        </>
    );
};

export default ClientesPage;
