"use client";

import { useEffect, useState } from "react";
import { Proveedor } from "@prisma/client";
import { getProveedoresAction, deleteProveedorAction } from "@/actions/proveedores";
import ProveedorForm from "./proveedor-form";
import { ConfirmModal } from "../Common/confirm-modal";
import toast from "react-hot-toast";

export default function GridProveedor() {
    const [data, setData] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showForm, setShowForm] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [proveedorToDelete, setProveedorToDelete] = useState<number | null>(null);

    async function fetchData() {
        setLoading(true);
        const res = await getProveedoresAction({ page, search, limit: 10 });
        setData(res.data);
        setTotalPages(res.totalPages);
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, [page, search]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleEdit = (proveedor: Proveedor) => {
        setEditingProveedor(proveedor);
        setShowForm(true);
    };

    const handleDeleteClick = (id: number) => {
        setProveedorToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!proveedorToDelete) return;
        try {
            await deleteProveedorAction(proveedorToDelete);
            toast.success("Proveedor eliminado correctamente");
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar el proveedor");
        } finally {
            setShowDeleteModal(false);
            setProveedorToDelete(null);
        }
    };

    const handleAdd = () => {
        setEditingProveedor(null);
        setShowForm(true);
    };

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="relative w-full max-w-75">
                    <input
                        type="text"
                        placeholder="Buscar proveedor..."
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        value={search}
                        onChange={handleSearch}
                    />
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center justify-center gap-2 rounded bg-primary py-2.5 px-6 font-medium text-white hover:bg-opacity-90"
                >
                    <span>Nuevo Proveedor</span>
                </button>
            </div>

            <div className="max-w-full overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className="py-4 px-4 font-medium text-black dark:text-white">Nombre</th>
                            <th className="py-4 px-4 font-medium text-black dark:text-white">Código</th>
                            <th className="py-4 px-4 font-medium text-black dark:text-white">Identificación</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Contacto</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Teléfono</th>
                            <th className="py-4 px-4 font-medium text-black dark:text-white">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="py-10 text-center">Cargando proveedores...</td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-10 text-center text-gray-400">No se encontraron proveedores</td>
                            </tr>
                        ) : data.map((item) => (
                            <tr key={item.id} className="border-b border-stroke dark:border-strokedark">
                                <td className="py-4 px-4">
                                    <h5 className="font-medium text-black dark:text-white">{item.nombre}</h5>
                                    {item.email && <p className="text-xs text-gray-500">{item.email}</p>}
                                </td>
                                <td className="py-4 px-4">{item.codigo || "N/A"}</td>
                                <td className="py-4 px-4">{item.identificacion || "N/A"}</td>
                                <td className="py-2 px-4">{item.contacto || "N/A"}</td>
                                <td className="py-2 px-4">{item.telefono || "N/A"}</td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-primary hover:underline hover:text-opacity-80"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(item.id)}
                                            className="text-danger hover:underline hover:text-opacity-80"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between pb-4">
                <p className="font-medium text-black dark:text-white">
                    Página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="flex items-center justify-center rounded border border-stroke py-1 px-3 hover:bg-gray dark:border-strokedark dark:hover:bg-meta-4 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="flex items-center justify-center rounded border border-stroke py-1 px-3 hover:bg-gray dark:border-strokedark dark:hover:bg-meta-4 disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Modal de Formulario */}
            {showForm && (
                <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg dark:bg-boxdark overflow-y-auto max-h-[90vh]">
                        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
                            <h3 className="font-medium text-black dark:text-white">
                                {editingProveedor ? "Editar Proveedor" : "Añadir Proveedor"}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-black dark:hover:text-white">
                                <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10.0004 8.78441L14.7171 4.06775L15.9338 5.28441L11.2171 10.0011L15.9338 14.7178L14.7171 15.9344L10.0004 11.2178L5.28373 15.9344L4.06706 14.7178L8.78373 10.0011L4.06706 5.28441L5.28373 4.06775L10.0004 8.78441Z" />
                                </svg>
                            </button>
                        </div>
                        <ProveedorForm
                            proveedor={editingProveedor}
                            onSuccess={() => {
                                setShowForm(false);
                                fetchData();
                            }}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                </div>
            )}

            {/* Modal de eliminación */}
            <ConfirmModal
                isOpen={showDeleteModal}
                title="Eliminar Proveedor"
                message="¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer."
                onConfirm={confirmDelete}
                onClose={() => setShowDeleteModal(false)}
            />
        </div>
    );
}
