"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

export async function getTerminalsAction() {
    try {
        const terminals = await prisma.terminal.findMany({
            orderBy: { nombre: "asc" }
        });
        return { success: true, data: terminals };
    } catch (error) {
        console.error("Error fetching terminals:", error);
        return { success: false, error: "Error al obtener terminales" };
    }
}

export async function createTerminalAction(data: any) {
    try {
        await prisma.terminal.create({
            data: toUpperCaseFields(data)
        });
        revalidatePath("/clientes/configuracion/terminales");
        revalidatePath("/clientes"); // Relookup in forms
        return { success: true };
    } catch (error) {
        console.error("Error creating terminal:", error);
        return { success: false, error: "Error al crear terminal" };
    }
}

export async function updateTerminalAction(id: number, data: any) {
    try {
        await prisma.terminal.update({
            where: { id },
            data: toUpperCaseFields(data)
        });
        revalidatePath("/clientes/configuracion/terminales");
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("Error updating terminal:", error);
        return { success: false, error: "Error al actualizar terminal" };
    }
}

export async function deleteTerminalAction(id: number) {
    try {
        await prisma.terminal.delete({
            where: { id }
        });
        revalidatePath("/clientes/configuracion/terminales");
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("Error deleting terminal:", error);
        return { success: false, error: "No se puede eliminar porque está en uso" };
    }
}
