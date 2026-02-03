import React from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PackingListDetailProps {
    lines: any[];
    summary: any[];
}

export function PackingListDetail({ lines, summary }: PackingListDetailProps) {

    const handleExportExcel = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `PackingList_Detalle_${dateStr}_${timeStr}.xlsx`;

        const wb = XLSX.utils.book_new();

        // 1. Detail Sheet
        const wsDataDetail = [
            ["Pedido", "PO", "Proveedor", "Cliente", "Familia", "Producto", "Variante", "Tamaño", "Cajas", "Tallos/Ramo", "Ramos/Caja", "Total Tallos", "Terminal", "Agencia", "AWD", "Precio Prov.", "Precio Unit.", "Importe"]
        ];

        lines.forEach(line => {
            wsDataDetail.push([
                line.order_code || line.pedido_codigo || 'PV-???',
                line.po || line.order_po,
                line.proveedor?.nombre || '-',
                line.client_name,
                line.familia?.nombre_cientifico || '-',
                line.producto?.nombre,
                line.variante?.nombre,
                line.tamano?.nombre,
                line.cajas,
                line.stems_per_box,
                line.bunches_per_box,
                line.total_stems,
                line.terminal,
                line.agencia,
                line.awd,
                line.precio_proveedor,
                line.precio_unitario,
                line.net_amount
            ]);
        });

        const wsDetail = XLSX.utils.aoa_to_sheet(wsDataDetail);
        XLSX.utils.book_append_sheet(wb, wsDetail, "Detalle");

        // 2. Summary Sheet
        const wsDataSummary = [
            ["Cliente", "Producto", "Empaque", "Total Cajas"]
        ];
        summary.forEach(row => {
            wsDataSummary.push([
                row.client,
                row.product,
                row.empaque,
                row.boxes
            ]);
        });

        const wsSummary = XLSX.utils.aoa_to_sheet(wsDataSummary);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen Cajas");

        XLSX.writeFile(wb, filename);
    };

    const handleExportPDF = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `PackingList_Detalle_${dateStr}_${timeStr}.pdf`;

        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

        doc.text("Packing List - Detalle", 14, 15);

        const head = [["Pedido", "PO", "Prov.", "Cliente", "Prod.", "Var.", "Tam.", "Cajas", "Term.", "Agencia"]];
        const body = lines.map(line => [
            line.order_code,
            line.po,
            (line.proveedor?.nombre || '').substring(0, 10),
            (line.client_name || '').substring(0, 15),
            (line.producto?.nombre || '').substring(0, 15),
            (line.variante?.nombre || '').substring(0, 10),
            line.tamano?.nombre,
            line.cajas,
            line.terminal,
            line.agencia
        ]);

        autoTable(doc, {
            startY: 20,
            head: head,
            body: body,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [66, 66, 66] },
        });

        // Summary on new page
        doc.addPage();
        doc.text("Resumen por Cajas", 14, 15);

        const headSum = [["Cliente", "Producto", "Empaque", "Total Cajas"]];
        const bodySum = summary.map(row => [row.client, row.product, row.empaque, row.boxes]);

        autoTable(doc, {
            startY: 20,
            head: headSum,
            body: bodySum,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] },
        });

        doc.save(filename);
    };

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-black dark:text-white">
                    Detalle de Pedidos
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

            <div className="max-w-full overflow-x-auto rounded border border-stroke dark:border-strokedark mb-8">
                <table className="w-full table-auto text-xs">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Pedido</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">PO</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Proveedor</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Cliente</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Familia</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Producto</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Variante</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Tamaño</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Cajas</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Tallos/Ramo</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Ramos/Caja</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Total Tallos</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Terminal</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Agencia</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">AWD</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white whitespace-nowrap">Precio Prov.</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white whitespace-nowrap">Precio Unit.</th>
                            <th className="py-2 px-2 font-medium text-black dark:text-white">Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line: any, idx: number) => (
                            <tr key={idx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4">
                                <td className="py-2 px-2 font-bold text-black border-r border-gray-200 dark:border-strokedark">
                                    {line.order_code || line.pedido_codigo || 'PV-???'}
                                </td>
                                <td className="py-2 px-2">{line.po || line.order_po}</td>
                                <td className="py-2 px-2">{line.proveedor?.nombre || '-'}</td>
                                <td className="py-2 px-2">{line.client_name}</td>
                                <td className="py-2 px-2">{line.familia?.nombre_cientifico || '-'}</td>
                                <td className="py-2 px-2 font-semibold">{line.producto?.nombre}</td>
                                <td className="py-2 px-2">{line.variante?.nombre}</td>
                                <td className="py-2 px-2">{line.tamano?.nombre}</td>
                                <td className="py-2 px-2 font-bold">{line.cajas}</td>
                                <td className="py-2 px-2">{line.stems_per_box}</td>
                                <td className="py-2 px-2">{line.bunches_per_box}</td>
                                <td className="py-2 px-2">{line.total_stems}</td>
                                <td className="py-2 px-2">{line.terminal}</td>
                                <td className="py-2 px-2">{line.agencia}</td>
                                <td className="py-2 px-2">{line.awd}</td>
                                <td className="py-2 px-2 text-right">${line.precio_proveedor?.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right">${line.precio_unitario?.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right">${line.net_amount?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h3 className="mb-4 font-medium text-black dark:text-white">
                Resumen por Cajas (Cliente / Producto / Empaque)
            </h3>
            <div className="max-w-2xl overflow-x-auto rounded border border-stroke dark:border-strokedark">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Cliente</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Producto</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Empaque</th>
                            <th className="py-2 px-4 font-medium text-black dark:text-white">Total Cajas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary.map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-stroke dark:border-strokedark">
                                <td className="py-2 px-4">{row.client}</td>
                                <td className="py-2 px-4">{row.product}</td>
                                <td className="py-2 px-4">{row.empaque}</td>
                                <td className="py-2 px-4 font-bold">{row.boxes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
