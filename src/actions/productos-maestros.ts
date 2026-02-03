"use server";
// Force reload

import { prisma } from "@/lib/prisma";
import { ProductoMaestro, Familia, Variante, Tamano, ProductoEmpaque, Empaque } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

export async function generateProductosFromConfigAction(familiaId: number) {
    try {
        // 1. Get Familia
        const familia = await prisma.familia.findUnique({
            where: { id: familiaId }
        });
        if (!familia) throw new Error("Familia no encontrada");

        // 2. Get Valid Configs (ignoring wildcards for safety in auto-generation)
        const configs = await prisma.configuracionPermitida.findMany({
            where: {
                familia_id: familiaId,
                variante_id: { not: null },
                tamano_id: { not: null }
            },
            include: {
                variante: true,
                tamano: true
            }
        });

        let createdCount = 0;
        let skippedCount = 0;

        for (const config of configs) {
            if (!config.variante || !config.tamano) continue;

            // 3. Check existence
            const existing = await prisma.productoMaestro.findFirst({
                where: {
                    familia_id: familiaId,
                    variante_id: config.variante_id!,
                    tamano_id: config.tamano_id!
                }
            });

            if (existing) {
                skippedCount++;
                continue;
            }

            // 4. Create Name & Description & Code
            const nombreProducto = familia.nombre_cientifico;
            const descripcionProducto = `Variante: ${config.variante.nombre} - Tamaño: ${config.tamano.nombre}`;

            // Auto-generate code: FAM-001
            // 1. Get Prefix
            const fCode = familia.nombre_cientifico.substring(0, 3).toUpperCase();

            // 2. Find max current code for this prefix
            const existingCodes = await prisma.productoMaestro.findMany({
                where: { codigo: { startsWith: `${fCode}-` } },
                select: { codigo: true }
            });

            let maxNum = 0;
            existingCodes.forEach(p => {
                const parts = p.codigo?.split('-');
                if (parts && parts.length >= 2) {
                    const num = parseInt(parts[1], 10);
                    if (!isNaN(num) && num > maxNum) {
                        maxNum = num;
                    }
                }
            });

            // 3. Assign Next
            const nextNum = maxNum + 1;
            const codigo = `${fCode}-${nextNum.toString().padStart(3, '0')}`;

            // 5. Create
            const productData = toUpperCaseFields({
                nombre: nombreProducto,
                codigo: codigo,
                descripcion: descripcionProducto,
                familia_id: familiaId,
                variante_id: config.variante_id!,
                tamano_id: config.tamano_id!
            });

            await prisma.productoMaestro.create({
                data: productData
            });
            createdCount++;
        }

        revalidatePath("/productos/maestros");
        return { created: createdCount, skipped: skippedCount };

    } catch (error) {
        console.error("Error generating products:", error);
        throw new Error("Error al generar productos automáticamente");
    }
}


export type ProductoMaestroWithRelations = ProductoMaestro & {
    familia: Familia;
    variante: Variante;
    tamano: Tamano;
    allowed_empaques: (ProductoEmpaque & { empaque: Empaque })[];
};

export type GetProductosMaestrosParams = {
    page?: number;
    limit?: number;
    search?: string;
    familiaId?: string;
    varianteId?: string;
    tamanoId?: string;
};

export type GetProductosMaestrosResponse = {
    data: ProductoMaestroWithRelations[];
    total: number;
    totalPages: number;
    currentPage: number;
};

export async function getProductosMaestrosAction({
    page = 1,
    limit = 10,
    search = "",
    familiaId,
    varianteId,
    tamanoId,
}: GetProductosMaestrosParams = {}): Promise<GetProductosMaestrosResponse> {
    try {
        const skip = (page - 1) * limit;

        // Build Where Clause
        const where: any = {};

        // 1. Search (Text)
        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: "insensitive" } },
                { codigo: { contains: search, mode: "insensitive" } },
                { descripcion: { contains: search, mode: "insensitive" } },
                { familia: { nombre_cientifico: { contains: search, mode: "insensitive" } } },
            ];
        }

        // 2. Filters (Exact Match)
        if (familiaId && familiaId !== "all") where.familia_id = parseInt(familiaId);
        if (varianteId && varianteId !== "all") where.variante_id = parseInt(varianteId);
        if (tamanoId && tamanoId !== "all") where.tamano_id = parseInt(tamanoId);

        const [data, total] = await Promise.all([
            prisma.productoMaestro.findMany({
                where,
                include: {
                    familia: true,
                    variante: true,
                    tamano: true,
                    allowed_empaques: {
                        include: { empaque: true }
                    }
                },
                skip,
                take: limit,
                orderBy: { id: "desc" },
            }),
            prisma.productoMaestro.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            totalPages,
            currentPage: page,
        };
    } catch (error) {
        console.error("Error fetching productos maestros:", error);
        return { data: [], total: 0, totalPages: 0, currentPage: 1 };
    }
}

