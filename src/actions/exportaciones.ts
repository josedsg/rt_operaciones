"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getOrdersForExport(date: string) {
    try {
        // Fetch orders for the specific date
        // Ideally filter by status (e.g., != BORRADOR), but for now fetch all
        const orders = await prisma.pedidoVenta.findMany({
            where: {
                fecha_pedido: new Date(date),
                estado: "CONFIRMADO"
            },
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
        orders.forEach(order => {
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
            // Sum boxes from lines
            const boxes = order.lineas.reduce((acc, line) => acc + line.cajas, 0);
            client.total_cajas += boxes;
        });

        return {
            success: true,
            data: {
                orders,
                clients: Array.from(clientsMap.values()),
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
