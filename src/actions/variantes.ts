"use server";

import { prisma } from "@/lib/prisma";
import { Variante } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

export type GetVariantesParams = {
    page?: number;
    limit?: number;
    search?: string;
};

export type GetVariantesResponse = {
    data: Variante[];
    total: number;
    totalPages: number;
    currentPage: number;
};

export async function getVariantesAction({
    page = 1,
    limit = 10,
    search = "",
}: GetVariantesParams = {}): Promise<GetVariantesResponse> {
    try {
        const skip = (page - 1) * limit;

        const where = search
            ? {
                nombre: {
                    contains: search,
                    mode: "insensitive" as const,
                },
            }
            : {};

        const [data, total] = await Promise.all([
            prisma.variante.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    id: "desc",
                },
            }),
            prisma.variante.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            totalPages,
            currentPage: page,
        };
    } catch (error) {
        console.error("Error al obtener variantes:", error);
        return { data: [], total: 0, totalPages: 0, currentPage: 1 };
    }
}

export async function createVarianteAction(nombre: string): Promise<Variante | null> {
    try {
        const nuevaVariante = await prisma.variante.create({
            data: {
                nombre: nombre.toUpperCase(),
            },
        });
        revalidatePath("/productos/configuracion/variantes");
        return nuevaVariante;
    } catch (error) {
        console.error("Error al crear variante:", error);
        throw new Error("No se pudo crear la variante");
    }
}

export async function updateVarianteAction(id: number, nombre: string): Promise<Variante | null> {
    try {
        const varianteActualizada = await prisma.variante.update({
            where: { id },
            data: { nombre: nombre.toUpperCase() },
        });
        revalidatePath("/productos/configuracion/variantes");
        return varianteActualizada;
    } catch (error) {
        console.error("Error al actualizar variante:", error);
        throw new Error("No se pudo actualizar la variante");
    }
}

export async function deleteVarianteAction(id: number): Promise<void> {
    try {
        await prisma.variante.delete({
            where: { id },
        });
        revalidatePath("/productos/configuracion/variantes");
    } catch (error) {
        console.error("Error al eliminar variante:", error);
        throw new Error("No se pudo eliminar la variante");
    }
}
