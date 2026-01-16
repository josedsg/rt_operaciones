"use client";

import React, { useEffect, useState } from "react";
import { TipoCliente } from "@prisma/client";
import { getTiposClienteAction, deleteTipoClienteAction } from "@/actions/clientes";
import { TipoClienteForm } from "@/components/Clientes/Forms/tipo-cliente-form";

export default function GridTipoCliente() {
    const [tipos, setTipos] = useState<TipoCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTipo, setEditingTipo] = useState<TipoCliente | null>(null);

    const fetchTipos = async () => {
        try {
            setLoading(true);
            const data = await getTiposClienteAction();
            setTipos(data);
        } catch (error) {
            console.error("Error fetching tipos cliente:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTipos();
    }, []);

    const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de eliminar este tipo?")) {
            const res = await deleteTipoClienteAction(id);
            if (res.success) {
                fetchTipos();
            } else {
                alert(res.error);
            }
        }
    }

    const openNew = () => {
        setEditingTipo(null);
        setIsModalOpen(true);
    }

    const openEdit = (tipo: TipoCliente) => {
        setEditingTipo(tipo);
        setIsModalOpen(true);
    }

    if (loading) return <div>Cargando...</div>;

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={openNew}
                    className="rounded bg-primary px-4 py-2 font-medium text-white hover:bg-opacity-90"
                >
                    Nuevo Tipo
                </button>
            </div>
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[50px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                                    ID
                                </th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                                    Nombre
                                </th>
                                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white">
                                    Descripción
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {tipos.map((tipo) => (
                                <tr key={tipo.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <p className="text-black dark:text-white">{tipo.id}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{tipo.nombre}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{tipo.descripcion}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button onClick={() => openEdit(tipo)} className="hover:text-primary">
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(tipo.id)} className="hover:text-danger text-red-500">
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <TipoClienteForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTipos}
                editingTipo={editingTipo}
            />
        </>
    );
}
