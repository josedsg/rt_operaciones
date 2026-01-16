"use client";

import { Tamano } from "@prisma/client";
import { useEffect, useState, useCallback } from "react";
import { TamanoForm } from "./tamano-form";
import { getTamanosAction, deleteTamanoAction } from "@/actions/tamanos";

export function GridTamano() {
    const [tamanos, setTamanos] = useState<Tamano[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTamano, setEditingTamano] = useState<Tamano | null>(null);

    // Pagination & Search States
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce logic for search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchTamanos = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getTamanosAction({
                page: currentPage,
                limit: 10,
                search: debouncedSearch
            });
            setTamanos(response.data);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error("Error cargando tamaños:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch]);

    useEffect(() => {
        fetchTamanos();
    }, [fetchTamanos]);


    const handleCreate = () => {
        setEditingTamano(null);
        setShowForm(true);
    };

    const handleEdit = (tamano: Tamano) => {
        setEditingTamano(tamano);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar este tamaño?")) {
            await deleteTamanoAction(id);
            fetchTamanos();
        }
    };

    return (
        <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                    Tamaños
                </h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Buscar tamaño..."
                        className="rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    >
                        Nuevo Tamaño
                    </button>
                </div>
            </div>

            {showForm && (
                <TamanoForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        fetchTamanos();
                    }}
                    initialData={editingTamano}
                />
            )}

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full table-auto mb-4">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">ID</th>
                                <th className="min-w-[200px] py-4 px-4 font-medium text-black dark:text-white">Nombre</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Fecha Creación</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tamanos.map((tamano) => (
                                <tr key={tamano.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">#{tamano.id}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <h5 className="font-medium text-black dark:text-white">{tamano.nombre}</h5>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-sm text-black dark:text-white">
                                            {tamano.fecha_creacion ? new Date(tamano.fecha_creacion).toLocaleDateString() : '-'}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button onClick={() => handleEdit(tamano)} className="hover:text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            <button onClick={() => handleDelete(tamano.id)} className="hover:text-meta-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {tamanos.length === 0 && (
                        <div className="py-10 text-center text-dark-6">
                            No se encontraron tamaños.
                        </div>
                    )}

                    {/* Controles de Paginación */}
                    <div className="flex justify-between items-center py-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded border border-stroke disabled:opacity-50 hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4 text-black dark:text-white"
                        >
                            Anterior
                        </button>
                        <span className="text-black dark:text-white">
                            Página {currentPage} de {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-4 py-2 rounded border border-stroke disabled:opacity-50 hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4 text-black dark:text-white"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
