import { Cliente } from "@/types/cliente";
import Link from "next/link";

interface ClienteCardProps {
    cliente: Cliente;
}

export function ClienteCard({ cliente }: ClienteCardProps) {
    return (
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="text-xl font-bold text-dark dark:text-white">
                        {cliente.nombre_comercial || cliente.nombre}
                    </h4>
                    <p className="mt-1 text-sm font-medium text-dark-6">
                        {cliente.nombre}
                    </p>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                {cliente.email_notificacion && (
                    <p className="text-sm font-medium text-dark-5 dark:text-dark-6">
                        <span className="mb-0.5 block text-xs">Email</span>
                        {cliente.email_notificacion}
                    </p>
                )}

                {cliente.telefono && (
                    <p className="text-sm font-medium text-dark-5 dark:text-dark-6">
                        <span className="mb-0.5 block text-xs">Teléfono</span>
                        {cliente.telefono}
                    </p>
                )}

                {(cliente.provincia || cliente.canton || cliente.distrito) && (
                    <p className="text-sm font-medium text-dark-5 dark:text-dark-6">
                        <span className="mb-0.5 block text-xs">Ubicación</span>
                        {[
                            cliente.provincia?.nombre,
                            cliente.canton?.nombre,
                            cliente.distrito?.nombre
                        ].filter(Boolean).join(", ")}
                    </p>
                )}

                {cliente.direccion && (
                    <p className="text-sm font-medium text-dark-5 dark:text-dark-6">
                        <span className="mb-0.5 block text-xs">Dirección</span>
                        {cliente.direccion}
                    </p>
                )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
                <Link
                    href={`/clientes/${cliente.id}/editar`}
                    className="inline-flex items-center justify-center rounded-md border border-primary px-4 py-2 text-center text-sm font-medium text-primary hover:bg-opacity-90 dark:border-white dark:text-white"
                >
                    Editar
                </Link>
                <Link
                    href={`/clientes/${cliente.id}`}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-opacity-90"
                >
                    Ver Detalles
                </Link>
            </div>
        </div>
    );
}
