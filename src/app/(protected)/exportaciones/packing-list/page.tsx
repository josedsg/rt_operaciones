"use client";

import { useState } from "react";
import { getOrdersForExport } from "@/actions/exportaciones";
import { StepPackingList } from "@/components/Exportaciones/Wizard/step-packing";
import toast from "react-hot-toast";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css"; // or your preferred theme
import { Spanish } from "flatpickr/dist/l10n/es.js";

export default function SimuladorPackingListPage() {
    const [dates, setDates] = useState<Date[]>([new Date(), new Date()]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSimulate = async () => {
        if (!dates || dates.length === 0) return;
        setLoading(true);
        setSearched(true);
        try {
            const startDate = dates[0].toISOString();
            // If only one date selected (or second is same), use it as single day or range
            // Flatpickr might return [d1, d2]
            const endDate = dates.length > 1 ? dates[1].toISOString() : startDate;

            const res = await getOrdersForExport(startDate, endDate, true);
            if (res.success && res.data) {
                setOrders(res.data.orders);
                if (res.data.orders.length === 0) {
                    toast("No se encontraron pedidos confirmados o exportados para este rango.", { icon: "ℹ️" });
                }
            } else {
                toast.error("Error al cargar pedidos");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const wizardData = {
        pedidos_seleccionados: orders
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <h1 className="text-2xl font-bold text-black dark:text-white mb-6">
                Simulador de Packing List
            </h1>

            <div className="bg-white dark:bg-boxdark rounded-sm border border-stroke dark:border-strokedark p-6 mb-8">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Rango de Fechas
                        </label>
                        <Flatpickr
                            value={dates}
                            onChange={(selectedDates) => setDates(selectedDates)}
                            options={{
                                mode: "range",
                                locale: Spanish,
                                dateFormat: "Y-m-d",
                            }}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                    </div>
                    <button
                        onClick={handleSimulate}
                        disabled={loading || !dates || dates.length === 0}
                        className="rounded bg-primary px-8 py-3 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {loading ? "Cargando..." : "Generar Packing List"}
                    </button>
                </div>
            </div>

            {searched && orders.length > 0 && (
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <StepPackingList
                        data={wizardData}
                        updateData={() => { }}
                        hideNavigation={true}
                    />
                </div>
            )}

            {searched && orders.length === 0 && !loading && (
                <div className="text-center p-10 bg-gray-50 dark:bg-meta-4 rounded border border-dashed border-gray-300">
                    <p className="text-gray-500">No hay datos para mostrar en la fecha seleccionada.</p>
                </div>
            )}
        </div>
    );
}
