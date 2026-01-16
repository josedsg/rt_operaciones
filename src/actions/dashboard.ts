"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardDataAction() {
    try {
        const now = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(now.getMonth() - 11);
        twelveMonthsAgo.setDate(1);

        const [
            totalVentas,
            cantidadPedidos,
            clientesTotales,
            cajasTotales,
            pedidosPorEstado,
            ventasMensualesRaw,
            topClientesRaw
        ] = await Promise.all([
            // 1. Total Ventas ($)
            prisma.pedidoVenta.aggregate({
                _sum: { total: true },
                where: { estado: "CONFIRMADO" }
            }),
            // 2. Cantidad de Pedidos
            prisma.pedidoVenta.count(),
            // 3. Clientes Totales
            prisma.cliente.count(),
            // 4. Cajas Totales
            prisma.lineaPedidoVenta.aggregate({
                _sum: { cajas: true },
                where: { pedido: { estado: "CONFIRMADO" } }
            }),
            // 5. Pedidos por Estado
            prisma.pedidoVenta.groupBy({
                by: ["estado"],
                _count: { id: true }
            }),
            // 6. Ventas por mes (últimos 12 meses)
            prisma.pedidoVenta.findMany({
                where: {
                    estado: "CONFIRMADO",
                    fecha_pedido: { gte: twelveMonthsAgo }
                },
                select: { total: true, fecha_pedido: true },
                orderBy: { fecha_pedido: "asc" }
            }),
            // 7. Top 5 Clientes
            prisma.pedidoVenta.groupBy({
                by: ["cliente_id"],
                _sum: { total: true },
                where: { estado: "CONFIRMADO" },
                orderBy: { _sum: { total: "desc" } },
                take: 5
            })
        ]);

        // Procesar ventas mensuales
        const meses = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlySales: Record<string, number> = {};

        // Inicializar últimos 12 meses en 0
        for (let i = 0; i < 12; i++) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            monthlySales[`${meses[d.getMonth()]} ${d.getFullYear()}`] = 0;
        }

        ventasMensualesRaw.forEach(v => {
            if (v.fecha_pedido) {
                const date = new Date(v.fecha_pedido);
                const key = `${meses[date.getMonth()]} ${date.getFullYear()}`;
                if (monthlySales[key] !== undefined) {
                    monthlySales[key] += v.total;
                }
            }
        });

        const sortedMonthlySales = Object.entries(monthlySales)
            .reverse() // Volver al orden cronológico
            .map(([month, total]) => ({ x: month, y: total }));

        // Obtener nombres de clientes para Top 5
        const topClientes = await Promise.all(
            topClientesRaw.map(async (tc) => {
                const [cliente, ordersCount] = await Promise.all([
                    prisma.cliente.findUnique({
                        where: { id: tc.cliente_id },
                        select: { nombre: true, nombre_comercial: true }
                    }),
                    prisma.pedidoVenta.count({
                        where: {
                            cliente_id: tc.cliente_id,
                            estado: "CONFIRMADO"
                        }
                    })
                ]);
                return {
                    name: cliente?.nombre_comercial || cliente?.nombre || "N/A",
                    total: tc._sum.total || 0,
                    ordersCount
                };
            })
        );

        return {
            stats: {
                totalVentas: totalVentas?._sum?.total || 0,
                cantidadPedidos: cantidadPedidos || 0,
                clientesTotales: clientesTotales || 0,
                cajasTotales: cajasTotales?._sum?.cajas || 0
            },
            pedidosPorEstado: (pedidosPorEstado || []).map((p) => ({
                name: p.estado,
                count: p._count.id
            })),
            monthlySales: sortedMonthlySales,
            topClientes
        };
    } catch (error) {
        console.error("Error al obtener datos del dashboard:", error);
        return {
            stats: { totalVentas: 0, cantidadPedidos: 0, clientesTotales: 0, cajasTotales: 0 },
            pedidosPorEstado: [],
            monthlySales: [],
            topClientes: []
        };
    }
}
