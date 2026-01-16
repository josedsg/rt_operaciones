"use client";

import React, { useEffect, useState } from "react";
import { TerminosPago } from "@prisma/client";
import { getTerminosPagoAction, deleteTerminosPagoAction } from "@/actions/clientes";
import { TerminosPagoForm } from "@/components/Clientes/Forms/terminos-pago-form";

export default function GridTerminosPago() {
    const [terminos, setTerminos] = useState<TerminosPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTermino, setEditingTermino] = useState<TerminosPago | null>(null);

    const fetchTerminos = async () => {
        try {
            setLoading(true);
            const data = await getTerminosPagoAction();
            setTerminos(data);
        } catch (error) {
            console.error("Error fetching terminos pago:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTerminos();
    }, []);

    const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de eliminar este término?")) {
            const res = await deleteTerminosPagoAction(id);
            if (res.success) {
                fetchTerminos();
            } else {
                alert(res.error);
            }
        }
    }

    const openNew = () => {
        setEditingTermino(null);
        setIsModalOpen(true);
    }

    const openEdit = (termino: TerminosPago) => {
        setEditingTermino(termino);
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
                    Nuevo Término
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
                                <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
                                    Días
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {terminos.map((termino) => (
                                <tr key={termino.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <p className="text-black dark:text-white">{termino.id}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{termino.nombre}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{termino.dias}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button onClick={() => openEdit(termino)} className="hover:text-primary">
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(termino.id)} className="hover:text-danger text-red-500">
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
            <TerminosPagoForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTerminos}
                editingTermino={editingTermino}
            />
        </>
    );
}
