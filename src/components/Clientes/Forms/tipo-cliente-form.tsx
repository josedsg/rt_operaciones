"use client";

import { useState, useEffect } from "react";
import { TipoCliente } from "@prisma/client";
import { createTipoClienteAction, updateTipoClienteAction } from "@/actions/clientes";

interface TipoClienteFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingTipo?: TipoCliente | null;
}

export function TipoClienteForm({ isOpen, onClose, onSuccess, editingTipo }: TipoClienteFormProps) {
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editingTipo) {
            setNombre(editingTipo.nombre);
            setDescripcion(editingTipo.descripcion || "");
        } else {
            setNombre("");
            setDescripcion("");
        }
    }, [editingTipo, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingTipo) {
                await updateTipoClienteAction(editingTipo.id, { nombre, descripcion });
            } else {
                await createTipoClienteAction({ nombre, descripcion });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark">
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
                    {editingTipo ? "Editar Tipo" : "Nuevo Tipo de Cliente"}
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Descripción
                        </label>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded bg-primary py-2 px-6 font-medium text-white hover:bg-opacity-90"
                        >
                            {saving ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
