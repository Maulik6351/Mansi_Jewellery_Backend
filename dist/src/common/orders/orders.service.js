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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../db/prisma.service");
let OrdersService = OrdersService_1 = class OrdersService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OrdersService_1.name);
    }
    async createOrder(userId, createOrderDto) {
        const { shippingDetails, paymentData, idempotencyKey } = createOrderDto;
        if (idempotencyKey) {
            const existingOrder = await this.prisma.order.findUnique({
                where: { idempotencyKey }
            });
            if (existingOrder) {
                this.logger.warn(`Duplicate order submission detected for idempotencyKey: ${idempotencyKey}`);
                return existingOrder;
            }
        }
        const existingPayment = await this.prisma.payment.findFirst({
            where: { transactionId: paymentData.transactionId, provider: paymentData.provider }
        });
        if (existingPayment) {
            this.logger.error(`Replay attack suspected: transactionId ${paymentData.transactionId} already exists for provider ${paymentData.provider}`);
            await this.prisma.auditLog.create({
                data: {
                    action: 'SUSPICIOUS_TRANSACTION_REPLAY',
                    userId,
                    details: { transactionId: paymentData.transactionId, provider: paymentData.provider }
                }
            });
            throw new common_1.BadRequestException('Security validation failed: Payment already processed');
        }
        let cart;
        if (createOrderDto.cartId) {
            cart = await this.prisma.cart.findUnique({
                where: { id: createOrderDto.cartId },
                include: { items: { include: { product: true } } }
            });
            if (!cart || cart.userId !== userId) {
                throw new common_1.BadRequestException('Invalid Cart ID');
            }
        }
        else {
            cart = await this.prisma.cart.findUnique({
                where: { userId },
                include: { items: { include: { product: true } } }
            });
        }
        if (!cart || cart.items.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        let totalAmount = 0;
        const orderItemsData = [];
        for (const item of cart.items) {
            if (item.product.stockQuantity < item.quantity) {
                this.logger.warn(`Insufficient stock for product ${item.product.id} during checkout attempts`);
                throw new common_1.BadRequestException(`Insufficient stock for product: ${item.product.name}`);
            }
            const itemTotal = Number(item.product.basePrice) * item.quantity;
            totalAmount += itemTotal;
            orderItemsData.push({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.basePrice,
                productName: item.product.name,
            });
        }
        const isHighValue = totalAmount >= 5000;
        try {
            const result = await this.prisma.$transaction(async (prisma) => {
                for (const item of cart.items) {
                    const product = await prisma.product.findUnique({
                        where: { id: item.productId },
                        select: { stockQuantity: true }
                    });
                    if (!product || product.stockQuantity < item.quantity) {
                        throw new common_1.BadRequestException(`Insufficient stock for product: ${item.product.name} (race condition detected)`);
                    }
                }
                const order = await prisma.order.create({
                    data: {
                        userId,
                        totalAmount: totalAmount,
                        currency: 'USD',
                        status: 'PENDING',
                        idempotencyKey,
                        isHighValue,
                        shippingDetails: {
                            create: {
                                ...shippingDetails
                            }
                        },
                        payment: {
                            create: {
                                transactionId: paymentData.transactionId,
                                provider: paymentData.provider,
                                amount: totalAmount,
                                currency: 'USD',
                                status: paymentData.status,
                                response: paymentData.response || {}
                            }
                        },
                        items: {
                            create: orderItemsData
                        }
                    },
                    include: {
                        items: true,
                        shippingDetails: true,
                        payment: true
                    }
                });
                for (const item of cart.items) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            stockQuantity: { decrement: item.quantity }
                        }
                    });
                    await prisma.inventoryLog.create({
                        data: {
                            productId: item.productId,
                            changeType: 'ORDER_DEDUCTION',
                            quantity: -item.quantity
                        }
                    });
                }
                await prisma.cartItem.deleteMany({
                    where: { cartId: cart.id }
                });
                if (paymentData.status === 'succeeded') {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { status: 'CONFIRMED' }
                    });
                    order.status = 'CONFIRMED';
                }
                if (paymentData.status === 'succeeded' && totalAmount >= 10000) {
                    this.logger.log(`High-value order ${order.id} processed. Amount: ${totalAmount}`);
                }
                return order;
            });
            if (isHighValue) {
                await this.prisma.auditLog.create({
                    data: {
                        action: 'HIGH_VALUE_ORDER_REQUIRING_REVIEW',
                        entityId: result.id,
                        entityType: 'ORDER',
                        userId,
                        details: { amount: totalAmount, currency: 'USD' }
                    }
                });
            }
            this.logger.log(`Order created successfully: ${result.id}`);
            return result;
        }
        catch (error) {
            this.logger.error('Failed to create order', error);
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException('Failed to process order');
        }
    }
    async getAllOrders(userId) {
        return this.prisma.order.findMany({
            where: { userId },
            include: { items: true, payment: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getOrderById(orderId, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true, shippingDetails: true, payment: true }
        });
        if (!order || order.userId !== userId) {
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async updateStatus(orderId, status, data) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: status,
                ...(data?.trackingNumber && { trackingNumber: data.trackingNumber }),
                ...(data?.shippingProvider && { shippingProvider: data.shippingProvider }),
                ...(data?.adminNotes && { adminNotes: data.adminNotes })
            }
        });
    }
    async getAllOrdersAdmin(query) {
        const { page = 1, limit = 10, status, search } = query;
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (status && status !== 'ALL') {
            whereClause.status = status;
        }
        if (search) {
            whereClause.OR = [
                { id: { contains: search } },
                { user: { email: { contains: search } } },
                { shippingDetails: { email: { contains: search } } },
                { shippingDetails: { firstName: { contains: search } } },
                { shippingDetails: { lastName: { contains: search } } }
            ];
        }
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: whereClause,
                include: { items: true, payment: true, user: true, shippingDetails: true },
                orderBy: { createdAt: 'desc' },
                skip: Number(skip),
                take: Number(limit)
            }),
            this.prisma.order.count({ where: whereClause })
        ]);
        return {
            data: orders,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async cancelOrder(orderId, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });
        if (!order || order.userId !== userId) {
            throw new common_1.NotFoundException('Order not found');
        }
        const eligibleStatuses = ['PENDING', 'CONFIRMED'];
        if (!eligibleStatuses.includes(order.status)) {
            throw new common_1.BadRequestException(`Order cannot be cancelled in its current state: ${order.status}`);
        }
        try {
            return await this.prisma.$transaction(async (prisma) => {
                const updatedOrder = await prisma.order.update({
                    where: { id: orderId },
                    data: { status: 'CANCELLED' }
                });
                for (const item of order.items) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            stockQuantity: { increment: item.quantity }
                        }
                    });
                    await prisma.inventoryLog.create({
                        data: {
                            productId: item.productId,
                            changeType: 'ORDER_CANCELLATION_RESTORE',
                            quantity: item.quantity
                        }
                    });
                }
                return updatedOrder;
            });
        }
        catch (error) {
            this.logger.error(`Failed to cancel order ${orderId}`, error);
            throw new common_1.InternalServerErrorException('Failed to cancel order');
        }
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map