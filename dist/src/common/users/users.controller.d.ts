import { UsersService } from './users.service';
import { CreateAddressDto } from './dto/create-address.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: any): Promise<{
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
    addAddress(user: any, createAddressDto: CreateAddressDto): Promise<{
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
    getAddresses(user: any): Promise<{
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
