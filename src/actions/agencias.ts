"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

export async function getAgenciasAction() {
    try {
        const agencias = await prisma.agencia.findMany({
            orderBy: { nombre: "asc" }
        });
        return { success: true, data: agencias };
    } catch (error) {
        console.error("Error fetching agencias:", error);
        return { success: false, error: "Error al obtener agencias" };
    }
}

export async function createAgenciaAction(data: any) {
    try {
        await prisma.agencia.create({
            data: toUpperCaseFields(data)
        });
        revalidatePath("/clientes/configuracion/agencias");
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("Error creating agencia:", error);
        return { success: false, error: "Error al crear agencia" };
    }
}

export async function updateAgenciaAction(id: number, data: any) {
    try {
        await prisma.agencia.update({
            where: { id },
            data: toUpperCaseFields(data)
        });
        revalidatePath("/clientes/configuracion/agencias");
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("Error updating agencia:", error);
        return { success: false, error: "Error al actualizar agencia" };
    }
}

export async function deleteAgenciaAction(id: number) {
    try {
        await prisma.agencia.delete({
            where: { id }
        });
        revalidatePath("/clientes/configuracion/agencias");
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("Error deleting agencia:", error);
        return { success: false, error: "No se puede eliminar porque está en uso" };
    }
}
