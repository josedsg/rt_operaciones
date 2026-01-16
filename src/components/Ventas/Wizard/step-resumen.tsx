"use client";

import { PedidoVentaInput, uploadInvoiceFilesAction } from "@/actions/ventas";
import { useState } from "react";
import toast from "react-hot-toast";

interface StepResumenProps {
    data: PedidoVentaInput;
    updateData: (data: Partial<PedidoVentaInput>) => void;
}

export function StepResumen({ data, updateData }: StepResumenProps) {
    const [uploading, setUploading] = useState(false);

    // Derived values
    const monedaSimbolo = data.moneda === 'CRC' ? '₡' : '$';

    // Cálculos
    const totalCajas = data.lineas.reduce((acc, l) => acc + (l.cajas || 0), 0);
    const totalCantidad = data.lineas.reduce((acc, l) => acc + (l.cantidad || 0), 0);

    const subtotal = data.lineas.reduce((acc, l) => acc + (l.cantidad * l.precio_unitario), 0);
    const totalImpuestos = data.lineas.reduce((acc, l) => {
        const lineSub = l.cantidad * l.precio_unitario;
        const netTax = Math.max(0, (l.impuesto || 0) - (l.exoneracion || 0));
        return acc + (lineSub * (netTax / 100));
    }, 0);
    const totalGeneral = subtotal + totalImpuestos;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: "pdf" | "xml_envio" | "xml_respuesta") => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append(field, file);

        try {
            const results = await uploadInvoiceFilesAction(formData);
            if (field === "pdf") updateData({ pdf_factura: results.pdf || undefined });
            if (field === "xml_envio") updateData({ xml_envio: results.xml_envio || undefined });
            if (field === "xml_respuesta") updateData({ xml_respuesta: results.xml_respuesta || undefined });
            toast.success("Archivo cargado");
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar archivo");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">

            {/* --- COMMERCIAL INVOICE PREVIEW --- */}
            <div className="bg-white dark:bg-boxdark shadow-lg rounded-sm overflow-hidden border border-stroke dark:border-strokedark print:shadow-none print:border-none">

                {/* Header Logo & Title */}
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            {/* Logo Simulation */}
                            <div className="flex items-center gap-2 mb-2">
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 0L40 34.641H0L20 0Z" fill="#167e35" />
                                </svg>
                                <div className="flex flex-col">
                                    <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight leading-none">
                                        Río <span className="text-[#167e35]">Tapezco</span>
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h2 className="text-2xl font-bold text-[#167e35] uppercase tracking-wide">Comercial Invoice</h2>
                    </div>
                </div>

                {/* Addresses Block (Gray Bg? Or just lines) - Reference image has light boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 text-sm border-t border-b border-stroke dark:border-strokedark">
                    {/* FROM */}
                    <div className="p-6 border-r border-stroke dark:border-strokedark">
                        <h3 className="font-bold text-[#167e35] mb-2 uppercase text-xs tracking-wider">From:</h3>
                        <p className="font-bold text-black dark:text-white">RIO TAPEZCO CORP</p>
                        <p className="text-gray-600 dark:text-gray-300">3785 NW 82 ND Ave</p>
                        <p className="text-gray-600 dark:text-gray-300">Doral, Florida 33166</p>
                        <p className="text-gray-600 dark:text-gray-300">Estados Unidos</p>
                        <div className="mt-2 text-gray-500 text-xs">
                            <p>Phone: +506 2231 4946</p>
                            <p>Email: accounts@riotapezco.com</p>
                        </div>
                    </div>

                    {/* TO (Customer Data) */}
                    <div className="p-6 bg-gray-50 dark:bg-meta-4/20">
                        <h3 className="font-bold text-[#167e35] mb-2 uppercase text-xs tracking-wider">Customer Data:</h3>
                        {data.cliente_id ? (
                            <>
                                <p className="font-bold text-black dark:text-white uppercase">{/* We need client name here, data only has ID in input but form probably has access... actually StepResumen receives PedidoVentaInput. Ideally we'd have the client object. 
                                For now we display 'Cliente #' or pass client name if available. 
                                Wait, PedidoForm had `data` which might only contain ID. 
                                Let's assume for this preview we might need to fetch or passed down. 
                                Checking Component Props... StepResumenProps data: PedidoVentaInput. 
                                We might miss client name here if not populated. 
                                However, user experience: they just selected it. 
                                Let's check if we can get it from an API or if we should just show generic.
                                Re-reading previous step logic: StepEncabezado selects it.
                                We will display "Cliente Ref: {data.cliente_id}" if name missing, 
                                BUT usually we want the name. 
                                The user state in PedidoForm loads full object on Edit.
                                Let's try to simulate or leave placeholder if strict type. Use 'Cliente Seleccionado' */}
                                    CLIENTE ID: {data.cliente_id}
                                </p>
                                <p className="text-gray-600 dark:text-gray-300">Dirección del Cliente...</p>
                                <p className="text-gray-600 dark:text-gray-300">Ciudad, País</p>
                            </>
                        ) : (
                            <p className="text-danger italic">Cliente no seleccionado</p>
                        )}
                        <div className="mt-2 text-gray-500 text-xs">
                            <p>Phone: ...</p>
                            <p>Email: ...</p>
                        </div>
                    </div>
                </div>

                {/* Invoice Meta Grid (Green Headers) */}
                <div className="grid grid-cols-3 text-center border-b border-stroke dark:border-strokedark">
                    <div className="border-r border-stroke dark:border-strokedark">
                        <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1">Invoice</div>
                        <div className="py-2 text-sm font-bold text-danger">{data.numero_factura || "BORRADOR"}</div>
                    </div>
                    <div className="border-r border-stroke dark:border-strokedark">
                        <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1">Date</div>
                        <div className="py-2 text-sm font-medium">
                            {data.fecha_pedido instanceof Date
                                ? data.fecha_pedido.toLocaleDateString()
                                : new Date(data.fecha_pedido || Date.now()).toLocaleDateString()}
                        </div>
                    </div>
                    <div>
                        <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1">AWD</div>
                        <div className="py-2 text-sm font-medium">{data.awd || "—"}</div>
                    </div>
                </div>

                {/* Salesperson & Terms (Green Headers) */}
                <div className="grid grid-cols-3 text-center border-b border-stroke dark:border-strokedark mt-4 mx-4 border-l border-r">
                    <div className="border-r border-stroke dark:border-strokedark">
                        <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1">Salesperson</div>
                        <div className="py-2 text-sm">Melissa Hernandez</div>
                    </div>
                    <div className="border-r border-stroke dark:border-strokedark">
                        <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1">Payment Condition</div>
                        <div className="py-2 text-sm">45 días</div>
                    </div>
                    <div>
                        <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1">Due Date</div>
                        <div className="py-2 text-sm">
                            {/* Dummy calculation: date + 45 */}
                            {(() => {
                                const d = data.fecha_pedido instanceof Date ? new Date(data.fecha_pedido) : new Date(data.fecha_pedido || Date.now());
                                d.setDate(d.getDate() + 45);
                                return d.toLocaleDateString();
                            })()}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="p-4">
                    <table className="w-full border-collapse border border-stroke dark:border-strokedark">
                        <thead>
                            <tr>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-2 border border-stroke dark:border-strokedark text-left">Description</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-1 border border-stroke dark:border-strokedark">PO</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-1 border border-stroke dark:border-strokedark w-16">Box Qty</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-1 border border-stroke dark:border-strokedark w-20">Stem/Box</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-1 border border-stroke dark:border-strokedark w-16">Qty</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-2 border border-stroke dark:border-strokedark text-right">Unit Price</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-2 border border-stroke dark:border-strokedark text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.lineas.map((linea, key) => (
                                <tr key={key}>
                                    <td className="border border-stroke dark:border-strokedark px-2 py-2 text-xs text-black dark:text-white">
                                        <div className="font-bold">{linea.producto_nombre}</div>
                                        <div className="text-[10px] text-gray-500">{linea.variante_nombre} {linea.tamano_nombre} {linea.empaque_nombre}</div>
                                    </td>
                                    <td className="border border-stroke dark:border-strokedark px-1 py-1 text-center text-xs">{linea.po || "—"}</td>
                                    <td className="border border-stroke dark:border-strokedark px-1 py-1 text-center text-xs font-semibold">{linea.cajas}</td>
                                    <td className="border border-stroke dark:border-strokedark px-1 py-1 text-center text-xs">{linea.stems_per_box}</td>
                                    <td className="border border-stroke dark:border-strokedark px-1 py-1 text-center text-xs font-bold">{linea.cantidad}</td>
                                    <td className="border border-stroke dark:border-strokedark px-2 py-1 text-right text-xs">{monedaSimbolo}{linea.precio_unitario.toFixed(3)}</td>
                                    <td className="border border-stroke dark:border-strokedark px-2 py-1 text-right text-xs font-bold">
                                        {monedaSimbolo}{(linea.cantidad * linea.precio_unitario).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {/* Totals Row (Green Bar) */}
                            <tr className="bg-[#167e35] text-white font-bold">
                                <td className="px-2 py-2 text-xs uppercase text-right" colSpan={2}>Totals:</td>
                                <td className="px-1 py-2 text-center text-xs border-l border-white/20">{totalCajas}</td>
                                <td className="px-1 py-2 border-l border-white/20"></td>
                                <td className="px-1 py-2 text-center text-xs border-l border-white/20">{totalCantidad}</td>
                                <td className="px-2 py-2 border-l border-white/20" colSpan={2}></td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Financial Footer */}
                    <div className="flex justify-end mt-0">
                        <div className="w-64 border-l border-r border-b border-stroke dark:border-strokedark">
                            {/* Subtotal */}
                            <div className="flex border-b border-stroke dark:border-strokedark">
                                <div className="w-1/2 bg-[#167e35] text-white text-xs font-bold p-2 text-right uppercase">Subtotal {data.moneda}:</div>
                                <div className="w-1/2 p-2 text-right text-sm font-bold text-black dark:text-white">{monedaSimbolo}{subtotal.toFixed(2)}</div>
                            </div>
                            {/* Taxes */}
                            <div className="flex border-b border-stroke dark:border-strokedark">
                                <div className="w-1/2 bg-[#167e35] text-white text-xs font-bold p-2 text-right uppercase">Taxes {data.moneda}:</div>
                                <div className="w-1/2 p-2 text-right text-sm font-medium text-black dark:text-white">{monedaSimbolo}{totalImpuestos.toFixed(2)}</div>
                            </div>
                            {/* Total */}
                            <div className="flex border-b border-stroke dark:border-strokedark">
                                <div className="w-1/2 bg-[#167e35] text-white text-xs font-bold p-2 text-right uppercase">Total {data.moneda}:</div>
                                <div className="w-1/2 p-2 text-right text-sm font-black text-black dark:text-white">{monedaSimbolo}{totalGeneral.toFixed(2)}</div>
                            </div>
                            {/* Amount Due */}
                            <div className="flex">
                                <div className="w-1/2 bg-[#167e35] text-white text-xs font-bold p-2 text-right uppercase">Amount Due:</div>
                                <div className="w-1/2 p-2 text-right text-sm font-black text-black dark:text-white">{monedaSimbolo}{totalGeneral.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Legal */}
                <div className="p-4 border-t border-stroke dark:border-strokedark text-[10px] text-gray-500 flex justify-between">
                    <div>
                        <p>+506 2231 4946 info@riotapezco.com RIO TAPEZCO CORP</p>
                        <p>http://riotapezco.com/ EIN 33-Miami FL Estados Unidos</p>
                    </div>
                    <div className="bg-[#8ca892] text-white h-6 w-6 flex items-center justify-center font-bold rounded">1</div>
                </div>

            </div>

            {/* --- ELECTRONIC INVOICE MANAGEMENT --- */}
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
                <div className="flex items-center gap-3 mb-6 border-b border-stroke dark:border-strokedark pb-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    </div>
                    <h4 className="text-xl font-bold text-black dark:text-white">Factura Electrónica</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    {/* Status & ID */}
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Número de Factura (Consecutivo)</label>
                            <input
                                type="text"
                                placeholder="Ej. 00100001010000..."
                                className="w-full rounded border border-stroke bg-gray-50 py-3 px-4 dark:bg-meta-4 focus:border-primary outline-none text-sm font-mono"
                                value={data.numero_factura || ""}
                                onChange={(e) => updateData({ numero_factura: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Estado Hacienda</label>
                            <select
                                className={`w-full rounded border border-stroke py-3 px-4 outline-none text-sm font-bold ${data.estado_factura === 'ACEPTADO' ? 'bg-success/10 text-success border-success' :
                                        data.estado_factura === 'RECHAZADO' ? 'bg-danger/10 text-danger border-danger' :
                                            'bg-white dark:bg-boxdark'
                                    }`}
                                value={data.estado_factura || "PENDIENTE"}
                                onChange={(e) => updateData({ estado_factura: e.target.value })}
                            >
                                <option value="PENDIENTE">PENDIENTE DE ENVÍO</option>
                                <option value="ENVIADO">ENVIADO (Procesando)</option>
                                <option value="ACEPTADO">ACEPTADO POR HACIENDA</option>
                                <option value="RECHAZADO">RECHAZADO / ERROR</option>
                            </select>
                        </div>
                    </div>

                    {/* File Uploads */}
                    <div className="space-y-4">
                        <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Archivos XML / PDF</label>

                        {/* PDF Upload */}
                        <div className="flex items-center justify-between p-3 border border-stroke dark:border-strokedark rounded bg-gray-50 dark:bg-meta-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 text-red-600 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                                </div>
                                <div className="text-xs">
                                    <p className="font-bold text-black dark:text-white">PDF Factura</p>
                                    <p className="text-gray-500">{data.pdf_factura ? "Archivo cargado" : "No disponible"}</p>
                                </div>
                            </div>
                            <div>
                                <input type="file" accept=".pdf" className="hidden" id="pdf_file" onChange={(e) => handleFileChange(e, "pdf")} />
                                <label htmlFor="pdf_file" className="cursor-pointer text-xs font-bold text-primary hover:underline">
                                    {data.pdf_factura ? "Reemplazar" : "Subir PDF"}
                                </label>
                            </div>
                        </div>

                        {/* XML Uploads Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 border border-stroke dark:border-strokedark rounded bg-gray-50 dark:bg-meta-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                                        <span className="text-[10px] font-black">XML</span>
                                    </div>
                                    <div className="text-[10px]">
                                        <p className="font-bold text-black dark:text-white">Envío</p>
                                    </div>
                                </div>
                                <div>
                                    <input type="file" accept=".xml" className="hidden" id="xml_envio" onChange={(e) => handleFileChange(e, "xml_envio")} />
                                    <label htmlFor="xml_envio" className="cursor-pointer text-[10px] font-bold text-primary hover:underline">
                                        {data.xml_envio ? "Update" : "Subir"}
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border border-stroke dark:border-strokedark rounded bg-gray-50 dark:bg-meta-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-green-100 text-green-600 rounded">
                                        <span className="text-[10px] font-black">XML</span>
                                    </div>
                                    <div className="text-[10px]">
                                        <p className="font-bold text-black dark:text-white">Respuesta</p>
                                    </div>
                                </div>
                                <div>
                                    <input type="file" accept=".xml" className="hidden" id="xml_respuesta" onChange={(e) => handleFileChange(e, "xml_respuesta")} />
                                    <label htmlFor="xml_respuesta" className="cursor-pointer text-[10px] font-bold text-primary hover:underline">
                                        {data.xml_respuesta ? "Update" : "Subir"}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {uploading && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white dark:bg-boxdark p-6 rounded-lg shadow-2xl flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                        <div className="text-center">
                            <p className="font-bold text-black dark:text-white">Procesando archivo...</p>
                            <p className="text-xs text-gray-500">Por favor espere un momento</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
