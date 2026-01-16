"use server";

import { prisma } from "@/lib/prisma";
import { Cliente } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

// --- Lookups ---

export async function getTiposIdentificacionAction() {
    return await prisma.tipoIdentificacion.findMany({ orderBy: { id: "asc" } });
}

export async function getTiposClienteAction() {
    return await prisma.tipoCliente.findMany({ orderBy: { id: "asc" } });
}

export async function getTerminosPagoAction() {
    return await prisma.terminosPago.findMany({ orderBy: { id: "asc" } });
}

export async function getPaisesAction() {
    return await prisma.pais.findMany({ orderBy: { nombre: "asc" } });
}

export async function getProvinciasAction() {
    return await prisma.provincia.findMany({ orderBy: { nombre: "asc" } });
}

export async function getCantonesAction(provinciaId: number) {
    if (!provinciaId) return [];
    return await prisma.canton.findMany({
        where: { provincia_id: provinciaId },
        orderBy: { nombre: "asc" },
    });
}

export async function getDistritosAction(cantonId: number) {
    if (!cantonId) return [];
    return await prisma.distrito.findMany({
        where: { canton_id: cantonId },
        orderBy: { nombre: "asc" },
    });
}

// --- CRUD ---

export async function getClientesAction() {
    try {
        const clientes = await prisma.cliente.findMany({
            orderBy: { id: "asc" },
            include: {
                tipo_cliente: true,
                tipo_identificacion: true,
                terminos_pago: true,
                pais: true,
                provincia: true,
                canton: true,
                distrito: true,
            },
        });
        return clientes;
    } catch (error) {
        console.error("Error al obtener clientes desde Prisma:", error);
        return [];
    }
}

export async function getClienteByIdAction(id: number) {
    try {
        return await prisma.cliente.findUnique({
            where: { id },
            include: {
                tipo_cliente: true,
                tipo_identificacion: true,
                terminos_pago: true,
                pais: true,
                provincia: true,
                canton: true,
                distrito: true,
            },
        });
    } catch (error) {
        console.error("Error al obtener cliente por ID:", error);
        return null;
    }
}

export async function createClienteAction(data: any) {
    try {
        // Ensure relations are integers
        const formattedData = {
            ...toUpperCaseFields(data),
            tipo_identificacion_id: Number(data.tipo_identificacion_id),
            tipo_cliente_id: Number(data.tipo_cliente_id),
            pais_id: Number(data.pais_id),
            provincia_id: Number(data.provincia_id) || null,
            canton_id: Number(data.canton_id) || null,
            distrito_id: Number(data.distrito_id) || null,
            terminos_pago_id: Number(data.terminos_pago_id),
            fecha_vencimiento_exoneracion: data.fecha_vencimiento_exoneracion ? new Date(data.fecha_vencimiento_exoneracion) : null,
            tipo_facturacion: data.tipo_facturacion || "GRAVADO"
        };

        const cliente = await prisma.cliente.create({
            data: formattedData,
        });
        revalidatePath("/clientes");
        return cliente;
    } catch (error) {
        console.error("Error al crear cliente:", error);
        throw new Error("No se pudo crear el cliente");
    }
}

export async function updateClienteAction(id: number, data: any) {
    try {
        const formattedData = {
            ...toUpperCaseFields(data),
            tipo_identificacion_id: Number(data.tipo_identificacion_id),
            tipo_cliente_id: Number(data.tipo_cliente_id),
            pais_id: Number(data.pais_id),
            provincia_id: Number(data.provincia_id) || null,
            canton_id: Number(data.canton_id) || null,
            distrito_id: Number(data.distrito_id) || null,
            terminos_pago_id: Number(data.terminos_pago_id),
            fecha_vencimiento_exoneracion: data.fecha_vencimiento_exoneracion ? new Date(data.fecha_vencimiento_exoneracion) : null,
            tipo_facturacion: data.tipo_facturacion || "GRAVADO"
        };

        const cliente = await prisma.cliente.update({
            where: { id },
            data: formattedData,
        });
        revalidatePath("/clientes");
        return cliente;
    } catch (error) {
        console.error("Error al actualizar cliente:", error);
        throw new Error("No se pudo actualizar el cliente");
    }
}

// --- CRUD: Tipo Cliente ---

export async function createTipoClienteAction(data: any) {
    try {
        await prisma.tipoCliente.create({ data: toUpperCaseFields(data) });
        revalidatePath("/clientes/configuracion/tipos-cliente");
        return { success: true };
    } catch (error) {
        console.error("Error creating tipo cliente:", error);
        return { success: false, error: "Error al crear tipo de cliente" };
    }
}

export async function updateTipoClienteAction(id: number, data: any) {
    try {
        await prisma.tipoCliente.update({
            where: { id },
            data: toUpperCaseFields(data),
        });
        revalidatePath("/clientes/configuracion/tipos-cliente");
        return { success: true };
    } catch (error) {
        console.error("Error updating tipo cliente:", error);
        return { success: false, error: "Error al actualizar tipo de cliente" };
    }
}

export async function deleteTipoClienteAction(id: number) {
    try {
        await prisma.tipoCliente.delete({ where: { id } });
        revalidatePath("/clientes/configuracion/tipos-cliente");
        return { success: true };
    } catch (error) {
        console.error("Error deleting tipo cliente:", error);
        return { success: false, error: "No se puede eliminar porque está en uso" };
    }
}

// --- CRUD: Terminos Pago ---

export async function createTerminosPagoAction(data: any) {
    try {
        await prisma.terminosPago.create({
            data: {
                nombre: data.nombre.toUpperCase(),
                dias: Number(data.dias)
            }
        });
        revalidatePath("/clientes/configuracion/terminos-pago");
        return { success: true };
    } catch (error) {
        console.error("Error creating terminos pago:", error);
        return { success: false, error: "Error al crear término de pago" };
    }
}

export async function updateTerminosPagoAction(id: number, data: any) {
    try {
        await prisma.terminosPago.update({
            where: { id },
            data: {
                nombre: data.nombre.toUpperCase(),
                dias: Number(data.dias)
            }
        });
        revalidatePath("/clientes/configuracion/terminos-pago");
        return { success: true };
    } catch (error) {
        console.error("Error updating terminos pago:", error);
        return { success: false, error: "Error al actualizar término de pago" };
    }
}

export async function deleteTerminosPagoAction(id: number) {
    try {
        await prisma.terminosPago.delete({ where: { id } });
        revalidatePath("/clientes/configuracion/terminos-pago");
        return { success: true };
    } catch (error) {
        console.error("Error deleting terminos pago:", error);
        return { success: false, error: "No se puede eliminar porque está en uso" };
    }
}
