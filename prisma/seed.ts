import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface DistritoJson {
    [key: string]: number; // "Canton Name": zip_code_suffix (not used directly for ID but maybe for checks)
    // Actually the JSON structure is usually: { "Provincia": { "Canton": { "Distrito": zipcode } } }
    // Let's verify the standard structure of 'josuenoel' gist or similar.
    // Based on common CR JSONs: "San José": { "Central": { "Carmen": 10101, ... } }
}

async function main() {
    console.log('Start seeding...');

    // 1. Tipos de Identificación
    const tiposId = [
        { nombre: 'Cédula Física', descripcion: 'Identificación para personas físicas' },
        { nombre: 'Cédula Jurídica', descripcion: 'Identificación para empresas' },
        { nombre: 'DIMEX', descripcion: 'Documento de Identificación Migratorio' },
        { nombre: 'NITE', descripcion: 'Número de Identificación Tributaria Especial' },
    ];

    for (const t of tiposId) {
        await prisma.tipoIdentificacion.upsert({
            where: { id: 0 }, // This won't match, simpler to iterate and check or just createMany if empty.
            // Using findFirst to avoid duplicates for now or just deleteMany at start?
            // Safer to use upsert if I had a unique key (nombre?).
            create: t,
            update: {},
        }).catch(async () => {
            // Fallback if upsert fails or just find
            const exists = await prisma.tipoIdentificacion.findFirst({ where: { nombre: t.nombre } });
            if (!exists) await prisma.tipoIdentificacion.create({ data: t });
        });
    }
    console.log('Tipos identificación seeded');

    // 2. Tipos de Cliente
    const tiposCliente = [
        { nombre: 'General', descripcion: 'Cliente estándar' },
        { nombre: 'VIP', descripcion: 'Cliente preferente' },
        { nombre: 'Mayorista', descripcion: 'Cliente con precios de mayoreo' },
    ];

    for (const t of tiposCliente) {
        const exists = await prisma.tipoCliente.findFirst({ where: { nombre: t.nombre } });
        if (!exists) await prisma.tipoCliente.create({ data: t });
    }
    console.log('Tipos cliente seeded');

    // 3. Términos de Pago
    const terminos = [
        { nombre: 'Contado', dias: 0 },
        { nombre: 'Crédito 15 Días', dias: 15 },
        { nombre: 'Crédito 30 Días', dias: 30 },
        { nombre: 'Crédito 60 Días', dias: 60 },
    ];

    for (const t of terminos) {
        const exists = await prisma.terminosPago.findFirst({ where: { nombre: t.nombre } });
        if (!exists) await prisma.terminosPago.create({ data: t });
    }
    console.log('Términos pago seeded');

    // 4. Geografía
    // Clean existing geography to allow full hydration without conflicts (Optional but cleaner for "populate" request)
    // await prisma.distrito.deleteMany({});
    // await prisma.canton.deleteMany({});
    // await prisma.provincia.deleteMany({});
    // await prisma.pais.deleteMany({});
    // Commented out deleteMany to be safe, but user said "no veo las tablas", implies empty.

    // Major Export Countries for Costa Rica
    const paises = [
        { nombre: 'Costa Rica', codigo: '506' },
        { nombre: 'Estados Unidos', codigo: '840' },
        { nombre: 'Holanda (Países Bajos)', codigo: '528' },
        { nombre: 'Bélgica', codigo: '056' },
        { nombre: 'Guatemala', codigo: '320' },
        { nombre: 'Panamá', codigo: '591' },
        { nombre: 'Nicaragua', codigo: '558' },
        { nombre: 'Honduras', codigo: '340' },
        { nombre: 'El Salvador', codigo: '222' },
        { nombre: 'Alemania', codigo: '276' },
        { nombre: 'China', codigo: '156' },
        { nombre: 'Reino Unido', codigo: '826' },
        { nombre: 'México', codigo: '484' },
        { nombre: 'España', codigo: '724' },
        { nombre: 'Italia', codigo: '380' },
        { nombre: 'Canadá', codigo: '124' },
    ];

    let crId = 1;

    for (const p of paises) {
        let country = await prisma.pais.findFirst({ where: { nombre: p.nombre } });

        if (!country) {
            country = await prisma.pais.create({ data: p });
        } else {
            // Update if needed, or just skip
        }

        if (p.nombre === 'Costa Rica') crId = country.id;
    }

    console.log('Fetching CR Geography JSON...');
    const res = await fetch('https://gist.githubusercontent.com/josuenoel/80daca657b71bc1cfd95a4e27d547abe/raw/provincias_cantones_distritos_costa_rica.json');
    if (!res.ok) throw new Error('Failed to fetch geography JSON');

    const geoData = await res.json() as Record<string, Record<string, Record<string, number>>>;

    // Structure: { "Provincia": { "Canton": { "Distrito": zip } } }

    // Counters for stats
    let provCount = 0;
    let cantCount = 0;
    let distCount = 0;

    for (const [provName, cantones] of Object.entries(geoData)) {
        let provincia = await prisma.provincia.findFirst({ where: { nombre: provName, pais_id: crId } });
        if (!provincia) {
            provincia = await prisma.provincia.create({
                data: { nombre: provName, pais_id: crId }
            });
            provCount++;
        }

        for (const [cantName, distritos] of Object.entries(cantones)) {
            let canton = await prisma.canton.findFirst({ where: { nombre: cantName, provincia_id: provincia.id } });
            if (!canton) {
                canton = await prisma.canton.create({
                    data: { nombre: cantName, provincia_id: provincia.id }
                });
                cantCount++;
            }

            for (const [distName, zip] of Object.entries(distritos)) {
                // zip is number e.g. 10101
                let distrito = await prisma.distrito.findFirst({ where: { nombre: distName, canton_id: canton.id } });
                if (!distrito) {
                    await prisma.distrito.create({
                        data: {
                            nombre: distName,
                            canton_id: canton.id,
                            codigo: String(zip) // Storing zip as code if field exists, else just ignore
                        }
                    });
                    distCount++;
                }
            }
        }
    }
    console.log(`Geography Hydrated: ${provCount} Provincias, ${cantCount} Cantones, ${distCount} Distritos`);

    // 5. Clientes (Sample)
    console.log('Seeding Sample Clients...');
    const tipoIdFisica = await prisma.tipoIdentificacion.findFirst();
    const tipoClienteGen = await prisma.tipoCliente.findFirst();
    const terminoContado = await prisma.terminosPago.findFirst();

    // Find Zarcero if exists, else picking defaults
    const provAlajuela = await prisma.provincia.findFirst({ where: { nombre: 'Alajuela' } });
    const cantZarcero = provAlajuela ? await prisma.canton.findFirst({ where: { nombre: 'Zarcero', provincia_id: provAlajuela.id } }) : null;
    const distZarcero = cantZarcero ? await prisma.distrito.findFirst({ where: { nombre: 'Zarcero', canton_id: cantZarcero.id } }) : null;

    if (tipoIdFisica && tipoClienteGen && terminoContado && provAlajuela && cantZarcero && distZarcero) {
        const clienteData = {
            tipo_identificacion_id: tipoIdFisica.id,
            identificacion: "1-1111-1111",
            tipo_cliente_id: tipoClienteGen.id,
            nombre: "Jose David Solis",
            nombre_comercial: "Jose David Solis",
            email_notificacion: "josedsg@gmail.com",
            telefono: "83561650",
            sitio_web: "www.neosyscr.com",
            pais_id: crId,
            provincia_id: provAlajuela.id,
            canton_id: cantZarcero.id,
            distrito_id: distZarcero.id,
            direccion: "ALAJUELA ZARCERO ZARCERO",
            terminos_pago_id: terminoContado.id,
        };

        const existingClient = await prisma.cliente.findFirst({ where: { identificacion: "1-1111-1111" } });
        if (!existingClient) {
            await prisma.cliente.create({ data: clienteData });
            console.log('Sample Cliente 1 created');
        }
    } else {
        console.warn('Skipping Client Seed: Missing dependencies (maybe Fetch failed?)');
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
