"use client";

import { useState, useEffect } from "react";
import { TerminosPago } from "@prisma/client";
import { createTerminosPagoAction, updateTerminosPagoAction } from "@/actions/clientes";

interface TerminosPagoFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingTermino?: TerminosPago | null;
}

export function TerminosPagoForm({ isOpen, onClose, onSuccess, editingTermino }: TerminosPagoFormProps) {
    const [nombre, setNombre] = useState("");
    const [dias, setDias] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editingTermino) {
            setNombre(editingTermino.nombre);
            setDias(editingTermino.dias);
        } else {
            setNombre("");
            setDias(0);
        }
    }, [editingTermino, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingTermino) {
                await updateTerminosPagoAction(editingTermino.id, { nombre, dias });
            } else {
                await createTerminosPagoAction({ nombre, dias });
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
                    {editingTermino ? "Editar Término" : "Nuevo Término de Pago"}
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
                            placeholder="Ej. Contado, Crédito 30 Días"
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Días de Crédito
                        </label>
                        <input
                            type="number"
                            value={dias}
                            onChange={(e) => setDias(Number(e.target.value))}
                            required
                            min={0}
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
