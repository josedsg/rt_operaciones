"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { getVentasStatsAction } from "@/actions/ventas";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

interface ChartState {
    series: {
        name: string;
        data: number[];
    }[];
}

export function VentasStats() {
    const [stats, setStats] = useState<{ moneda: string; estado: string; total: number; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getVentasStatsAction().then(data => {
            setStats(data);
            setLoading(false);
        });
    }, []);

    const getChartData = (currency: string) => {
        const currencyStats = stats.filter(s => (s.moneda || 'USD') === currency);

        // Group by Status
        // Categories: BORRADOR, CONFIRMADO, ENVIADO, FACTURADO
        const categories = ["BORRADOR", "CONFIRMADO", "ENVIADO", "FACTURADO"];

        // Series: Total Amount
        const data = categories.map(cat => {
            const found = currencyStats.find(s => s.estado === cat);
            return found ? found.total : 0;
        });

        return {
            series: [{ name: "Total", data }],
            categories
        };
    };

    const chartOptions: ApexOptions = {
        chart: {
            type: "bar",
            height: 350,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "55%",
                borderRadius: 2
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ["transparent"] },
        xaxis: {
            categories: ["BORRADOR", "CONFIRMADO", "ENVIADO", "FACTURADO"],
        },
        yaxis: {
            title: { text: "Monto" }
        },
        fill: { opacity: 1 },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val.toLocaleString('en-US', { minimumFractionDigits: 2 });
                }
            }
        },
        colors: ["#3C50E0"],
    };

    if (loading) return <div>Cargando estadísticas...</div>;

    const usdData = getChartData("USD");
    const crcData = getChartData("CRC");

    return (
        <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Chart USD */}
            <div className="rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
                <div className="mb-4 justify-between gap-4 sm:flex">
                    <div>
                        <h4 className="text-xl font-semibold text-black dark:text-white">Ventas USD ($)</h4>
                    </div>
                </div>
                <div>
                    <div id="chartOne" className="-ml-5">
                        <ReactApexChart
                            options={{
                                ...chartOptions,
                                yaxis: { title: { text: "Monto ($)" } },
                                tooltip: { y: { formatter: (val) => `$ ${val.toLocaleString()}` } }
                            }}
                            series={usdData.series}
                            type="bar"
                            height={350}
                        />
                    </div>
                </div>
            </div>

            {/* Chart CRC */}
            <div className="rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
                <div className="mb-4 justify-between gap-4 sm:flex">
                    <div>
                        <h4 className="text-xl font-semibold text-black dark:text-white">Ventas CRC (₡)</h4>
                    </div>
                </div>
                <div>
                    <div id="chartTwo" className="-ml-5">
                        <ReactApexChart
                            options={{
                                ...chartOptions,
                                colors: ["#10B981"],
                                yaxis: { title: { text: "Monto (₡)" } },
                                tooltip: { y: { formatter: (val) => `₡ ${val.toLocaleString()}` } }
                            }}
                            series={crcData.series}
                            type="bar"
                            height={350}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
