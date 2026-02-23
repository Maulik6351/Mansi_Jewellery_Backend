import { PrismaService } from '../../db/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
export interface CartSummary {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
}
export declare class CartService {
    private prisma;
    private readonly MAX_ITEM_QUANTITY;
    constructor(prisma: PrismaService);
    private calculateCartTotals;
    getCart(userId: string): Promise<{
        summary: CartSummary;
        items: ({
            product: {
                id: string;
                name: string;
                stockQuantity: number;
                slug: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                images: {
                    imageUrl: string;
                }[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            quantity: number;
            cartId: string;
            priceSnapshot: import("@prisma/client/runtime/library").Decimal;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    addToCart(userId: string, dto: AddToCartDto): Promise<{
        summary: CartSummary;
        items: ({
            product: {
                id: string;
                name: string;
                stockQuantity: number;
                slug: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                images: {
                    imageUrl: string;
                }[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            quantity: number;
            cartId: string;
            priceSnapshot: import("@prisma/client/runtime/library").Decimal;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    updateCartItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<{
        summary: CartSummary;
        items: ({
            product: {
                id: string;
                name: string;
                stockQuantity: number;
                slug: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                images: {
                    imageUrl: string;
                }[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            quantity: number;
            cartId: string;
            priceSnapshot: import("@prisma/client/runtime/library").Decimal;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    removeCartItem(userId: string, itemId: string): Promise<{
        summary: CartSummary;
        items: ({
            product: {
                id: string;
                name: string;
                stockQuantity: number;
                slug: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                images: {
                    imageUrl: string;
                }[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            quantity: number;
            cartId: string;
            priceSnapshot: import("@prisma/client/runtime/library").Decimal;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    clearCart(userId: string): Promise<{
        summary: CartSummary;
        items: ({
            product: {
                id: string;
                name: string;
                stockQuantity: number;
                slug: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                images: {
                    imageUrl: string;
                }[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            quantity: number;
            cartId: string;
            priceSnapshot: import("@prisma/client/runtime/library").Decimal;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    mergeGuestCart(userId: string, guestItems: {
        productId: string;
        quantity: number;
    }[]): Promise<{
        summary: CartSummary;
        items: ({
            product: {
                id: string;
                name: string;
                stockQuantity: number;
                slug: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                images: {
                    imageUrl: string;
                }[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            quantity: number;
            cartId: string;
            priceSnapshot: import("@prisma/client/runtime/library").Decimal;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
}
