"use client";

import { useEffect, useState, useMemo } from "react";
import { ProductoMaestro, Familia, Variante, Tamano, ConfiguracionPermitida } from "@prisma/client";
import { createProductoMaestroAction, updateProductoMaestroAction } from "@/actions/productos-maestros";
import { getFamiliasAction } from "@/actions/familias";
import { getConfiguracionesAction, getAllVariantes, getAllTamanos } from "@/actions/configuraciones";
import toast from "react-hot-toast";

interface ProductoMaestroFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: ProductoMaestro | null;
}

type ConfigWithRelations = ConfiguracionPermitida & { variante: Variante | null, tamano: Tamano | null };

export function ProductoMaestroForm({ onClose, onSuccess, initialData }: ProductoMaestroFormProps) {
    // Form States
    const [nombre, setNombre] = useState(initialData?.nombre || "");
    const [descripcion, setDescripcion] = useState(initialData?.descripcion || "");
    const [familiaId, setFamiliaId] = useState<string>(initialData?.familia_id.toString() || "");
    const [varianteId, setVarianteId] = useState<string>(initialData?.variante_id.toString() || "");
    const [tamanoId, setTamanoId] = useState<string>(initialData?.tamano_id.toString() || "");

    // Data Sources
    const [familias, setFamilias] = useState<Familia[]>([]);
    const [allVariantes, setAllVariantes] = useState<Variante[]>([]);
    const [allTamanos, setAllTamanos] = useState<Tamano[]>([]);

    // Loaded Configs for current family
    const [configuraciones, setConfiguraciones] = useState<ConfigWithRelations[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // 1. Initial Load (Familias + All Variantes/Tamanos for wildcards)
    useEffect(() => {
        Promise.all([
            getFamiliasAction(),
            getAllVariantes(),
            getAllTamanos()
        ]).then(([f, v, t]) => {
            setFamilias(f);
            setAllVariantes(v);
            setAllTamanos(t);
        });
    }, []);

    // 2. When Familia changes, load configurations
    useEffect(() => {
        if (familiaId) {
            getConfiguracionesAction(parseInt(familiaId)).then(setConfiguraciones);
        } else {
            setConfiguraciones([]);
        }
        // Only reset downstream if user changed familia manually, not on initial load
        if (!initialData || initialData.familia_id.toString() !== familiaId) {
            // If manual change, reset downstream
        }
    }, [familiaId, initialData]);

    // 3. Compute Valid Variantes based on Familia Configs
    const validVariantes = useMemo(() => {
        if (!familiaId) return [];
        if (configuraciones.length === 0) return [];

        // Check for wildcard (variante_id === null)
        const hasWildcard = configuraciones.some(c => c.variante_id === null);
        if (hasWildcard) return allVariantes;

        // Otherwise collect specific allowed variants
        const allowedIds = new Set(configuraciones.map(c => c.variante_id).filter(Boolean));
        return allVariantes.filter(v => allowedIds.has(v.id));
    }, [familiaId, configuraciones, allVariantes]);

    // 4. Compute Valid Tamanos based on Selected Variante
    const validTamanos = useMemo(() => {
        if (!familiaId || !varianteId) return [];

        const vid = parseInt(varianteId);

        // Filter configs relevant to this variante (specific match OR wildcard)
        const relevantConfigs = configuraciones.filter(c =>
            c.variante_id === vid || c.variante_id === null
        );

        if (relevantConfigs.length === 0) return [];

        // Check for tamano wildcard in relevant configs
        const hasWildcard = relevantConfigs.some(c => c.tamano_id === null);
        if (hasWildcard) return allTamanos;

        // Otherwise collect specific allowed sizes
        const allowedIds = new Set(relevantConfigs.map(c => c.tamano_id).filter(Boolean));
        return allTamanos.filter(t => allowedIds.has(t.id));

    }, [familiaId, varianteId, configuraciones, allTamanos]);


    // Handle Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const formData = new FormData();
            if (initialData) formData.append("id", initialData.id.toString());

            formData.append("nombre", nombre);
            formData.append("descripcion", descripcion);
            formData.append("familia_id", familiaId);
            formData.append("variante_id", varianteId);
            formData.append("tamano_id", tamanoId);

            if (initialData) {
                await updateProductoMaestroAction(formData);
                toast.success("Producto maestro actualizado");
            } else {
                await createProductoMaestroAction(formData);
                toast.success("Producto maestro creado");
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError("Error al guardar el producto maestro.");
            toast.error("Error al guardar el producto");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white p-8 dark:bg-boxdark">
                <h3 className="mb-6 text-xl font-bold text-black dark:text-white">
                    {initialData ? "Editar Producto Maestro" : "Nuevo Producto Maestro"}
                </h3>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Familia <span className="text-meta-1">*</span>
                        </label>
                        <select
                            value={familiaId}
                            onChange={(e) => {
                                setFamiliaId(e.target.value);
                                setVarianteId("");
                                setTamanoId("");
                            }}
                            required
                            className="w-full rounded border border-stroke bg-white py-3 px-5 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                        >
                            <option value="">Seleccione Familia</option>
                            {familias.map(f => (
                                <option key={f.id} value={f.id}>{f.nombre_cientifico}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Variante <span className="text-meta-1">*</span>
                        </label>
                        <select
                            value={varianteId}
                            onChange={(e) => {
                                setVarianteId(e.target.value);
                                setTamanoId("");
                            }}
                            required
                            disabled={!familiaId}
                            className="w-full rounded border border-stroke bg-white py-3 px-5 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark disabled:opacity-50"
                        >
                            <option value="">Seleccione Variante</option>
                            {validVariantes.map(v => (
                                <option key={v.id} value={v.id}>{v.nombre}</option>
                            ))}
                        </select>
                        {familiaId && validVariantes.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">No hay variantes configuradas para esta familia.</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Tamaño <span className="text-meta-1">*</span>
                        </label>
                        <select
                            value={tamanoId}
                            onChange={(e) => setTamanoId(e.target.value)}
                            required
                            disabled={!varianteId}
                            className="w-full rounded border border-stroke bg-white py-3 px-5 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark disabled:opacity-50"
                        >
                            <option value="">Seleccione Tamaño</option>
                            {validTamanos.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                        {varianteId && validTamanos.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">No hay tamaños permitidos para esta variante.</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Nombre del Producto <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                            className="w-full rounded border border-stroke bg-white py-3 px-5 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
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
                            className="w-full rounded border border-stroke bg-white py-3 px-5 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
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
                            disabled={isSubmitting}
                            className="rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                        >
                            {isSubmitting ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
