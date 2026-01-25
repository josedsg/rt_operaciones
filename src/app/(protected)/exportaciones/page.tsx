import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TableExportaciones from "@/components/Exportaciones/table-exportaciones";
import { getExportaciones } from "@/actions/exportaciones";

export default async function ExportacionesPage() {
    const result = await getExportaciones();

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <Breadcrumb pageName="Exportaciones" />

            <div className="flex flex-col gap-10">
                <TableExportaciones initialData={result} />
            </div>
        </div>
    );
}
