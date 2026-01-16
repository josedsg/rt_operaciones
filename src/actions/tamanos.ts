"use server";

import { prisma } from "@/lib/prisma";
import { Tamano } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

export type GetTamanosParams = {
    page?: number;
    limit?: number;
    search?: string;
};

export type GetTamanosResponse = {
    data: Tamano[];
    total: number;
    totalPages: number;
    currentPage: number;
};

export async function getTamanosAction({
    page = 1,
    limit = 10,
    search = "",
}: GetTamanosParams = {}): Promise<GetTamanosResponse> {
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
            prisma.tamano.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    id: "desc",
                },
            }),
            prisma.tamano.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            totalPages,
            currentPage: page,
        };
    } catch (error) {
        console.error("Error al obtener tamaños:", error);
        return { data: [], total: 0, totalPages: 0, currentPage: 1 };
    }
}

export async function createTamanoAction(nombre: string): Promise<Tamano | null> {
    try {
        const nuevoTamano = await prisma.tamano.create({
            data: {
                nombre: nombre.toUpperCase(),
            },
        });
        revalidatePath("/productos/configuracion/tamanos");
        return nuevoTamano;
    } catch (error) {
        console.error("Error al crear tamaño:", error);
        throw new Error("No se pudo crear el tamaño");
    }
}

export async function updateTamanoAction(id: number, nombre: string): Promise<Tamano | null> {
    try {
        const tamanoActualizado = await prisma.tamano.update({
            where: { id },
            data: { nombre: nombre.toUpperCase() },
        });
        revalidatePath("/productos/configuracion/tamanos");
        return tamanoActualizado;
    } catch (error) {
        console.error("Error al actualizar tamaño:", error);
        throw new Error("No se pudo actualizar el tamaño");
    }
}

export async function deleteTamanoAction(id: number): Promise<void> {
    try {
        await prisma.tamano.delete({
            where: { id },
        });
        revalidatePath("/productos/configuracion/tamanos");
    } catch (error) {
        console.error("Error al eliminar tamaño:", error);
        throw new Error("No se pudo eliminar el tamaño");
    }
}
