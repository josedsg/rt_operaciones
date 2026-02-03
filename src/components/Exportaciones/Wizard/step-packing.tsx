"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PackingListMatrix } from "./PackingListMatrix";
import { PackingListFamilySummary } from "./PackingListFamilySummary";
import { PackingListClientSummary } from "./PackingListClientSummary";
import { PackingListDetail } from "./PackingListDetail";
import { PackingListProviderSummary } from "./PackingListProviderSummary";

interface StepPackingProps {
    data: any;
    updateData: (data: any) => void;
    onNext?: () => void;
    onPrev?: () => void;
    hideNavigation?: boolean;
}

export function StepPackingList({ data, updateData, onNext, onPrev, hideNavigation = false }: StepPackingProps) {
    const [filterClient, setFilterClient] = useState("");
    const [filterProduct, setFilterProduct] = useState("");
    const [filterFamily, setFilterFamily] = useState("");

    // Flatten all lines from all orders
    const flatLines = useMemo(() => {
        if (!data.pedidos_seleccionados) return [];
        return data.pedidos_seleccionados.flatMap((order: any) =>
            order.lineas.map((line: any) => ({
                ...line,
                order_code: order.codigo, // Ensure this exists
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

    // Apply Filters
    const filteredLines = useMemo(() => {
        return flatLines.filter((line: any) => {
            const matchClient = filterClient ? line.client_name === filterClient : true;
            const matchProduct = filterProduct ? line.producto?.nombre === filterProduct : true;
            const matchFamily = filterFamily ? line.familia?.nombre_cientifico === filterFamily : true;
            return matchClient && matchProduct && matchFamily;
        });
    }, [flatLines, filterClient, filterProduct, filterFamily]);

    // Unique values for filters
    const uniqueClients = Array.from(new Set(flatLines.map((l: any) => l.client_name))).sort() as string[];
    const uniqueProducts = Array.from(new Set(flatLines.map((l: any) => l.producto?.nombre))).sort() as string[];
    const uniqueFamilies = Array.from(new Set(flatLines.map((l: any) => l.familia?.nombre_cientifico))).sort() as string[];

    // Summary Calculation: Boxes by Client & Product & Empaque (Based on FILTERED lines)
    const summary = useMemo(() => {
        const map = new Map();
        filteredLines.forEach((line: any) => {
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
    }, [filteredLines]);

    const [activeTab, setActiveTab] = useState<'detalle' | 'matriz' | 'familias' | 'clientes' | 'proveedores'>('detalle');

    return (
        <div className="p-6.5">
            {/* ... header ... */}
            <h3 className="mb-5 font-medium text-black dark:text-white">
                Packing List Preliminar
            </h3>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-black dark:text-white">Filtrar por Cliente</label>
                    <select
                        className="w-full rounded border border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                        value={filterClient}
                        onChange={(e) => setFilterClient(e.target.value)}
                    >
                        <option value="">Todos los Clientes</option>
                        {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-black dark:text-white">Filtrar por Familia</label>
                    <select
                        className="w-full rounded border border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                        value={filterFamily}
                        onChange={(e) => setFilterFamily(e.target.value)}
                    >
                        <option value="">Todas las Familias</option>
                        {uniqueFamilies.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-black dark:text-white">Filtrar por Producto</label>
                    <select
                        className="w-full rounded border border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                        value={filterProduct}
                        onChange={(e) => setFilterProduct(e.target.value)}
                    >
                        <option value="">Todos los Productos</option>
                        {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-4 border-b border-stroke dark:border-strokedark pb-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('detalle')}
                    className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'detalle'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-primary'
                        }`}
                >
                    Detalle
                </button>
                <button
                    onClick={() => setActiveTab('matriz')}
                    className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'matriz'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-primary'
                        }`}
                >
                    Informe de Carga
                </button>
                <button
                    onClick={() => setActiveTab('familias')}
                    className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'familias'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-primary'
                        }`}
                >
                    Resumen Familias
                </button>
                <button
                    onClick={() => setActiveTab('clientes')}
                    className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'clientes'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-primary'
                        }`}
                >
                    Resumen Clientes
                </button>
                <button
                    onClick={() => setActiveTab('proveedores')}
                    className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'proveedores'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-primary'
                        }`}
                >
                    Resumen Proveedores
                </button>
            </div>

            {/* Content Based on Tab */}
            {activeTab === 'detalle' && (
                <PackingListDetail lines={filteredLines} summary={summary} />
            )}

            {activeTab === 'matriz' && (
                <PackingListMatrix lines={filteredLines} />
            )}

            {activeTab === 'familias' && (
                <PackingListFamilySummary lines={filteredLines} />
            )}

            {activeTab === 'clientes' && (
                <PackingListClientSummary lines={filteredLines} />
            )}

            {activeTab === 'proveedores' && (
                <PackingListProviderSummary lines={filteredLines} />
            )}

            {!hideNavigation && (
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
            )}
        </div>
    );
}
