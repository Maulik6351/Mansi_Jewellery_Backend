import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Create Super Admin
    const superAdminEmail = 'admin@mansijewellery.com';
    const existingAdmin = await prisma.admin.findUnique({
        where: { email: superAdminEmail },
    });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        await prisma.admin.create({
            data: {
                email: superAdminEmail,
                passwordHash: hashedPassword,
                fullName: 'Super Admin',
                role: Role.SUPER_ADMIN,
                isActive: true,
            },
        });
        console.log('✅ Super Admin created: admin@mansijewellery.com / Admin@123');
    } else {
        console.log('ℹ️ Super Admin already exists.');
    }

    // 2. Create Base Categories
    const categories = [
        { name: 'Rings', description: 'Exquisite diamond and gold rings' },
        { name: 'Necklaces', description: 'Elegant necklaces and pendants' },
        { name: 'Earrings', description: 'Timeless earring collections' },
        { name: 'Bracelets', description: 'Luxury bracelets and bangles' },
        { name: 'Bridal', description: 'Premium bridal jewellery sets' },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat,
        });
    }
    console.log(`✅ ${categories.length} base categories created/updated.`);

    console.log('✨ Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
