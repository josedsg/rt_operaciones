"use client";

import { runUppercaseMigrationAction } from "@/actions/migration";
import { useState } from "react";
import toast from "react-hot-toast";

export default function MigratePage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleMigrate = async () => {
        if (!confirm("¿Estás seguro de que deseas convertir TODOS los registros a MAYÚSCULAS? Esta acción no se puede deshacer fácilmente.")) {
            return;
        }

        setLoading(true);
        try {
            const res = await runUppercaseMigrationAction();
            setResult(res);
            toast.success("Migración completada");
        } catch (error) {
            console.error(error);
            toast.error("Error en la migración");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">Migración a Mayúsculas</h1>
            <p className="mb-6 text-gray-600">
                Esta utilidad recorrerá todas las tablas (Clientes, Proveedores, Ventas, Productos, etc.)
                y convertirá todos los campos de texto a MAYÚSCULAS.
            </p>

            <button
                onClick={handleMigrate}
                disabled={loading}
                className={`px-6 py-3 rounded bg-primary text-white font-bold ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
            >
                {loading ? "Procesando..." : "Ejecutar Migración Ahora"}
            </button>

            {result && (
                <div className="mt-10 p-4 bg-green-100 border border-green-400 rounded">
                    <h2 className="font-bold text-green-800">Resultado:</h2>
                    <pre className="mt-2 text-sm">{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
