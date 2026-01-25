"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import { confirmExportacionAction } from "@/actions/exportaciones";
import { useRouter } from "next/navigation";

interface StepConfirmationProps {
    data: any;
    onPrev: () => void;
    currentUserId?: number; // Should be passed from parent
}

export function StepConfirmation({ data, onPrev, currentUserId }: StepConfirmationProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Data Preparation ---

    // 1. Table: Client / Total Boxes / Empaque
    // Iterate orders -> lines -> sum boxes by client+empaque
    const clientSummaryRaw = useMemo(() => {
        if (!data.pedidos_seleccionados) return [];
        const map = new Map();

        data.pedidos_seleccionados.forEach((order: any) => {
            order.lineas.forEach((line: any) => {
                const clientName = order.cliente.nombre_comercial || order.cliente.nombre;
                const empaqueName = line.empaque?.nombre || "Sin Empaque";
                const key = `${clientName}-${empaqueName}`;

                if (!map.has(key)) {
                    map.set(key, {
                        client: clientName,
                        empaque: empaqueName,
                        orders: new Set(),
                        boxes: 0
                    });
                }
                const item = map.get(key);
                item.boxes += line.cajas;
                item.orders.add(order.codigo);
            });
        });

        return Array.from(map.values()).map((item: any) => ({
            client: item.client,
            orders_count: item.orders.size,
            boxes: item.boxes,
            empaque: item.empaque
        })).sort((a, b) => a.client.localeCompare(b.client));
    }, [data.pedidos_seleccionados]);

    // 2. Table: Product / Variant / Size / Boxes / Empaque
    const productSummaryRaw = useMemo(() => {
        if (!data.pedidos_seleccionados) return [];
        const map = new Map();

        data.pedidos_seleccionados.forEach((order: any) => {
            order.lineas.forEach((line: any) => {
                const productName = line.producto.nombre;
                const variantName = line.variante.nombre;
                const sizeName = line.tamano.nombre;
                const empaqueName = line.empaque?.nombre || "Sin Empaque";

                const key = `${productName}-${variantName}-${sizeName}-${empaqueName}`;

                if (!map.has(key)) {
                    map.set(key, {
                        product: productName,
                        variant: variantName,
                        size: sizeName,
                        empaque: empaqueName,
                        boxes: 0
                    });
                }
                const item = map.get(key);
                item.boxes += line.cajas;
            });
        });

        return Array.from(map.values()).sort((a, b) => {
            const prodDiff = a.product.localeCompare(b.product);
            if (prodDiff !== 0) return prodDiff;
            return a.variant.localeCompare(b.variant);
        });
    }, [data.pedidos_seleccionados]);


    // --- PDF Export ---

    const exportClientTablePDF = () => {
        const doc = new jsPDF();
        doc.text("Resumen por Cliente y Empaque", 14, 15);

        const tableColumn = ["Cliente", "Pedidos", "Cajas", "Empaque"];
        const tableRows: any[] = [];

        clientSummaryRaw.forEach(row => {
            tableRows.push([
                row.client,
                row.orders_count,
                row.boxes,
                row.empaque
            ]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("resumen_clientes_exportacion.pdf");
    };

    const exportProductTablePDF = () => {
        const doc = new jsPDF();
        doc.text("Resumen Detallado por Producto", 14, 15);

        const tableColumn = ["Producto", "Variante", "Tamaño", "Cajas", "Empaque"];
        const tableRows: any[] = [];

        productSummaryRaw.forEach(row => {
            tableRows.push([
                row.product,
                row.variant,
                row.size,
                row.boxes,
                row.empaque
            ]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("resumen_productos_exportacion.pdf");
    };


    // --- Success State ---
    const [successData, setSuccessData] = useState<{ id: number; ordersCount: number; clients: string[]; invoices: string[] } | null>(null);

    // --- Confirm Action ---
    const handleConfirm = async () => {
        if (!confirm("¿Está seguro de confirmar esta exportación? Se marcarán los pedidos como EXPORTADOS.")) return;

        setIsSubmitting(true);
        try {
            const pedidoIds = data.pedidos_seleccionados.map((o: any) => o.id);
            // Fallback for user id if not passed (demo mode safety)
            const userId = currentUserId || 1;

            const res = await confirmExportacionAction({
                fecha: new Date(data.fecha),
                usuario_id: userId,
                pedidos_ids: pedidoIds
            });

            if (res.success) {
                // Calculate Summary Data for Display
                const uniqueClients = Array.from(new Set(data.pedidos_seleccionados.map((o: any) => o.cliente.nombre_comercial || o.cliente.nombre))) as string[];
                const invoices = data.pedidos_seleccionados.map((o: any) => o.numero_factura || "S/N").filter((n: string) => n !== "S/N");

                setSuccessData({
                    id: res.data.id,
                    ordersCount: data.pedidos_seleccionados.length,
                    clients: uniqueClients,
                    invoices: invoices
                });

                toast.success("Exportación confirmada exitosamente");
                // Don't redirect immediately, show summary first
            } else {
                toast.error("Error al confirmar exportación");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successData) {
        return (
            <div className="p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/20 text-success mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <h3 className="text-3xl font-bold text-black dark:text-white mb-2">
                    ¡Exportación #{successData.id} Procesada!
                </h3>
                <p className="text-gray-500 mb-8">El proceso se ha completado correctamente y los pedidos han sido actualizados.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto mb-10">
                    <div className="bg-gray-50 dark:bg-meta-4 p-5 rounded border border-stroke dark:border-strokedark">
                        <p className="text-sm text-gray-500 mb-1">Pedidos Procesados</p>
                        <p className="text-2xl font-bold text-black dark:text-white">{successData.ordersCount}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-meta-4 p-5 rounded border border-stroke dark:border-strokedark">
                        <p className="text-sm text-gray-500 mb-1">Clientes Incluidos</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {successData.clients.map((c, i) => (
                                <span key={i} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-white dark:bg-boxdark border border-stroke dark:border-strokedark">
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-meta-4 p-5 rounded border border-stroke dark:border-strokedark">
                        <p className="text-sm text-gray-500 mb-1">Facturas Electrónicas</p>
                        <div className="max-h-24 overflow-y-auto mt-1 custom-scrollbar">
                            {successData.invoices.length > 0 ? (
                                <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300">
                                    {successData.invoices.map((inv, i) => (
                                        <li key={i}>{inv}</li>
                                    ))}
                                </ul>
                            ) : (
                                <span className="text-xs text-gray-400 italic">Sin facturas registradas</span>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/exportaciones")}
                    className="inline-flex items-center justify-center rounded bg-primary py-3 px-10 text-base font-medium text-white hover:bg-opacity-90 transition-all"
                >
                    Volver a Lista de Exportaciones
                </button>
            </div>
        );
    }

    return (
        <div className="p-6.5">
            <h3 className="mb-5 font-medium text-black dark:text-white">
                Confirmación de Exportación
            </h3>

            {/* Table 1: Clients */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-black dark:text-white">Resumen Clientes</h4>
                    <button onClick={exportClientTablePDF} className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-opacity-90">
                        Descargar PDF
                    </button>
                </div>
                <div className="max-w-full overflow-x-auto rounded border border-stroke dark:border-strokedark">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="py-2 px-4 font-medium text-black dark:text-white">Cliente</th>
                                <th className="py-2 px-4 font-medium text-black dark:text-white">Pedidos (Cant)</th>
                                <th className="py-2 px-4 font-medium text-black dark:text-white">Cajas</th>
                                <th className="py-2 px-4 font-medium text-black dark:text-white">Empaque</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientSummaryRaw.map((row: any, idx: number) => (
                                <tr key={idx} className="border-b border-stroke dark:border-strokedark">
                                    <td className="py-2 px-4">{row.client}</td>
                                    <td className="py-2 px-4">{row.orders_count}</td>
                                    <td className="py-2 px-4 font-bold">{row.boxes}</td>
                                    <td className="py-2 px-4">{row.empaque}</td>
                                </tr>
                            ))}
                            {/* Total Row */}
                            <tr className="bg-gray-100 font-bold dark:bg-meta-4">
                                <td className="py-2 px-4">TOTAL</td>
                                <td className="py-2 px-4"></td>
                                <td className="py-2 px-4">{clientSummaryRaw.reduce((acc: number, r: any) => acc + r.boxes, 0)}</td>
                                <td className="py-2 px-4"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Table 2: Products */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-black dark:text-white">Resumen Productos</h4>
                    <button onClick={exportProductTablePDF} className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-opacity-90">
                        Descargar PDF
                    </button>
                </div>
                <div className="max-w-full overflow-x-auto rounded border border-stroke dark:border-strokedark">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="py-2 px-4 font-medium text-black dark:text-white">Producto</th>
                                <th className="py-2 px-4 font-medium text-black dark:text-white">Variante</th>
                                <th className="py-2 px-4 font-medium text-black dark:text-white">Tamaño</th>
                                <th className="py-2 px-4 font-medium text-black dark:text-white">Cajas</th>
                                <th className="py-2 px-4 font-medium text-black dark:text-white">Empaque</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productSummaryRaw.map((row: any, idx: number) => (
                                <tr key={idx} className="border-b border-stroke dark:border-strokedark">
                                    <td className="py-2 px-4">{row.product}</td>
                                    <td className="py-2 px-4">{row.variant}</td>
                                    <td className="py-2 px-4">{row.size}</td>
                                    <td className="py-2 px-4 font-bold">{row.boxes}</td>
                                    <td className="py-2 px-4">{row.empaque}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-100 font-bold dark:bg-meta-4">
                                <td className="py-2 px-4" colSpan={3}>TOTAL</td>
                                <td className="py-2 px-4">{productSummaryRaw.reduce((acc: number, r: any) => acc + r.boxes, 0)}</td>
                                <td className="py-2 px-4"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-10 flex justify-end gap-4">
                <button
                    onClick={onPrev}
                    className="flex justify-center rounded border border-stroke py-3 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                >
                    Atrás
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="flex justify-center rounded bg-primary py-4 px-10 text-lg font-bold text-white hover:bg-opacity-90 disabled:opacity-50 shadow-lg transition-all transform hover:scale-105"
                >
                    {isSubmitting ? "Procesando..." : "Procesar Exportación"}
                </button>
            </div>
        </div>
    );
}
