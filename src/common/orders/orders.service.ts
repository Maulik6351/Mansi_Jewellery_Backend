import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(private readonly prisma: PrismaService) { }

    async createOrder(userId: string, createOrderDto: CreateOrderDto) {
        const { shippingDetails, paymentData, idempotencyKey } = createOrderDto;

        // 1. Idempotency Check
        if (idempotencyKey) {
            const existingOrder = await this.prisma.order.findUnique({
                where: { idempotencyKey }
            });
            if (existingOrder) {
                this.logger.warn(`Duplicate order submission detected for idempotencyKey: ${idempotencyKey}`);
                return existingOrder; // Return existing order to client (standard idempotency behavior)
            }
        }

        // 2. Replay Attack Protection: Check if transaction ID has already been used
        const existingPayment = await this.prisma.payment.findFirst({
            where: { transactionId: paymentData.transactionId, provider: paymentData.provider }
        });
        if (existingPayment) {
            this.logger.error(`Replay attack suspected: transactionId ${paymentData.transactionId} already exists for provider ${paymentData.provider}`);
            // Log to Audit Log
            await this.prisma.auditLog.create({
                data: {
                    action: 'SUSPICIOUS_TRANSACTION_REPLAY',
                    userId,
                    details: { transactionId: paymentData.transactionId, provider: paymentData.provider }
                }
            });
            throw new BadRequestException('Security validation failed: Payment already processed');
        }

        // 3. Get Cart
        let cart;
        if (createOrderDto.cartId) {
            cart = await this.prisma.cart.findUnique({
                where: { id: createOrderDto.cartId },
                include: { items: { include: { product: true } } }
            });
            if (!cart || cart.userId !== userId) {
                throw new BadRequestException('Invalid Cart ID');
            }
        } else {
            cart = await this.prisma.cart.findUnique({
                where: { userId },
                include: { items: { include: { product: true } } }
            });
        }

        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        // 4. Validate Stock & Calculate Total
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of cart.items) {
            if (item.product.stockQuantity < item.quantity) {
                this.logger.warn(`Insufficient stock for product ${item.product.id} during checkout attempts`);
                throw new BadRequestException(`Insufficient stock for product: ${item.product.name}`);
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

        // 5. High-Value Order Flagging (e.g., > $5,000)
        const isHighValue = totalAmount >= 5000;

        // 6. Transaction: Create Order, Items, Shipping, Payment, Deduct Stock, Clear Cart
        try {
            const result = await this.prisma.$transaction(async (prisma) => {
                // Double-check stock inside transaction for absolute safety
                for (const item of cart.items) {
                    const product = await prisma.product.findUnique({
                        where: { id: item.productId },
                        select: { stockQuantity: true }
                    });
                    if (!product || product.stockQuantity < item.quantity) {
                        throw new BadRequestException(`Insufficient stock for product: ${item.product.name} (race condition detected)`);
                    }
                }

                // Create Order
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

                // Deduct Inventory
                for (const item of cart.items) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            stockQuantity: { decrement: item.quantity }
                        }
                    });
                    // Log inventory change
                    await prisma.inventoryLog.create({
                        data: {
                            productId: item.productId,
                            changeType: 'ORDER_DEDUCTION',
                            quantity: -item.quantity
                        }
                    });
                }

                // Clear Cart
                await prisma.cartItem.deleteMany({
                    where: { cartId: cart.id }
                });

                // Update Order Status to Confirmed if payment status is succeeded
                if (paymentData.status === 'succeeded') {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { status: 'CONFIRMED' }
                    });
                    order.status = 'CONFIRMED';
                }

                // Log suspicion if payment response looks weird (placeholder logic)
                if (paymentData.status === 'succeeded' && totalAmount >= 10000) {
                    this.logger.log(`High-value order ${order.id} processed. Amount: ${totalAmount}`);
                }

                return order;
            });

            if (isHighValue) {
                // Log to Audit Log for admin review
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

        } catch (error) {
            this.logger.error('Failed to create order', error);
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException('Failed to process order');
        }
    }

    async getAllOrders(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            include: { items: true, payment: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getOrderById(orderId: string, userId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true, shippingDetails: true, payment: true }
        });

        if (!order || order.userId !== userId) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    async updateStatus(orderId: string, status: any, data?: { trackingNumber?: string, shippingProvider?: string, adminNotes?: string }) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Usage of 'any' for status due to potential Type/Enum generation lag in IDE, but runtime is fine.
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

    // For Admin: Get all orders with Filtering & Pagination
    async getAllOrdersAdmin(query: { page?: number, limit?: number, status?: string, search?: string }) {
        const { page = 1, limit = 10, status, search } = query;
        const skip = (page - 1) * limit;

        const whereClause: any = {};

        if (status && status !== 'ALL') {
            whereClause.status = status;
        }

        if (search) {
            whereClause.OR = [
                { id: { contains: search } }, // Search by Order ID
                { user: { email: { contains: search } } }, // Search by User Email
                { shippingDetails: { email: { contains: search } } }, // Search by Shipping Email
                { shippingDetails: { firstName: { contains: search } } }, // Search by Name
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

    async cancelOrder(orderId: string, userId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order || order.userId !== userId) {
            throw new NotFoundException('Order not found');
        }

        const eligibleStatuses = ['PENDING', 'CONFIRMED'];
        if (!eligibleStatuses.includes(order.status as string)) {
            throw new BadRequestException(`Order cannot be cancelled in its current state: ${order.status}`);
        }

        try {
            return await this.prisma.$transaction(async (prisma) => {
                // 1. Update Order Status
                const updatedOrder = await prisma.order.update({
                    where: { id: orderId },
                    data: { status: 'CANCELLED' }
                });

                // 2. Restore Inventory
                for (const item of order.items) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            stockQuantity: { increment: item.quantity }
                        }
                    });

                    // Log inventory restoration
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
        } catch (error) {
            this.logger.error(`Failed to cancel order ${orderId}`, error);
            throw new InternalServerErrorException('Failed to cancel order');
        }
    }
}
