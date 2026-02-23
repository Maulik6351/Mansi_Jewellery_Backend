import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        const { passwordHash, ...result } = user;
        return result;
    }

    async findAll() {
        const users = await this.prisma.user.findMany();
        return users.map(user => {
            const { passwordHash, ...result } = user;
            return result;
        });
    }

    async addAddress(userId: string, data: any) {
        // If this is the first address, make it default
        const count = await this.prisma.address.count({ where: { userId } });
        const isDefault = count === 0 ? true : (data.isDefault || false);

        if (isDefault) {
            // Unset other defaults if this one is default
            await this.prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false }
            });
        }

        return this.prisma.address.create({
            data: {
                ...data,
                userId,
                isDefault
            }
        });
    }

    async getAddresses(userId: string) {
        return this.prisma.address.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
