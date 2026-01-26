"use server";

import { prisma } from "@/lib/prisma";
import { PedidoVenta, LineaPedidoVenta, Proveedor } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

// --- Tipos ---
export type LineaPedidoInput = {
    id?: number;
    familia_id: number;
    producto_id: number;
    variante_id: number;
    tamano_id: number;
    proveedor_id?: number;
    empaque_id?: number;
    cantidad: number;
    precio_unitario: number;
    precio_proveedor: number;
    impuesto: number;
    exoneracion: number;
    descripcion?: string;
    awd?: string;
    especificaciones?: string;
    po?: string;
    cajas: number;
    stems_per_bunch: number;
    bunches_per_box: number;
    stems_per_box: number;
    producto_nombre?: string;
    variante_nombre?: string;
    tamano_nombre?: string;
    empaque_nombre?: string;
    assorted_config?: ConfiguracionAssortedInput[];
};

export type ConfiguracionAssortedInput = {
    variante_id: number;
    cantidad: number;
    variante_nombre?: string;
};

export type PedidoVentaInput = {
    id?: number;
    codigo?: string;
    cliente_id: number;
    fecha_pedido: Date;
    descripcion?: string;
    awd?: string;
    moneda?: string; // 'USD' | 'CRC'
    estado?: string;
    lineas: LineaPedidoInput[];

    // Invoice details
    numero_factura?: string;
    pdf_factura?: string;
    xml_envio?: string;
    xml_respuesta?: string;
    estado_factura?: string;

    // Shipping & User
    agencia?: string;
    terminal?: string;
    usuario_id?: number;
    exportacion_id?: number;
    cliente_tipo_facturacion?: string;
};

export type PedidoVentaWithLineas = PedidoVenta & {
    cliente: { nombre: string; nombre_comercial: string | null };
    estado_factura: string | null;
    numero_factura: string | null;
    pdf_factura: string | null;
    xml_envio: string | null;
    xml_respuesta: string | null;
    lineas: (LineaPedidoVenta & {
        producto: { nombre: string };
        familia: { nombre_cientifico: string };
        variante: { nombre: string };
        tamano: { nombre: string };
    })[];
};

// --- Helpers ---

async function generarCodigoPedido(): Promise<string> {
    const lastPedido = await prisma.pedidoVenta.findFirst({
        orderBy: { id: "desc" }
    });

    let nextNum = 1;
    if (lastPedido && lastPedido.codigo.startsWith("PV-")) {
        const currentNum = parseInt(lastPedido.codigo.split("-")[1]);
        if (!isNaN(currentNum)) {
            nextNum = currentNum + 1;
        }
    }

    return `PV-${nextNum.toString().padStart(3, "0")}`;
}

// --- Actions ---

export async function createPedidoAction(dataRaw: PedidoVentaInput) {
    try {
        const data = toUpperCaseFields(dataRaw);

        let codigo = data.codigo;
        if (!data.id) {
            codigo = await generarCodigoPedido();
        }

        // Calcular totales generales
        let subtotal = 0;
        let impuestos = 0;
        let total = 0;

        const lineasData = data.lineas.map(linea => {
            const lineaSubtotal = (linea.cantidad || 0) * (linea.precio_unitario || 0);
            const netTaxRate = Math.max(0, (linea.impuesto || 0) - (linea.exoneracion || 0));
            const lineaImpuesto = lineaSubtotal * (netTaxRate / 100);

            subtotal += lineaSubtotal;
            impuestos += lineaImpuesto;
            total += lineaSubtotal + lineaImpuesto;

            return {
                familia_id: linea.familia_id,
                producto_id: linea.producto_id,
                variante_id: linea.variante_id,
                tamano_id: linea.tamano_id,
                proveedor_id: linea.proveedor_id || null,
                empaque_id: linea.empaque_id || null,
                cantidad: linea.cantidad,
                precio_unitario: linea.precio_unitario,
                precio_proveedor: linea.precio_proveedor || 0,
                impuesto: linea.impuesto,
                exoneracion: linea.exoneracion,
                subtotal: lineaSubtotal,
                total: lineaSubtotal + lineaImpuesto,
                descripcion: linea.descripcion,
                awd: linea.awd,
                especificaciones: linea.especificaciones,
                po: linea.po,
                cajas: linea.cajas,
                stems_per_bunch: linea.stems_per_bunch,
                bunches_per_box: linea.bunches_per_box,
                stems_per_box: linea.stems_per_box,
                configuraciones_assorted: linea.assorted_config && linea.assorted_config.length > 0 ? {
                    create: linea.assorted_config.map(ac => ({
                        variante_id: ac.variante_id,
                        cantidad: ac.cantidad
                    }))
                } : undefined
            };
        });

        const pedidoData = {
            cliente_id: data.cliente_id,
            fecha_pedido: data.fecha_pedido,
            descripcion: data.descripcion,
            awd: data.awd,
            estado: data.estado || "BORRADOR",
            subtotal,
            impuestos,
            exonerado: data.lineas.reduce((acc, l) => acc + (l.cantidad * l.precio_unitario * (l.exoneracion / 100)), 0),
            total,
            numero_factura: data.numero_factura,
            pdf_factura: data.pdf_factura,
            xml_envio: data.xml_envio,
            xml_respuesta: data.xml_respuesta,
            estado_factura: data.estado_factura,
            agencia: data.agencia,
            terminal: data.terminal,
            usuario_id: data.usuario_id,
        };

        let pedido;

        if (data.id) {
            // Update: Delete existing lines and recreate them
            await prisma.$transaction([
                prisma.lineaPedidoVenta.deleteMany({
                    where: { pedido_id: data.id }
                }),
                prisma.pedidoVenta.update({
                    where: { id: data.id },
                    data: {
                        ...pedidoData,
                        lineas: {
                            create: lineasData
                        }
                    }
                })
            ]);
            pedido = await prisma.pedidoVenta.findUnique({ where: { id: data.id } });
        } else {
            // Create
            pedido = await prisma.pedidoVenta.create({
                data: {
                    ...pedidoData,
                    codigo: codigo!,
                    lineas: {
                        create: lineasData
                    }
                }
            });
        }

        revalidatePath("/ventas");
        return pedido;
    } catch (error) {
        console.error("Error saving pedido:", error);
        throw new Error("Error al guardar el pedido");
    }
}

