"use client";

import { createTamanoAction, updateTamanoAction } from "@/actions/tamanos";
import { Tamano } from "@prisma/client";
import { useState } from "react";

interface TamanoFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Tamano | null;
}

export function TamanoForm({ onClose, onSuccess, initialData }: TamanoFormProps) {
    const [nombre, setNombre] = useState(initialData?.nombre || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            if (initialData) {
                await updateTamanoAction(initialData.id, nombre);
            } else {
                await createTamanoAction(nombre);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(`Error al ${initialData ? 'actualizar' : 'crear'} el tamaño.`);
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-8 dark:bg-boxdark">
                <h3 className="mb-6 text-xl font-bold text-black dark:text-white">
                    {initialData ? "Editar Tamaño" : "Nuevo Tamaño"}
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
                            placeholder="Ej. Pequeño, Grande, 10x10, etc."
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
