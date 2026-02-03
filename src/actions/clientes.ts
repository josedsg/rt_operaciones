"use server";

import { prisma } from "@/lib/prisma";
import { Cliente } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { toUpperCaseFields } from "@/lib/utils";

// --- Lookups ---

export async function getTiposIdentificacionAction() {
    return await prisma.tipoIdentificacion.findMany({ orderBy: { id: "asc" } });
}

export async function getTerminalesAction() {
    return await prisma.terminal.findMany({ orderBy: { nombre: "asc" } });
}

export async function getAgenciasAction() {
    return await prisma.agencia.findMany({ orderBy: { nombre: "asc" } });
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

export async function getClientesAction(
    page = 1,
    limit = 20,
    filters = { nombre: "", tipo_cliente: "" }
) {
    try {
        const skip = (page - 1) * limit;

        const whereClause: any = {};

        if (filters.nombre) {
            whereClause.OR = [
                { nombre: { contains: filters.nombre, mode: "insensitive" } },
                { nombre_comercial: { contains: filters.nombre, mode: "insensitive" } },
                // Si tuviéramos un campo código explícito idealmente filtraríamos por él también
                // { codigo: { contains: filters.nombre, mode: "insensitive" } } 
            ];

            // Intento de búsqueda por ID si es numérico
            const idSearch = Number(filters.nombre);
            if (!isNaN(idSearch)) {
                whereClause.OR.push({ id: idSearch });
            }
        }

        if (filters.tipo_cliente && filters.tipo_cliente !== "TODOS") {
            whereClause.tipo_cliente_id = Number(filters.tipo_cliente);
        }

        const [clientes, total] = await Promise.all([
            prisma.cliente.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { id: "desc" },
                include: {
                    tipo_cliente: true,
                    tipo_identificacion: true,
                    terminos_pago: true,
                    pais: true,
                    provincia: true,
                    canton: true,
                    distrito: true,
                    agencia: true,
                    terminal: true
                },
            }),
            prisma.cliente.count({ where: whereClause })
        ]);

        return { data: clientes, total };
    } catch (error) {
        console.error("Error al obtener clientes desde Prisma:", error);
        return { data: [], total: 0 };
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
                allowed_empaques: {
                    include: { empaque: true }
                }
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
        const { empaques, ...cleanData } = data;

        const formattedData = {
            ...toUpperCaseFields(cleanData),
            tipo_identificacion_id: Number(data.tipo_identificacion_id),
            tipo_cliente_id: Number(data.tipo_cliente_id),
            pais_id: Number(data.pais_id),
            provincia_id: Number(data.provincia_id) || null,
            canton_id: Number(data.canton_id) || null,
            distrito_id: Number(data.distrito_id) || null,
            terminos_pago_id: Number(data.terminos_pago_id),
            fecha_vencimiento_exoneracion: data.fecha_vencimiento_exoneracion ? new Date(data.fecha_vencimiento_exoneracion) : null,
            tipo_facturacion: data.tipo_facturacion || "GRAVADO",
            // agencia: data.agencia || null, // REMOVED
            // terminal: data.terminal || null // REMOVED
            agencia_id: Number(data.agencia_id) || null,
            terminal_id: Number(data.terminal_id) || null
        };

        const empaques_ids = data.empaques ? data.empaques.map(Number) : [];

        const cliente = await prisma.$transaction(async (tx) => {
            const newCliente = await tx.cliente.create({
                data: formattedData,
            });

            if (empaques_ids.length > 0) {
                await tx.clienteEmpaque.createMany({
                    data: empaques_ids.map((eid: number) => ({
                        cliente_id: newCliente.id,
                        empaque_id: eid
                    }))
                });
            }
            return newCliente;
        });

        revalidatePath("/clientes");
        return cliente;
    } catch (error) {
        console.error("Error al crear cliente:", error);
        throw new Error("No se pudo crear el cliente");
    }
}

export async function deleteClienteAction(id: number) {
    try {
        await prisma.cliente.delete({ where: { id } });
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar cliente:", error);
        throw new Error("No se pudo eliminar el cliente");
    }
}

export async function updateClienteAction(id: number, data: any) {
    try {
        const { empaques, ...cleanData } = data;

        const formattedData = {
            ...toUpperCaseFields(cleanData),
            tipo_identificacion_id: Number(data.tipo_identificacion_id),
            tipo_cliente_id: Number(data.tipo_cliente_id),
            pais_id: Number(data.pais_id),
            provincia_id: Number(data.provincia_id) || null,
            canton_id: Number(data.canton_id) || null,
            distrito_id: Number(data.distrito_id) || null,
            terminos_pago_id: Number(data.terminos_pago_id),
            fecha_vencimiento_exoneracion: data.fecha_vencimiento_exoneracion ? new Date(data.fecha_vencimiento_exoneracion) : null,
            tipo_facturacion: data.tipo_facturacion || "GRAVADO",
            agencia_id: Number(data.agencia_id) || null,
            terminal_id: Number(data.terminal_id) || null
        };

        const empaques_ids = data.empaques ? data.empaques.map(Number) : [];

        // Transaction for Update + Relations
        const cliente = await prisma.$transaction(async (tx) => {
            const c = await tx.cliente.update({
                where: { id },
                data: formattedData,
            });

            // Sync Allowed Empaques
            await tx.clienteEmpaque.deleteMany({
                where: { cliente_id: id }
            });

            if (empaques_ids.length > 0) {
                await tx.clienteEmpaque.createMany({
                    data: empaques_ids.map((eid: number) => ({
                        cliente_id: id,
                        empaque_id: eid
                    }))
                });
            }
            return c;
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
