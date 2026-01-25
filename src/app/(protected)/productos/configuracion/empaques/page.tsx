"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { EmpaqueForm } from "@/components/Empaques/empaque-form";
import { getEmpaquesAction, deleteEmpaqueAction } from "@/actions/empaques";
import toast from "react-hot-toast";

export default function EmpaquesPage() {
    const [empaques, setEmpaques] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEmpaque, setEditingEmpaque] = useState<any>(null);

    const loadData = async () => {
        setLoading(true);
        const data = await getEmpaquesAction();
        setEmpaques(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: number) => {
        if (confirm("¿Está seguro de eliminar este empaque?")) {
            try {
                await deleteEmpaqueAction(id);
                toast.success("Empaque eliminado");
                loadData();
            } catch (error) {
                toast.error("Error al eliminar empaque");
            }
        }
    };

    return (
        <>
            <Breadcrumb pageName="Configuración de Empaques" />

            <div className="flex flex-col gap-10">
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="flex items-center justify-between border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">
                            Definiciones de Empaque
                        </h3>
                        <button
                            onClick={() => {
                                setEditingEmpaque(null);
                                setShowForm(!showForm);
                            }}
                            className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
                        >
                            {showForm ? "Cerrar" : "Nuevo Empaque"}
                        </button>
                    </div>

                    {showForm && (
                        <div className="p-6.5 border-b border-stroke dark:border-strokedark bg-gray-2 dark:bg-meta-4">
                            <EmpaqueForm
                                empaque={editingEmpaque}
                                onSuccess={() => {
                                    setShowForm(false);
                                    loadData();
                                }}
                            />
                        </div>
                    )}

                    <div className="p-6.5">
                        <div className="max-w-full overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                        <th className="py-4 px-4 font-medium text-black dark:text-white">Nombre</th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white">Tipo</th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white text-center">SXB</th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white text-center">BXB</th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white text-center">ST X BX</th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center">Cargando...</td>
                                        </tr>
                                    ) : empaques.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center">No hay empaques registrados</td>
                                        </tr>
                                    ) : (
                                        empaques.map((empaque) => (
                                            <tr key={empaque.id} className="border-b border-[#eee] dark:border-strokedark">
                                                <td className="py-5 px-4">
                                                    <h5 className="font-medium text-black dark:text-white uppercase">
                                                        {empaque.nombre}
                                                    </h5>
                                                    <p className="text-sm">{empaque.descripcion}</p>
                                                </td>
                                                <td className="py-5 px-4">
                                                    {empaque.tipo_empaque?.nombre || "N/A"}
                                                </td>
                                                <td className="py-5 px-4 text-center">{empaque.sxb}</td>
                                                <td className="py-5 px-4 text-center">{empaque.bxb}</td>
                                                <td className="py-5 px-4 text-center">{empaque.st_x_bx}</td>
                                                <td className="py-5 px-4">
                                                    <div className="flex items-center space-x-3.5">
                                                        <button
                                                            onClick={() => {
                                                                setEditingEmpaque(empaque);
                                                                setShowForm(true);
                                                            }}
                                                            className="hover:text-primary"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(empaque.id)}
                                                            className="hover:text-danger"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
