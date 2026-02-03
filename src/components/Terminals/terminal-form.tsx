"use client";

import React, { useState, useEffect } from "react";
import { createTerminalAction, updateTerminalAction } from "@/actions/terminals";
import { Terminal } from "@prisma/client";

interface TerminalFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingTerminal: Terminal | null;
}

export function TerminalForm({ isOpen, onClose, onSuccess, editingTerminal }: TerminalFormProps) {
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (editingTerminal) {
            setNombre(editingTerminal.nombre);
            setDescripcion(editingTerminal.descripcion || "");
        } else {
            setNombre("");
            setDescripcion("");
        }
        setError("");
    }, [editingTerminal, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = { nombre, descripcion };
            let res;

            if (editingTerminal) {
                res = await updateTerminalAction(editingTerminal.id, data);
            } else {
                res = await createTerminalAction(data);
            }

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                setError(res.error || "Error al guardar");
            }
        } catch (err) {
            setError("Error inesperado");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 dark:bg-boxdark">
                <h3 className="mb-6 text-xl font-bold text-black dark:text-white">
                    {editingTerminal ? "Editar Terminal" : "Nueva Terminal"}
                </h3>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                            className="w-full rounded border border-stroke bg-white py-3 px-5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 focus:ring-1 focus:ring-primary"
                            placeholder="Nombre de la terminal"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Descripción
                        </label>
                        <textarea
                            rows={3}
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="w-full rounded border border-stroke bg-white py-3 px-5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 focus:ring-1 focus:ring-primary"
                            placeholder="Descripción opcional"
                        ></textarea>
                    </div>

                    {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                        >
                            {loading ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
