"use client";

import { createVarianteAction, updateVarianteAction } from "@/actions/variantes";
import { Variante } from "@prisma/client";
import { useState } from "react";

interface VarianteFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Variante | null;
}

export function VarianteForm({ onClose, onSuccess, initialData }: VarianteFormProps) {
    const [nombre, setNombre] = useState(initialData?.nombre || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            if (initialData) {
                await updateVarianteAction(initialData.id, nombre);
            } else {
                await createVarianteAction(nombre);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(`Error al ${initialData ? 'actualizar' : 'crear'} la variante.`);
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-8 dark:bg-boxdark">
                <h3 className="mb-6 text-xl font-bold text-black dark:text-white">
                    {initialData ? "Editar Variante" : "Nueva Variante"}
                </h3>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Nombre
                        </label>
                        <input
                            type="text"
                            required
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej. Talla M, Rojo, etc."
                            className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                    </div>

                    {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                        >
                            {isSubmitting ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
