"use client";

import { useMemo } from "react";
import Link from "next/link";

interface StepPackingProps {
    data: any;
    updateData: (data: any) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function StepPackingList({ data, updateData, onNext, onPrev }: StepPackingProps) {

    // Flatten all lines from all orders
    const flatLines = useMemo(() => {
        if (!data.pedidos_seleccionados) return [];
        return data.pedidos_seleccionados.flatMap((order: any) =>
            order.lineas.map((line: any) => ({
                ...line,
                order_po: order.codigo, // Or client PO if available
                client_name: order.cliente.nombre_comercial || order.cliente.nombre,
                terminal: order.terminal,
                agencia: order.agencia,
                awd: order.awd,
                // Calculated fields
                total_stems: line.cajas * line.stems_per_box,
                net_amount: line.total
            }))
        );
    }, [data.pedidos_seleccionados]);

    // Summary Calculation: Boxes by Client & Product & Empaque
    const summary = useMemo(() => {
        const map = new Map();
        flatLines.forEach((line: any) => {
            const key = `${line.client_name}-${line.producto.nombre}-${line.empaque?.nombre || 'Sin Empaque'}`;
            if (!map.has(key)) {
                map.set(key, {
                    client: line.client_name,
                    product: line.producto.nombre,
                    empaque: line.empaque?.nombre || 'Sin Empaque',
                    boxes: 0
                });
            }
            const item = map.get(key);
            item.boxes += line.cajas;
        });
        return Array.from(map.values()).sort((a, b) => {
            const clientDiff = a.client.localeCompare(b.client);
            if (clientDiff !== 0) return clientDiff;
            return a.product.localeCompare(b.product);
        });
    }, [flatLines]);

    return (
        <div className="p-6.5">
            <h3 className="mb-5 font-medium text-black dark:text-white">
                Packing List Preliminar
            </h3>

            {/* Main Table */}
            <div className="max-w-full overflow-x-auto rounded border border-stroke dark:border-strokedark mb-8">
                <table className="w-full table-auto text-xs">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Pedido</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">PO</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Proveedor</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Cliente</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Familia</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Producto</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Variante</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Tamaño</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Cajas</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Tallos/Ramo</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Ramos/Caja</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Total Tallos</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Terminal</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Agencia</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">AWD</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white whitespace-nowrap">Precio Prov.</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white whitespace-nowrap">Precio Unit.</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {flatLines.map((line: any, idx: number) => (
                            <tr key={idx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4">
                                <td className="py-2 px-2">
                                    <Link
                                        href={`/ventas/${line.pedido_id}/editar`}
                                        target="_blank"
                                        className="text-primary hover:underline"
                                    >
                                        {line.order_code || 'Ver'}
                                    </Link>
                                </td>
                                <td className="py-2 px-2">{line.po || line.order_po}</td>
                                <td className="py-2 px-2">{line.proveedor?.nombre || '-'}</td>
                                <td className="py-2 px-2">{line.client_name}</td>
                                <td className="py-2 px-2">{line.familia?.nombre_cientifico || '-'}</td>
                                <td className="py-2 px-2 font-semibold">{line.producto?.nombre}</td>
                                <td className="py-2 px-2">{line.variante?.nombre}</td>
                                <td className="py-2 px-2">{line.tamano?.nombre}</td>
                                <td className="py-2 px-2 font-bold">{line.cajas}</td>
                                <td className="py-2 px-2">{line.stems_per_bunch}</td>
                                <td className="py-2 px-2">{line.bunches_per_box}</td>
                                <td className="py-2 px-2">{line.total_stems}</td>
                                <td className="py-2 px-2">{line.terminal}</td>
                                <td className="py-2 px-2">{line.agencia}</td>
                                <td className="py-2 px-2">{line.awd}</td>
                                <td className="py-2 px-2 text-right">${line.precio_proveedor?.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right">${line.precio_unitario?.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right">${line.net_amount?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h3 className="mb-4 font-medium text-black dark:text-white">
                Resumen por Cajas (Cliente / Producto / Empaque)
            </h3>
            <div className="max-w-2xl overflow-x-auto rounded border border-stroke dark:border-strokedark">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Cliente</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Producto</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Empaque</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Total Cajas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary.map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-stroke dark:border-strokedark">
                                <td className="py-2 px-4">{row.client}</td>
                                <td className="py-2 px-4">{row.product}</td>
                                <td className="py-2 px-4">{row.empaque}</td>
                                <td className="py-2 px-4 font-bold">{row.boxes}</td>
                            </tr>
                        ))}
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
                    className="flex justify-center rounded bg-primary py-3 px-6 font-medium text-gray hover:bg-opacity-90"
                >
                    Siguiente: Surtidos
                </button>
            </div>
        </div>
    );
}
