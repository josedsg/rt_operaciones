"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getOrdersForExport(startDate: string, endDate: string | null = null, excludeExported: boolean = false) {
    try {
        // Build where clause based on flag
        const whereClause: any = {
            fecha_pedido: endDate
                ? { gte: new Date(startDate), lte: new Date(endDate) }
                : new Date(startDate),
        };

        if (excludeExported) {
            // For "New Export", only show confirmed orders that are NOT yet exported
            whereClause.estado = "CONFIRMADO";
            whereClause.exportacion_id = null;
        } else {
            // For "Simulator" or general view, show both confirmed and exported
            whereClause.estado = { in: ["CONFIRMADO", "EXPORTADO"] };
        }

        const orders = await prisma.pedidoVenta.findMany({
            where: whereClause,
            include: {
                cliente: true,
                lineas: {
                    include: {
                        producto: true,
                        variante: true,
                        tamano: true,
                        familia: true,
                        empaque: true,
                        proveedor: true,
                        configuraciones_assorted: {
                            include: { variante: true }
                        }
                    }
                }
            }
        });

        // Group by Client
        const clientsMap = new Map();
        const productsMap = new Map();

        orders.forEach(order => {
            // Clients aggregation
            if (!clientsMap.has(order.cliente_id)) {
                clientsMap.set(order.cliente_id, {
                    id: order.cliente.id,
                    nombre: order.cliente.nombre,
                    nombre_comercial: order.cliente.nombre_comercial,
                    pedidos_count: 0,
                    total_cajas: 0
                });
            }
            const client = clientsMap.get(order.cliente_id);
            client.pedidos_count += 1;

            // Lines aggregation
            const boxes = order.lineas.reduce((acc, line) => {
                // Product Aggregation
                const productKey = `${line.producto.id}-${line.variante_id || 'null'}-${line.empaque_id || 'null'}`;
                if (!productsMap.has(productKey)) {
                    productsMap.set(productKey, {
                        id: productKey,
                        nombre: line.producto.nombre,
                        variante: line.variante?.nombre || "",
                        empaque: line.empaque?.nombre || "N/A",
                        total_cajas: 0
                    });
                }
                const productStats = productsMap.get(productKey);
                productStats.total_cajas += line.cajas;

                return acc + line.cajas;
            }, 0);

            client.total_cajas += boxes;
        });

        return {
            success: true,
            data: {
                orders,
                clients: Array.from(clientsMap.values()),
                products: Array.from(productsMap.values()).sort((a: any, b: any) => b.total_cajas - a.total_cajas),
                summary: {
                    total_pedidos: orders.length,
                    total_cajas: orders.reduce((acc, o) => acc + o.lineas.reduce((lAcc, l) => lAcc + l.cajas, 0), 0)
                }
            }
        };

    } catch (error) {
        console.error("Error fetching orders for export:", error);
        return { success: false, error: "Error al obtener pedidos" };
    }
}

export async function getExportaciones(page = 1, limit = 20) {
    try {
        const skip = (page - 1) * limit;
        const [data, total] = await prisma.$transaction([
            prisma.exportacion.findMany({
                skip,
                take: limit,
                orderBy: { fecha: 'desc' },
                include: {
                    usuario: {
                        select: { nombre: true }
                    },
                    _count: {
                        select: { pedidos: true }
                    }
                }
            }),
            prisma.exportacion.count()
        ]);

        return {
            success: true,
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error("Error getting exportaciones:", error);
        return { success: false, error: "Error al cargar exportaciones" };
    }
}

export async function confirmExportacionAction(data: {
    fecha: Date;
    usuario_id: number;
    pedidos_ids: number[];
}) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Exportacion
            const exportacion = await tx.exportacion.create({
                data: {
                    fecha: data.fecha,
                    usuario_id: data.usuario_id,
                    estado: "PROCESADA" // Or whatever status is appropriate
                }
            });

            // 2. Update Orders
            await tx.pedidoVenta.updateMany({
                where: {
                    id: { in: data.pedidos_ids }
                },
                data: {
                    estado: "EXPORTADO",
                    exportacion_id: exportacion.id
                }
            });

            return exportacion;
        });

        revalidatePath("/exportaciones");
        return { success: true, data: result };
    } catch (error) {
        console.error("Error confirming exportacion:", error);
        return { success: false, error: "Error al confirmar exportación" };
    }
}

export async function getExportacionById(id: number) {
    try {
        const exportacion = await prisma.exportacion.findUnique({
            where: { id },
            include: {
                usuario: { select: { nombre: true } },
                pedidos: {
                    include: {
                        cliente: true,
                        lineas: {
                            include: {
                                producto: true,
                                variante: true,
                                tamano: true,
                                familia: true,
                                empaque: true,
                                proveedor: true
                            }
                        }
                    }
                }
            }
        });

        if (!exportacion) return { success: false, error: "Exportación no encontrada" };

        return { success: true, data: exportacion };
    } catch (error) {
        console.error("Error fetching exportacion:", error);
        return { success: false, error: "Error al obtener exportación" };
    }
}
