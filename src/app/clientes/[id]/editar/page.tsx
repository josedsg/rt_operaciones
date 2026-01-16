import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ClienteForm from "@/components/Clientes/cliente-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Editar Cliente | NextAdmin",
};

interface EditarClientePageProps {
    params: Promise<{ id: string }>;
}

export default async function EditarClientePage({ params }: EditarClientePageProps) {
    const { id } = await params;

    return (
        <>
            <Breadcrumb pageName="Editar Cliente" />

            <div className="mx-auto max-w-270">
                <ClienteForm clienteId={parseInt(id)} />
            </div>
        </>
    );
}
