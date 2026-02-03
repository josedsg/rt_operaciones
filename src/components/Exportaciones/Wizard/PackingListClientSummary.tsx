import React, { useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PackingListClientSummaryProps {
    lines: any[];
}

export function PackingListClientSummary({ lines }: PackingListClientSummaryProps) {
    const clientData = useMemo(() => {
        // Group by Client -> Product Key -> Data
        const grouped: Record<string, Record<string, any>> = {};
        const clientTotals: Record<string, number> = {};

        lines.forEach(line => {
            const clientName = line.client_name || "Sin Cliente";
            const productBase = line.producto?.nombre || "N/A";
            const empaque = line.empaque?.nombre || "Sin Empaque";
            const product = `${productBase} - ${empaque}`; // Concat Empaque
            const variant = line.variante?.nombre || "-";
            const size = line.tamano?.nombre || "-";
            const boxes = line.cajas || 0;
            const configs = line.configuraciones_assorted || [];

            const key = `${product}###${variant}###${size}`;

            if (!grouped[clientName]) grouped[clientName] = {};

            if (!grouped[clientName][key]) {
                grouped[clientName][key] = {
                    product,
                    variant,
                    size,
                    boxes: 0,
                    configs: [] // Store configurations
                };
            }

            grouped[clientName][key].boxes += boxes;
            if (configs.length > 0) {
                grouped[clientName][key].configs.push(configs);
            }

            clientTotals[clientName] = (clientTotals[clientName] || 0) + boxes;
        });

        // Deduplicate and Format Configs
        Object.keys(grouped).forEach(client => {
            Object.keys(grouped[client]).forEach(key => {
                const item = grouped[client][key];
                if (item.configs.length > 0) {
                    // Flatten and just keep unique string representations to avoid clutter
                    // Or keep them as arrays if we want to show distribution.
                    // Let's assume for projection we want to see what is inside.
                    // If multiple boxes have same config, we just show it once?
                    // Or 5 boxes with config A, 3 with config B.
                    // For now, let's just list unique configurations found in this group.
                    const uniqueConfigs = new Set<string>();
                    item.configs.forEach((cfg: any[]) => {
                        const summary = cfg.map((c: any) =>
                            `${c.cantidad}x ${c.variante?.nombre || c.variante_nombre || '?'}`
                        ).join(" + ");
                        uniqueConfigs.add(summary);
                    });
                    item.configDisplay = Array.from(uniqueConfigs);
                }
            });
        });

        return { grouped, clientTotals };
    }, [lines]);

    const sortedClients = Object.keys(clientData.grouped).sort();

    const handleExportExcel = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `Resumen_Clientes_${dateStr}_${timeStr}.xlsx`;

        const wb = XLSX.utils.book_new();
        const wsData: any[] = [];

        sortedClients.forEach(client => {
            wsData.push([client.toUpperCase()]);
            wsData.push(["Producto", "Variante", "Tamaño", "Cajas", "Detalle Surtido"]);

            const products = clientData.grouped[client];
            const sortedKeys = Object.keys(products).sort();

            sortedKeys.forEach(key => {
                const item = products[key];
                const configStr = item.configDisplay ? item.configDisplay.join("; ") : "";
                wsData.push([item.product, item.variant, item.size, item.boxes, configStr]);
            });
            wsData.push(["Total general", "", "", "", clientData.clientTotals[client]]);
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Resumen Clientes");
        XLSX.writeFile(wb, filename);
    };

    const handleExportPDF = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `Resumen_Clientes_${dateStr}_${timeStr}.pdf`;

        const doc = new jsPDF();

        doc.text("Resumen por Clientes", 14, 15);
        let finalY = 20;

        sortedClients.forEach(client => {
            const products = clientData.grouped[client];
            const sortedKeys = Object.keys(products).sort();

            const body = sortedKeys.map(key => {
                const item = products[key];
                let productText = item.product;
                if (item.configDisplay && item.configDisplay.length > 0) {
                    productText += "\n" + item.configDisplay.map((c: string) => `• ${c}`).join("\n");
                }
                return [productText, item.variant, item.size, item.boxes];
            });

            body.push([{ content: "Total general", colSpan: 3, styles: { fontStyle: 'bold' } }, clientData.clientTotals[client]]);

            if (finalY > 250) {
                doc.addPage();
                finalY = 20;
            }

            doc.setFontSize(10);
            doc.text(client, 14, finalY);

            autoTable(doc, {
                startY: finalY + 2,
                head: [["Producto (y Surtido)", "Var.", "Tam.", "Cajas"]],
                body: body,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 66, 66] },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 20, halign: 'right' }
                }
            });

            const lastTable = (doc as any).lastAutoTable;
            finalY = lastTable ? lastTable.finalY + 10 : finalY + 30;
        });

        doc.save(filename);
    };

    return (
        <div className="mt-4 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-black dark:text-white">
                    Resumen por Clientes (Proyección)
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {sortedClients.map(client => {
                    const products = clientData.grouped[client];
                    const sortedKeys = Object.keys(products).sort();
                    const total = clientData.clientTotals[client];

                    return (
                        <div key={client} className="border border-stroke dark:border-strokedark rounded-sm overflow-hidden shadow-sm">
                            <div className="bg-primary py-2 px-4 text-center font-bold text-white text-lg uppercase tracking-wide">
                                {client}
                            </div>
                            <table className="w-full text-base">
                                <thead>
                                    <tr className="border-b border-stroke dark:border-strokedark bg-gray-100 dark:bg-slate-700">
                                        <th className="py-2 px-3 text-left font-semibold text-black dark:text-white">Producto</th>
                                        <th className="py-2 px-3 text-left font-semibold text-black dark:text-white w-24">Variante</th>
                                        <th className="py-2 px-3 text-left font-semibold text-black dark:text-white w-20">Tam.</th>
                                        <th className="py-2 px-3 text-right font-bold text-black dark:text-white w-20">Cajas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedKeys.map(key => {
                                        const item = products[key];
                                        return (
                                            <tr key={key} className="border-b border-stroke dark:border-strokedark last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800">
                                                <td className="py-2 px-3 text-black dark:text-white">
                                                    <div className="font-semibold">{item.product}</div>
                                                    {item.configDisplay && item.configDisplay.length > 0 && (
                                                        <div className="mt-1 pl-2 text-sm text-gray-600 dark:text-gray-400 border-l-2 border-gray-300 dark:border-gray-600">
                                                            {item.configDisplay.map((cfg: string, idx: number) => (
                                                                <div key={idx} className="italic">• {cfg}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2 px-3 text-black dark:text-white">{item.variant}</td>
                                                <td className="py-2 px-3 text-black dark:text-white">{item.size}</td>
                                                <td className="py-2 px-3 text-right text-black dark:text-white font-bold text-lg">{item.boxes}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-yellow-50 dark:bg-yellow-900/20 font-bold border-t-2 border-primary">
                                        <td className="py-3 px-3 text-black dark:text-white text-lg text-right" colSpan={3}>TOTAL GENERAL</td>
                                        <td className="py-3 px-3 text-right text-primary dark:text-white text-xl">{total}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
