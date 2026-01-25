"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPedidosAction, deletePedidoAction, duplicatePedidoAction } from "@/actions/ventas";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/Common/confirm-modal";

export default function VentasPage() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        codigo: "",
        cliente: "",
        fechaInicio: "",
        fechaFin: "",
        exportacionId: "",
        estado: "BORRADOR"
    });

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        id: 0
    });

    const fetchPedidos = async () => {
        setLoading(true);
        try {
            const res = await getPedidosAction(1, 20, filters);
            setPedidos(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar pedidos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPedidos();
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleDelete = async () => {
        try {
            await deletePedidoAction(confirmModal.id);
            toast.success("Pedido eliminado");
            setConfirmModal({ isOpen: false, id: 0 });
            fetchPedidos();
        } catch (error) {
            toast.error("Error al eliminar pedido");
        }
    };

    const handleExport = async () => {
        const toastId = toast.loading("Exporting...");
        try {
            const { data } = await getPedidosAction(1, 10000, filters);

            const headers = ["Código", "Cliente", "Fecha", "Estado", "Moneda", "Total"];
            const rows = data.map(p => [
                p.codigo,
                // Replace commas to avoid breaking CSV
                `"${p.cliente.nombre}"`,
                new Date(p.fecha_pedido).toLocaleDateString(),
                p.estado,
                p.moneda || 'USD',
                p.total
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(r => r.join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `pedidos_venta_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Exportado exitosamente", { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error("Error al exportar", { id: toastId });
        }
    };

    return (
        <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                    Pedidos de Venta
                </h2>
                <div className="flex gap-4">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center justify-center rounded-md border border-success px-4 py-2 text-center font-medium text-success hover:bg-success hover:text-white lg:px-6"
                    >
                        Exportar
                    </button>
                    <Link
                        href="/ventas/nuevo"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    >
                        Nuevo Pedido
                    </Link>
                </div>
            </div>

            <div className="flex flex-col gap-4 bg-white dark:bg-boxdark p-6 rounded-lg border border-stroke dark:border-strokedark shadow-1 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Código
                        </label>
                        <input
                            type="text"
                            placeholder="PV-001..."
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                            value={filters.codigo}
                            onChange={(e) => setFilters(prev => ({ ...prev, codigo: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Cliente
                        </label>
                        <input
                            type="text"
                            placeholder="Nombre del cliente..."
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                            value={filters.cliente}
                            onChange={(e) => setFilters(prev => ({ ...prev, cliente: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Exportación #
                        </label>
                        <input
                            type="number"
                            placeholder="ID..."
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                            value={filters.exportacionId || ""}
                            onChange={(e) => setFilters(prev => ({ ...prev, exportacionId: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Desde
                        </label>
                        <input
                            type="date"
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                            value={filters.fechaInicio}
                            onChange={(e) => setFilters(prev => ({ ...prev, fechaInicio: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Hasta
                        </label>
                        <input
                            type="date"
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                            value={filters.fechaFin}
                            onChange={(e) => setFilters(prev => ({ ...prev, fechaFin: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Estado
                        </label>
                        <select
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                            value={filters.estado}
                            onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                        >
                            <option value="TODOS">Todos</option>
                            <option value="BORRADOR">Borrador</option>
                            <option value="CONFIRMADO">Confirmado</option>
                            <option value="EXPORTADO">Exportado</option>
                            <option value="ENVIADO">Enviado</option>
                            <option value="FACTURADO">Facturado</option>
                        </select>
                    </div>
                </div>

            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-boxdark rounded-sm border border-stroke dark:border-strokedark shadow-default overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Código</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Cliente</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Fecha</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Estado</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Exp. #</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Total</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedidos.map((pedido) => (
                                    <tr key={pedido.id} className="border-t border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4">
                                        <td className="py-5 px-4 font-medium">{pedido.codigo}</td>
                                        <td className="py-5 px-4">{pedido.cliente.nombre}</td>
                                        <td className="py-5 px-4">{new Date(pedido.fecha_pedido).toLocaleDateString()}</td>
                                        <td className="py-5 px-4">
                                            <span className={`inline-block rounded px-2.5 py-0.5 text-sm font-medium ${pedido.estado === 'BORRADOR' ? 'bg-gray-100 text-gray-600 dark:bg-meta-4 dark:text-white' :
                                                pedido.estado === 'CONFIRMADO' ? 'bg-primary/10 text-primary' :
                                                    pedido.estado === 'EXPORTADO' ? 'bg-purple-100 text-purple-700' :
                                                        pedido.estado === 'ENVIADO' ? 'bg-success/10 text-success' :
                                                            'bg-warning/10 text-warning'
                                                }`}>
                                                {pedido.estado}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4 text-sm">
                                            {pedido.exportacion_id ? (
                                                <span className="font-mono bg-gray-100 px-2 py-1 rounded dark:bg-meta-4">
                                                    #{pedido.exportacion_id}
                                                </span>
                                            ) : "-"}
                                        </td>
                                        <td className="py-5 px-4 font-bold text-success">
                                            {pedido.moneda === 'CRC' ? '₡' : '$'}
                                            {pedido.total.toFixed(2)}
                                        </td>
                                        <td className="py-5 px-4">
                                            <div className="flex items-center space-x-3.5">
                                                <Link href={`/ventas/${pedido.id}/editar`} className="hover:text-primary">
                                                    ✏️
                                                </Link>
                                                <button
                                                    onClick={async () => {
                                                        const toastId = toast.loading("Duplicando pedido...");
                                                        try {
                                                            await duplicatePedidoAction(pedido.id);
                                                            toast.success("Pedido duplicado correctamente", { id: toastId });
                                                            fetchPedidos();
                                                        } catch (error) {
                                                            toast.error("Error al duplicar pedido", { id: toastId });
                                                        }
                                                    }}
                                                    className="hover:text-primary"
                                                    title="Duplicar Pedido"
                                                >
                                                    📄
                                                </button>
                                                <button
                                                    onClick={() => setConfirmModal({ isOpen: true, id: pedido.id })}
                                                    className="hover:text-meta-1"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                                {pedido.estado === "BORRADOR" && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm("¿Confirmar pedido? Pasará a estado CONFIRMADO y estará listo para exportar.")) return;
                                                            const toastId = toast.loading("Confirmando...");
                                                            try {
                                                                const { confirmPedidoAction } = await import("@/actions/ventas");
                                                                await confirmPedidoAction(pedido.id);
                                                                toast.success("Pedido confirmado", { id: toastId });
                                                                fetchPedidos();
                                                            } catch (error) {
                                                                toast.error("Error al confirmar", { id: toastId });
                                                            }
                                                        }}
                                                        className="hover:text-success text-success"
                                                        title="Confirmar Pedido"
                                                    >
                                                        ✅
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: 0 })}
                onConfirm={handleDelete}
                title="Eliminar Pedido"
                message="¿Estás seguro? Se eliminarán todas las líneas asociadas."
                type="danger"
            />
        </>
    );
}
