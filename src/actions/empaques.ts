"use server";

import { prisma } from "@/lib/prisma";
import { Empaque } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

export async function getEmpaquesAction(): Promise<Empaque[]> {
    try {
        return await prisma.empaque.findMany({
            include: { tipo_empaque: true },
            orderBy: { id: "asc" },
        });
    } catch (error) {
        console.error("Error al obtener empaques:", error);
        return [];
    }
}

export async function createEmpaqueAction(data: {
    nombre: string;
    descripcion?: string;
    sxb: number;
    bxb: number;
    st_x_bx: number;
    tipo_empaque_id?: number;
}) {
    try {
        const uppercaseData = toUpperCaseFields(data);
        const empaque = await prisma.empaque.create({
            data: uppercaseData,
        });
        revalidatePath("/productos/configuracion/empaques");
        return empaque;
    } catch (error) {
        console.error("Error al crear empaque:", error);
        throw new Error("No se pudo crear el empaque");
    }
}

export async function updateEmpaqueAction(id: number, data: {
    nombre: string;
    descripcion?: string;
    sxb: number;
    bxb: number;
    st_x_bx: number;
    tipo_empaque_id?: number;
}) {
    try {
        const uppercaseData = toUpperCaseFields(data);
        const empaque = await prisma.empaque.update({
            where: { id },
            data: uppercaseData,
        });
        revalidatePath("/productos/configuracion/empaques");
        return empaque;
    } catch (error) {
        console.error("Error al actualizar empaque:", error);
        throw new Error("No se pudo actualizar el empaque");
    }
}

export async function deleteEmpaqueAction(id: number) {
    try {
        await prisma.empaque.delete({ where: { id } });
        revalidatePath("/productos/configuracion/empaques");
    } catch (error) {
        console.error("Error al eliminar empaque:", error);
        throw new Error("No se pudo eliminar el empaque");
    }
}
