import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@admin.com';
    const password = 'admin';

    console.log(`Checking user: ${email}`);
    const user = await prisma.usuario.findUnique({ where: { email } });

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log('User found:', {
        id: user.id,
        email: user.email,
        passwordHash: user.password
    });

    const match = await bcrypt.compare(password, user.password);
    console.log('Password match:', match);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
