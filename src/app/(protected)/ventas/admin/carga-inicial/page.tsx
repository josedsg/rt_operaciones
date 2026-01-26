"use client";

import { uploadInitialData } from "@/actions/admin-products";
import { useState } from "react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";

export default function CargaInicialPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [fileContents, setFileContents] = useState<any>(null);
    const [fileName, setFileName] = useState<string>("");
    const [showConfirm, setShowConfirm] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                setFileContents(json);
                setResult(null); // Reset prev results
            } catch (err) {
                toast.error("Error al leer el archivo JSON. Verifica el formato.");
                setFileContents(null);
            }
        };
        reader.readAsText(file);
    };

    const handleUploadClick = () => {
        if (!fileContents) {
            toast.error("Por favor selecciona un archivo JSON válido primero.");
            return;
        }
        setShowConfirm(true);
    };

    const executeUpload = async () => {
        setShowConfirm(false);
        setLoading(true);
        try {
            const res = await uploadInitialData(fileContents);
            setResult(res);
            if (res.success) {
                toast.success("Carga inicial completada con éxito");
            } else {
                toast.error("Error en la carga: " + res.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error inesperado en la carga");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="max-w-xl w-full bg-white dark:bg-boxdark p-8 rounded-sm border border-stroke dark:border-strokedark shadow-default">
                <h1 className="text-3xl font-bold text-primary mb-4 flex items-center gap-2">
                    📦 Carga Inicial de Productos
                </h1>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                    Sube el archivo JSON maestro (v7 con dimensiones) para repoblar la base de datos.
                </p>

                <div className="bg-yellow-50 dark:bg-meta-3/20 border-l-4 border-warning p-4 mb-8">
                    <p className="text-warning font-bold text-sm">
                        ADVERTENCIA:
                    </p>
                    <p className="text-warning text-sm">
                        Este proceso <b>ELIMINA</b> todos los datos de productos existentes antes de cargar los nuevos.
                        Asegúrate de tener un backup si es necesario.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="mb-3 block text-black dark:text-white font-medium">
                        Archivo JSON Maestro
                    </label>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        disabled={loading}
                        className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:px-5 file:py-3 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                    />
                    {fileName && (
                        <p className="mt-2 text-sm text-green-600">Archivo seleccionado: {fileName}</p>
                    )}
                </div>

                <button
                    onClick={handleUploadClick}
                    disabled={loading || !fileContents}
                    className={`w-full px-6 py-4 rounded bg-primary text-white font-bold text-lg shadow-lg transition-transform active:scale-95 ${loading || !fileContents ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
                >
                    {loading ? "PROCESANDO CARGA..." : "CARGAR DATOS INICIALES"}
                </button>

                {result && (
                    <div className={`mt-8 p-4 border rounded ${result.success ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
                        <h2 className={`font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                            {result.success ? 'Resultado Exitoso:' : 'Error:'}
                        </h2>
                        <pre className="mt-2 text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                )}


                {/* Confirm Dialog */}
                <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>⚠️ Advertencia Crítica</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Esta acción <strong>BORRARÁ TODOS</strong> los Productos, Familias, Grupos, Empaques y Variantes actuales de la base de datos para cargar los nuevos desde el archivo JSON.
                            </p>
                            <p className="mt-2 text-sm text-red-500 font-medium">
                                Esta acción es irreversible. ¿Deseas continuar?
                            </p>
                        </div>
                        <DialogFooter>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 rounded border border-stroke text-gray-700 hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={executeUpload}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition font-medium"
                            >
                                Sí, Borrar y Cargar
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
