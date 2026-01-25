import { getUsuariosAction } from "@/actions/usuarios";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TableUsuarios from "@/components/Usuarios/table-usuarios";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gestion de Usuarios | Rio Tapezco",
    description: "Modulo para administrar usuarios del sistema",
};

export default async function UsuariosPage() {
    const usuarios = await getUsuariosAction();

    return (
        <>
            <Breadcrumb pageName="Usuarios" />
            <div className="flex flex-col gap-10">
                <TableUsuarios initialData={usuarios} />
            </div>
        </>
    );
}
