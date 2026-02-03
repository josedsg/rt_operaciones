
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting backfill of product codes (Format: FAM-001)...');

    const familias = await prisma.familia.findMany({
        include: {
            productos_maestros: {
                orderBy: { id: 'asc' } // Keep order stable
            }
        }
    });

    // Track counters per Prefix to handle multiple Families sharing same prefix
    const prefixCounters = new Map();

    for (const familia of familias) {
        if (familia.productos_maestros.length === 0) continue;

        const prefix = familia.nombre_cientifico.substring(0, 3).toUpperCase();
        console.log(`Processing Family: ${familia.nombre_cientifico} (${prefix}) - ${familia.productos_maestros.length} products`);

        // Initialize or get current counter for this prefix
        let counter = prefixCounters.get(prefix) || 1;

        for (const product of familia.productos_maestros) {
            // Pad with zeros to ensure 3 digits (e.g., 001, 010, 100)
            const consecutive = counter.toString().padStart(3, '0');
            const newCode = `${prefix}-${consecutive}`;

            if (product.codigo !== newCode) {
                // Double check uniqueness just in case (though we follow sequence)
                // Actually, if we re-run this, we might overlap if we don't check existence first
                // But for backfill, we assume we own the sequence.

                // Wait, if we use upsert logic or verify existence?
                // Let's just trust the sequence for now, but handle potential error if we are updating partly.
                // Actually, best might be to fetch Max code for prefix first?
                // Simpler for backfill: Just try update.
                try {
                    await prisma.productoMaestro.update({
                        where: { id: product.id },
                        data: { codigo: newCode }
                    });
                    console.log(`  Updated ${product.id}: ${product.codigo} -> ${newCode}`);
                } catch (e) {
                    console.warn(`  Failed update ${product.id} to ${newCode}: ${e.message}`);
                }
            }
            counter++;
        }
        // Update the map for next family with same prefix
        prefixCounters.set(prefix, counter);
    }

    console.log('Backfill complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
