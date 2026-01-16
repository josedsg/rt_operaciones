"use client";

import { ConfiguracionPermitida, Familia, Grupo, Tamano, Variante } from "@prisma/client";
import { useEffect, useState } from "react";
import { createFamiliaAction, updateFamiliaAction } from "@/actions/familias";
import { getGruposAction } from "@/actions/grupos";
import { createConfiguracionAction, deleteConfiguracionAction, getAllTamanos, getAllVariantes, getConfiguracionesAction } from "@/actions/configuraciones";
import { generateProductosFromConfigAction } from "@/actions/productos-maestros";
import toast from "react-hot-toast";

import { ConfirmModal } from "@/components/Common/confirm-modal";

interface FamiliaFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Familia & { grupo: Grupo };
}

type ConfigWithRelations = ConfiguracionPermitida & { variante: Variante | null, tamano: Tamano | null };

export function FamiliaForm({ onClose, onSuccess, initialData }: FamiliaFormProps) {
    // Tab State
    const [activeTab, setActiveTab] = useState<'general' | 'configuraciones'>('general');

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: "danger" | "info" | "warning";
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        type: "info",
    });

    // Familia States
    const [nombreCientifico, setNombreCientifico] = useState(initialData?.nombre_cientifico || "");
    const [descripcion, setDescripcion] = useState(initialData?.descripcion || "");
    const [grupoId, setGrupoId] = useState<string>(initialData?.grupo_id.toString() || "");
    const [codigoCabys, setCodigoCabys] = useState(initialData?.codigo_cabys || "");
    const [partidaArancelaria, setPartidaArancelaria] = useState(initialData?.partida_arancelaria || "");
    const [foto, setFoto] = useState<File | null>(null);
    const [fichaTecnica, setFichaTecnica] = useState<File | null>(null);

    // Initial Data Lists
    const [grupos, setGrupos] = useState<Grupo[]>([]);

    // Config States
    const [variantes, setVariantes] = useState<Variante[]>([]);
    const [tamanos, setTamanos] = useState<Tamano[]>([]);
    const [configuraciones, setConfiguraciones] = useState<ConfigWithRelations[]>([]);

    // Config Selection States
    const [selectedVariante, setSelectedVariante] = useState("");
    const [selectedTamano, setSelectedTamano] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");

    // Load Data
    useEffect(() => {
        // Load Groups
        getGruposAction().then(setGrupos);

        // Load Config Data if Editing
        if (initialData) {
            Promise.all([
                getAllVariantes(),
                getAllTamanos(),
                getConfiguracionesAction(initialData.id)
            ]).then(([v, t, c]) => {
                setVariantes(v);
                setTamanos(t);
                setConfiguraciones(c);
            }).catch(e => {
                console.error("Error loading config data", e);
                setError("Error al cargar configuraciones.");
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        if (!grupoId) {
            setError("Debe seleccionar un grupo");
            setIsSubmitting(false);
            return;
        }

        try {
            const formData = new FormData();
            if (initialData) formData.append("id", initialData.id.toString());
            formData.append("nombre_cientifico", nombreCientifico);
            formData.append("descripcion", descripcion);
            formData.append("grupo_id", grupoId);
            formData.append("codigo_cabys", codigoCabys);
            formData.append("partida_arancelaria", partidaArancelaria);

            if (foto) formData.append("foto", foto);
            if (fichaTecnica) formData.append("ficha_tecnica", fichaTecnica);

            if (initialData) {
                await updateFamiliaAction(formData);
                toast.success("Familia actualizada correctamente");
            } else {
                await createFamiliaAction(formData);
                toast.success("Familia creada correctamente");
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError("Ocurrió un error al guardar la familia.");
            toast.error("Error al guardar familia");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddConfig = async () => {
        if (!initialData) return;
        if (!selectedVariante && !selectedTamano) {
            toast.error("Debe seleccionar al menos una variante o un tamaño.");
            return;
        }

        try {
            const vId = selectedVariante ? parseInt(selectedVariante) : null;
            const tId = selectedTamano ? parseInt(selectedTamano) : null;

            await createConfiguracionAction(initialData.id, vId, tId);

            // Refresh config list
            const updated = await getConfiguracionesAction(initialData.id);
            setConfiguraciones(updated);

            // Reset selects
            setSelectedVariante("");
            setSelectedTamano("");
            toast.success("Configuración agregada");
        } catch (e) {
            console.error("Error adding config", e);
            toast.error("No se pudo agregar. Puede que ya exista.");
        }
    };

    const handleDeleteConfig = async (id: number) => {
        if (!confirm("¿Eliminar esta configuración?")) return;
        try {
            await deleteConfiguracionAction(id);
            if (initialData) {
                const updated = await getConfiguracionesAction(initialData.id);
                setConfiguraciones(updated);
                toast.success("Configuración eliminada");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error al eliminar");
        }
    };

    const handleGenerateProducts = async () => {
        if (!initialData) return;
        if (!confirm("Esto generará productos maestros para todas las configuraciones completas (Variante + Tamaño) que no existan aún. ¿Continuar?")) return;

        setGenerating(true);
        try {
            const result = await generateProductosFromConfigAction(initialData.id);
            toast.success(`Proceso finalizado. Creados: ${result.created}. Omitidos: ${result.skipped}`, {
                duration: 5000,
            });
        } catch (e) {
            console.error(e);
            toast.error("Error al generar productos.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-5xl rounded-lg bg-white p-8 dark:bg-boxdark max-h-[95vh] flex flex-col">
                <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-black dark:text-white">
                        {initialData ? `Editar Familia: ${initialData.nombre_cientifico}` : "Nueva Familia"}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                {/* Tabs Header */}
                <div className="mb-6 border-b border-stroke dark:border-strokedark flex gap-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className={`pb-3 border-b-2 font-medium transition-colors ${activeTab === 'general'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'
                            }`}
                    >
                        Información General
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('configuraciones')}
                        disabled={!initialData}
                        className={`pb-3 border-b-2 font-medium transition-colors ${activeTab === 'configuraciones'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'
                            } ${!initialData ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Configuraciones Permitidas
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    {/* TAB: GENERAL */}
                    <div className={activeTab === 'general' ? 'block' : 'hidden'}>
                        <form id="generalForm" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Informacion General Fields */}
                                <div>
                                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                                        Nombre Científico <span className="text-meta-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={nombreCientifico}
                                        onChange={(e) => setNombreCientifico(e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                                        Grupo <span className="text-meta-1">*</span>
                                    </label>
                                    <select
                                        required
                                        value={grupoId}
                                        onChange={(e) => setGrupoId(e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="">Seleccione un grupo</option>
                                        {grupos.map(g => (
                                            <option key={g.id} value={g.id}>{g.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-full">
                                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                                        Descripción
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                                        Código CABYS
                                    </label>
                                    <input
                                        type="text"
                                        value={codigoCabys}
                                        onChange={(e) => setCodigoCabys(e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                                        Partida Arancelaria
                                    </label>
                                    <input
                                        type="text"
                                        value={partidaArancelaria}
                                        onChange={(e) => setPartidaArancelaria(e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                                        Foto (Imagen)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFoto(e.target.files?.[0] || null)}
                                        className="w-full rounded border border-stroke bg-white p-3 dark:border-strokedark dark:bg-boxdark"
                                    />
                                    {initialData?.foto && !foto && (
                                        <p className="mt-2 text-sm text-primary">Archivo actual: {initialData.foto.split('/').pop()}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                                        Ficha Técnica (PDF/Doc)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setFichaTecnica(e.target.files?.[0] || null)}
                                        className="w-full rounded border border-stroke bg-white p-3 dark:border-strokedark dark:bg-boxdark"
                                    />
                                    {initialData?.ficha_tecnica && !fichaTecnica && (
                                        <p className="mt-2 text-sm text-primary">Archivo actual: {initialData.ficha_tecnica.split('/').pop()}</p>
                                    )}
                                </div>
                            </div>

                            {!initialData && (
                                <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded text-sm border border-blue-200">
                                    Nota: Guarda la familia primero para poder configurar variantes y tamaños.
                                </div>
                            )}

                            <div className="mt-8 flex justify-end gap-4 border-t border-stroke pt-4 dark:border-strokedark">
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
                                    {isSubmitting ? "Guardando..." : "Guardar Familia"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* TAB: CONFIGURACIONES */}
                    <div className={activeTab === 'configuraciones' ? 'block h-full flex flex-col' : 'hidden'}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 bg-gray-50 dark:bg-meta-4 p-4 rounded-lg">
                            <div>
                                <h4 className="text-lg font-bold text-black dark:text-white">
                                    Generación de Productos
                                </h4>
                                <p className="text-sm text-gray-500">
                                    Crea automáticamente SKUs únicos basados en las combinaciones de abajo.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerateProducts}
                                disabled={generating || configuraciones.length === 0}
                                className="mt-4 sm:mt-0 rounded bg-success px-6 py-2.5 font-bold text-white shadow-1 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {generating ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                        Generando...
                                    </>
                                ) : (
                                    "⚡ Generar Productos Automáticos"
                                )}
                            </button>
                        </div>

                        <div className="mb-4 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark p-4 rounded-lg shadow-sm">
                            <h5 className="mb-3 font-semibold text-black dark:text-white">Agregar Nueva Configuración</h5>
                            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                <div className="flex-1">
                                    <label className="mb-1 block text-sm font-medium">Variante</label>
                                    <select
                                        value={selectedVariante}
                                        onChange={(e) => setSelectedVariante(e.target.value)}
                                        className="w-full rounded border border-stroke bg-gray-2 py-2 px-3 outline-none focus:border-primary dark:bg-meta-4 dark:border-strokedark"
                                    >
                                        <option value="">Cualquiera / Ninguna</option>
                                        {variantes.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="mb-1 block text-sm font-medium">Tamaño</label>
                                    <select
                                        value={selectedTamano}
                                        onChange={(e) => setSelectedTamano(e.target.value)}
                                        className="w-full rounded border border-stroke bg-gray-2 py-2 px-3 outline-none focus:border-primary dark:bg-meta-4 dark:border-strokedark"
                                    >
                                        <option value="">Cualquiera / Ninguno</option>
                                        {tamanos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddConfig}
                                    className="rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90 h-[42px]"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>

                        {/* Tabla Scrollable */}
                        <div className="flex-1 overflow-hidden border border-stroke rounded dark:border-strokedark flex flex-col">
                            <div className="bg-gray-2 dark:bg-meta-4 p-3 font-semibold text-black dark:text-white border-b border-stroke dark:border-strokedark">
                                Configuraciones Activas ({configuraciones.length})
                            </div>
                            <div className="overflow-y-auto flex-1 p-0">
                                <table className="w-full table-auto">
                                    <thead className="bg-gray-2 text-left dark:bg-meta-4 sticky top-0 shadow-sm">
                                        <tr>
                                            <th className="py-3 px-4 font-medium text-black dark:text-white">Variante</th>
                                            <th className="py-3 px-4 font-medium text-black dark:text-white">Tamaño</th>
                                            <th className="py-3 px-4 font-medium text-black dark:text-white text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {configuraciones.map((conf) => (
                                            <tr key={conf.id} className="border-t border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-boxdark transition-colors">
                                                <td className="py-3 px-4">{conf.variante?.nombre || <span className="inline-block px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs font-medium">Cualquiera</span>}</td>
                                                <td className="py-3 px-4">{conf.tamano?.nombre || <span className="inline-block px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs font-medium">Cualquiera</span>}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteConfig(conf.id)}
                                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                                        title="Eliminar configuración"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {configuraciones.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-10 text-center text-gray-500 flex flex-col items-center justify-center">
                                                    <span className="text-4xl mb-2">📋</span>
                                                    <span>No hay configuraciones definidas aún.</span>
                                                    <span className="text-xs mt-1">Agrega variantes y tamaños arriba.</span>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />
        </div>
    );
}
