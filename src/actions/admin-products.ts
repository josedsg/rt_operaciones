"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function uploadInitialData(jsonContent: any) {
    try {
        console.log("Iniciando carga masiva de datos...");

        // 1. Validar estructura básica
        if (!jsonContent.LISTAS_MAESTRAS || !jsonContent.JERARQUIA) {
            throw new Error("El archivo JSON no tiene la estructura esperada (LISTAS_MAESTRAS, JERARQUIA).");
        }

        await prisma.$transaction(async (tx) => {
            // ---------------------------------------------------------
            // PASO 1: LIMPIEZA DE DATOS (Orden por dependencias)
            // ---------------------------------------------------------
            console.log("Borrando datos existentes...");

            // 1.1 Eliminar Datos Transaccionales (Ventas/Pedidos) que referencian a productos
            // Primero los hijos de las líneas
            await tx.configuracionAssorted.deleteMany({});
            // Luego las líneas de pedido
            await tx.lineaPedidoVenta.deleteMany({});
            // Luego los pedidos (opcional, pero limpio para integridad de datos de prueba)
            await tx.pedidoVenta.deleteMany({});

            // 1.2 Eliminar Tablas de Relación de Productos
            await tx.productoProveedor.deleteMany({});
            await tx.productoEmpaque.deleteMany({});
            await tx.configuracionPermitida.deleteMany({});

            // 1.3 Eliminar Maestros de Productos
            await tx.productoMaestro.deleteMany({});

            // 1.4 Eliminar Tablas Maestras de Categorización
            await tx.familia.deleteMany({});
            await tx.grupo.deleteMany({});
            await tx.variante.deleteMany({});
            await tx.tamano.deleteMany({});
            await tx.empaque.deleteMany({});
            await tx.tipoEmpaque.deleteMany({});

            // ---------------------------------------------------------
            // PASO 2: CARGA DE LISTAS MAESTRAS (Con deduplicación)
            // ---------------------------------------------------------
            console.log("Cargando listas maestras...");

            const listas = jsonContent.LISTAS_MAESTRAS;

            // 2.1 Grupos
            const gruposUnicos = Array.from(new Set(listas.GRUPOS as string[]));
            for (const nombreGrupo of gruposUnicos) {
                await tx.grupo.create({
                    data: {
                        nombre: nombreGrupo,
                        descripcion: nombreGrupo
                    }
                });
            }

            // 2.2 Variantes
            const variantesUnicas = Array.from(new Set(listas.VARIANTES_COLOR as string[]));
            for (const nombreVariante of variantesUnicas) {
                await tx.variante.create({
                    data: { nombre: nombreVariante }
                });
            }

            // 2.3 Tamaños
            const tamanosUnicos = Array.from(new Set(listas.TAMANOS_GRADO as string[]));
            for (const nombreTamano of tamanosUnicos) {
                await tx.tamano.create({
                    data: { nombre: nombreTamano }
                });
            }

            // 2.4 Tipos de Empaque
            const tiposEmpaqueUnicos = Array.from(new Set(listas.EMPAQUES as string[]));
            for (const nombreTipoEmpaque of tiposEmpaqueUnicos) {
                await tx.tipoEmpaque.create({
                    data: {
                        nombre: nombreTipoEmpaque,
                        descripcion: nombreTipoEmpaque
                    }
                });
            }

            // 2.5 Empaques (Box Types)
            // Usamos un Map para asegurar unicidad por nombre de BOX_TYPE
            const processedBoxTypes = new Set();

            for (const box of listas.BOX_TYPES) {
                if (processedBoxTypes.has(box.BOX_TYPE)) continue; // Skip duplicates
                processedBoxTypes.add(box.BOX_TYPE);

                const tipoEmpaque = await tx.tipoEmpaque.findFirst({
                    where: { nombre: box.EMPAQUE }
                });

                if (!tipoEmpaque) {
                    console.warn(`Tipo de empaque ${box.EMPAQUE} no encontrado para box type ${box.BOX_TYPE}`);
                    continue;
                }

                // Extracción segura de dimensiones (tomando el primer valor del array)
                const dim = box.DIMENSIONES;
                const stemPerBunch = dim.STEM_PER_BUNCH?.[0] || 0;
                const bunchesPerBox = dim.BUNCHES_PER_BOX?.[0] || 0;
                const stemPerBox = dim.STEM_PER_BOX?.[0] || 0;

                // Ya validamos unicidad con el Set, y borramos la tabla antes, así que create directo es seguro
                await tx.empaque.create({
                    data: {
                        nombre: box.BOX_TYPE,
                        descripcion: `Tipo: ${box.EMPAQUE} | ${stemPerBunch} st/bunch x ${bunchesPerBox} bunches = ${stemPerBox} total`,
                        tipo_empaque_id: tipoEmpaque.id,
                        sxb: stemPerBunch,
                        bxb: bunchesPerBox,
                        st_x_bx: stemPerBox
                    }
                });
            }

            // ---------------------------------------------------------
            // PASO 3: CARGA DE JERARQUÍA Y PRODUCTOS
            // ---------------------------------------------------------
            console.log("Cargando jerarquía de productos...");

            const jerarquia = jsonContent.JERARQUIA;

            for (const grupoData of jerarquia) {
                const grupo = await tx.grupo.findFirst({ where: { nombre: grupoData.GRUPO } });
                if (!grupo) {
                    console.warn(`Grupo ${grupoData.GRUPO} no encontrado en paso anterior. Saltando.`);
                    continue;
                }

                for (const familiaData of grupoData.FAMILIAS) {
                    // Crear Familia
                    const familia = await tx.familia.create({
                        data: {
                            nombre_cientifico: familiaData.FAMILIA,
                            descripcion: familiaData.FAMILIA,
                            grupo_id: grupo.id
                        }
                    });

                    // Generar Productos Maestros (Producto Cartesiano: Variante x Tamaño)
                    // JSON Structure:
                    // "VARIANTES_COLOR": ["BLUE", ...],
                    // "TAMANOS_GRADO": ["PREMIUM - 80 CM", ...],
                    // "EMPAQUES": [ ... ] (Configuracion permitida global para esta familia y sus variantes/tamaños)

                    // Primero, aseguramos que EXISTAN las variantes y tamaños en DB (ya cargados en paso 2, pero los buscamos por ID)
                    // Para optimizar, podríamos buscarlos todos antes, pero lo haremos iterativo por simplicidad y robustez inicial.

                    for (const nombreVariante of familiaData.VARIANTES_COLOR) {
                        const variante = await tx.variante.findFirst({ where: { nombre: nombreVariante } });
                        if (!variante) {
                            console.warn(`Variante ${nombreVariante} no encontrada para familia ${familia.nombre_cientifico}`);
                            continue;
                        }

                        for (const nombreTamano of familiaData.TAMANOS_GRADO) {
                            const tamano = await tx.tamano.findFirst({ where: { nombre: nombreTamano } });
                            if (!tamano) {
                                console.warn(`Tamaño ${nombreTamano} no encontrado para familia ${familia.nombre_cientifico}`);
                                continue;
                            }

                            // 1. Crear Configuración Permitida
                            await tx.configuracionPermitida.create({
                                data: {
                                    familia_id: familia.id,
                                    variante_id: variante.id,
                                    tamano_id: tamano.id
                                }
                            });

                            // 2. Crear Producto Maestro
                            const producto = await tx.productoMaestro.create({
                                data: {
                                    nombre: familia.nombre_cientifico,
                                    descripcion: `Producto generado automáticamente`,
                                    familia_id: familia.id,
                                    variante_id: variante.id,
                                    tamano_id: tamano.id
                                }
                            });

                            // 3. Asignar Empaques Permitidos (Iteramos sobre la estructura de empaques de la familia)
                            // JSON Structure of EMPAQUES in FAMILIAS:
                            // "EMPAQUES": [ { "EMPAQUE": "BULK", "BOX_TYPES": [ { "BOX_TYPE": "QB FRESCA", ... } ] } ]
                            // Nota: En el JSON, los empaques están a nivel de Familia, no específicos por variante/tamaño.
                            // Asumimos que aplican a TODOS los productos de esa familia.

                            if (familiaData.EMPAQUES && Array.isArray(familiaData.EMPAQUES)) {
                                const empaquesToLink = new Set<string>(); // Para evitar duplicados en este producto

                                for (const empConfig of familiaData.EMPAQUES) {
                                    if (empConfig.BOX_TYPES && Array.isArray(empConfig.BOX_TYPES)) {
                                        for (const boxTypeConfig of empConfig.BOX_TYPES) {
                                            empaquesToLink.add(boxTypeConfig.BOX_TYPE);
                                        }
                                    }
                                }

                                for (const nombreBoxType of empaquesToLink) {
                                    const empaqueEntity = await tx.empaque.findFirst({
                                        where: { nombre: nombreBoxType }
                                    });

                                    if (empaqueEntity) {
                                        // Crear relación ProductoEmpaque
                                        await tx.productoEmpaque.create({
                                            data: {
                                                producto_id: producto.id,
                                                empaque_id: empaqueEntity.id
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }, {
            maxWait: 20000, // 20s
            timeout: 60000,  // 60s
        });

        revalidatePath("/");
        return { success: true, message: "Carga masiva completada correctamente." };

    } catch (error: any) {
        console.error("Error en uploadInitialData:", error);
        return { success: false, error: error.message };
    }
}
