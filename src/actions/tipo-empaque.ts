"use server";

import { prisma } from "@/lib/prisma";
import { TipoEmpaque } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

export async function getTiposEmpaqueAction(): Promise<TipoEmpaque[]> {
    try {
        return await prisma.tipoEmpaque.findMany({
            orderBy: { id: "asc" },
        });
    } catch (error) {
        console.error("Error al obtener tipos de empaque:", error);
        return [];
    }
}

export async function createTipoEmpaqueAction(data: { nombre: string; descripcion?: string }) {
    try {
        const uppercaseData = toUpperCaseFields(data);
        const tipo = await prisma.tipoEmpaque.create({
            data: uppercaseData,
        });
        revalidatePath("/productos/configuracion/empaques");
        return tipo;
    } catch (error) {
        console.error("Error al crear tipo de empaque:", error);
        throw new Error("No se pudo crear el tipo de empaque");
    }
}

export async function updateTipoEmpaqueAction(id: number, data: { nombre: string; descripcion?: string }) {
    try {
        const uppercaseData = toUpperCaseFields(data);
        const tipo = await prisma.tipoEmpaque.update({
            where: { id },
            data: uppercaseData,
        });
        revalidatePath("/productos/configuracion/empaques");
        return tipo;
    } catch (error) {
        console.error("Error al actualizar tipo de empaque:", error);
        throw new Error("No se pudo actualizar el tipo de empaque");
    }
}

export async function deleteTipoEmpaqueAction(id: number) {
    try {
        await prisma.tipoEmpaque.delete({ where: { id } });
        revalidatePath("/productos/configuracion/empaques");
    } catch (error) {
        console.error("Error al eliminar tipo de empaque:", error);
        throw new Error("No se pudo eliminar el tipo de empaque");
    }
}
