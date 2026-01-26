"use client";

import { useEffect, useState } from "react";
import { getOrdersForExport } from "@/actions/exportaciones";
import toast from "react-hot-toast";

interface StepGeneralProps {
    data: any;
    updateData: (data: any) => void;
    onNext: () => void;
}

export function StepGeneralInfo({ data, updateData, onNext }: StepGeneralProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data.fecha) {
            fetchOrders(data.fecha);
        }
    }, [data.fecha]);

    const fetchOrders = async (date: string) => {
        setLoading(true);
        try {
            const res = await getOrdersForExport(date, null, true);
            if (res.success) {
                setStats(res.data);
                // Update parent state with selected orders for next steps
                updateData((prev: any) => ({
                    ...prev,
                    pedidos_seleccionados: res.data?.orders || []
                }));
            } else {
                toast.error(res.error || "Error cargando pedidos");
                setStats(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6.5">
            <h3 className="mb-5 font-medium text-black dark:text-white">
                Información de Exportación
            </h3>

            <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">
                    <label className="mb-2.5 block text-black dark:text-white">
                        Fecha de Exportación
                    </label>
                    <input
                        type="date"
                        value={data.fecha}
                        onChange={(e) => updateData((prev: any) => ({ ...prev, fecha: e.target.value }))}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                </div>

                <div className="w-full xl:w-1/2">
                    <label className="mb-2.5 block text-black dark:text-white">
                        Estado
                    </label>
                    <input
                        type="text"
                        value={data.estado}
                        disabled
                        className="w-full cursor-not-allowed rounded border-[1.5px] border-stroke bg-gray py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary dark:disabled:bg-black"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            ) : stats ? (
                <div className="mt-8">
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
                            <h4 className="text-sm font-semibold text-black dark:text-white">Pedidos a Procesar</h4>
                            <p className="mt-2 text-2xl font-bold text-primary">{stats.summary.total_pedidos}</p>
                        </div>
                        <div className="rounded border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
                            <h4 className="text-sm font-semibold text-black dark:text-white">Cajas Totales Est.</h4>
                            <p className="mt-2 text-2xl font-bold text-success">{stats.summary.total_cajas}</p>
                        </div>
                    </div>

                    <h4 className="mb-4 font-semibold text-black dark:text-white">Clientes a Procesar</h4>

                    <div className="max-w-full overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Cliente</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Pedidos</th>
                                    <th className="py-4 px-4 font-medium text-black dark:text-white">Cajas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.clients.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-5 px-4 text-center text-gray-500">
                                            No hay pedidos para esta fecha.
                                        </td>
                                    </tr>
                                )}
                                {stats.clients.map((client: any, idx: number) => (
                                    <tr key={idx} className="border-b border-stroke dark:border-strokedark">
                                        <td className="py-5 px-4 text-black dark:text-white">
                                            {client.nombre_comercial || client.nombre}
                                        </td>
                                        <td className="py-5 px-4 text-black dark:text-white">
                                            {client.pedidos_count}
                                        </td>
                                        <td className="py-5 px-4 text-black dark:text-white">
                                            {client.total_cajas}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            <div className="mt-10 flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!stats || stats.summary.total_pedidos === 0}
                    className="flex justify-center rounded bg-primary py-3 px-6 font-medium text-gray hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
                >
                    Siguiente: Packing List
                </button>
            </div>
        </div>
    );
}
