
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Intentando conectar a la BD...');
        const grupo = await prisma.grupo.create({
            data: {
                nombre: 'Test Grupo Debug',
                descripcion: 'Test Descripcion Debug',
            },
        });
        console.log('Grupo creado exitosamente:', grupo);
    } catch (error) {
        console.error('Error detallado al crear grupo:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
