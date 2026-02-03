import React, { useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PackingListMatrixProps {
    lines: any[];
}

export function PackingListMatrix({ lines }: PackingListMatrixProps) {
    const matrixData = useMemo(() => {
        // 1. Get unique providers for columns
        const providers = new Set<string>();
        lines.forEach(line => {
            const providerName = line.proveedor?.nombre || "Sin Proveedor";
            providers.add(providerName);
        });
        const sortedProviders = Array.from(providers).sort();

        // 2. Group by Terminal -> Agency -> Client
        // Structure: { terminal: { agency: { client: { provider: boxes } } } }
        const hierarchy: Record<string, Record<string, Record<string, Record<string, number>>>> = {};

        // Track totals
        const grandTotalByProvider: Record<string, number> = {};
        let grandTotalAll = 0;

        lines.forEach(line => {
            const terminal = line.terminal || "Sin Terminal";
            const agency = line.agencia || "Sin Agencia";
            const client = line.client_name || "Sin Cliente";
            const provider = line.proveedor?.nombre || "Sin Proveedor";
            const boxes = line.cajas || 0;

            if (!hierarchy[terminal]) hierarchy[terminal] = {};
            if (!hierarchy[terminal][agency]) hierarchy[terminal][agency] = {};
            if (!hierarchy[terminal][agency][client]) hierarchy[terminal][agency][client] = {};

            const clientData = hierarchy[terminal][agency][client];
            clientData[provider] = (clientData[provider] || 0) + boxes;

            // Totals
            grandTotalByProvider[provider] = (grandTotalByProvider[provider] || 0) + boxes;
            grandTotalAll += boxes;
        });

        // Convert to logic for rendering
        // We want a flattened list of rows for easier rendering, or recursive
        // Let's pre-calculate row totals for sorting or display

        return {
            sortedProviders,
            hierarchy,
            grandTotalByProvider,
            grandTotalAll
        };
    }, [lines]);

    const { sortedProviders, hierarchy, grandTotalByProvider, grandTotalAll } = matrixData;

    // Helper to calculate total for a client row across all providers
    const getClientTotal = (providerCounts: Record<string, number>) => {
        return Object.values(providerCounts).reduce((sum, val) => sum + val, 0);
    };

    const handleExportExcel = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `Informe_Carga_${dateStr}_${timeStr}.xlsx`;

        const wb = XLSX.utils.book_new();
        const wsData: any[] = [];

        // Headers
        wsData.push(["Etiquetas de fila", ...sortedProviders, "Total general"]);

        // Data Rows
        Object.entries(hierarchy).sort().forEach(([terminal, agencies]) => {
            wsData.push([terminal]); // Terminal Header
            Object.entries(agencies).sort().forEach(([agency, clients]) => {
                wsData.push([`  ${agency}`]); // Agency Header
                Object.entries(clients).sort().forEach(([client, counts]) => {
                    const row: any[] = [`    ${client}`];
                    sortedProviders.forEach(provider => {
                        row.push(counts[provider] || "");
                    });
                    row.push(getClientTotal(counts));
                    wsData.push(row);
                });
            });
        });

        // Totals
        const totalRow: any[] = ["Total general"];
        sortedProviders.forEach(provider => {
            totalRow.push(grandTotalByProvider[provider] || 0);
        });
        totalRow.push(grandTotalAll);
        wsData.push(totalRow);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Informe Matriz");
        XLSX.writeFile(wb, filename);
    };

    const handleExportPDF = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `Informe_Carga_${dateStr}_${timeStr}.pdf`;

        const doc = new jsPDF('l', 'mm', 'a4'); // landscape

        doc.text("Informe de Carga (Matriz)", 14, 15);

        const head = [["Etiquetas de fila", ...sortedProviders, "Total general"]];
        const body: any[] = [];

        Object.entries(hierarchy).sort().forEach(([terminal, agencies]) => {
            body.push([{ content: terminal, colSpan: sortedProviders.length + 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
            Object.entries(agencies).sort().forEach(([agency, clients]) => {
                body.push([{ content: agency, colSpan: sortedProviders.length + 2, styles: { fontStyle: 'bold', halign: 'left', cellPadding: { left: 8 } } }]);
                Object.entries(clients).sort().forEach(([client, counts]) => {
                    const row: any[] = [{ content: client, styles: { cellPadding: { left: 12 } } }];
                    sortedProviders.forEach(provider => {
                        row.push(counts[provider] || "");
                    });
                    row.push(getClientTotal(counts));
                    body.push(row);
                });
            });
        });

        // Totals
        const totalRow: any[] = ["Total general"];
        sortedProviders.forEach(provider => {
            totalRow.push(grandTotalByProvider[provider] || 0);
        });
        totalRow.push(grandTotalAll);
        body.push(totalRow);

        autoTable(doc, {
            startY: 20,
            head: head,
            body: body,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] },
        });

        doc.save(filename);
    };

    return (
        <div className="mt-4 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-black dark:text-white">
                    Informe de Carga (Matriz)
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="rounded bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700"
                    >
                        Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="rounded bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
                    >
                        PDF
                    </button>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white border border-stroke dark:border-strokedark">
                                Etiquetas de fila
                            </th>
                            {sortedProviders.map(provider => (
                                <th key={provider} className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white text-center border border-stroke dark:border-strokedark whitespace-nowrap">
                                    {provider}
                                </th>
                            ))}
                            <th className="min-w-[100px] py-4 px-4 font-bold text-black dark:text-white text-center border border-stroke dark:border-strokedark">
                                Total general
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(hierarchy).sort().map(([terminal, agencies]) => (
                            <React.Fragment key={terminal}>
                                {/* Terminal Header Row (Optional, maybe specific style) */}
                                <tr className="bg-blue-50 dark:bg-slate-700">
                                    <td className="py-2 px-4 font-bold text-black dark:text-white border border-stroke dark:border-strokedark" colSpan={sortedProviders.length + 2}>
                                        {terminal}
                                    </td>
                                </tr>

                                {Object.entries(agencies).sort().map(([agency, clients]) => (
                                    <React.Fragment key={`${terminal}-${agency}`}>
                                        {/* Agency Header Row */}
                                        <tr className="bg-gray-50 dark:bg-slate-800">
                                            <td className="py-2 px-4 pl-8 font-semibold text-black dark:text-white border border-stroke dark:border-strokedark" colSpan={sortedProviders.length + 2}>
                                                {agency}
                                            </td>
                                        </tr>

                                        {/* Client Rows */}
                                        {Object.entries(clients).sort().map(([client, counts]) => (
                                            <tr key={`client-${terminal}-${agency}-${client}`} className="hover:bg-gray-1 dark:hover:bg-meta-4">
                                                <td className="py-2 px-4 pl-12 text-black dark:text-white border border-stroke dark:border-strokedark">
                                                    {client}
                                                </td>
                                                {sortedProviders.map(provider => (
                                                    <td key={provider} className="py-2 px-4 text-center text-black dark:text-white border border-stroke dark:border-strokedark">
                                                        {counts[provider] || ''}
                                                    </td>
                                                ))}
                                                <td className="py-2 px-4 text-center font-bold text-black dark:text-white border border-stroke dark:border-strokedark">
                                                    {getClientTotal(counts)}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}

                        {/* Grand Total Row */}
                        <tr className="bg-yellow-100 dark:bg-yellow-900/30 font-bold">
                            <td className="py-3 px-4 text-black dark:text-white border border-stroke dark:border-strokedark">
                                Total general
                            </td>
                            {sortedProviders.map(provider => (
                                <td key={provider} className="py-3 px-4 text-center text-black dark:text-white border border-stroke dark:border-strokedark">
                                    {grandTotalByProvider[provider] || 0}
                                </td>
                            ))}
                            <td className="py-3 px-4 text-center text-black dark:text-white border border-stroke dark:border-strokedark">
                                {grandTotalAll}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
