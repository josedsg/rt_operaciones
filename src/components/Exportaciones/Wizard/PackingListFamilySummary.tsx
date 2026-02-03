import React, { useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PackingListFamilySummaryProps {
    lines: any[];
}

export function PackingListFamilySummary({ lines }: PackingListFamilySummaryProps) {
    const familyData = useMemo(() => {
        // Hierarchy: Family -> ProductKey -> { details, clients: { client: boxes } }
        const grouped: Record<string, Record<string, any>> = {};
        const familyTotals: Record<string, number> = {};

        lines.forEach(line => {
            const familyName = line.familia?.nombre_cientifico || "Sin Familia";
            const clientName = line.client_name || "Sin Cliente";
            const productBase = line.producto?.nombre || "N/A";
            const empaque = line.empaque?.nombre || "Sin Empaque";
            const product = `${productBase} - ${empaque}`;
            const variant = line.variante?.nombre || "-";
            const size = line.tamano?.nombre || "-";
            const boxes = line.cajas || 0;
            const configs = line.configuraciones_assorted || [];

            const productKey = `${product}###${variant}###${size}`;

            if (!grouped[familyName]) grouped[familyName] = {};
            if (!grouped[familyName][productKey]) {
                grouped[familyName][productKey] = {
                    product,
                    variant,
                    size,
                    clients: {},
                    configs: [],
                    totalBoxes: 0
                };
            }

            const prodEntry = grouped[familyName][productKey];
            prodEntry.clients[clientName] = (prodEntry.clients[clientName] || 0) + boxes;
            prodEntry.totalBoxes += boxes;

            if (configs.length > 0) {
                prodEntry.configs.push(configs);
            }

            familyTotals[familyName] = (familyTotals[familyName] || 0) + boxes;
        });

        // Process Assorted Configs per Product
        Object.values(grouped).forEach(familyGroup => {
            Object.values(familyGroup).forEach((prodEntry: any) => {
                if (prodEntry.configs.length > 0) {
                    const uniqueConfigs = new Set<string>();
                    prodEntry.configs.forEach((cfg: any[]) => {
                        const summary = cfg.map((c: any) =>
                            `${c.cantidad}x ${c.variante?.nombre || c.variante_nombre || '?'}`
                        ).join(" + ");
                        uniqueConfigs.add(summary);
                    });
                    prodEntry.configDisplay = Array.from(uniqueConfigs);
                }
            });
        });

        return { grouped, familyTotals };
    }, [lines]);

    const sortedFamilies = Object.keys(familyData.grouped).sort();

    const handleExportExcel = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `Resumen_Familias_${dateStr}_${timeStr}.xlsx`;

        const wb = XLSX.utils.book_new();
        const wsData: any[] = [];

        sortedFamilies.forEach(family => {
            wsData.push([family.toUpperCase(), "", ""]);

            const products = familyData.grouped[family];
            const sortedProductKeys = Object.keys(products).sort();

            sortedProductKeys.forEach(pKey => {
                const prod = products[pKey];
                let prodHeader = `${prod.product} | ${prod.variant} | ${prod.size}`;
                if (prod.configDisplay) {
                    prodHeader += ` (${prod.configDisplay.join("; ")})`;
                }

                wsData.push(["", prodHeader, ""]);
                wsData.push(["", "Cliente", "Cajas"]);

                const sortedClients = Object.keys(prod.clients).sort();
                sortedClients.forEach(client => {
                    wsData.push(["", client, prod.clients[client]]);
                });
                wsData.push(["", "Total Producto", prod.totalBoxes]);
                wsData.push([]);
            });

            wsData.push(["Total Familia " + family, "", familyData.familyTotals[family]]);
            wsData.push([]);
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Resumen Familias");
        XLSX.writeFile(wb, filename);
    };

    const handleExportPDF = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `Resumen_Familias_${dateStr}_${timeStr}.pdf`;

        const doc = new jsPDF();

        doc.text("Resumen Detallado por Familias", 14, 15);
        let finalY = 20;

        sortedFamilies.forEach(family => {
            const products = familyData.grouped[family];
            const sortedProductKeys = Object.keys(products).sort();

            // Family Header
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text(family.toUpperCase(), 14, finalY + 5);
            finalY += 10;

            sortedProductKeys.forEach(pKey => {
                const prod = products[pKey];

                // Product Header
                let prodTitle = `${prod.product} - ${prod.variant} - ${prod.size}`;
                if (prod.configDisplay && prod.configDisplay.length > 0) {
                    prodTitle += `\n[ ${prod.configDisplay.join(" | ")} ]`;
                }

                // Check page break for header
                if (finalY > 260) {
                    doc.addPage();
                    finalY = 20;
                }

                doc.setFontSize(11);
                doc.setTextColor(50, 50, 50);
                // Split text if multiline
                const splitTitle = doc.splitTextToSize(prodTitle, 180);
                doc.text(splitTitle, 14, finalY);
                finalY += (splitTitle.length * 5) + 2;

                // Client Table
                const sortedClients = Object.keys(prod.clients).sort();
                const body = sortedClients.map(client => [client, prod.clients[client]]);
                body.push([{ content: "Total Producto", styles: { fontStyle: 'bold' } }, prod.totalBoxes]);

                autoTable(doc, {
                    startY: finalY,
                    head: [["Cliente", "Cajas"]],
                    body: body,
                    theme: 'grid',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [100, 100, 100], textColor: 255 },
                    columnStyles: {
                        0: { cellWidth: 100 },
                        1: { cellWidth: 30, halign: 'right' }
                    },
                    margin: { left: 14 }
                });

                const lastTable = (doc as any).lastAutoTable;
                finalY = lastTable ? lastTable.finalY + 10 : finalY + 20;
            });

            // Family Total
            if (finalY > 260) {
                doc.addPage();
                finalY = 20;
            }
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total ${family}: ${familyData.familyTotals[family]}`, 14, finalY);
            finalY += 15;

            // Separator
            doc.setDrawColor(200, 200, 200);
            doc.line(14, finalY - 5, 200, finalY - 5);
            finalY += 5;
        });

        doc.save(filename);
    };

    return (
        <div className="mt-4 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-black dark:text-white">
                    Resumen por Familias (Detallado)
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

            <div className="flex flex-col gap-8">
                {sortedFamilies.map(family => {
                    const products = familyData.grouped[family];
                    const sortedProductKeys = Object.keys(products).sort();
                    const totalFamily = familyData.familyTotals[family];

                    return (
                        <div key={family} className="border border-stroke dark:border-strokedark rounded-sm overflow-hidden shadow">
                            <div className="bg-primary/90 py-3 px-5 text-white">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-lg font-bold uppercase tracking-wide">{family}</h4>
                                    <span className="bg-white/20 px-3 py-1 rounded text-sm font-bold">Total: {totalFamily}</span>
                                </div>
                            </div>

                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 dark:bg-meta-4/20">
                                {sortedProductKeys.map(pKey => {
                                    const prod = products[pKey];
                                    const sortedClients = Object.keys(prod.clients).sort();

                                    return (
                                        <div key={pKey} className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded shadow-sm">
                                            <div className="p-3 border-b border-stroke dark:border-strokedark bg-gray-100 dark:bg-meta-4">
                                                <div className="font-bold text-black dark:text-white text-md">{prod.product}</div>
                                                <div className="flex justify-between text-xs mt-1 text-gray-600 dark:text-gray-400">
                                                    <span>{prod.variant}</span>
                                                    <span>{prod.size}</span>
                                                </div>
                                                {prod.configDisplay && prod.configDisplay.length > 0 && (
                                                    <div className="mt-2 text-xs text-primary dark:text-primary-light border-l-2 border-primary pl-2 italic">
                                                        {prod.configDisplay.map((cfg: string, idx: number) => (
                                                            <div key={idx}>• {cfg}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-stroke dark:border-strokedark">
                                                        <th className="py-1 px-3 text-left font-medium text-gray-500">Cliente</th>
                                                        <th className="py-1 px-3 text-right font-medium text-gray-500">Cajas</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortedClients.map(client => (
                                                        <tr key={client} className="border-b border-stroke dark:border-strokedark last:border-0">
                                                            <td className="py-1 px-3 text-black dark:text-white">{client}</td>
                                                            <td className="py-1 px-3 text-right font-bold text-black dark:text-white">{prod.clients[client]}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-gray-50 dark:bg-meta-4/50 font-bold text-black dark:text-white">
                                                        <td className="py-2 px-3 text-right">Total</td>
                                                        <td className="py-2 px-3 text-right">{prod.totalBoxes}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
