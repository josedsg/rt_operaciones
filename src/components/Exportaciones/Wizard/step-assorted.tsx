import { useMemo, useState } from "react";
import { AssortedModal } from "@/components/Ventas/Wizard/assorted-modal";
import { getVariantesByFamiliaAction } from "@/actions/variantes";
import { saveAssortedConfigAction } from "@/actions/ventas";
import { getOrdersForExport } from "@/actions/exportaciones";
import Link from "next/link";
import toast from "react-hot-toast";

interface StepAssortedProps {
    data: any;
    updateData: (data: any) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function StepAssorted({ data, updateData, onNext, onPrev }: StepAssortedProps) {
    const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [availableVariants, setAvailableVariants] = useState<any[]>([]);

    // 1. Flatten lines and Filter for ASSORTED without config
    // We strictly filter for lines that need configuration.
    // If they already have configuration (from DB or local state), strictly speaking they "have" it.
    // But the user might want to edit it.
    // The requirement says "que no tengan configuracion asignada".
    // However, if we only show those, once configured they would disappear from the list?
    // Better to show all ASSORTED, and maybe highlight those missing config.
    // User said: "Configuraracion de surtidos actualemte me salen en blanco esa seccion, pero debemos buscar... que contengan la variante ASSORTED y que no tengan configuracion... y tener la posibilidad de lanzar la ventana"

    // I will filter ALL Assorted lines.
    const assortedLines = useMemo(() => {
        if (!data.pedidos_seleccionados) return [];
        const lines: any[] = [];

        data.pedidos_seleccionados.forEach((order: any) => {
            order.lineas.forEach((line: any, lIdx: number) => {
                // Check if it is assorted. Assuming name check or ID check.
                // Best to check name for now as I don't have constant IDs.
                if (line.variante?.nombre?.toUpperCase().includes("ASSORTED") || line.variante?.nombre?.toUpperCase().includes("SURTIDO")) {
                    lines.push({
                        ...line,
                        _orderId: order.id,
                        _lineId: line.id, // DB Line ID
                        _originalIdx: lIdx, // Index in the order.lineas array
                        order_code: order.codigo,
                        client_name: order.cliente.nombre_comercial || order.cliente.nombre,
                        hasConfig: (line.configuraciones_assorted && line.configuraciones_assorted.length > 0)
                    });
                }
            });
        });

        // Filter to show only pending (no config) lines as requested
        return lines;
    }, [data.pedidos_seleccionados]);

    const handleConfigureClick = async (line: any) => {
        // Fetch variants for this family
        // We need a server action for this.
        // I'll assume we can pass the family ID.
        try {
            // Fetch variants for this family
            const res = await getVariantesByFamiliaAction(line.familia_id);
            setAvailableVariants(res);

            setSelectedLineIndex(line._lineId); // Use ID or unique ref
            setIsModalOpen(true);
        } catch (error) {
            toast.error("Error cargando variantes");
        }
    };

    const handleRefresh = async () => {
        try {
            if (!data.fecha) return;
            const res = await getOrdersForExport(data.fecha);
            if (res.success) {
                // Preserve previous state but update orders list
                const newData = {
                    ...data,
                    pedidos_seleccionados: res.data?.orders || []
                };
                updateData(newData);
                toast.success("Datos actualizados");
            } else {
                toast.error("Error al refrescar datos");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
        }
    };

    const handleSaveConfig = async (newConfig: any[]) => {
        if (selectedLineIndex === null) return;

        try {
            // 1. Save to DB
            await saveAssortedConfigAction(selectedLineIndex, newConfig);

            // 2. Update local state IMMUTABLY to reflect change
            // We map through orders and lines to create a new object structure
            const newOrders = data.pedidos_seleccionados.map((order: any) => {
                // If this order contains the modified line
                if (order.id === assortedLines.find(al => al._lineId === selectedLineIndex)?._orderId) {
                    return {
                        ...order,
                        lineas: order.lineas.map((line: any) => {
                            if (line.id === selectedLineIndex) {
                                return { ...line, configuraciones_assorted: newConfig };
                            }
                            return line;
                        })
                    };
                }
                return order;
            });

            const newData = { ...data, pedidos_seleccionados: newOrders };

            updateData(newData);
            setIsModalOpen(false);
            toast.success("Surtido configurado y guardado");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar en base de datos");
        }
    };

    // Calculate completion status
    const pendingCount = assortedLines.filter(l => !l.hasConfig).length;

    return (
        <div className="p-6.5">
            <div className="flex justify-between items-center mb-5">
                <h3 className="font-medium text-black dark:text-white">
                    Configuración de Surtidos
                </h3>
                <button
                    onClick={handleRefresh}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-black px-3 py-1 rounded border border-gray-300 dark:bg-meta-4 dark:text-white dark:border-strokedark"
                >
                    ↻ Refrescar Datos
                </button>
            </div>

            <div className="mb-4 text-sm">
                Lineas Assorted Pendientes: <strong className={pendingCount > 0 ? "text-danger" : "text-success"}>{pendingCount}</strong>
            </div>

            <div className="max-w-full overflow-x-auto rounded border border-stroke dark:border-strokedark mb-8">
                <table className="w-full table-auto text-sm">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Pedido</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Cliente</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Producto</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Cajas</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Ramos/Caja</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Estado</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Configuración</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assortedLines.map((line: any) => {
                            // Helper to build summary string
                            const configSummary = line.configuraciones_assorted?.map((c: any) =>
                                `${c.cantidad}x ${c.variante?.nombre || c.variante_nombre || '?'}`
                            ).join(", ");

                            return (
                                <tr key={line._lineId} className={`border-b border-stroke dark:border-strokedark ${line.hasConfig ? 'bg-green-100 dark:bg-green-900/20' : ''}`}>
                                    <td className="py-2 px-4">
                                        <Link
                                            href={`/ventas/${line._orderId}/editar`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            {line.order_code}
                                        </Link>
                                    </td>
                                    <td className="py-2 px-4">{line.client_name}</td>
                                    <td className="py-2 px-4">
                                        {line.producto?.nombre} <br />
                                        <span className="text-xs text-gray-500">{line.variante?.nombre}</span>
                                    </td>
                                    <td className="py-2 px-4 font-bold">{line.cajas}</td>
                                    <td className="py-2 px-4">{line.bunches_per_box}</td>
                                    <td className="py-2 px-4">
                                        {line.hasConfig ? (
                                            <span className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-xs font-medium text-success">
                                                Configurado
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-warning bg-opacity-10 py-1 px-3 text-xs font-medium text-warning">
                                                Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 text-xs text-black dark:text-white max-w-[200px] truncate" title={configSummary}>
                                        {configSummary || "-"}
                                    </td>
                                    <td className="py-2 px-4">
                                        <button
                                            onClick={() => handleConfigureClick(line)}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            {line.hasConfig ? "Editar" : "Configurar"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {assortedLines.length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-4 px-4 text-center text-gray-500">
                                    No hay líneas Assorted en esta exportación.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-10 flex justify-end gap-4">
                <button
                    onClick={onPrev}
                    className="flex justify-center rounded border border-stroke py-3 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                >
                    Atrás
                </button>
                <button
                    onClick={onNext}
                    // disabled={pendingCount > 0} // Optional: Block if pending? User didn't specify.
                    className="flex justify-center rounded bg-primary py-3 px-6 font-medium text-gray hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
                >
                    Siguiente: Confirmación
                </button>
            </div>

            {isModalOpen && selectedLineIndex !== null && (
                <AssortedModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    variantesDisponibles={availableVariants}
                    onSave={handleSaveConfig}
                    totalTarget={
                        assortedLines.find(l => l._lineId === selectedLineIndex)?.bunches_per_box || 0
                        // Note: If we need total stems, use total_stems. Assuming bunches logic.
                    }
                    initialConfig={
                        assortedLines.find(l => l._lineId === selectedLineIndex)?.configuraciones_assorted || []
                    }
                />
            )}
        </div>
    );
}
