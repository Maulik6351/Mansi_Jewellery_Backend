import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
export declare class WishlistController {
    private readonly wishlistService;
    constructor(wishlistService: WishlistService);
    getWishlist(user: any): Promise<({
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
    addToWishlist(user: any, dto: AddToWishlistDto): Promise<{
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
    removeFromWishlist(user: any, productId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
    }>;
}
