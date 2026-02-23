"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function test() {
    console.log('--- Database Test Started ---');
    try {
        console.log('Connecting...');
        await prisma.$connect();
        console.log('Connected.');
        console.log('Fetching admins...');
        const admins = await prisma.admin.findMany();
        console.log('Admins count:', admins.length);
        console.log('Admins data:', JSON.stringify(admins));
        console.log('Fetching user categories...');
        const categories = await prisma.category.findMany();
        console.log('Categories count:', categories.length);
    }
    catch (error) {
        console.error('Test Failed:', error);
    }
    finally {
        await prisma.$disconnect();
        console.log('--- Database Test Ended ---');
    }
}
test();
//# sourceMappingURL=test_db.js.map