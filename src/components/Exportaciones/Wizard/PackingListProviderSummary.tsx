import React, { useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PackingListProviderSummaryProps {
    lines: any[];
}

export function PackingListProviderSummary({ lines }: PackingListProviderSummaryProps) {
    const providerData = useMemo(() => {
        // Hierarchy: Provider -> Terminal -> Agency -> Client -> ProductKey -> Details
        const grouped: Record<string, Record<string, Record<string, Record<string, Record<string, any>>>>> = {};
        const providerTotals: Record<string, number> = {};

        lines.forEach(line => {
            const providerName = line.proveedor?.nombre || "Sin Proveedor";
            const terminal = line.terminal || "Sin Terminal";
            const agencia = line.agencia || "Sin Agencia";
            const clientName = line.client_name || "Sin Cliente";

            const product = line.producto?.nombre || "";
            const variant = line.variante?.nombre || "-";
            const size = line.tamano?.nombre || "-";
            const empaque = line.empaque?.nombre || "";
            const boxes = line.cajas || 0;
            const configs = line.configuraciones_assorted || [];

            // Config String
            let configStr = "";
            if (configs.length > 0) {
                configStr = configs.map((c: any) =>
                    `${c.cantidad}x ${c.variante?.nombre || c.variante_nombre}`
                ).sort().join(" + ");
            }

            // Concatenated Product String
            let productDisplay = `${product}`;
            if (empaque) productDisplay += ` - ${empaque}`;
            if (variant !== "-") productDisplay += ` - ${variant}`;
            if (size !== "-") productDisplay += ` - ${size}`;
            if (configStr) productDisplay += ` [${configStr}]`;

            const productKey = productDisplay; // Use display string as key

            // Initialize Hierarchy
            if (!grouped[providerName]) grouped[providerName] = {};
            if (!grouped[providerName][terminal]) grouped[providerName][terminal] = {};
            if (!grouped[providerName][terminal][agencia]) grouped[providerName][terminal][agencia] = {};
            if (!grouped[providerName][terminal][agencia][clientName]) grouped[providerName][terminal][agencia][clientName] = {};

            const clientGroup = grouped[providerName][terminal][agencia][clientName];

            if (!clientGroup[productKey]) {
                clientGroup[productKey] = {
                    display: productDisplay,
                    boxes: 0
                };
            }
            clientGroup[productKey].boxes += boxes;

            providerTotals[providerName] = (providerTotals[providerName] || 0) + boxes;
        });

        return { grouped, providerTotals };
    }, [lines]);

    const sortedProviders = Object.keys(providerData.grouped).sort();

    const handleExportExcel = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `Resumen_Proveedores_${dateStr}_${timeStr}.xlsx`;

        const wb = XLSX.utils.book_new();
        const wsData: any[] = [];

        sortedProviders.forEach(provider => {
            wsData.push([provider.toUpperCase()]);

            const terminals = providerData.grouped[provider];
            Object.keys(terminals).sort().forEach(term => {
                const agencies = terminals[term];
                Object.keys(agencies).sort().forEach(agency => {
                    wsData.push([`Terminal: ${term} / Agencia: ${agency}`, "", ""]);
                    wsData.push(["Cliente", "Producto (Detalle)", "Cajas"]);

                    const clients = agencies[agency];
                    Object.keys(clients).sort().forEach(client => {
                        const products = clients[client];
                        Object.values(products).forEach((p: any) => {
                            wsData.push([client, p.display, p.boxes]);
                        });
                    });
                    wsData.push([]);
                });
            });

            wsData.push(["Total Proveedor " + provider, "", providerData.providerTotals[provider]]);
            wsData.push([]);
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Resumen Proveedores");
        XLSX.writeFile(wb, filename);
    };

    const handleExportPDF = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `Resumen_Proveedores_${dateStr}_${timeStr}.pdf`;

        const doc = new jsPDF();

        doc.text("Resumen por Proveedores (Logística)", 14, 15);
        let finalY = 20;

        sortedProviders.forEach(provider => {
            // Check page break
            if (finalY > 260) {
                doc.addPage();
                finalY = 20;
            }

            // Provider Header
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text(provider.toUpperCase(), 14, finalY + 5);
            finalY += 10;

            const terminals = providerData.grouped[provider];
            Object.keys(terminals).sort().forEach(term => {
                const agencies = terminals[term];
                Object.keys(agencies).sort().forEach(agency => {

                    // Term/Agency Subheader
                    doc.setFontSize(10);
                    doc.setTextColor(50, 50, 50);
                    doc.text(`${term} - ${agency}`, 14, finalY + 5);
                    finalY += 8;

                    const body: any[] = [];
                    const clients = agencies[agency];

                    Object.keys(clients).sort().forEach(client => {
                        const products = clients[client];
                        Object.values(products).sort((a: any, b: any) => a.display.localeCompare(b.display)).forEach((p: any) => {
                            body.push([client, p.display, p.boxes]);
                        });
                    });

                    autoTable(doc, {
                        startY: finalY,
                        head: [["Cliente", "Producto", "Cajas"]],
                        body: body,
                        theme: 'grid',
                        styles: { fontSize: 8 },
                        headStyles: { fillColor: [80, 80, 80] },
                        columnStyles: {
                            0: { cellWidth: 40 },
                            2: { cellWidth: 20, halign: 'right' }
                        },
                        margin: { left: 14 }
                    });

                    const lastTable = (doc as any).lastAutoTable;
                    finalY = lastTable ? lastTable.finalY + 5 : finalY + 15;

                    if (finalY > 260) {
                        doc.addPage();
                        finalY = 20;
                    }
                });
            });

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total ${provider}: ${providerData.providerTotals[provider]}`, 14, finalY + 5);
            finalY += 15;

            // Separator
            doc.setDrawColor(200);
            doc.line(14, finalY, 200, finalY);
            finalY += 5;
        });

        doc.save(filename);
    };

    return (
        <div className="mt-4 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-black dark:text-white">
                    Resumen por Proveedores
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

            <div className="flex flex-col gap-6">
                {sortedProviders.map(provider => {
                    const terminals = providerData.grouped[provider];
                    const total = providerData.providerTotals[provider];

                    return (
                        <div key={provider} className="border border-stroke dark:border-strokedark rounded-sm overflow-hidden shadow">
                            <div className="bg-primary/90 py-2 px-4 flex justify-between items-center text-white">
                                <h4 className="font-bold uppercase tracking-wide">{provider}</h4>
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold">Total: {total}</span>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-meta-4/20 flex flex-col gap-4">
                                {Object.keys(terminals).sort().map(term => (
                                    <div key={term}>
                                        {Object.keys(terminals[term]).sort().map(agency => (
                                            <div key={agency} className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded mb-4 last:mb-0">
                                                <div className="px-3 py-2 bg-gray-100 dark:bg-meta-4 border-b border-stroke dark:border-strokedark font-semibold text-sm text-black dark:text-white">
                                                    {term}  <span className="text-gray-400 mx-2">|</span>  {agency}
                                                </div>
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-stroke dark:border-strokedark">
                                                            <th className="py-2 px-3 text-left font-medium text-gray-500 w-1/4">Cliente</th>
                                                            <th className="py-2 px-3 text-left font-medium text-gray-500">Producto</th>
                                                            <th className="py-2 px-3 text-right font-medium text-gray-500 w-20">Cajas</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.keys(terminals[term][agency]).sort().map(client => {
                                                            const products = terminals[term][agency][client];
                                                            return Object.values(products).sort((a: any, b: any) => a.display.localeCompare(b.display)).map((p: any, idx, arr) => (
                                                                <tr key={`${client}-${idx}`} className="border-b border-stroke dark:border-strokedark last:border-0">
                                                                    {idx === 0 && (
                                                                        <td rowSpan={arr.length} className="py-2 px-3 border-r border-stroke dark:border-strokedark align-top font-medium text-black dark:text-white bg-gray-50 dark:bg-meta-4/10">
                                                                            {client}
                                                                        </td>
                                                                    )}
                                                                    <td className="py-2 px-3 text-black dark:text-white">{p.display}</td>
                                                                    <td className="py-2 px-3 text-right font-bold text-black dark:text-white">{p.boxes}</td>
                                                                </tr>
                                                            ));
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