export async function getPedidosAction(
    page = 1,
    limit = 10,
    filters: {
        codigo?: string;
        cliente?: string;
        fechaInicio?: string;
        fechaFin?: string;
        estado?: string;
        exportacionId?: string;
    } = {}
) {
    try {
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters.codigo) {
            where.codigo = { contains: filters.codigo, mode: "insensitive" };
        }

        if (filters.cliente) {
            where.cliente = {
                nombre: { contains: filters.cliente, mode: "insensitive" }
            };
        }

        if (filters.estado && filters.estado !== "TODOS") {
            where.estado = filters.estado;
        }

        if (filters.fechaInicio || filters.fechaFin) {
            where.fecha_pedido = {};
            if (filters.fechaInicio) {
                where.fecha_pedido.gte = new Date(filters.fechaInicio);
            }
            if (filters.fechaFin) {
                where.fecha_pedido.lte = new Date(filters.fechaFin);
            }
        }

        if (filters.exportacionId) {
            const expId = parseInt(filters.exportacionId);
            if (!isNaN(expId)) {
                where.exportacion_id = expId;
            }
        }

        const [data, total] = await Promise.all([
            prisma.pedidoVenta.findMany({
                where,
                include: {
                    cliente: { select: { nombre: true, nombre_comercial: true } },
                    _count: { select: { lineas: true } }
                },
                skip,
                take: limit,
                orderBy: { id: "desc" }
            }),
            prisma.pedidoVenta.count({ where })
        ]);

        return {
            data,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    } catch (error) {
        console.error("Error fetching pedidos:", error);
        throw new Error("Error al obtener pedidos");
    }
}

export async function getPedidoByIdAction(id: number) {
    try {
        const pedido = await prisma.pedidoVenta.findUnique({
            where: { id },
            include: {
                cliente: { select: { nombre: true, nombre_comercial: true, tipo_facturacion: true } },
                lineas: {
                    include: {
                        producto: { select: { nombre: true } },
                        familia: { select: { nombre_cientifico: true } },
                        variante: { select: { nombre: true } },
                        tamano: { select: { nombre: true } },
                        empaque: { select: { nombre: true } },
                        configuraciones_assorted: {
                            include: {
                                variante: { select: { nombre: true } }
                            }
                        }
                    }
                }
            }
        });
        return pedido;
    } catch (error) {
        console.error("Error fetching pedido by ID:", error);
        return null;
    }
}

export async function deletePedidoAction(id: number) {
    try {
        await prisma.pedidoVenta.delete({ where: { id } });
        revalidatePath("/ventas");
    } catch (error) {
        console.error("Error deleting pedido:", error);
        throw new Error("Error al eliminar pedido");
    }
}

export async function getProveedoresAction(): Promise<Proveedor[]> {
    try {
        return await prisma.proveedor.findMany({
            orderBy: { nombre: "asc" }
        });
    } catch (error) {
        console.error("Error fetching proveedores:", error);
        return [];
    }
}

import { saveFile } from "@/lib/file-upload";

export async function uploadInvoiceFilesAction(formData: FormData) {
    try {
        const pdfFile = formData.get("pdf") as File | null;
        const xmlEnvioFile = formData.get("xml_envio") as File | null;
        const xmlRespuestaFile = formData.get("xml_respuesta") as File | null;

        const results: Record<string, string | null> = {
            pdf: null,
            xml_envio: null,
            xml_respuesta: null
        };

        if (pdfFile && pdfFile.size > 0) results.pdf = await saveFile(pdfFile);
        if (xmlEnvioFile && xmlEnvioFile.size > 0) results.xml_envio = await saveFile(xmlEnvioFile);
        if (xmlRespuestaFile && xmlRespuestaFile.size > 0) results.xml_respuesta = await saveFile(xmlRespuestaFile);

        return results;
    } catch (error) {
        console.error("Error uploading invoice files:", error);
        throw new Error("Error al subir archivos de factura");
    }
}

