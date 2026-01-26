"use client";

import { PedidoVentaInput, uploadInvoiceFilesAction, getCompanyConfigAction, getUsuariosAction } from "@/actions/ventas";
import { getClienteByIdAction } from "@/actions/clientes";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import logo from "@/assets/logos/rio-tapezco-logo.png";
import { CompanyConfig, Usuario, Cliente, TerminosPago, Provincia, Pais, Canton, Distrito } from "@prisma/client";

interface StepResumenProps {
    data: PedidoVentaInput;
    updateData: (data: Partial<PedidoVentaInput>) => void;
    onConfirm?: () => void;
    isReadOnly?: boolean;
}

type FullCliente = Cliente & {
    terminos_pago: TerminosPago;
    pais: Pais;
    provincia: Provincia | null;
    canton: Canton | null;
    distrito: Distrito | null;
};

export function StepResumen({ data, updateData, onConfirm, isReadOnly = false }: StepResumenProps) {
    const [uploading, setUploading] = useState(false);
    const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [clienteFull, setClienteFull] = useState<FullCliente | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        const loadInitialData = async () => {
            const config = await getCompanyConfigAction();
            setCompanyConfig(config);

            const users = await getUsuariosAction();
            setUsuarios(users);
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const loadCliente = async () => {
            if (data.cliente_id) {
                const c = await getClienteByIdAction(data.cliente_id);
                // We cast or check if response matches FullCliente, assuming action returns relations
                const fullC = c as unknown as FullCliente;
                setClienteFull(fullC);

                // Auto-load Agency/Terminal if empty
                if (!data.agencia && (fullC as any).agencia) {
                    updateData({ agencia: (fullC as any).agencia });
                }
                if (!data.terminal && (fullC as any).terminal) {
                    updateData({ terminal: (fullC as any).terminal });
                }
            }
        };
        loadCliente();
    }, [data.cliente_id]);

    // --- Logic / Calculations ---

    // Simulate Invoice Number if empty
    useEffect(() => {
        if (!data.numero_factura) {
            // Generating simulated number: 0010000101 + random digits
            const randomSuffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
            const simNumber = `0010000101${randomSuffix}`;

            // Only update if we want to auto-assign. 
            updateData({
                numero_factura: simNumber,
            });
        }
    }, [data.numero_factura, updateData]);

    const electronicKey = data.numero_factura ? `506${new Date().getFullYear()}${data.numero_factura.padEnd(40, '0')}`.substring(0, 50) : "";

    const monedaSimbolo = data.moneda === 'CRC' ? '₡' : '$';

    const fechaPedido = data.fecha_pedido instanceof Date ? data.fecha_pedido : new Date(data.fecha_pedido || Date.now());

    // Payment Condition & Due Date
    const paymentConditionName = clienteFull?.terminos_pago?.nombre || "N/A";
    const paymentDays = clienteFull?.terminos_pago?.dias || 0;

    const dueDate = new Date(fechaPedido);
    dueDate.setDate(dueDate.getDate() + paymentDays);

    // Totals
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
            <div className="bg-white dark:bg-boxdark shadow-lg rounded-sm border border-stroke dark:border-strokedark print:shadow-none print:border-none">

                {/* Header Logo & Title */}
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            {/* Logo: Changed to new Asset */}
                            <div className="flex items-center gap-2 mb-2">
                                <div className="relative h-24 w-80">
                                    <img
                                        src="/assets/invoice/logo-header.jpg"
                                        alt="Rio Tapezco Logo"
                                        className="h-full w-full object-contain object-left"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                            {/* Print Button (Hidden on Print) */}
                            <button
                                onClick={() => window.print()}
                                className="print:hidden flex items-center gap-2 bg-primary text-white px-4 py-2 rounded shadow hover:bg-opacity-90 transition-all text-sm font-bold"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                Guardar PDF / Imprimir
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between items-end">
                        <h2 className="text-2xl font-bold text-[#167e35] uppercase tracking-wide">Commercial Invoice</h2>
                    </div>
                </div>

                {/* Addresses Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 text-sm border-t border-b border-stroke dark:border-strokedark">
                    {/* FROM (Issuer Data) */}
                    <div className="p-6 border-r border-stroke dark:border-strokedark">
                        <h3 className="font-bold text-[#167e35] mb-2 uppercase text-xs tracking-wider">From:</h3>
                        {companyConfig ? (
                            <>
                                <p className="font-bold text-black dark:text-white uppercase">{companyConfig.nombre}</p>
                                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{companyConfig.direccion}</p>
                                <div className="mt-2 text-gray-500 text-xs">
                                    <p>Phone: {companyConfig.telefono}</p>
                                    <p>Email: {companyConfig.email}</p>
                                    {companyConfig.website && <p>{companyConfig.website}</p>}
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-400 italic">Load Company Config...</p>
                        )}
                    </div>

                    {/* TO (Customer Data) */}
                    <div className="p-6 bg-gray-50 dark:bg-meta-4/20">
                        <h3 className="font-bold text-[#167e35] mb-2 uppercase text-xs tracking-wider">Customer Data:</h3>
                        {clienteFull ? (
                            <>
                                <p className="font-bold text-black dark:text-white uppercase">
                                    {clienteFull.nombre_comercial || clienteFull.nombre}
                                </p>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {clienteFull.direccion || "No address on file"}
                                </p>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {clienteFull.distrito?.nombre}, {clienteFull.canton?.nombre}, {clienteFull.provincia?.nombre}
                                </p>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {clienteFull.pais?.nombre}
                                </p>
                                <div className="mt-2 text-gray-500 text-xs">
                                    <p>Phone: {clienteFull.telefono || "N/A"}</p>
                                    <p>Email: {clienteFull.email_notificacion || "N/A"}</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-danger italic">Select a Client in Step 1</p>
                        )}
                    </div>
                </div>

                {/* Invoice Meta Grid */}
                <div className="grid grid-cols-3 text-center border-b border-stroke dark:border-strokedark">
                    <div className="border-r border-stroke dark:border-strokedark">
                        <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1">Invoice</div>
                        <div className="py-2 text-[10px] font-bold text-danger break-all px-2 leading-tight">
                            {data.numero_factura || "DRAFT"}
                        </div>
                    </div>
                    <div className="border-r border-stroke dark:border-strokedark">
                        <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1">Date</div>
                        <div className="py-2 text-sm font-medium">
                            {fechaPedido.toLocaleDateString('en-US')}
                        </div>
                    </div>
                    <div>
                        <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1">AWB</div>
                        <div className="py-2 text-sm font-medium">{data.awd || "—"}</div>
                    </div>
                </div>

                {/* Shipping & Payment Grids */}
                <div className="grid grid-cols-2 mt-4 mx-4 gap-4">
                    {/* Left: Shipping Data (Editable Inputs) */}
                    <div className="border border-stroke dark:border-strokedark rounded">
                        <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1 text-center">Shipping Data</div>
                        <div className="p-2 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold w-16">Agency:</span>
                                <input
                                    type="text"
                                    className="flex-1 text-xs border-b border-gray-300 outline-none p-1 bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Agency Name"
                                    value={data.agencia || ""}
                                    onChange={(e) => updateData({ agencia: e.target.value })}
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold w-16">Terminal:</span>
                                <input
                                    type="text"
                                    className="flex-1 text-xs border-b border-gray-300 outline-none p-1 bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Terminal Info"
                                    value={data.terminal || ""}
                                    onChange={(e) => updateData({ terminal: e.target.value })}
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment Details */}
                    <div className="grid grid-cols-3 border border-stroke dark:border-strokedark rounded overflow-hidden">
                        <div className="border-r border-stroke dark:border-strokedark flex flex-col">
                            <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1 text-center">Salesperson</div>
                            <div className="flex-1 flex items-center justify-center p-1">
                                <select
                                    className="text-xs text-center w-full bg-transparent outline-none h-full disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.usuario_id || ""}
                                    onChange={(e) => updateData({ usuario_id: Number(e.target.value) })}
                                    disabled={isReadOnly}
                                >
                                    <option value="">Select User</option>
                                    {usuarios.map(u => (
                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="border-r border-stroke dark:border-strokedark flex flex-col">
                            <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1 text-center">Payment Condition</div>
                            <div className="flex-1 flex items-center justify-center text-xs font-medium p-2">
                                {paymentConditionName}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="bg-[#167e35] text-white font-bold text-xs uppercase py-1 text-center">Due Date</div>
                            <div className="flex-1 flex items-center justify-center text-xs font-medium p-2">
                                {dueDate.toLocaleDateString('en-US')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="p-4">
                    <table className="w-full border-collapse border border-stroke dark:border-strokedark">
                        <thead>
                            <tr>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-2 border border-stroke dark:border-strokedark text-left">Description</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-1 border border-stroke dark:border-strokedark text-center">PO</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-1 border border-stroke dark:border-strokedark text-center w-16">Box Qty</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-1 border border-stroke dark:border-strokedark text-center w-20">Stem/Box</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-1 border border-stroke dark:border-strokedark text-center w-16">Qty</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-2 border border-stroke dark:border-strokedark text-right">Unit Price</th>
                                <th className="bg-gray-100 text-[#167e35] font-bold text-xs uppercase py-2 px-2 border border-stroke dark:border-strokedark text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.lineas.map((linea, key) => (
                                <tr key={key}>
                                    <td className="border border-stroke dark:border-strokedark px-2 py-2 text-xs text-black dark:text-white">
                                        {/* Description Format: [Product] + [Empaque] + [Variant] + [Size] */}
                                        <div className="font-bold">
                                            {linea.producto_nombre} - {linea.empaque_nombre} - {linea.variante_nombre} {linea.tamano_nombre}
                                        </div>
                                    </td>
                                    <td className="border border-stroke dark:border-strokedark px-1 py-1 text-center text-xs">{linea.po || "—"}</td>
                                    <td className="border border-stroke dark:border-strokedark px-1 py-1 text-center text-xs font-semibold">
                                        {linea.cajas}
                                    </td>
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

                    {/* Breakdown & Hardcoded Section */}
                    <div className="flex justify-between mt-0">
                        {/* Left: Hardcoded Section (Cinebtarui / Note) */}
                        <div className="p-4 text-[10px] text-gray-500 w-1/2">
                            <p className="font-bold mb-1">CINEBTARUI (NOTES):</p>
                            <p>
                                Fixed section content. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                        </div>

                        {/* Right: Financials */}
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

                {/* Electronic Invoice CR Data (New Section) */}
                <div className="px-8 pb-4">
                    <div className="border-t-2 border-[#167e35] pt-2 mt-4 mb-4">
                        <h4 className="font-bold text-[#167e35] text-xs uppercase mb-2">Electronic Invoice CR Data</h4>
                        <div className="grid grid-cols-1 gap-1 text-[10px] font-mono text-gray-600">
                            <div className="flex gap-2">
                                <span className="font-bold w-24">Consecutive:</span>
                                <span>{data.numero_factura || "N/A"}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold w-24">Electronic Key:</span>
                                <span className="break-all">{electronicKey || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Legal & Banner */}
                <div className="p-0 border-t border-stroke dark:border-strokedark">
                    {/* Legal Text */}
                    <div className="p-4 flex justify-between items-end pb-2">
                        <div className="text-[10px] text-gray-500">
                            {companyConfig ? (
                                <>
                                    <p>{companyConfig.telefono} {companyConfig.email} {companyConfig.nombre?.toUpperCase()}</p>
                                    <p>{companyConfig.website} {companyConfig.ein_number}</p>
                                </>
                            ) : (
                                <p>Loading footer info...</p>
                            )}
                        </div>
                        {/* Signature Box (Fixed/Static) */}
                        <div className="w-40 border-t border-black text-center">
                            <p className="text-[10px] uppercase font-bold mt-1">Authorized Signature</p>
                        </div>
                    </div>
                    {/* Footer Banner */}
                    <div className="w-full">
                        <img
                            src="/assets/invoice/footer-banner.png"
                            alt="Footer Banner"
                            className="w-full h-auto object-cover"
                        />
                    </div>
                </div>
            </div>


            {/* --- ELECTRONIC INVOICE MANAGEMENT (Keep in Spanish as it is internal control) --- */}
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 print:hidden">
                <div className="flex items-center gap-3 mb-6 border-b border-stroke dark:border-strokedark pb-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    </div>
                    <h4 className="text-xl font-bold text-black dark:text-white">Factura Electrónica (Control Interno)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    {/* Status & ID */}
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Número de Factura (Consecutivo)</label>
                            <input
                                type="text"
                                placeholder="Ej. 00100001010000..."
                                className="w-full rounded border border-stroke bg-gray-50 py-3 px-4 dark:bg-meta-4 focus:border-primary outline-none text-sm font-mono disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.numero_factura || ""}
                                onChange={(e) => updateData({ numero_factura: e.target.value })}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Estado Hacienda</label>
                            <select
                                className={`w-full rounded border border-stroke py-3 px-4 outline-none text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${data.estado_factura === 'ACEPTADO' ? 'bg-success/10 text-success border-success' :
                                    data.estado_factura === 'RECHAZADO' ? 'bg-danger/10 text-danger border-danger' :
                                        'bg-white dark:bg-boxdark'
                                    }`}
                                value={data.estado_factura || "PENDIENTE"}
                                onChange={(e) => updateData({ estado_factura: e.target.value })}
                                disabled={isReadOnly}
                            >
                                <option value="PENDIENTE">PENDIENTE DE ENVÍO</option>
                                <option value="ENVIADO">ENVIADO (Procesando)</option>
                                <option value="ACEPTADO">ACEPTADO POR HACIENDA</option>
                                <option value="RECHAZADO">RECHAZADO / ERROR</option>
                            </select>
                        </div>
                    </div>

                    {/* File Uploads (Keep logic) */}
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
                                <input type="file" accept=".pdf" className="hidden" id="pdf_file" onChange={(e) => handleFileChange(e, "pdf")} disabled={isReadOnly} />
                                {!isReadOnly && (
                                    <label htmlFor="pdf_file" className="cursor-pointer text-xs font-bold text-primary hover:underline">
                                        {data.pdf_factura ? "Reemplazar" : "Subir PDF"}
                                    </label>
                                )}
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
                                    <input type="file" accept=".xml" className="hidden" id="xml_envio" onChange={(e) => handleFileChange(e, "xml_envio")} disabled={isReadOnly} />
                                    {!isReadOnly && (
                                        <label htmlFor="xml_envio" className="cursor-pointer text-[10px] font-bold text-primary hover:underline">
                                            {data.xml_envio ? "Update" : "Subir"}
                                        </label>
                                    )}
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
                                    <input type="file" accept=".xml" className="hidden" id="xml_respuesta" onChange={(e) => handleFileChange(e, "xml_respuesta")} disabled={isReadOnly} />
                                    {!isReadOnly && (
                                        <label htmlFor="xml_respuesta" className="cursor-pointer text-[10px] font-bold text-primary hover:underline">
                                            {data.xml_respuesta ? "Update" : "Subir"}
                                        </label>
                                    )}
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
