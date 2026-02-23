"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../db/prisma.service");
let CartService = class CartService {
    constructor(prisma) {
        this.prisma = prisma;
        this.MAX_ITEM_QUANTITY = 5;
    }
    calculateCartTotals(items) {
        const subtotal = items.reduce((sum, item) => {
            const price = Number(item.product.basePrice);
            return sum + (price * item.quantity);
        }, 0);
        const tax = 0;
        const shipping = 0;
        const total = subtotal + tax + shipping;
        return {
            subtotal: Number(subtotal.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            shipping: Number(shipping.toFixed(2)),
            total: Number(total.toFixed(2)),
            currency: 'USD'
        };
    }
    async getCart(userId) {
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
    async addToCart(userId, dto) {
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId }
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (dto.quantity > this.MAX_ITEM_QUANTITY) {
            throw new common_1.BadRequestException(`Cannot add more than ${this.MAX_ITEM_QUANTITY} items of this product.`);
        }
        if (product.stockQuantity < dto.quantity) {
            throw new common_1.BadRequestException(`Insufficient stock. Available: ${product.stockQuantity}`);
        }
        let cart = await this.prisma.cart.findUnique({
            where: { userId }
        });
        if (!cart) {
            cart = await this.prisma.cart.create({
                data: { userId }
            });
        }
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
                throw new common_1.BadRequestException(`Cannot have more than ${this.MAX_ITEM_QUANTITY} items of this product in cart.`);
            }
            if (product.stockQuantity < newQuantity) {
                throw new common_1.BadRequestException(`Insufficient stock for update. Available: ${product.stockQuantity}`);
            }
            await this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity }
            });
        }
        else {
            await this.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: dto.productId,
                    quantity: dto.quantity,
                    priceSnapshot: product.basePrice
                }
            });
        }
        return this.getCart(userId);
    }
    async updateCartItem(userId, itemId, dto) {
        const item = await this.prisma.cartItem.findUnique({
            where: { id: itemId },
            include: {
                product: true,
                cart: true
            }
        });
        if (!item) {
            throw new common_1.NotFoundException('Item not found');
        }
        if (item.cart.userId !== userId) {
            throw new common_1.NotFoundException('Item not found in your cart');
        }
        if (dto.quantity > this.MAX_ITEM_QUANTITY) {
            throw new common_1.BadRequestException(`Cannot request more than ${this.MAX_ITEM_QUANTITY} items.`);
        }
        if (item.product.stockQuantity < dto.quantity) {
            throw new common_1.BadRequestException(`Insufficient stock. Available: ${item.product.stockQuantity}`);
        }
        await this.prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: dto.quantity }
        });
        return this.getCart(userId);
    }
    async removeCartItem(userId, itemId) {
        const item = await this.prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true }
        });
        if (!item || item.cart.userId !== userId) {
            throw new common_1.NotFoundException('Item not found in your cart');
        }
        await this.prisma.cartItem.delete({
            where: { id: itemId }
        });
        return this.getCart(userId);
    }
    async clearCart(userId) {
        const cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (cart) {
            await this.prisma.cartItem.deleteMany({
                where: { cartId: cart.id }
            });
        }
        return this.getCart(userId);
    }
    async mergeGuestCart(userId, guestItems) {
        let cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await this.prisma.cart.create({ data: { userId } });
        }
        for (const item of guestItems) {
            try {
                const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
                if (!product)
                    continue;
                if (product.stockQuantity < item.quantity)
                    continue;
                const existingItem = await this.prisma.cartItem.findUnique({
                    where: {
                        cartId_productId: {
                            cartId: cart.id,
                            productId: item.productId
                        }
                    }
                });
                if (existingItem) {
                    const newQty = Math.min(existingItem.quantity + item.quantity, this.MAX_ITEM_QUANTITY);
                    if (product.stockQuantity >= newQty) {
                        await this.prisma.cartItem.update({
                            where: { id: existingItem.id },
                            data: { quantity: newQty }
                        });
                    }
                }
                else {
                    await this.prisma.cartItem.create({
                        data: {
                            cartId: cart.id,
                            productId: item.productId,
                            quantity: Math.min(item.quantity, this.MAX_ITEM_QUANTITY),
                            priceSnapshot: product.basePrice
                        }
                    });
                }
            }
            catch (error) {
                console.warn(`Failed to merge product ${item.productId}: ${error.message}`);
            }
        }
        return this.getCart(userId);
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CartService);
//# sourceMappingURL=cart.service.js.map