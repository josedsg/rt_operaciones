"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { getOrdersForExport } from "@/actions/exportaciones";
import Link from "next/link";

// Extend dayjs
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

export default function ExportDashboardPage() {
    const [year, setYear] = useState(dayjs().year());
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [weekData, setWeekData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Generate weeks for the year
    const weeks = [];
    let cleanYear = dayjs().year(year).startOf('year');
    // Simple 52/53 weeks loop
    // Better: iterate by adding 7 days until year changes
    // Or just 1..52/53
    const totalWeeks = dayjs(`${year}-12-31`).isoWeek() === 1 ? 52 : dayjs(`${year}-12-31`).isoWeek();
    // ISO week calculation at end of year can be tricky (week 1 of next year).
    // Let's use a simpler loop: start from Jan 1st, add weeks.

    // We will generate a list of week objects: { number, start, end }
    const generateWeeks = (y: number) => {
        const weeksArr = [];
        let current = dayjs().year(y).startOf('year');

        // Adjust to start of the first ISO week?
        // Or just taking Jan 1 as start of week 1? 
        // "Semanal del año" usually implies standard business weeks.
        // Let's use ISO weeks.

        // Find total ISO weeks
        // max weeks is 52 or 53.
        const maxWeeks = dayjs(`${y}-12-28`).isoWeek();

        for (let i = 1; i <= maxWeeks; i++) {
            // Get start and end of ISO week i
            const start = dayjs().year(y).isoWeek(i).startOf('isoWeek');
            const end = dayjs().year(y).isoWeek(i).endOf('isoWeek');
            weeksArr.push({
                number: i,
                start: start,
                end: end,
                label: `Semana ${i}`,
                range: `${start.format("DD MMM")} - ${end.format("DD MMM")}`
            });
        }
        return weeksArr;
    };

    const weekList = generateWeeks(year);

    const handleWeekClick = async (week: any) => {
        setSelectedWeek(week.number);
        setLoading(true);
        setWeekData(null);
        try {
            const res = await getOrdersForExport(week.start.toISOString(), week.end.toISOString(), false); // Include exported
            if (res.success && res.data) {
                setWeekData(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                    Dashboard de Exportaciones
                </h2>
                <div className="flex items-center gap-4">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="rounded border border-stroke bg-white py-2 px-4 dark:border-strokedark dark:bg-meta-4"
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Calendar Grid - Takes up 2 cols */}
                <div className="lg:col-span-2 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-4 py-4 dark:border-strokedark sm:px-6">
                        <h3 className="font-medium text-black dark:text-white">Calendario Semanal {year}</h3>
                    </div>
                    <div className="p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {weekList.map((w) => (
                            <div
                                key={w.number}
                                onClick={() => handleWeekClick(w)}
                                className={`
                                    cursor-pointer rounded border p-2 text-center text-xs transition hover:shadow-md
                                    ${selectedWeek === w.number
                                        ? "border-primary bg-primary text-white"
                                        : "border-stroke bg-gray hover:bg-primary/10 dark:border-strokedark dark:bg-meta-4 dark:text-white"
                                    }
                                `}
                            >
                                <div className="font-bold">W{w.number}</div>
                                <div className="mt-1 text-[10px] opacity-80">{w.start.format("DD/MM")}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary Panel - Takes up 1 col */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-4 py-4 dark:border-strokedark sm:px-6">
                        <h3 className="font-medium text-black dark:text-white">Resumen Semanal</h3>
                        {selectedWeek && <p className="text-sm text-gray-500">Semana {selectedWeek}</p>}
                    </div>

                    <div className="p-4">
                        {!selectedWeek && (
                            <div className="text-center py-10 text-gray-400">
                                Selecciona una semana para ver el detalle.
                            </div>
                        )}

                        {loading && (
                            <div className="flex justify-center py-10">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                            </div>
                        )}

                        {selectedWeek && !loading && weekData && (
                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded bg-gray-50 p-3 dark:bg-meta-4 text-center">
                                        <span className="block text-sm text-gray-500">Pedidos</span>
                                        <span className="text-xl font-bold text-black dark:text-white">{weekData.summary.total_pedidos}</span>
                                    </div>
                                    <div className="rounded bg-gray-50 p-3 dark:bg-meta-4 text-center">
                                        <span className="block text-sm text-gray-500">Cajas Totales</span>
                                        <span className="text-xl font-bold text-success">{weekData.summary.total_cajas}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-3 text-sm font-semibold text-black dark:text-white">Desglose por Cliente</h4>
                                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto mb-4">
                                        {weekData.clients.length === 0 && <p className="text-sm text-gray-400">Sin datos.</p>}
                                        {weekData.clients.map((c: any) => (
                                            <div key={c.id} className="flex justify-between items-center border-b border-stroke py-2 dark:border-strokedark">
                                                <span className="text-sm text-black dark:text-white truncate w-2/3" title={c.nombre_comercial}>{c.nombre_comercial || c.nombre}</span>
                                                <span className="text-sm font-medium">{c.total_cajas} Cajas</span>
                                            </div>
                                        ))}
                                    </div>

                                    <h4 className="mb-3 text-sm font-semibold text-black dark:text-white border-t border-stroke pt-4 dark:border-strokedark">Desglose por Producto</h4>
                                    <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                                        {(!weekData.products || weekData.products.length === 0) && <p className="text-sm text-gray-400">Sin datos.</p>}
                                        {weekData.products?.map((p: any) => (
                                            <div key={p.id} className="flex justify-between items-start border-b border-stroke py-2 dark:border-strokedark">
                                                <div className="flex flex-col w-2/3">
                                                    <span className="text-sm font-medium text-black dark:text-white truncate" title={p.nombre}>{p.nombre}</span>
                                                    <span className="text-xs text-gray-500">{p.variante} - {p.empaque}</span>
                                                </div>
                                                <span className="text-sm font-bold text-primary">{p.total_cajas} Cajas</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Link
                                    href="/exportaciones/packing-list"
                                    className="mt-4 flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
                                >
                                    Ir al Simulador
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