export async function duplicatePedidoAction(id: number) {
    try {
        // 1. Fetch original order
        const original = await prisma.pedidoVenta.findUnique({
            where: { id },
            include: { lineas: true }
        });

        if (!original) {
            throw new Error("Pedido no encontrado");
        }

        // 2. Generate new code
        const codigo = await generarCodigoPedido();

        // 3. Prepare new data (Deep Copy intent)
        // Reset status to BORRADOR, Date to NOW, and clear Invoice fields
        const newPedidoData = {
            codigo,
            cliente_id: original.cliente_id,
            fecha_pedido: new Date(),
            descripcion: original.descripcion ? `${original.descripcion} (Copia)` : "Copia de pedido",
            awd: original.awd,
            moneda: original.moneda,
            estado: "BORRADOR",
            subtotal: original.subtotal,
            impuestos: original.impuestos,
            exonerado: original.exonerado,
            total: original.total,
            // Explicitly clear invoice fields
            numero_factura: null,
            pdf_factura: null,
            xml_envio: null,
            xml_respuesta: null,
            estado_factura: null
        };

        // 4. Create new Pedido with Lines
        const newPedido = await prisma.pedidoVenta.create({
            data: {
                ...newPedidoData,
                lineas: {
                    create: original.lineas.map(l => ({
                        familia_id: l.familia_id,
                        producto_id: l.producto_id,
                        variante_id: l.variante_id,
                        tamano_id: l.tamano_id,
                        proveedor_id: l.proveedor_id,
                        cantidad: l.cantidad,
                        precio_unitario: l.precio_unitario,
                        precio_proveedor: l.precio_proveedor,
                        impuesto: l.impuesto,
                        exoneracion: l.exoneracion,
                        subtotal: l.subtotal,
                        total: l.total,
                        descripcion: l.descripcion,
                        awd: l.awd,
                        especificaciones: l.especificaciones,
                        po: l.po,
                        cajas: l.cajas,
                        stems_per_bunch: l.stems_per_bunch,
                        bunches_per_box: l.bunches_per_box,
                        stems_per_box: l.stems_per_box
                    }))
                }
            }
        });

        revalidatePath("/ventas");
        return newPedido;
    } catch (error) {
        console.error("Error duplicating pedido:", error);
        throw new Error("Error al duplicar el pedido");
    }
}

export async function getVentasStatsAction() {
    try {
        // Cast to any to bypass strict typing if 'moneda' isn't recognized yet
        const stats = await prisma.pedidoVenta.groupBy({
            by: ["estado", "moneda"] as any,
            _sum: {
                total: true
            },
            _count: {
                id: true
            }
        });

        return stats.map((s: any) => ({
            moneda: s.moneda || 'USD',
            estado: s.estado,
            total: s._sum?.total || 0,
            count: s._count?.id || 0
        }));
    } catch (error) {
        console.error("Error fetching ventas stats:", error);
        return [];
    }
}

export async function getCompanyConfigAction() {
    try {
        return await prisma.companyConfig.findFirst();
    } catch (error) {
        console.error("Error fetching company config:", error);
        return null;
    }
}

export async function getUsuariosAction() {
    try {
        return await prisma.usuario.findMany({
            orderBy: { nombre: "asc" }
        });
    } catch (error) {
        console.error("Error fetching usuarios:", error);
        return [];
    }
}
// Assorted Config Persistence
export async function saveAssortedConfigAction(lineaPedidoId: number, config: ConfiguracionAssortedInput[]) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Delete existing config for this line
            await tx.configuracionAssorted.deleteMany({
                where: { linea_pedido_id: lineaPedidoId }
            });

            // 2. Insert new config
            if (config.length > 0) {
                await tx.configuracionAssorted.createMany({
                    data: config.map(c => ({
                        linea_pedido_id: lineaPedidoId,
                        variante_id: c.variante_id,
                        cantidad: c.cantidad
                    }))
                });
            }
        });

        revalidatePath("/exportaciones/nuevo"); // Revalidate wizard context if possible, though mostly client state
        return { success: true };
    } catch (error) {
        console.error("Error saving assorted config:", error);
        throw new Error("Error al guardar configuración de surtido");
    }
}

export async function confirmPedidoAction(id: number) {
    try {
        await prisma.pedidoVenta.update({
            where: { id },
            data: { estado: "CONFIRMADO" }
        });
        revalidatePath("/ventas");
        return { success: true };
    } catch (error) {
        console.error("Error confirming pedido:", error);
        throw new Error("Error al confirmar pedido");
    }
}
