import { PrismaService } from '../../db/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
        users: number;
        products: number;
        categories: number;
    }>;
}
