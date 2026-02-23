import { PrismaService } from '../../db/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(id: string): Promise<{
        id: string;
        email: string;
        fullName: string | null;
        role: import(".prisma/client").$Enums.Role;
        refreshTokenHash: string | null;
        loginAttempts: number;
        lockUntil: Date | null;
        createdAt: Date;
        updatedAt: Date;
        isVerified: boolean;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        fullName: string | null;
        role: import(".prisma/client").$Enums.Role;
        refreshTokenHash: string | null;
        loginAttempts: number;
        lockUntil: Date | null;
        createdAt: Date;
        updatedAt: Date;
        isVerified: boolean;
    }[]>;
    addAddress(userId: string, data: any): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        firstName: string;
        lastName: string;
        phone: string;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        isDefault: boolean;
    }>;
    getAddresses(userId: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        firstName: string;
        lastName: string;
        phone: string;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        isDefault: boolean;
    }[]>;
}
