"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { getClientesAction, deleteClienteAction, getTiposClienteAction } from "@/actions/clientes";
import { ConfirmModal } from "@/components/Common/confirm-modal";

export function GridCliente() {
    const [clientes, setClientes] = useState<any[]>([]);
    const [tiposCliente, setTiposCliente] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        nombre: "",
        tipo_cliente: "TODOS"
    });

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        id: 0
    });

    useEffect(() => {
        // Load Tipos de Cliente for filter
        getTiposClienteAction().then(setTiposCliente);
    }, []);

    const fetchClientes = async () => {
        setLoading(true);
        try {
            const res = await getClientesAction(page, limit, filters);
            setClientes(res.data);
            setTotal(res.total);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar clientes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClientes();
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [filters, page]);

    const handleDelete = async () => {
        try {
            await deleteClienteAction(confirmModal.id);
            toast.success("Cliente eliminado");
            setConfirmModal({ isOpen: false, id: 0 });
            fetchClientes();
        } catch (error) {
            toast.error("Error al eliminar cliente");
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                    Clientes
                </h2>
                <Link
                    href="/clientes/nuevo"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                >
                    Agregar Cliente
                </Link>
            </div>

            <div className="flex flex-col gap-4 bg-white dark:bg-boxdark p-6 rounded-lg border border-stroke dark:border-strokedark shadow-1 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Buscar (Nombre / Comercial / ID)
                        </label>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                            value={filters.nombre}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, nombre: e.target.value }));
                                setPage(1); // Reset page on filter change
                            }}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Tipo de Cliente
                        </label>
                        <select
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                            value={filters.tipo_cliente}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, tipo_cliente: e.target.value }));
                                setPage(1);
                            }}
                        >
                            <option value="TODOS">Todos</option>
                            {tiposCliente.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
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
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">ID</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Nombre / Comercial</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Identificación</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Tipo</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Ubicación</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientes.map((cliente) => (
                                    <tr key={cliente.id} className="border-t border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4">
                                        <td className="py-5 px-4 font-medium text-black dark:text-white text-xs">{cliente.id}</td>
                                        <td className="py-5 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-black dark:text-white text-sm">{cliente.nombre}</span>
                                                {cliente.nombre_comercial && (
                                                    <span className="text-xs text-gray-500">{cliente.nombre_comercial}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-5 px-4 text-xs font-medium">
                                            {cliente.tipo_identificacion?.codigo} - {cliente.identificacion}
                                        </td>
                                        <td className="py-5 px-4 text-xs font-medium">
                                            <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                                                {cliente.tipo_cliente?.nombre}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4 text-xs">
                                            {cliente.provincia?.nombre}, {cliente.pais?.nombre}
                                        </td>
                                        <td className="py-5 px-4">
                                            <div className="flex items-center space-x-3.5">
                                                <Link href={`/clientes/${cliente.id}/editar`} className="hover:text-primary" title="Editar">
                                                    ✏️
                                                </Link>
                                                <button
                                                    onClick={() => setConfirmModal({ isOpen: true, id: cliente.id })}
                                                    className="hover:text-meta-1"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center p-4 border-t border-stroke dark:border-strokedark">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-4 py-2 text-sm font-medium text-black bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="px-4 py-2 text-sm font-medium text-black bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: 0 })}
                onConfirm={handleDelete}
                title="Eliminar Cliente"
                message="¿Estás seguro? Esta acción no se puede deshacer."
                type="danger"
            />
        </div>
    );
}
