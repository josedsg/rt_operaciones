"use server";

import { prisma } from "@/lib/prisma";
import { Proveedor } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

export type GetProveedoresParams = {
    page?: number;
    limit?: number;
    search?: string;
};

export type GetProveedoresResponse = {
    data: Proveedor[];
    total: number;
    totalPages: number;
    currentPage: number;
};

export async function getProveedoresAction({
    page = 1,
    limit = 10,
    search = "",
}: GetProveedoresParams = {}): Promise<GetProveedoresResponse> {
    try {
        const skip = (page - 1) * limit;

        const where: { OR?: any[] } = {};
        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: "insensitive" } },
                { codigo: { contains: search, mode: "insensitive" } },
                { identificacion: { contains: search, mode: "insensitive" } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.proveedor.findMany({
                where,
                skip,
                take: limit,
                orderBy: { id: "desc" },
            }),
            prisma.proveedor.count({ where }),
        ]);

        return {
            data,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        };
    } catch (error) {
        console.error("Error fetching proveedores:", error);
        return { data: [], total: 0, totalPages: 0, currentPage: 1 };
    }
}

export async function getProveedorByIdAction(id: number) {
    try {
        return await prisma.proveedor.findUnique({
            where: { id },
        });
    } catch (error) {
        console.error("Error fetching proveedor by ID:", error);
        return null;
    }
}

export async function createProveedorAction(formData: FormData) {
    try {
        const nombre = formData.get("nombre") as string;
        const codigo = formData.get("codigo") as string;
        const identificacion = formData.get("identificacion") as string;
        const contacto = formData.get("contacto") as string;
        const email = formData.get("email") as string;
        const telefono = formData.get("telefono") as string;
        const direccion = formData.get("direccion") as string;
        const es_principal = formData.get("es_principal") === "on";

        const rawData = {
            nombre,
            codigo: codigo || null,
            identificacion: identificacion || null,
            contacto: contacto || null,
            email: email || null,
            telefono: telefono || null,
            direccion: direccion || null,
            es_principal,
        };

        const providerData = toUpperCaseFields(rawData);

        const proveedor = await prisma.proveedor.create({
            data: providerData,
        });

        revalidatePath("/compras/proveedores");
        return proveedor;
    } catch (error) {
        console.error("Error creating proveedor:", error);
        throw new Error("Error al crear el proveedor");
    }
}

export async function updateProveedorAction(formData: FormData) {
    try {
        const id = parseInt(formData.get("id") as string);
        const nombre = formData.get("nombre") as string;
        const codigo = formData.get("codigo") as string;
        const identificacion = formData.get("identificacion") as string;
        const contacto = formData.get("contacto") as string;
        const email = formData.get("email") as string;
        const telefono = formData.get("telefono") as string;
        const direccion = formData.get("direccion") as string;
        const es_principal = formData.get("es_principal") === "on";

        const rawData = {
            nombre,
            codigo: codigo || null,
            identificacion: identificacion || null,
            contacto: contacto || null,
            email: email || null,
            telefono: telefono || null,
            direccion: direccion || null,
            es_principal,
        };

        const providerData = toUpperCaseFields(rawData);

        const proveedor = await prisma.proveedor.update({
            where: { id },
            data: providerData,
        });

        revalidatePath("/compras/proveedores");
        return proveedor;
    } catch (error) {
        console.error("Error updating proveedor:", error);
        throw new Error("Error al actualizar el proveedor");
    }
}

export async function deleteProveedorAction(id: number) {
    try {
        await prisma.proveedor.delete({
            where: { id },
        });
        revalidatePath("/compras/proveedores");
    } catch (error) {
        console.error("Error deleting proveedor:", error);
        throw new Error("Error al eliminar el proveedor");
    }
}

export async function getProductosByProveedorAction(proveedorId: number) {
    try {
        const prodProvs = await prisma.productoProveedor.findMany({
            where: { proveedor_id: proveedorId },
            include: {
                producto: {
                    include: {
                        familia: true,
                        variante: true,
                        tamano: true
                    }
                }
            }
        });
        return prodProvs;
    } catch (error) {
        console.error("Error fetching products by proveedor:", error);
        return [];
    }
}

export async function updateProductosProveedorAction(proveedorId: number, productoIds: number[]) {
    try {
        // Simple approach: delete all and recreate
        await prisma.$transaction([
            prisma.productoProveedor.deleteMany({
                where: { proveedor_id: proveedorId }
            }),
            prisma.productoProveedor.createMany({
                data: productoIds.map(pid => ({
                    proveedor_id: proveedorId,
                    producto_id: pid
                }))
            })
        ]);
        revalidatePath("/compras/proveedores");
    } catch (error) {
        console.error("Error updating products for proveedor:", error);
        throw new Error("Error al actualizar productos del proveedor");
    }
}
