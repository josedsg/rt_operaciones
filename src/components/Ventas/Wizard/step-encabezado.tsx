"use client";

import { useEffect, useState } from "react";
import { PedidoVentaInput } from "@/actions/ventas";
import { getClientesAction } from "@/actions/clientes";
import { Cliente } from "@prisma/client";

interface StepEncabezadoProps {
    data: PedidoVentaInput;
    updateData: (data: Partial<PedidoVentaInput>) => void;
}

export function StepEncabezado({ data, updateData }: StepEncabezadoProps) {
    const [clientes, setClientes] = useState<Cliente[]>([]);

    useEffect(() => {
        getClientesAction().then(res => {
            setClientes(res);
        });
    }, []);

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Cliente
                </label>
                <select
                    value={data.cliente_id}
                    onChange={(e) => updateData({ cliente_id: Number(e.target.value) })}
                    className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                >
                    <option value={0}>Seleccione un cliente</option>
                    {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.nombre} {c.nombre_comercial ? `(${c.nombre_comercial})` : ""}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Fecha de Pedido
                </label>
                <input
                    type="date"
                    value={data.fecha_pedido instanceof Date ? data.fecha_pedido.toISOString().split('T')[0] : data.fecha_pedido}
                    onChange={(e) => updateData({ fecha_pedido: new Date(e.target.value) })}
                    className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
            </div>

            <div>
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    AWD (Air Waybill)
                </label>
                <input
                    type="text"
                    placeholder="Ej. 123-45678901"
                    value={data.awd || ""}
                    onChange={(e) => updateData({ awd: e.target.value })}
                    className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
            </div>

            <div className="md:col-span-1">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Estado
                </label>
                <select
                    value={data.estado || "BORRADOR"}
                    onChange={(e) => updateData({ estado: e.target.value })}
                    className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                >
                    <option value="BORRADOR">BORRADOR</option>
                    <option value="CONFIRMADO">CONFIRMADO</option>
                    <option value="ANULADO">ANULADO</option>
                </select>
            </div>

            <div className="md:col-span-1">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Moneda
                </label>
                <select
                    value={data.moneda || "USD"}
                    onChange={(e) => updateData({ moneda: e.target.value })}
                    className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                >
                    <option value="USD">Dólares (USD $)</option>
                    <option value="CRC">Colones (CRC ₡)</option>
                </select>
            </div>

            <div className="md:col-span-2">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Descripción / Notas
                </label>
                <textarea
                    rows={3}
                    placeholder="Notas adicionales del pedido"
                    value={data.descripcion || ""}
                    onChange={(e) => updateData({ descripcion: e.target.value })}
                    className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
            </div>
        </div>
    );
}
