"use client";

import React, { useEffect, useState } from "react";
import { Agencia } from "@prisma/client";
import { getAgenciasAction, deleteAgenciaAction } from "@/actions/agencias";
import { AgenciaForm } from "./agencia-form";

export default function GridAgencias() {
    const [agencias, setAgencias] = useState<Agencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgencia, setEditingAgencia] = useState<Agencia | null>(null);

    const fetchAgencias = async () => {
        try {
            setLoading(true);
            const res = await getAgenciasAction();
            if (res.success && res.data) {
                setAgencias(res.data);
            }
        } catch (error) {
            console.error("Error fetching agencias:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgencias();
    }, []);

    const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de eliminar esta agencia?")) {
            const res = await deleteAgenciaAction(id);
            if (res.success) {
                fetchAgencias();
            } else {
                alert(res.error);
            }
        }
    }

    const openNew = () => {
        setEditingAgencia(null);
        setIsModalOpen(true);
    }

    const openEdit = (agencia: Agencia) => {
        setEditingAgencia(agencia);
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
                    Nueva Agencia
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
                            {agencias.map((agencia) => (
                                <tr key={agencia.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <p className="text-black dark:text-white">{agencia.id}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{agencia.nombre}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{agencia.descripcion || "-"}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button onClick={() => openEdit(agencia)} className="hover:text-primary">
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(agencia.id)} className="hover:text-danger text-red-500">
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {agencias.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-5 px-4 text-center text-gray-500">
                                        No hay agencias registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <AgenciaForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAgencias}
                editingAgencia={editingAgencia}
            />
        </>
    );
}
