import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ClienteForm from "@/components/Clientes/cliente-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Nuevo Cliente | NextAdmin",
};

export default function NuevoClientePage() {
    return (
        <>
            <Breadcrumb pageName="Nuevo Cliente" />

            <div className="mx-auto max-w-270">
                <ClienteForm />
            </div>
        </>
    );
}
