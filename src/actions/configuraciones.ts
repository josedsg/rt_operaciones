"use server";

import { prisma } from "@/lib/prisma";
import { ConfiguracionPermitida, Variante, Tamano } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Helpers para selects
export async function getAllVariantes(): Promise<Variante[]> {
    try {
        return await prisma.variante.findMany({ orderBy: { nombre: 'asc' } });
    } catch (e) {
        console.error("Error fetching variantes", e);
        return [];
    }
}

export async function getAllTamanos(): Promise<Tamano[]> {
    try {
        return await prisma.tamano.findMany({ orderBy: { nombre: 'asc' } });
    } catch (e) {
        console.error("Error fetching tamanos", e);
        return [];
    }
}

// Get Config
export async function getConfiguracionesAction(familiaId: number): Promise<(ConfiguracionPermitida & { variante: Variante | null, tamano: Tamano | null })[]> {
    try {
        const configs = await prisma.configuracionPermitida.findMany({
            where: { familia_id: familiaId },
            include: {
                variante: true,
                tamano: true
            },
            orderBy: { id: 'desc' }
        });
        return configs;
    } catch (error) {
        console.error("Error al obtener configuraciones:", error);
        return [];
    }
}

// Create Config
export async function createConfiguracionAction(familiaId: number, varianteId: number | null, tamanoId: number | null) {
    try {
        if (!varianteId && !tamanoId) {
            throw new Error("Debe seleccionar al menos una variante o un tamaño");
        }

        const config = await prisma.configuracionPermitida.create({
            data: {
                familia_id: familiaId,
                variante_id: varianteId,
                tamano_id: tamanoId
            }
        });
        revalidatePath("/productos/configuracion/familias");
        return config;
    } catch (error) {
        console.error("Error al crear configuración:", error);
        throw new Error("No se pudo crear la configuración");
    }
}

// Delete Config
export async function deleteConfiguracionAction(id: number) {
    try {
        await prisma.configuracionPermitida.delete({
            where: { id }
        });
        revalidatePath("/productos/configuracion/familias");
    } catch (error) {
        console.error("Error al eliminar configuración:", error);
        throw new Error("No se pudo eliminar la configuración");
    }
}
