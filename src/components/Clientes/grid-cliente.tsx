"use client";

import { Cliente } from "@/types/cliente";
import { useEffect, useState } from "react";
import { ClienteCard } from "./cliente-card";
import { getClientes } from "@/services/clientes";
import Link from "next/link";
import { SearchIcon } from "@/assets/icons"; // Assuming you have an icon, or use an svg inline

export function GridCliente() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const data = await getClientes();
                setClientes(data);
                setFilteredClientes(data);
            } catch (error) {
                console.error("Error fetching clientes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClientes();
    }, []);

    useEffect(() => {
        const results = clientes.filter(
            (cliente) =>
                cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (cliente.nombre_comercial || "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
        );
        setFilteredClientes(results);
    }, [searchTerm, clientes]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                {/* Search Bar */}
                <div className="relative w-full max-w-md">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-12 pr-6 outline-none focus:border-primary focus-visible:shadow-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:focus-visible:border-primary"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2">
                            <svg
                                className="fill-current text-bodydark2 dark:text-white"
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M9.16666 3.33332C5.94504 3.33332 3.33332 5.94504 3.33332 9.16666C3.33332 12.3883 5.94504 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.94504 12.3883 3.33332 9.16666 3.33332ZM1.66666 9.16666C1.66666 5.02452 5.02452 1.66666 9.16666 1.66666C13.3088 1.66666 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66666 13.3088 1.66666 9.16666Z"
                                    fill=""
                                />
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z"
                                    fill=""
                                />
                            </svg>
                        </span>
                    </div>
                </div>

                <Link
                    href="/clientes/nuevo"
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                >
                    Agregar Cliente
                </Link>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredClientes.map((cliente) => (
                        <ClienteCard key={cliente.id} cliente={cliente} />
                    ))}
                    {filteredClientes.length === 0 && (
                        <div className="col-span-full py-10 text-center text-dark-6">
                            No se encontraron clientes.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
