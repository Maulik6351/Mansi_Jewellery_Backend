import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    getCart(req: any): Promise<{
        summary: import("./cart.service").CartSummary;
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
    addItem(req: any, dto: AddToCartDto): Promise<{
        summary: import("./cart.service").CartSummary;
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
    updateItem(req: any, id: string, dto: UpdateCartItemDto): Promise<{
        summary: import("./cart.service").CartSummary;
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
    removeItem(req: any, id: string): Promise<{
        summary: import("./cart.service").CartSummary;
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
    clearCart(req: any): Promise<{
        summary: import("./cart.service").CartSummary;
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
    mergeCart(req: any, body: {
        items: {
            productId: string;
            quantity: number;
        }[];
    }): Promise<{
        summary: import("./cart.service").CartSummary;
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
