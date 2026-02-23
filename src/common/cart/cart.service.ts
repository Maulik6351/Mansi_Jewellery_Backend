import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class CartService {
    private readonly MAX_ITEM_QUANTITY = 5;

    constructor(private prisma: PrismaService) { }

    private calculateCartTotals(items: any[]): CartSummary {
        // Calculate subtotal based on real-time product basePrice
        const subtotal = items.reduce((sum, item) => {
            // Ensure we use the product's current price, not a snapshot for the cart total
            const price = Number(item.product.basePrice);
            return sum + (price * item.quantity);
        }, 0);

        // Placeholders for future logic
        const tax = 0;
        const shipping = 0;
        const total = subtotal + tax + shipping;

        return {
            subtotal: Number(subtotal.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            shipping: Number(shipping.toFixed(2)),
            total: Number(total.toFixed(2)),
            currency: 'USD' // Default currency for now
        };
    }

    async getCart(userId: string) {
        let cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                basePrice: true,
                                slug: true,
                                stockQuantity: true,
                                images: {
                                    where: { isPrimary: true },
                                    take: 1,
                                    select: {
                                        imageUrl: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!cart) {
            // Create empty cart if not exists
            cart = await this.prisma.cart.create({
                data: { userId },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    basePrice: true,
                                    slug: true,
                                    stockQuantity: true,
                                    images: {
                                        where: { isPrimary: true },
                                        take: 1,
                                        select: {
                                            imageUrl: true
                                        }
                                    }
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
        }

        const summary = this.calculateCartTotals(cart.items);

        return {
            ...cart,
            summary
        };
    }

    async addToCart(userId: string, dto: AddToCartDto) {
        // 1. Check if product exists and has stock
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId }
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        if (dto.quantity > this.MAX_ITEM_QUANTITY) {
            throw new BadRequestException(`Cannot add more than ${this.MAX_ITEM_QUANTITY} items of this product.`);
        }

        if (product.stockQuantity < dto.quantity) {
            throw new BadRequestException(`Insufficient stock. Available: ${product.stockQuantity}`);
        }

        // 2. Get or create cart
        let cart = await this.prisma.cart.findUnique({
            where: { userId }
        });

        if (!cart) {
            cart = await this.prisma.cart.create({
                data: { userId }
            });
        }

        // 3. Check if item already in cart
        const existingItem = await this.prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: dto.productId
                }
            }
        });

        if (existingItem) {
            const newQuantity = existingItem.quantity + dto.quantity;

            if (newQuantity > this.MAX_ITEM_QUANTITY) {
                throw new BadRequestException(`Cannot have more than ${this.MAX_ITEM_QUANTITY} items of this product in cart.`);
            }

            if (product.stockQuantity < newQuantity) {
                throw new BadRequestException(`Insufficient stock for update. Available: ${product.stockQuantity}`);
            }

            await this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity }
            });
        } else {
            await this.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: dto.productId,
                    quantity: dto.quantity,
                    priceSnapshot: product.basePrice
                }
            });
        }

        // Return updated cart with totals
        return this.getCart(userId);
    }

    async updateCartItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
        // Verify item belongs to user's cart
        const item = await this.prisma.cartItem.findUnique({
            where: { id: itemId },
            include: {
                product: true,
                cart: true
            }
        });

        if (!item) {
            throw new NotFoundException('Item not found');
        }

        if (item.cart.userId !== userId) {
            throw new NotFoundException('Item not found in your cart');
        }

        if (dto.quantity > this.MAX_ITEM_QUANTITY) {
            throw new BadRequestException(`Cannot request more than ${this.MAX_ITEM_QUANTITY} items.`);
        }

        if (item.product.stockQuantity < dto.quantity) {
            throw new BadRequestException(`Insufficient stock. Available: ${item.product.stockQuantity}`);
        }

        await this.prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: dto.quantity }
        });

        return this.getCart(userId);
    }

    async removeCartItem(userId: string, itemId: string) {
        const item = await this.prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true }
        });

        if (!item || item.cart.userId !== userId) {
            throw new NotFoundException('Item not found in your cart');
        }

        await this.prisma.cartItem.delete({
            where: { id: itemId }
        });

        return this.getCart(userId);
    }

    async clearCart(userId: string) {
        const cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (cart) {
            await this.prisma.cartItem.deleteMany({
                where: { cartId: cart.id }
            });
        }
        // Return empty cart structure
        return this.getCart(userId);
    }

    async mergeGuestCart(userId: string, guestItems: { productId: string, quantity: number }[]) {
        // Ensure cart exists
        let cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await this.prisma.cart.create({ data: { userId } });
        }

        for (const item of guestItems) {
            try {
                // Reuse addToCart logic for individual items? 
                // Calling addToCart inside loop might be inefficient but safe.
                // However, addToCart returns the FULL cart, which is overhead.
                // Better to duplicate the logic slightly or refactor `addToCart` to split logic from response.
                // For now, I'll stick to a simpler direct implementation to avoid N+1 full cart fetches.

                const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
                if (!product) continue;
                if (product.stockQuantity < item.quantity) continue; // Skip if OOS

                const existingItem = await this.prisma.cartItem.findUnique({
                    where: {
                        cartId_productId: {
                            cartId: cart.id,
                            productId: item.productId
                        }
                    }
                });

                if (existingItem) {
                    // Update if possible
                    const newQty = Math.min(existingItem.quantity + item.quantity, this.MAX_ITEM_QUANTITY);
                    if (product.stockQuantity >= newQty) {
                        await this.prisma.cartItem.update({
                            where: { id: existingItem.id },
                            data: { quantity: newQty }
                        });
                    }
                } else {
                    // Create
                    await this.prisma.cartItem.create({
                        data: {
                            cartId: cart.id,
                            productId: item.productId,
                            quantity: Math.min(item.quantity, this.MAX_ITEM_QUANTITY),
                            priceSnapshot: product.basePrice
                        }
                    });
                }

            } catch (error) {
                console.warn(`Failed to merge product ${item.productId}: ${error.message}`);
            }
        }

        return this.getCart(userId);
    }
}
