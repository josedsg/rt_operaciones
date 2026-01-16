"use server";

import { prisma } from "@/lib/prisma";
import { toUpperCaseFields } from "@/lib/utils";

export async function runUppercaseMigrationAction() {
    try {
        console.log("Starting Uppercase Migration...");

        // 1. Clientes
        const clientes = await prisma.cliente.findMany();
        for (const c of clientes) {
            const { id, fecha_creacion, fecha_modificacion, ...rest } = c;
            await prisma.cliente.update({
                where: { id },
                data: toUpperCaseFields(rest)
            });
        }
        console.log(`Migrated ${clientes.length} Clientes`);

        // 2. Grupos
        const grupos = await prisma.grupo.findMany();
        for (const g of grupos) {
            const { id, fecha_creacion, fecha_modificacion, ...rest } = g;
            await prisma.grupo.update({
                where: { id },
                data: toUpperCaseFields(rest)
            });
        }
        console.log(`Migrated ${grupos.length} Grupos`);

        // 3. Familias
        const familias = await prisma.familia.findMany();
        for (const f of familias) {
            const { id, fecha_creacion, fecha_modificacion, ...rest } = f;
            await prisma.familia.update({
                where: { id },
                data: toUpperCaseFields(rest)
            });
        }
        console.log(`Migrated ${familias.length} Familias`);

        // 4. Variantes
        const variantes = await prisma.variante.findMany();
        for (const v of variantes) {
            const { id, fecha_creacion, fecha_modificacion, ...rest } = v;
            await prisma.variante.update({
                where: { id },
                data: toUpperCaseFields(rest)
            });
        }
        console.log(`Migrated ${variantes.length} Variantes`);

        // 5. Tamanos
        const tamanos = await prisma.tamano.findMany();
        for (const t of tamanos) {
            const { id, fecha_creacion, fecha_modificacion, ...rest } = t;
            await prisma.tamano.update({
                where: { id },
                data: toUpperCaseFields(rest)
            });
        }
        console.log(`Migrated ${tamanos.length} Tamanos`);

        // 6. Proveedores
        const proveedores = await prisma.proveedor.findMany();
        for (const p of proveedores) {
            const { id, fecha_creacion, fecha_modificacion, ...rest } = p;
            await prisma.proveedor.update({
                where: { id },
                data: toUpperCaseFields(rest)
            });
        }
        console.log(`Migrated ${proveedores.length} Proveedores`);

        // 7. Productos Maestros
        const productos = await prisma.productoMaestro.findMany();
        for (const p of productos) {
            const { id, fecha_creacion, fecha_modificacion, ...rest } = p;
            await prisma.productoMaestro.update({
                where: { id },
                data: toUpperCaseFields(rest)
            });
        }
        console.log(`Migrated ${productos.length} Productos Maestros`);

        // 8. Pedidos de Venta
        const pedidos = await prisma.pedidoVenta.findMany();
        for (const p of pedidos) {
            const { id, fecha_creacion, fecha_modificacion, ...rest } = p;
            await prisma.pedidoVenta.update({
                where: { id },
                data: toUpperCaseFields(rest)
            });
        }
        console.log(`Migrated ${pedidos.length} Pedidos de Venta`);

        // 9. Lineas de Pedido de Venta
        const lineas = await prisma.lineaPedidoVenta.findMany();
        for (const l of lineas) {
            const { id, fecha_creacion, fecha_modificacion, ...rest } = l;
            await prisma.lineaPedidoVenta.update({
                where: { id },
                data: toUpperCaseFields(rest)
            });
        }
        console.log(`Migrated ${lineas.length} Lineas de Pedido`);

        return { success: true, message: "Migration completed successfully" };
    } catch (error) {
        console.error("Migration failed:", error);
        throw new Error("Migration failed");
    }
}
