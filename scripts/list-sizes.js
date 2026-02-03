
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tamanos = await prisma.tamano.findMany({ select: { nombre: true } });
    console.log('--- SIZE NAMES ---');
    tamanos.forEach(t => console.log(t.nombre));
}

main().finally(() => prisma.$disconnect());
