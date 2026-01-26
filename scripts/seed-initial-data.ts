import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Instantiate Prisma
const prisma = new PrismaClient();

// Helper to normalize strings (uppercase)
const normalize = (str: string) => str.trim().toUpperCase();

async function main() {
    console.log("🚀 Starting Initial Data Seed...");

    // 1. Read JSON
    const jsonPath = path.join(process.cwd(), 'public', 'datos_maestros_productos_normalizados_v5_boxtype_con_empaque.json');
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(rawData);

    // --- MASTERS ---
    console.log("📦 Seeding Masters...");

    // GRUPOS
    for (const nombre of data.LISTAS_MAESTRAS.GRUPOS) {
        await prisma.grupo.upsert({
            where: { id: -1 }, // Hack: we don't have unique name index but we use findFirst/create pattern usually. Upsert needs unique.
            // Since name is not @unique in schema, we use findFirst
            update: {},
            create: { nombre: normalize(nombre), descripcion: normalize(nombre) }
        }).catch(async () => {
            // Fallback to findFirst if upsert fails on ID or check manually
        });
        // We will use findFirst + create because name is not unique in Schema (Check Schema again).
        // Schema: Grupo -> nombre String (Not unique)
        // Wait, if it's not unique, upsert won't work by name unless I add a unique constraint or use findFirst.
    }

    // BETTER APPROACH: Helper function for "Ensure Exists"
    const ensureGrupo = async (nombre: string) => {
        const n = normalize(nombre);
        const existing = await prisma.grupo.findFirst({ where: { nombre: n } });
        if (existing) return existing;
        return await prisma.grupo.create({ data: { nombre: n, descripcion: n } });
    };

    const ensureFamilia = async (nombre: string, grupoId: number) => {
        const n = normalize(nombre);
        const existing = await prisma.familia.findFirst({ where: { nombre_cientifico: n } });
        if (existing) return existing;
        return await prisma.familia.create({ data: { nombre_cientifico: n, descripcion: n, grupo_id: grupoId } });
    };

    const ensureVariante = async (nombre: string) => {
        const n = normalize(nombre);
        const existing = await prisma.variante.findFirst({ where: { nombre: n } });
        if (existing) return existing;
        return await prisma.variante.create({ data: { nombre: n } });
    };

    const ensureTamano = async (nombre: string) => {
        const n = normalize(nombre);
        const existing = await prisma.tamano.findFirst({ where: { nombre: n } });
        if (existing) return existing;
        return await prisma.tamano.create({ data: { nombre: n } });
    };

    const ensureTipoEmpaque = async (nombre: string) => {
        const n = normalize(nombre);
        const existing = await prisma.tipoEmpaque.findFirst({ where: { nombre: n } });
        if (existing) return existing;
        return await prisma.tipoEmpaque.create({ data: { nombre: n } });
    };

    // Initialize Maps to avoid frequent lookups
    const gruposMap = new Map<string, number>();
    const familiasMap = new Map<string, number>();
    const variantesMap = new Map<string, number>();
    const tamanosMap = new Map<string, number>();
    const tiposEmpaqueMap = new Map<string, number>();
    const empaquesMap = new Map<string, number>(); // Key: "TYPE_NAME|BOX_NAME" -> ID

    // SEED GRUPOS
    for (const g of data.LISTAS_MAESTRAS.GRUPOS) {
        const rec = await ensureGrupo(g);
        gruposMap.set(rec.nombre, rec.id);
    }

    // SEED FAMILIAS (Flat List first? JSON has FAMILIAS list)
    // NOTE: The flat list "FAMILIAS" in JSON doesn't imply Group. Hierarchy does.
    // But we need to create them. We can infer group from Hierarchy later or just create them now and update group later?
    // Schema relations: Familia REQUIRES Group.
    // So we must process Hierarchy to create families OR use a default group.
    // Hierarchy parsing is better source for Families creation linked to Groups.

    // SEED VARIANTES
    for (const v of data.LISTAS_MAESTRAS.VARIANTES_COLOR) {
        const rec = await ensureVariante(v);
        variantesMap.set(rec.nombre, rec.id);
    }

    // SEED TAMANOS
    for (const t of data.LISTAS_MAESTRAS.TAMANOS_GRADO) {
        const rec = await ensureTamano(t);
        tamanosMap.set(rec.nombre, rec.id);
    }

    // SEED TIPOS EMPAQUE
    for (const Te of data.LISTAS_MAESTRAS.EMPAQUES) {
        const rec = await ensureTipoEmpaque(Te);
        tiposEmpaqueMap.set(rec.nombre, rec.id);
    }

    // SEED BOX TYPES (Empaques)
    console.log("📦 Seeding Box Types...");
    for (const box of data.LISTAS_MAESTRAS.BOX_TYPES) {
        // box is { BOX_TYPE: "EB", EMPAQUE: ["BULK"] }
        const boxName = normalize(box.BOX_TYPE);

        for (const tipoNombre of box.EMPAQUE) {
            const tipoId = tiposEmpaqueMap.get(normalize(tipoNombre));
            if (!tipoId) {
                console.warn(`⚠️ Type ${tipoNombre} not found for box ${boxName}`);
                continue;
            }

            // Create Empaque record specifically for this Type
            // Since Schema doesn't enforce Unique Name, we create multiple "EB" if needed?
            // User requirement: "Boxtypes - hacia tabla empaques".
            // If "EB" exists for "BULK", good. If "EB" exists for "CB"? 
            // Schema has `tipo_empaque_id`.
            // We should check if an Empaque with this Name AND this Type exists.

            const existing = await prisma.empaque.findFirst({
                where: {
                    nombre: boxName,
                    tipo_empaque_id: tipoId
                }
            });

            if (!existing) {
                const created = await prisma.empaque.create({
                    data: {
                        nombre: boxName,
                        tipo_empaque_id: tipoId,
                        sxb: 0,
                        bxb: 0,
                        st_x_bx: 0
                    }
                });
                empaquesMap.set(`${normalize(tipoNombre)}|${boxName}`, created.id);
            } else {
                empaquesMap.set(`${normalize(tipoNombre)}|${boxName}`, existing.id);
            }
        }
    }

    // --- HIERARCHY & PRODUCTS ---
    console.log("🌳 Processing Hierarchy...");

    for (const gData of data.JERARQUIA) {
        const grupoId = gruposMap.get(normalize(gData.GRUPO));
        if (!grupoId) {
            console.error(`❌ Group ${gData.GRUPO} not found!`);
            continue;
        }

        for (const fData of gData.FAMILIAS) {
            // Create Familia Linked to Group
            const familia = await ensureFamilia(fData.FAMILIA, grupoId);
            familiasMap.set(familia.nombre_cientifico, familia.id); // For reference

            console.log(`🌸 Processing Family: ${familia.nombre_cientifico}`);

            // 1. CONFIGURACIONES PERMITIDAS
            // Cross product of VARIANTES_COLOR x TAMANOS_GRADO
            const variantes = fData.VARIANTES_COLOR || [];
            const tamanos = fData.TAMANOS_GRADO || [];

            for (const vName of variantes) {
                const vid = variantesMap.get(normalize(vName));
                if (!vid) continue;

                for (const tName of tamanos) {
                    const tid = tamanosMap.get(normalize(tName));
                    if (!tid) continue;

                    // Upsert Config
                    const existingConfig = await prisma.configuracionPermitida.findFirst({
                        where: {
                            familia_id: familia.id,
                            variante_id: vid,
                            tamano_id: tid
                        }
                    });

                    if (!existingConfig) {
                        await prisma.configuracionPermitida.create({
                            data: {
                                familia_id: familia.id,
                                variante_id: vid,
                                tamano_id: tid
                            }
                        });
                    }
                }
            }

            // 2. GENERATE PRODUCTS
            // Logic duplicated from `generateProductosFromConfigAction` to avoid server action context issues in script
            const configs = await prisma.configuracionPermitida.findMany({
                where: { familia_id: familia.id },
                include: { variante: true, tamano: true }
            });

            for (const config of configs) {
                if (!config.variante || !config.tamano) continue;

                const existingProd = await prisma.productoMaestro.findFirst({
                    where: {
                        familia_id: familia.id,
                        variante_id: config.variante_id!,
                        tamano_id: config.tamano_id!
                    }
                });

                let productId = existingProd?.id;

                if (!existingProd) {
                    const nombreProducto = familia.nombre_cientifico;
                    const descripcionProducto = `Variante: ${config.variante.nombre} - Tamaño: ${config.tamano.nombre}`;
                    const newProd = await prisma.productoMaestro.create({
                        data: {
                            nombre: normalize(nombreProducto),
                            descripcion: normalize(descripcionProducto),
                            familia_id: familia.id,
                            variante_id: config.variante_id!,
                            tamano_id: config.tamano_id!
                        }
                    });
                    productId = newProd.id;
                }

                // 3. ALLOWED EMPAQUES
                // fData.EMPAQUES is Array of { EMPAQUE: "TYPE", BOX_TYPES: ["BOX1", "BOX2"] }
                if (productId && fData.EMPAQUES) {
                    for (const empEntry of fData.EMPAQUES) {
                        const typeName = normalize(empEntry.EMPAQUE);

                        for (const boxName of empEntry.BOX_TYPES) {
                            const key = `${typeName}|${normalize(boxName)}`;
                            const empaqueId = empaquesMap.get(key);

                            if (empaqueId) {
                                // Link Product <-> Empaque
                                // Check if exists
                                await prisma.productoEmpaque.upsert({
                                    where: {
                                        producto_id_empaque_id: {
                                            producto_id: productId,
                                            empaque_id: empaqueId
                                        }
                                    },
                                    create: {
                                        producto_id: productId,
                                        empaque_id: empaqueId
                                    },
                                    update: {}
                                });
                            } else {
                                console.warn(`⚠️ Empaque not found for linking: ${key}`);
                            }
                        }
                    }
                }
            }
        }
    }

    console.log("✅ Seed Completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
