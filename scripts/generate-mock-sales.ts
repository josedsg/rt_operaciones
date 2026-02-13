import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLIENT_COUNT = 20;
const START_DATE = new Date('2026-02-01');
const END_DATE = new Date('2026-03-31');
const ORDERS_PER_DAY = 5; // Generate 5 orders every Mon/Wed/Fri
const LINES_PER_ORDER = 45; // At least 40

async function main() {
    console.log("🚀 Starting Mock Data Generation for Performance Testing...");

    // 1. Ensure Dependencies
    const pais = await prisma.pais.findFirst({ where: { nombre: 'Costa Rica' } }); // Default
    const tipoId = await prisma.tipoIdentificacion.findFirst();
    const tipoCliente = await prisma.tipoCliente.findFirst();
    const terminos = await prisma.terminosPago.findFirst();

    // Attempt to find geography defaults
    const prov = await prisma.provincia.findFirst();
    const cant = await prisma.canton.findFirst({ where: { provincia_id: prov?.id } });
    const dist = await prisma.distrito.findFirst({ where: { canton_id: cant?.id } });

    if (!pais || !tipoId || !tipoCliente || !terminos) {
        throw new Error("Missing base data (Pais, TipoID, TipoCliente, Terminos). Run seed first.");
    }

    // 2. Fetch Existing Clients (Global Clients)
    console.log(`👤 Fetching Existing Clients...`);
    const clients = await prisma.cliente.findMany({
        where: {
            // Filter out any leftover tests if needed, or just take all
            terminos_pago_id: { not: undefined }
        },
        include: { terminal: true, agencia: true } // Include logistics for logging/check
    });

    if (clients.length === 0) {
        throw new Error("No clients found. Please run 'generate-global-clients' first.");
    }
    console.log(`   Found ${clients.length} clients.`);

    // 3. Ensure Providers (Specific Requests)
    const PROVIDER_NAMES = ["Río", "FYV Irazú", "HDC", "Kewi", "La Tigra", "Obashe", "Seanda", "Volcán"];
    console.log(`🏭 Ensuring ${PROVIDER_NAMES.length} Specific Providers...`);

    const providers = [];
    for (const name of PROVIDER_NAMES) {
        let prov = await prisma.proveedor.findFirst({ where: { nombre: name } });
        if (!prov) {
            prov = await prisma.proveedor.create({
                data: { nombre: name, direccion: "Mock Address" }
            });
            console.log(`   + Created Provider: ${name}`);
        }
        providers.push(prov);
    }

    // 4. Fetch Products & Link Providers
    const products = await prisma.productoMaestro.findMany({
        take: 200,
        include: {
            variante: true,
            tamano: true,
            familia: true,
            allowed_empaques: { include: { empaque: true } }
        }
    });

    if (products.length === 0) {
        throw new Error("No products found. Please run initial seed.");
    }

    // Link All Products to All Providers (Requested for Test)
    console.log("🔗 Linking All Products to All Providers...");
    for (const prod of products) {
        for (const prov of providers) {
            // Upsert or Ignore
            const exists = await prisma.productoProveedor.findUnique({
                where: {
                    producto_id_proveedor_id: {
                        producto_id: prod.id,
                        proveedor_id: prov.id
                    }
                }
            });

            if (!exists) {
                await prisma.productoProveedor.create({
                    data: {
                        producto_id: prod.id,
                        proveedor_id: prov.id,
                        precio_referencia: Math.random() * 5 + 1
                    }
                });
            }
        }
    }


    // 5. Generate Orders
    console.log(`📅 Generating Orders from ${START_DATE.toISOString().split('T')[0]} to ${END_DATE.toISOString().split('T')[0]}...`);

    let currentDate = new Date(START_DATE);
    let orderCount = 0;

    // Helper to get random item
    const getRand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

    while (currentDate <= END_DATE) {
        const day = currentDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

        // Mon(1), Wed(3), Fri(5)
        if (day === 1 || day === 3 || day === 5) {
            console.log(`   Processing Date: ${currentDate.toDateString()}`);

            for (let o = 0; o < ORDERS_PER_DAY; o++) {
                const client = getRand(clients);
                const orderCode = `PV-MOCK-${currentDate.getTime()}-${o}`; // Unique-ish

                // Create Order
                const pedido = await prisma.pedidoVenta.create({
                    data: {
                        codigo: orderCode,
                        cliente_id: client.id,
                        fecha_pedido: currentDate,
                        moneda: 'USD',
                        estado: 'BORRADOR', // Or CONFIRMADO
                        agencia: client.agencia?.nombre || "Agencia Mock",
                        terminal: client.terminal?.nombre || "Terminal Mock",
                        usuario_id: 1 // Assume Admin
                    }
                });

                // Create Lines
                let orderTotal = 0;
                const linesData = [];

                for (let l = 0; l < LINES_PER_ORDER; l++) {
                    const prod = getRand(products);
                    const randomProvider = getRand(providers); // Pick random provider for this line

                    // Pick Empaque allowed for product, or random from all if allow_all/none defined (checking allowed list first)
                    let empaqueId = null;
                    if (prod.allowed_empaques && prod.allowed_empaques.length > 0) {
                        empaqueId = getRand(prod.allowed_empaques).empaque_id;
                    }
                    // Fallback to null empaque is okay, or pick one random if strict? Leaving null is safer if no map.

                    const boxes = Math.floor(Math.random() * 10) + 1;
                    const price = Math.random() * 5 + 2; // 2.00 - 7.00
                    const subtotal = boxes * price; // Simplified logic (usually boxes * stems * price)

                    linesData.push({
                        pedido_id: pedido.id,
                        familia_id: prod.familia_id,
                        producto_id: prod.id,
                        variante_id: prod.variante_id,
                        tamano_id: prod.tamano_id,
                        empaque_id: empaqueId,
                        proveedor_id: randomProvider.id, // <--- Assign Provider
                        cajas: boxes,
                        cantidad: boxes, // quantity usually equals boxes or bunches
                        precio_unitario: price,
                        subtotal: subtotal,
                        total: subtotal,
                        descripcion: `${prod.nombre} - ${prod.variante.nombre} (Mock)`
                    });

                    orderTotal += subtotal;
                }

                // Batch insert lines
                await prisma.lineaPedidoVenta.createMany({
                    data: linesData
                });

                // Update Order Total
                await prisma.pedidoVenta.update({
                    where: { id: pedido.id },
                    data: { total: orderTotal, subtotal: orderTotal }
                });

                orderCount++;
            }
        }

        // Next Day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`✅ Completed! Generated ${orderCount} Orders with ~${orderCount * LINES_PER_ORDER} Lines.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
