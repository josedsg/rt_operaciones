"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { TipoEmpaqueForm } from "@/components/Empaques/tipo-empaque-form";
import { getTiposEmpaqueAction, deleteTipoEmpaqueAction } from "@/actions/tipo-empaque";
import toast from "react-hot-toast";

export default function TiposEmpaquePage() {
    const [tipos, setTipos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTipo, setEditingTipo] = useState<any>(null);

    const loadData = async () => {
        setLoading(true);
        const data = await getTiposEmpaqueAction();
        setTipos(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: number) => {
        if (confirm("¿Está seguro de eliminar este tipo de empaque?")) {
            try {
                await deleteTipoEmpaqueAction(id);
                toast.success("Tipo de empaque eliminado");
                loadData();
            } catch (error) {
                toast.error("Error al eliminar tipo de empaque");
            }
        }
    };

    return (
        <>
            <Breadcrumb pageName="Configuración de Tipos de Empaque" />

            <div className="flex flex-col gap-10">
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="flex items-center justify-between border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">
                            Tipos de Empaque
                        </h3>
                        <button
                            onClick={() => {
                                setEditingTipo(null);
                                setShowForm(!showForm);
                            }}
                            className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
                        >
                            {showForm ? "Cerrar" : "Nuevo Tipo"}
                        </button>
                    </div>

                    {showForm && (
                        <div className="p-6.5 border-b border-stroke dark:border-strokedark bg-gray-2 dark:bg-meta-4">
                            <TipoEmpaqueForm
                                tipo={editingTipo}
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
                                        <th className="py-4 px-4 font-medium text-black dark:text-white">Descripción</th>
                                        <th className="py-4 px-4 font-medium text-black dark:text-white">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={3} className="p-4 text-center">Cargando...</td>
                                        </tr>
                                    ) : tipos.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="p-4 text-center">No hay tipos registrados</td>
                                        </tr>
                                    ) : (
                                        tipos.map((tipo) => (
                                            <tr key={tipo.id} className="border-b border-[#eee] dark:border-strokedark">
                                                <td className="py-5 px-4 font-medium text-black dark:text-white uppercase">
                                                    {tipo.nombre}
                                                </td>
                                                <td className="py-5 px-4">
                                                    {tipo.descripcion || "Sin descripción"}
                                                </td>
                                                <td className="py-5 px-4">
                                                    <div className="flex items-center space-x-3.5">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTipo(tipo);
                                                                setShowForm(true);
                                                            }}
                                                            className="hover:text-primary"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(tipo.id)}
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
