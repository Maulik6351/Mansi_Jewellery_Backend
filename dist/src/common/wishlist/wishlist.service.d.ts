import { PrismaService } from '../../db/prisma.service';
export declare class WishlistService {
    private prisma;
    constructor(prisma: PrismaService);
    getWishlist(userId: string): Promise<({
        product: {
            category: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
            images: {
                id: string;
                productId: string;
                imageUrl: string;
                isPrimary: boolean;
                displayOrder: number;
            }[];
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            sku: string;
            shortDescription: string | null;
            metalType: string | null;
            purity: string | null;
            weight: import("@prisma/client/runtime/library").Decimal | null;
            stockQuantity: number;
            categoryId: string;
            slug: string;
            basePrice: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
    })[]>;
    addToWishlist(userId: string, productId: string): Promise<{
        product: {
            category: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
            images: {
                id: string;
                productId: string;
                imageUrl: string;
                isPrimary: boolean;
                displayOrder: number;
            }[];
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            sku: string;
            shortDescription: string | null;
            metalType: string | null;
            purity: string | null;
            weight: import("@prisma/client/runtime/library").Decimal | null;
            stockQuantity: number;
            categoryId: string;
            slug: string;
            basePrice: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
    }>;
    removeFromWishlist(userId: string, productId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
    }>;
}
