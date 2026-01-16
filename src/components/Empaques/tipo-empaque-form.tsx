"use client";

import { useState, useEffect } from "react";
import { createTipoEmpaqueAction, updateTipoEmpaqueAction } from "@/actions/tipo-empaque";
import toast from "react-hot-toast";

interface TipoEmpaqueFormProps {
    tipo?: any;
    onSuccess: () => void;
}

export function TipoEmpaqueForm({ tipo, onSuccess }: TipoEmpaqueFormProps) {
    const [nombre, setNombre] = useState(tipo?.nombre || "");
    const [descripcion, setDescripcion] = useState(tipo?.descripcion || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (tipo) {
            setNombre(tipo.nombre);
            setDescripcion(tipo.descripcion || "");
        }
    }, [tipo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (tipo) {
                await updateTipoEmpaqueAction(tipo.id, { nombre, descripcion });
                toast.success("Tipo de empaque actualizado");
            } else {
                await createTipoEmpaqueAction({ nombre, descripcion });
                toast.success("Tipo de empaque creado");
            }
            onSuccess();
            if (!tipo) {
                setNombre("");
                setDescripcion("");
            }
        } catch (error) {
            toast.error("Error al guardar tipo de empaque");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="mb-2 block text-sm font-medium">Nombre</label>
                <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. CAJA DE CARTÓN"
                    className="w-full rounded border border-stroke bg-white py-3 px-5 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                />
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium">Descripción</label>
                <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Detalles adicionales..."
                    className="w-full rounded border border-stroke bg-white py-3 px-5 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                ></textarea>
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-primary py-3 font-medium text-white hover:bg-opacity-90"
            >
                {loading ? "Guardando..." : "Guardar Tipo"}
            </button>
        </form>
    );
}
