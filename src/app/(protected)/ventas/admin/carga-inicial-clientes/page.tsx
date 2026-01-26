"use client";

import { uploadInitialClients } from "@/actions/admin-clients";
import { useState } from "react";
import toast from "react-hot-toast";

export default function CargaInicialClientesPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [fileContents, setFileContents] = useState<any>(null);
    const [fileName, setFileName] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                setFileContents(json);
                setResult(null);
            } catch (err) {
                toast.error("Error al leer el archivo JSON. Verifica el formato.");
                setFileContents(null);
            }
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        if (!fileContents) {
            toast.error("Por favor selecciona un archivo JSON válido primero.");
            return;
        }

        const confirm1 = confirm("¡ADVERTENCIA CRÍTICA! Esta acción borrará TODOS los Clientes y Pedidos actuales. ¿Deseas continuar?");
        if (!confirm1) return;

        setLoading(true);
        try {
            const res = await uploadInitialClients(fileContents);
            setResult(res);
            if (res.success) {
                toast.success("Carga inicial de clientes completada con éxito");
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
                    👥 Carga Inicial de Clientes
                </h1>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                    Sube el archivo JSON de contactos para repoblar la base de datos de clientes.
                </p>

                <div className="bg-yellow-50 dark:bg-meta-3/20 border-l-4 border-warning p-4 mb-8">
                    <p className="text-warning font-bold text-sm">
                        ADVERTENCIA:
                    </p>
                    <p className="text-warning text-sm">
                        Este proceso <b>ELIMINA</b> todos los clientes y pedidos existentes.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="mb-3 block text-black dark:text-white font-medium">
                        Archivo JSON (contactos.json)
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
                    onClick={handleUpload}
                    disabled={loading || !fileContents}
                    className={`w-full px-6 py-4 rounded bg-primary text-white font-bold text-lg shadow-lg transition-transform active:scale-95 ${loading || !fileContents ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
                >
                    {loading ? "PROCESANDO CARGA..." : "CARGAR CLIENTES"}
                </button>

                {result && (
                    <div className={`mt-8 p-4 border rounded ${result.success ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
                        <h2 className={`font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                            {result.success ? 'Resultado Exitoso:' : 'Error:'}
                        </h2>
                        <pre className="mt-2 text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}
