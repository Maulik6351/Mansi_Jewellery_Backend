import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        const [userCount, productCount, categoryCount] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.product.count(),
            this.prisma.category.count(),
        ]);

        return {
            users: userCount,
            products: productCount,
            categories: categoryCount,
        };
    }
}
