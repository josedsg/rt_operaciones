"use client";

import { Familia, Grupo } from "@prisma/client";
import { useEffect, useState } from "react";
import { FamiliaForm } from "./familia-form";
import { getFamiliasAction, deleteFamiliaAction } from "@/actions/familias";
import Image from "next/image";

// Extended type for relation
type FamiliaWithGrupo = Familia & { grupo: Grupo };

export function GridFamilia() {
    const [familias, setFamilias] = useState<FamiliaWithGrupo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingFamilia, setEditingFamilia] = useState<FamiliaWithGrupo | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchFamilias = async () => {
        setLoading(true);
        try {
            const data = await getFamiliasAction();
            setFamilias(data);
        } catch (error) {
            console.error("Error cargando familias:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFamilias();
    }, []);

    const handleCreate = () => {
        setEditingFamilia(null);
        setShowForm(true);
    };

    const handleEdit = (familia: FamiliaWithGrupo) => {
        setEditingFamilia(familia);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta familia?")) {
            await deleteFamiliaAction(id);
            fetchFamilias();
        }
    };

    const filteredFamilias = familias.filter(f =>
        f.nombre_cientifico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.codigo_cabys?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                    Familias de Productos
                </h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ćodigo..."
                        className="rounded border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    >
                        Nueva Familia
                    </button>
                </div>
            </div>

            {showForm && (
                <FamiliaForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        fetchFamilias();
                    }}
                    initialData={editingFamilia || undefined}
                />
            )}

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Nombre Científico</th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Grupo</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Foto</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Ficha</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFamilias.map((familia) => (
                                <tr key={familia.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <h5 className="font-medium text-black dark:text-white">{familia.nombre_cientifico}</h5>
                                        <p className="text-sm">{familia.descripcion}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{familia.grupo.nombre}</p>
                                    </td>

                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {familia.foto ? (
                                            <div className="h-10 w-10 relative rounded-full overflow-hidden">
                                                <Image src={familia.foto} alt="Foto" fill className="object-cover" />
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {familia.ficha_tecnica ? (
                                            <a href={familia.ficha_tecnica} target="_blank" className="text-primary hover:underline">Ver Ficha</a>
                                        ) : '-'}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button onClick={() => handleEdit(familia)} className="hover:text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            <button onClick={() => handleDelete(familia.id)} className="hover:text-meta-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredFamilias.length === 0 && (
                        <div className="py-10 text-center text-dark-6">
                            No se encontraron familias.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
