"use client";

import { useEffect, useState, useCallback } from "react";
import { ProductoMaestroForm } from "./producto-maestro-form";
import { getProductosMaestrosAction, deleteProductoMaestroAction, ProductoMaestroWithRelations } from "@/actions/productos-maestros";
import { getFamiliasAction } from "@/actions/familias";
import { getAllVariantes, getAllTamanos } from "@/actions/configuraciones";
import { Familia, Variante, Tamano } from "@prisma/client";
import { ConfirmModal } from "@/components/Common/confirm-modal";
import toast from "react-hot-toast";

export function GridProductoMaestro() {
    const [productos, setProductos] = useState<ProductoMaestroWithRelations[]>([]);
    const [loading, setLoading] = useState(true);

    // Catalogs for Filters
    const [familias, setFamilias] = useState<Familia[]>([]);
    const [variantes, setVariantes] = useState<Variante[]>([]);
    const [tamanos, setTamanos] = useState<Tamano[]>([]);

    // Filters State
    const [filterFamilia, setFilterFamilia] = useState("all");
    const [filterVariante, setFilterVariante] = useState("all");
    const [filterTamano, setFilterTamano] = useState("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // Search
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Modal
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductoMaestroWithRelations | null>(null);

    // Confirm Modal
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

    // Load Catalogs
    useEffect(() => {
        Promise.all([
            getFamiliasAction(),
            getAllVariantes(),
            getAllTamanos()
        ]).then(([f, v, t]) => {
            setFamilias(f);
            setVariantes(v);
            setTamanos(t);
        });
    }, []);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset Page on Filter Change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterFamilia, filterVariante, filterTamano]);

    // Fetch Data
    const fetchProductos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getProductosMaestrosAction({
                page: currentPage,
                limit: 10,
                search: debouncedSearch,
                familiaId: filterFamilia === "all" ? undefined : filterFamilia,
                varianteId: filterVariante === "all" ? undefined : filterVariante,
                tamanoId: filterTamano === "all" ? undefined : filterTamano,
            });
            setProductos(res.data);
            setTotalPages(res.totalPages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, filterFamilia, filterVariante, filterTamano]);

    useEffect(() => {
        fetchProductos();
    }, [fetchProductos]);

    const handleDelete = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: "Eliminar Producto Maestro",
            message: "¿Estás seguro de eliminar este producto? Esta acción no es reversible.",
            onConfirm: async () => {
                await deleteProductoMaestroAction(id);
                toast.success("Producto eliminado");
                fetchProductos();
            }
        });
    };

    const handleEdit = (prod: ProductoMaestroWithRelations) => {
        setEditingProduct(prod);
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setShowForm(true);
    };

    return (
        <div>
            <div className="mb-6 flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                        Productos Maestros
                    </h2>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    >
                        Nuevo Producto
                    </button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end bg-white dark:bg-boxdark p-4 rounded-lg border border-stroke dark:border-strokedark shadow-1">
                    <div className="flex-1 min-w-[200px]">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Buscar</label>
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="min-w-[150px]">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Familia</label>
                        <select
                            value={filterFamilia}
                            onChange={(e) => setFilterFamilia(e.target.value)}
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                        >
                            <option value="all">Todas</option>
                            {familias.map(f => <option key={f.id} value={f.id}>{f.nombre_cientifico}</option>)}
                        </select>
                    </div>
                    <div className="min-w-[150px]">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Variante</label>
                        <select
                            value={filterVariante}
                            onChange={(e) => setFilterVariante(e.target.value)}
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                        >
                            <option value="all">Todas</option>
                            {variantes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                        </select>
                    </div>
                    <div className="min-w-[150px]">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Tamaño</label>
                        <select
                            value={filterTamano}
                            onChange={(e) => setFilterTamano(e.target.value)}
                            className="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                        >
                            <option value="all">Todos</option>
                            {tamanos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                    </div>
                    {(filterFamilia !== 'all' || filterVariante !== 'all' || filterTamano !== 'all' || searchTerm) && (
                        <button
                            onClick={() => {
                                setFilterFamilia("all");
                                setFilterVariante("all");
                                setFilterTamano("all");
                                setSearchTerm("");
                            }}
                            className="px-3 py-2 text-sm text-red-500 hover:text-red-700"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {showForm && (
                <ProductoMaestroForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => fetchProductos()}
                    initialData={editingProduct}
                />
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />

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
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Nombre</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Familia</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Variante</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Tamaño</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map((prod) => (
                                    <tr key={prod.id} className="border-t border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4">
                                        <td className="py-5 px-4 font-bold text-primary">{prod.codigo || "-"}</td>
                                        <td className="py-5 px-4">
                                            <h5 className="font-medium text-black dark:text-white">{prod.nombre}</h5>
                                            <p className="text-sm">{prod.descripcion}</p>
                                        </td>
                                        <td className="py-5 px-4">{prod.familia.nombre_cientifico}</td>
                                        <td className="py-5 px-4">{prod.variante.nombre}</td>
                                        <td className="py-5 px-4">{prod.tamano.nombre}</td>
                                        <td className="py-5 px-4">
                                            <div className="flex items-center space-x-3.5">
                                                <button onClick={() => handleEdit(prod)} className="hover:text-primary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(prod.id)} className="hover:text-meta-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center p-4 border-t border-stroke dark:border-strokedark">
                        <p className="text-sm">Página {currentPage} de {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded border hover:bg-gray-100 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="px-3 py-1 rounded border hover:bg-gray-100 disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
