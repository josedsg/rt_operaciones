"use server";

import { prisma } from "@/lib/prisma";
import { Grupo } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

export type GrupoCreateInput = {
    nombre: string;
    descripcion: string;
};

export type GrupoUpdateInput = {
    id: number;
    nombre: string;
    descripcion: string;
};

export async function getGruposAction(): Promise<Grupo[]> {
    try {
        const grupos = await prisma.grupo.findMany({
            orderBy: {
                id: "asc",
            },
        });
        return grupos;
    } catch (error) {
        console.error("Error al obtener grupos:", error);
        return [];
    }
}

export async function createGrupoAction(data: GrupoCreateInput): Promise<Grupo | null> {
    try {
        const uppercaseData = toUpperCaseFields({
            nombre: data.nombre,
            descripcion: data.descripcion,
        });
        const nuevoGrupo = await prisma.grupo.create({
            data: uppercaseData,
        });
        revalidatePath("/productos/configuracion/grupos");
        return nuevoGrupo;
    } catch (error) {
        console.error("Error al crear grupo:", error);
        throw new Error("No se pudo crear el grupo");
    }
}

export async function updateGrupoAction(data: GrupoUpdateInput): Promise<Grupo | null> {
    try {
        const uppercaseData = toUpperCaseFields({
            nombre: data.nombre,
            descripcion: data.descripcion,
        });
        const grupoActualizado = await prisma.grupo.update({
            where: {
                id: data.id,
            },
            data: uppercaseData,
        });
        revalidatePath("/productos/configuracion/grupos");
        return grupoActualizado;
    } catch (error) {
        console.error("Error al actualizar grupo:", error);
        throw new Error("No se pudo actualizar el grupo");
    }
}

export async function deleteGrupoAction(id: number): Promise<void> {
    try {
        await prisma.grupo.delete({
            where: {
                id: id,
            },
        });
        revalidatePath("/productos/configuracion/grupos");
    } catch (error) {
        console.error("Error al eliminar grupo:", error);
        throw new Error("No se pudo eliminar el grupo");
    }
}
