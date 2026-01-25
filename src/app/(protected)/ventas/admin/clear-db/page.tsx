"use client";

import { clearDatabaseAction } from "@/actions/admin";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ClearDbPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleClear = async () => {
        const confirm1 = confirm("¡ADVERTENCIA CRÍTICA! Esta acción borrará TODOS los registros de la base de datos (Clientes, Pedidos, Productos, etc.). ¿Deseas continuar?");
        if (!confirm1) return;

        const confirm2 = confirm("¿ESTÁS REALMENTE SEGURO? Esta operación es IRREVERSIBLE y se utiliza exclusivamente para limpieza de entornos de prueba.");
        if (!confirm2) return;

        setLoading(true);
        try {
            const res = await clearDatabaseAction();
            setResult(res);
            toast.success("Base de datos limpiada con éxito");
        } catch (error) {
            console.error(error);
            toast.error("Error al limpiar la base de datos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="max-w-xl w-full bg-white dark:bg-boxdark p-8 rounded-sm border border-stroke dark:border-strokedark shadow-default">
                <h1 className="text-3xl font-bold text-danger mb-4 flex items-center gap-2">
                    ⚠️ Peligro: Limpieza de BD
                </h1>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                    Esta utilidad borrará **absolutamente todos** los registros de todas las tablas.
                    Úsala únicamente si necesitas reiniciar el sistema con datos limpios para nuevas pruebas.
                </p>

                <div className="bg-red-50 dark:bg-meta-4 border-l-4 border-danger p-4 mb-8">
                    <p className="text-danger font-medium text-sm">
                        ADVERTENCIA: No hay vuelta atrás después de ejecutar esta acción.
                    </p>
                </div>

                <button
                    onClick={handleClear}
                    disabled={loading}
                    className={`w-full px-6 py-4 rounded bg-danger text-white font-bold text-lg shadow-lg transition-transform active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
                >
                    {loading ? "PROCESANDO LIMPIEZA..." : "BORRAR TODA LA BASE DE DATOS"}
                </button>

                {result && (
                    <div className="mt-8 p-4 bg-green-100 border border-green-400 rounded">
                        <h2 className="font-bold text-green-800">Resultado:</h2>
                        <pre className="mt-2 text-sm">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}
