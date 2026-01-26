"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function uploadInitialClients(jsonContent: any) {
    try {
        console.log("Iniciando carga masiva de clientes...");

        // 1. Validar estructura básica
        if (!jsonContent.clientes || !Array.isArray(jsonContent.clientes)) {
            throw new Error("El archivo JSON no tiene la propiedad 'clientes' o no es un array.");
        }

        // Usamos transacción para atomicidad
        // NOTA: No usamos try-catch DENTRO de la transacción para evitar "current transaction is aborted"
        await prisma.$transaction(async (tx) => {
            // ---------------------------------------------------------
            // PASO 1: LIMPIEZA DE DATOS
            // ---------------------------------------------------------
            console.log("Borrando datos existentes...");

            // 1.1 Datos Transaccionales (Ventas y Pedidos)
            await tx.configuracionAssorted.deleteMany({});
            await tx.lineaPedidoVenta.deleteMany({});
            await tx.pedidoVenta.deleteMany({});

            // 1.2 Datos Relacionales de Cliente
            await tx.clienteEmpaque.deleteMany({});

            // 1.3 Clientes
            await tx.cliente.deleteMany({});

            // ---------------------------------------------------------
            // PASO 2: PREPARAR DEFAULTS
            // ---------------------------------------------------------

            // 2.1 Tipo Identificación GENERICO (Default)
            let tipoIdGenerico = await tx.tipoIdentificacion.findFirst({ where: { nombre: "GENERICO" } });
            if (!tipoIdGenerico) {
                tipoIdGenerico = await tx.tipoIdentificacion.create({
                    data: { nombre: "GENERICO", descripcion: "Generado automáticamente para carga inicial" }
                });
            }

            // 2.1.2 Tipo Identificación NITE (Para Extranjeros)
            let tipoIdNite = await tx.tipoIdentificacion.findFirst({ where: { nombre: "NITE" } });
            if (!tipoIdNite) {
                tipoIdNite = await tx.tipoIdentificacion.create({
                    data: { nombre: "NITE", descripcion: "Número de Identificación Tributaria Especial (Extranjeros)" }
                });
            }

            // 2.2 Tipo Cliente (Extranjero por defecto si no es CR, luego afinaremos)
            let tipoClienteExtranjero = await tx.tipoCliente.findFirst({ where: { nombre: "EXTRANJERO" } });
            if (!tipoClienteExtranjero) {
                tipoClienteExtranjero = await tx.tipoCliente.create({
                    data: { nombre: "EXTRANJERO", descripcion: "Cliente Extranjero General" }
                });
            }

            let tipoClienteNacional = await tx.tipoCliente.findFirst({ where: { nombre: "NACIONAL" } });
            if (!tipoClienteNacional) {
                tipoClienteNacional = await tx.tipoCliente.create({
                    data: { nombre: "NACIONAL", descripcion: "Cliente Nacional (Costa Rica)" }
                });
            }

            // 2.3 Términos de Pago (Default NET 30 si no existe)
            let terminos = await tx.terminosPago.findFirst({ where: { nombre: "NET 30" } });
            if (!terminos) {
                terminos = await tx.terminosPago.create({
                    data: { nombre: "NET 30", dias: 30, descripcion: "Crédito a 30 días" }
                });
            }

            // 2.4 Pais Default (Por si acaso viene null en JSON o no existe)
            let paisDefault = await tx.pais.findFirst({ where: { nombre: "Desconocido" } });
            if (!paisDefault) {
                paisDefault = await tx.pais.create({
                    data: { nombre: "Desconocido", codigo: "UNK" }
                });
            }

            // Cache simple de paises para no consultar en cada iteración
            const paisesCache = new Map<string, number>();
            const allPaises = await tx.pais.findMany();
            allPaises.forEach(p => paisesCache.set(p.nombre.toLowerCase(), p.id));
            paisesCache.set("desconocido", paisDefault.id);

            // ---------------------------------------------------------
            // PASO 3: INSERTAR CLIENTES
            // ---------------------------------------------------------
            console.log("Insertando clientes...");

            let counter = 1;
            for (const item of jsonContent.clientes) {
                // Mapeo de Pais
                let paisId = paisDefault.id;
                let isCostaRica = false;

                if (item.pais) {
                    const normalizedPais = item.pais.trim().toLowerCase();
                    if (normalizedPais === "costa rica") isCostaRica = true;

                    // Intentar buscar directo
                    if (paisesCache.has(normalizedPais)) {
                        paisId = paisesCache.get(normalizedPais)!;
                    } else {
                        // Si no existe, lo creamos on-the-fly y agregamos al cache
                        // Nota: codigo a veces no está, usamos 3 letras del nombre
                        const nuevoPais = await tx.pais.create({
                            data: {
                                nombre: item.pais,
                                codigo: item.pais.substring(0, 3).toUpperCase()
                            }
                        });
                        paisId = nuevoPais.id;
                        paisesCache.set(normalizedPais, paisId);
                    }
                }

                // Lógica de Identificación
                // 1. Si viene nif_nit, usarlo.
                // 2. Si no, generar uno genérico
                const identificacion = item.nif_nit && item.nif_nit.trim() !== ""
                    ? item.nif_nit
                    : `GEN-${Date.now()}-${counter}`;

                // Lógica de Tipo Identificación y Tipo Cliente
                let tipoIdentificacionId = tipoIdGenerico.id;
                let tipoClienteId = tipoClienteExtranjero.id; // Default EXTRANJERO

                if (!isCostaRica) {
                    // Si NO es Costa Rica -> NITE + EXTRANJERO
                    tipoIdentificacionId = tipoIdNite.id;
                    tipoClienteId = tipoClienteExtranjero.id;
                } else {
                    // Si ES Costa Rica -> Podríamos usar GENERICO o tratar de inferir si es Cédula Física/Jurídica por formato
                    // De momento dejamos GENERICO + NACIONAL
                    tipoIdentificacionId = tipoIdGenerico.id;
                    tipoClienteId = tipoClienteNacional.id;
                }

                // Increment counter only if we generated an ID (optional, but harmless to increment always)
                counter++;

                // Crear Cliente
                await tx.cliente.create({
                    data: {
                        nombre: item.contacto || "Cliente Sin Nombre",
                        nombre_comercial: item.contacto,
                        identificacion: identificacion,
                        tipo_identificacion_id: tipoIdentificacionId,
                        tipo_cliente_id: tipoClienteId,
                        email_notificacion: item.emails,
                        telefono: item.telefono,
                        direccion: item.ciudad ? `${item.ciudad}, ${item.pais || ""}` : item.pais,
                        pais_id: paisId,
                        terminos_pago_id: terminos.id,
                        tipo_facturacion: "GRAVADO",
                    }
                });
            }
        }, {
            maxWait: 20000,
            timeout: 60000,
        });

        revalidatePath("/");
        return { success: true, message: "Carga de clientes completada correctamente." };

    } catch (error: any) {
        console.error("Error en uploadInitialClients:", error);
        return { success: false, error: error.message };
    }
}
