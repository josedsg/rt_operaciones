"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Peligro: Borra todos los datos de la base de datos.
 * Solo para propósitos de prueba.
 */
export async function clearDatabaseAction() {
    try {
        console.log("!!! INICIANDO LIMPIEZA TOTAL DE BASE DE DATOS !!!");

        await prisma.$transaction([
            // Orden sugerido para respetar llaves foráneas
            prisma.lineaPedidoVenta.deleteMany(),
            prisma.pedidoVenta.deleteMany(),
            prisma.productoProveedor.deleteMany(),
            prisma.configuracionPermitida.deleteMany(),
            prisma.productoMaestro.deleteMany(),
            prisma.familia.deleteMany(),
            prisma.grupo.deleteMany(),
            prisma.variante.deleteMany(),
            prisma.tamano.deleteMany(),
            prisma.proveedor.deleteMany(),
            prisma.cliente.deleteMany(),
        ]);

        console.log("!!! LIMPIEZA COMPLETADA CON ÉXITO !!!");

        revalidatePath("/");
        return { success: true, message: "Base de datos limpiada con éxito" };
    } catch (error) {
        console.error("Error al limpiar la base de datos:", error);
        throw new Error("No se pudo limpiar la base de datos");
    }
}
