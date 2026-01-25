"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    createClienteAction,
    updateClienteAction,
    getDistritosAction,
    getClienteByIdAction,
    getTiposIdentificacionAction,
    getTiposClienteAction,
    getTerminosPagoAction,
    getPaisesAction,
    getProvinciasAction,
    getCantonesAction
} from "@/actions/clientes";
import { getEmpaquesAction } from "@/actions/empaques";
import { Empaque } from "@prisma/client";
import Link from "next/link";
import toast from "react-hot-toast";

interface ClienteFormProps {
    clienteId?: number;
}

export default function ClienteForm({ clienteId }: ClienteFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Catalogs
    const [tiposIdentificacion, setTiposIdentificacion] = useState<any[]>([]);
    const [tiposCliente, setTiposCliente] = useState<any[]>([]);
    const [terminosPago, setTerminosPago] = useState<any[]>([]);
    const [paises, setPaises] = useState<any[]>([]);
    const [provincias, setProvincias] = useState<any[]>([]);
    const [cantones, setCantones] = useState<any[]>([]);
    const [distritos, setDistritos] = useState<any[]>([]);

    const [empaques, setEmpaques] = useState<Empaque[]>([]);
    const [selectedEmpaques, setSelectedEmpaques] = useState<number[]>([]);

    const [formData, setFormData] = useState({
        tipo_identificacion_id: 0,
        identificacion: "",
        tipo_cliente_id: 0,
        nombre: "",
        nombre_comercial: "",
        email_notificacion: "",
        telefono: "",
        sitio_web: "",
        pais_id: 0,
        provincia_id: 0,
        canton_id: 0,
        distrito_id: 0,
        direccion: "",
        terminos_pago_id: 0,
        latitud: "",
        longitud: "",
        tipo_facturacion: "GRAVADO",
        num_documento_exoneracion: "",
        fecha_vencimiento_exoneracion: "",
        agencia: "",
        terminal: ""
    });

    // Load initial catalogs
    useEffect(() => {
        const loadCatalogs = async () => {
            const [ti, tc, tp, pa, pr] = await Promise.all([
                getTiposIdentificacionAction(),
                getTiposClienteAction(),
                getTerminosPagoAction(),
                getPaisesAction(),
                getProvinciasAction()
            ]);
            setTiposIdentificacion(ti);
            setTiposCliente(tc);
            setTerminosPago(tp);
            setPaises(pa);
            setProvincias(pr);

            const allEmpaques = await getEmpaquesAction();
            setEmpaques(allEmpaques);


            // Set defaults if creating new
            if (!clienteId) {
                setFormData(prev => ({
                    ...prev,
                    tipo_identificacion_id: ti[0]?.id || 0,
                    tipo_cliente_id: tc[0]?.id || 0,
                    terminos_pago_id: tp[0]?.id || 0,
                    pais_id: pa[0]?.id || 0,
                }));
                setFetching(false);
            }
        };
        loadCatalogs();
    }, [clienteId]);

    // Load Client Data
    useEffect(() => {
        if (clienteId) {
            getClienteByIdAction(clienteId).then(async (cliente) => {
                if (cliente) {
                    // Load cascaded data
                    if (cliente.provincia_id) {
                        const cants = await getCantonesAction(cliente.provincia_id);
                        setCantones(cants);
                    }
                    if (cliente.canton_id) {
                        const dists = await getDistritosAction(cliente.canton_id);
                        setDistritos(dists);
                    }

                    setFormData({
                        tipo_identificacion_id: cliente.tipo_identificacion_id,
                        identificacion: cliente.identificacion,
                        tipo_cliente_id: cliente.tipo_cliente_id,
                        nombre: cliente.nombre,
                        nombre_comercial: cliente.nombre_comercial || "",
                        email_notificacion: cliente.email_notificacion || "",
                        telefono: cliente.telefono || "",
                        sitio_web: cliente.sitio_web || "",
                        pais_id: cliente.pais_id,
                        provincia_id: cliente.provincia_id || 0,
                        canton_id: cliente.canton_id || 0,
                        distrito_id: cliente.distrito_id || 0,
                        direccion: cliente.direccion || "",
                        terminos_pago_id: cliente.terminos_pago_id,
                        latitud: cliente.latitud || "",
                        longitud: cliente.longitud || "",
                        tipo_facturacion: cliente.tipo_facturacion || "GRAVADO",
                        num_documento_exoneracion: cliente.num_documento_exoneracion || "",
                        fecha_vencimiento_exoneracion: cliente.fecha_vencimiento_exoneracion ? cliente.fecha_vencimiento_exoneracion.toString().split('T')[0] : "",
                        agencia: (cliente as any).agencia || "",
                        terminal: (cliente as any).terminal || ""
                    });
                    const clientWithRelations = cliente as any;
                    if (clientWithRelations.allowed_empaques) {
                        setSelectedEmpaques(clientWithRelations.allowed_empaques.map((ae: any) => ae.empaque_id));
                    }
                }
                setFetching(false);
            });
        }
    }, [clienteId]);

    // Cascading Loading
    useEffect(() => {
        if (formData.provincia_id) {
            getCantonesAction(formData.provincia_id).then(setCantones);
        } else {
            setCantones([]);
            setCantones([]);
        }
    }, [formData.provincia_id]);

    useEffect(() => {
        if (formData.canton_id) {
            getDistritosAction(formData.canton_id).then(setDistritos);
        } else {
            setDistritos([]);
        }
    }, [formData.canton_id]);

    const toggleEmpaque = (id: number) => {
        setSelectedEmpaques(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = { ...formData, empaques: selectedEmpaques };
            if (clienteId) {
                await updateClienteAction(clienteId, payload);
                toast.success("Cliente actualizado con éxito");
            } else {
                await createClienteAction(payload);
                toast.success("Cliente creado con éxito");
            }
            router.push("/clientes");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el cliente");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-10 text-center">Cargando datos...</div>;

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    {clienteId ? "Editar Cliente" : "Nuevo Cliente"}
                </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6.5">
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Sección: Información Básica */}
                    <div className="md:col-span-2 border-b border-stroke pb-2 mb-2 dark:border-strokedark">
                        <h4 className="font-semibold text-primary">Información Básica</h4>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">
                            Tipo de Identificación <span className="text-meta-1">*</span>
                        </label>
                        <select
                            value={formData.tipo_identificacion_id}
                            onChange={(e) => setFormData({ ...formData, tipo_identificacion_id: Number(e.target.value) })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            <option value={0}>Seleccione...</option>
                            {tiposIdentificacion.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">
                            Identificación <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.identificacion}
                            onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">
                            Tipo Cliente <span className="text-meta-1">*</span>
                        </label>
                        <select
                            value={formData.tipo_cliente_id}
                            onChange={(e) => setFormData({ ...formData, tipo_cliente_id: Number(e.target.value) })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            {tiposCliente.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">
                            Nombre <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">
                            Nombre Comercial
                        </label>
                        <input
                            type="text"
                            value={formData.nombre_comercial}
                            onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                    </div>

                    {/* Contacto */}
                    <div className="md:col-span-2 border-b border-stroke pb-2 mb-2 mt-4 dark:border-strokedark">
                        <h4 className="font-semibold text-primary">Información de Contacto</h4>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Email Notificación</label>
                        <input
                            type="email"
                            value={formData.email_notificacion}
                            onChange={(e) => setFormData({ ...formData, email_notificacion: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Teléfono</label>
                        <input
                            type="text"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Sitio Web</label>
                        <input
                            type="url"
                            value={formData.sitio_web}
                            onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Términos de Pago</label>
                        <select
                            value={formData.terminos_pago_id}
                            onChange={(e) => setFormData({ ...formData, terminos_pago_id: Number(e.target.value) })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            {terminosPago.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre} ({t.dias} días)</option>
                            ))}
                        </select>
                    </div>

                    {/* Facturación Electrónica */}
                    <div className="md:col-span-2 border-b border-stroke pb-2 mb-2 mt-4 dark:border-strokedark">
                        <h4 className="font-semibold text-primary">Facturación Electrónica</h4>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Tipo Facturación</label>
                        <select
                            value={formData.tipo_facturacion}
                            onChange={(e) => setFormData({ ...formData, tipo_facturacion: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            <option value="GRAVADO">GRAVADO</option>
                            <option value="EXONERADO">EXONERADO</option>
                        </select>
                    </div>

                    {formData.tipo_facturacion === 'EXONERADO' && (
                        <>
                            <div>
                                <label className="mb-2.5 block text-black dark:text-white">
                                    Número de Documento <span className="text-meta-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.num_documento_exoneracion}
                                    onChange={(e) => setFormData({ ...formData, num_documento_exoneracion: e.target.value })}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="mb-2.5 block text-black dark:text-white">
                                    Fecha de Expiración <span className="text-meta-1">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.fecha_vencimiento_exoneracion}
                                    onChange={(e) => setFormData({ ...formData, fecha_vencimiento_exoneracion: e.target.value })}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>
                        </>
                    )}

                    {/* Ubicación */}
                    <div className="md:col-span-2 border-b border-stroke pb-2 mb-2 mt-4 dark:border-strokedark">
                        <h4 className="font-semibold text-primary">Ubicación</h4>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">País</label>
                        <select
                            value={formData.pais_id}
                            onChange={(e) => setFormData({ ...formData, pais_id: Number(e.target.value) })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            {paises.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Provincia</label>
                        <select
                            value={formData.provincia_id}
                            onChange={(e) => {
                                setFormData({ ...formData, provincia_id: Number(e.target.value), canton_id: 0, distrito_id: 0 });
                            }}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            <option value={0}>Seleccione...</option>
                            {provincias.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Cantón</label>
                        <select
                            value={formData.canton_id}
                            onChange={(e) => {
                                setFormData({ ...formData, canton_id: Number(e.target.value), distrito_id: 0 });
                            }}
                            disabled={!formData.provincia_id}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            <option value={0}>Seleccione...</option>
                            {cantones.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Distrito</label>
                        <select
                            value={formData.distrito_id}
                            onChange={(e) => setFormData({ ...formData, distrito_id: Number(e.target.value) })}
                            disabled={!formData.canton_id}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            <option value={0}>Seleccione...</option>
                            {distritos.map(d => (
                                <option key={d.id} value={d.id}>{d.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2.5 block text-black dark:text-white">Dirección Exacta</label>
                        <textarea
                            rows={3}
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        ></textarea>
                    </div>

                    <div className="md:col-span-2 border-b border-stroke pb-2 mb-2 mt-4 dark:border-strokedark">
                        <h4 className="font-semibold text-primary">Logística (Predeterminados)</h4>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Agencia</label>
                        <input
                            type="text"
                            value={formData.agencia}
                            onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            placeholder="Ej. Tikal"
                        />
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Terminal</label>
                        <input
                            type="text"
                            value={formData.terminal}
                            onChange={(e) => setFormData({ ...formData, terminal: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            placeholder="Ej. 12345"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4.5">
                    <div className="w-full mb-6 mt-4 border-t border-stroke pt-4 dark:border-strokedark">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Empaques Permitidos <span className="text-xs font-normal text-gray-500">(Dejar vacío para permitir todos)</span>
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-stroke rounded p-2 dark:border-strokedark bg-gray-50 dark:bg-meta-4">
                            {empaques.map(e => (
                                <button
                                    key={e.id}
                                    type="button"
                                    onClick={() => toggleEmpaque(e.id)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-all ${selectedEmpaques.includes(e.id)
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white text-black border-stroke hover:border-primary dark:bg-boxdark dark:text-white dark:border-strokedark'
                                        }`}
                                >
                                    {e.nombre}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4.5">
                    <Link
                        href="/clientes"
                        className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
                    >
                        {loading ? "Guardando..." : "Guardar Cliente"}
                    </button>
                </div>
            </form>
        </div>
    );
}