export async function createProductoMaestroAction(formData: FormData) {
    try {
        const nombre = formData.get("nombre") as string;
        const descripcion = formData.get("descripcion") as string;
        const familia_id = parseInt(formData.get("familia_id") as string);
        const variante_id = parseInt(formData.get("variante_id") as string);
        const tamano_id = parseInt(formData.get("tamano_id") as string);

        const empaques_ids = formData.get("empaques") ? (formData.get("empaques") as string).split(",").map(Number) : [];

        // Auto-generate Code if not provided (though this action is manual creation, we should support auto-gen too)
        // Need to fetch names to generate code if we want to support it here. 
        // For simplicity, if manual creation, let's try to generate if missing using IDs? 
        // Or better, fetch the relations to generate the code.

        let codigo = formData.get("codigo") as string;

        if (!codigo) {
            const [f, v, t] = await Promise.all([
                prisma.familia.findUnique({ where: { id: familia_id } }),
                prisma.variante.findUnique({ where: { id: variante_id } }),
                prisma.tamano.findUnique({ where: { id: tamano_id } })
            ]);

            if (f && v && t) {
                // Auto-generate code: FAM-001
                const fCode = f.nombre_cientifico.substring(0, 3).toUpperCase();

                const existingCodes = await prisma.productoMaestro.findMany({
                    where: { codigo: { startsWith: `${fCode}-` } },
                    select: { codigo: true }
                });

                let maxNum = 0;
                existingCodes.forEach(p => {
                    const parts = p.codigo?.split('-');
                    if (parts && parts.length >= 2) {
                        const num = parseInt(parts[1], 10);
                        if (!isNaN(num) && num > maxNum) {
                            maxNum = num;
                        }
                    }
                });

                const nextNum = maxNum + 1;
                codigo = `${fCode}-${nextNum.toString().padStart(3, '0')}`;
            }
        }

        const rawData = {
            nombre,
            codigo,
            descripcion,
            familia_id,
            variante_id,
            tamano_id,
        };

        const productData = toUpperCaseFields(rawData);

        await prisma.$transaction(async (tx) => {
            const product = await tx.productoMaestro.create({
                data: productData,
            });

            if (empaques_ids.length > 0) {
                await tx.productoEmpaque.createMany({
                    data: empaques_ids.map(eid => ({
                        producto_id: product.id,
                        empaque_id: eid
                    }))
                });
            }
        });

        revalidatePath("/productos/maestros");
    } catch (error) {
        console.error("Error creating producto maestro:", error);
        throw new Error("Error al crear el producto maestro");
    }
}

export async function updateProductoMaestroAction(formData: FormData) {
    try {
        const id = parseInt(formData.get("id") as string);
        const nombre = formData.get("nombre") as string;
        const descripcion = formData.get("descripcion") as string;
        const familia_id = parseInt(formData.get("familia_id") as string);
        const variante_id = parseInt(formData.get("variante_id") as string);
        const tamano_id = parseInt(formData.get("tamano_id") as string);

        const codigo = formData.get("codigo") as string;

        const empaques_ids = formData.get("empaques") ? (formData.get("empaques") as string).split(",").map(Number) : [];

        const rawData = {
            nombre,
            codigo,
            descripcion,
            familia_id,
            variante_id,
            tamano_id,
        };

        const productData = toUpperCaseFields(rawData);

        // Transaction to update product and manage relations
        await prisma.$transaction(async (tx) => {
            await tx.productoMaestro.update({
                where: { id },
                data: productData,
            });

            // Sync Allowed Empaques
            await tx.productoEmpaque.deleteMany({
                where: { producto_id: id }
            });

            if (empaques_ids.length > 0) {
                await tx.productoEmpaque.createMany({
                    data: empaques_ids.map(eid => ({
                        producto_id: id,
                        empaque_id: eid
                    }))
                });
            }
        });

        revalidatePath("/productos/maestros");
    } catch (error) {
        console.error("Error updating producto maestro:", error);
        throw new Error("Error al actualizar el producto maestro");
    }
}

export async function deleteProductoMaestroAction(id: number) {
    try {
        await prisma.productoMaestro.delete({
            where: { id },
        });
        revalidatePath("/productos/maestros");
    } catch (error) {
        console.error("Error deleting producto maestro:", error);
        throw new Error("Error al eliminar el producto maestro");
    }
}
