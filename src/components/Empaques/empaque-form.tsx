"use client";

import { useState, useEffect } from "react";
import { createEmpaqueAction, updateEmpaqueAction } from "@/actions/empaques";
import { getTiposEmpaqueAction } from "@/actions/tipo-empaque";
import toast from "react-hot-toast";

interface EmpaqueFormProps {
    empaque?: any;
    onSuccess: () => void;
}

export function EmpaqueForm({ empaque, onSuccess }: EmpaqueFormProps) {
    const [nombre, setNombre] = useState(empaque?.nombre || "");
    const [descripcion, setDescripcion] = useState(empaque?.descripcion || "");
    const [sxb, setSxb] = useState(empaque?.sxb || 0);
    const [bxb, setBxb] = useState(empaque?.bxb || 0);
    const [stXbx, setStXbx] = useState(empaque?.st_x_bx || 0);
    const [tipoEmpaqueId, setTipoEmpaqueId] = useState(empaque?.tipo_empaque_id || "");
    const [tipos, setTipos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getTiposEmpaqueAction().then(setTipos);
        if (empaque) {
            setNombre(empaque.nombre);
            setDescripcion(empaque.descripcion || "");
            setSxb(empaque.sxb);
            setBxb(empaque.bxb);
            setStXbx(empaque.st_x_bx);
            setTipoEmpaqueId(empaque.tipo_empaque_id || "");
        }
    }, [empaque]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                nombre,
                descripcion,
                sxb: Number(sxb),
                bxb: Number(bxb),
                st_x_bx: Number(stXbx),
                tipo_empaque_id: tipoEmpaqueId ? Number(tipoEmpaqueId) : undefined
            };

            if (empaque) {
                await updateEmpaqueAction(empaque.id, data);
                toast.success("Empaque actualizado");
            } else {
                await createEmpaqueAction(data);
                toast.success("Empaque creado");
            }
            onSuccess();
            if (!empaque) {
                setNombre("");
                setDescripcion("");
                setSxb(0);
                setBxb(0);
                setStXbx(0);
                setTipoEmpaqueId("");
            }
        } catch (error) {
            toast.error("Error al guardar empaque");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium">Nombre</label>
                    <input
                        type="text"
                        required
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. CAJA FULL PREMIUM"
                        className="w-full rounded border border-stroke bg-white py-3 px-5 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium">Tipo de Empaque</label>
                    <select
                        value={tipoEmpaqueId}
                        onChange={(e) => setTipoEmpaqueId(e.target.value)}
                        className="w-full rounded border border-stroke bg-white py-3 px-5 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                    >
                        <option value="">Seleccionar Tipo...</option>
                        {tipos.map((t) => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="mb-2 block text-sm font-medium">SXB (Stems x Bunch)</label>
                    <input
                        type="number"
                        required
                        value={sxb}
                        onChange={(e) => setSxb(Number(e.target.value))}
                        className="w-full rounded border border-stroke bg-white py-3 px-5 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium">BXB (Bunches x Box)</label>
                    <input
                        type="number"
                        required
                        value={bxb}
                        onChange={(e) => setBxb(Number(e.target.value))}
                        className="w-full rounded border border-stroke bg-white py-3 px-5 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium">ST X BX</label>
                    <input
                        type="number"
                        required
                        value={stXbx}
                        onChange={(e) => setStXbx(Number(e.target.value))}
                        className="w-full rounded border border-stroke bg-white py-3 px-5 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                    />
                </div>
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium">Descripción</label>
                <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Detalles sobre este empaque..."
                    className="w-full rounded border border-stroke bg-white py-3 px-5 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                ></textarea>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-primary py-3 font-medium text-white hover:bg-opacity-90"
            >
                {loading ? "Guardando..." : "Guardar Empaque"}
            </button>
        </form>
    );
}
