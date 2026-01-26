"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getExportacionById } from "@/actions/exportaciones";
import { StepPackingList } from "@/components/Exportaciones/Wizard/step-packing";
import Link from "next/link";

export default function VerExportacionPage() {
    const params = useParams();
    const id = Number(params.id);
    const [exportacion, setExportacion] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            getExportacionById(id).then(res => {
                if (res.success) {
                    setExportacion(res.data);
                }
            }).finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <div className="p-6">Cargando exportación...</div>;
    if (!exportacion) return <div className="p-6">No se encontró la exportación</div>;

    // Prepare data structure for StepPackingList
    const wizardData = {
        pedidos_seleccionados: exportacion.pedidos
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-black dark:text-white">
                        Detalle de Exportación #{exportacion.id}
                    </h2>
                    <p className="text-sm text-gray-500">
                        Fecha: {new Date(exportacion.fecha).toLocaleDateString()} | Estado: {exportacion.estado}
                    </p>
                </div>
                <Link
                    href="/exportaciones"
                    className="rounded border border-stroke bg-white px-6 py-2 font-medium text-black hover:shadow-1 dark:bg-boxdark dark:text-white"
                >
                    Volver
                </Link>
            </div>

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                {/* Reusing the Packing List Component in View Mode */}
                <StepPackingList
                    data={wizardData}
                    updateData={() => { }}
                    hideNavigation={true}
                />
            </div>
        </div>
    );
}
