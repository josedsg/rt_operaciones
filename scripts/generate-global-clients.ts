import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLIENTS_PER_REGION = 10;

// Fake Data Arrays
const USA_NAMES = [
    "Miami Floral Imports", "Sunshine State Blooms", "New York Petals", "California Flower Exchange",
    "Texas Rose Distributors", "Chicago Floral Market", "Seattle Stem Supply", "Boston Bouquet Co.",
    "Florida Fresh Cuts", "American Wholesale Florist"
];

const EU_NAMES = [
    "Amsterdam Tulips B.V.", "London Royal Blooms", "Paris Fleur Exclusif", "Berlin Blumen Handel",
    "Madrid Flores Global", "Rome Fiori Import", "Brussels Botanics", "Vienna Floral logistics",
    "Swiss Alpine Flowers", "Nordic Petal Group"
];

const CAM_NAMES = [
    "Guatemala Blooms S.A.", "Flores de San Salvador", "Panama City Orchids", "Tegucigalpa Rosas",
    "Nicaragua Ferns & Flowers", "Belize Tropicals", "San Jose Exports (non-CR)", "Honduras Flora",
    "El Salvador Greenery", "Panama Canal Florals"
];

async function main() {
    console.log("🚀 Starting Global Clients Generation...");

    // 1. Ensure Dependencies
    const tipoId = await prisma.tipoIdentificacion.findFirst();
    const tipoCliente = await prisma.tipoCliente.findFirst();
    const terminos = await prisma.terminosPago.findFirst();

    if (!tipoId || !tipoCliente || !terminos) throw new Error("Missing base data types.");

    // 2. Fetch Countries
    // Ensure we have IDs for USA, Holland (EU proxy), Guatemala (CAM proxy) or similar
    // From seed.ts: 'Estados Unidos', 'Holanda (Países Bajos)', 'Guatemala', 'Panamá', etc.

    const usa = await prisma.pais.findFirst({ where: { nombre: { contains: 'Estados Unidos' } } });
    const holanda = await prisma.pais.findFirst({ where: { nombre: { contains: 'Holanda' } } });
    const guatemala = await prisma.pais.findFirst({ where: { nombre: { contains: 'Guatemala' } } });

    // Fallbacks if distinct countries missing, but assuming seed ran they exist.
    // We will distribute EU across Holanda, Belgium, Spain etc if available, otherwise just Holanda.
    const euCountries = await prisma.pais.findMany({
        where: { nombre: { in: ['Holanda (Países Bajos)', 'Bélgica', 'Alemania', 'España', 'Italia', 'Reino Unido'] } }
    });

    const camCountries = await prisma.pais.findMany({
        where: { nombre: { in: ['Guatemala', 'Panamá', 'Nicaragua', 'Honduras', 'El Salvador'] } }
    });

    if (!usa) console.warn("USA country not found, skipping USA clients.");
    if (euCountries.length === 0) console.warn("EU countries not found, skipping EU clients.");
    if (camCountries.length === 0) console.warn("CAM countries not found, skipping CAM clients.");

    // 3. Fetch Logistics
    const terminals = await prisma.terminal.findMany();
    const agencies = await prisma.agencia.findMany();

    if (terminals.length === 0 || agencies.length === 0) console.warn("Warning: No Terminals or Agencies found. Clients will have null logistics.");

    // Helper
    const getRand = (arr: any[]) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

    // 4. Create Clients

    // USA
    if (usa) {
        console.log("🇺🇸 Creating USA Clients...");
        for (const name of USA_NAMES) {
            await createClient(name, usa.id, "USA", tipoId.id, tipoCliente.id, terminos.id, getRand(terminals), getRand(agencies));
        }
    }

    // EU
    if (euCountries.length > 0) {
        console.log("🇪🇺 Creating EU Clients...");
        for (const name of EU_NAMES) {
            const country = getRand(euCountries);
            await createClient(name, country.id, "EU", tipoId.id, tipoCliente.id, terminos.id, getRand(terminals), getRand(agencies));
        }
    }

    // CAM
    if (camCountries.length > 0) {
        console.log("🌎 Creating Central America Clients...");
        for (const name of CAM_NAMES) {
            const country = getRand(camCountries);
            await createClient(name, country.id, "CAM", tipoId.id, tipoCliente.id, terminos.id, getRand(terminals), getRand(agencies));
        }
    }

    console.log("✅ Global Clients Seed Completed.");
}

async function createClient(
    name: string,
    paisId: number,
    regionCode: string,
    tipoId: number,
    tipoCliente: number,
    terminosId: number,
    terminal: any,
    agencia: any
) {
    const idStr = `CL-${regionCode}-${name.replace(/\s+/g, '').substring(0, 5).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const existing = await prisma.cliente.findFirst({ where: { nombre: name } });
    if (existing) {
        // Update logistics if null? Or just skip.
        // Let's just update logistics to ensure distribution
        await prisma.cliente.update({
            where: { id: existing.id },
            data: {
                terminal_id: terminal?.id,
                agencia_id: agencia?.id
            }
        });
        console.log(`   ~ Updated: ${name}`);
        return;
    }

    await prisma.cliente.create({
        data: {
            identificacion: idStr,
            nombre: name,
            nombre_comercial: name,
            email_notificacion: `info@${name.replace(/\s+/g, '').toLowerCase()}.com`,
            tipo_identificacion_id: tipoId,
            tipo_cliente_id: tipoCliente,
            pais_id: paisId,
            terminos_pago_id: terminosId,
            direccion: `${regionCode} Address Mock`,
            terminal_id: terminal?.id,
            agencia_id: agencia?.id
        }
    });
    console.log(`   + Created: ${name}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
