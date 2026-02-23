import { PrismaService } from '../../db/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        idempotencyKey: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        trackingNumber: string | null;
        shippingProvider: string | null;
        isHighValue: boolean;
        isFraud: boolean;
        adminNotes: string | null;
    }>;
    getAllOrders(userId: string): Promise<({
        payment: {
            id: string;
            createdAt: Date;
            orderId: string;
            transactionId: string;
            provider: string;
            status: string;
            response: import("@prisma/client/runtime/library").JsonValue | null;
            currency: string;
            amount: import("@prisma/client/runtime/library").Decimal;
        };
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            quantity: number;
            orderId: string;
            productName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        idempotencyKey: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        trackingNumber: string | null;
        shippingProvider: string | null;
        isHighValue: boolean;
        isFraud: boolean;
        adminNotes: string | null;
    })[]>;
    getOrderById(orderId: string, userId: string): Promise<{
        shippingDetails: {
            id: string;
            email: string;
            orderId: string;
            firstName: string;
            lastName: string;
            phone: string;
            addressLine1: string;
            addressLine2: string | null;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        };
        payment: {
            id: string;
            createdAt: Date;
            orderId: string;
            transactionId: string;
            provider: string;
            status: string;
            response: import("@prisma/client/runtime/library").JsonValue | null;
            currency: string;
            amount: import("@prisma/client/runtime/library").Decimal;
        };
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            quantity: number;
            orderId: string;
            productName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        idempotencyKey: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        trackingNumber: string | null;
        shippingProvider: string | null;
        isHighValue: boolean;
        isFraud: boolean;
        adminNotes: string | null;
    }>;
    updateStatus(orderId: string, status: any, data?: {
        trackingNumber?: string;
        shippingProvider?: string;
        adminNotes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        idempotencyKey: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        trackingNumber: string | null;
        shippingProvider: string | null;
        isHighValue: boolean;
        isFraud: boolean;
        adminNotes: string | null;
    }>;
    getAllOrdersAdmin(query: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<{
        data: ({
            user: {
                id: string;
                email: string;
                passwordHash: string;
                fullName: string | null;
                role: import(".prisma/client").$Enums.Role;
                refreshTokenHash: string | null;
                loginAttempts: number;
                lockUntil: Date | null;
                createdAt: Date;
                updatedAt: Date;
                isVerified: boolean;
            };
            shippingDetails: {
                id: string;
                email: string;
                orderId: string;
                firstName: string;
                lastName: string;
                phone: string;
                addressLine1: string;
                addressLine2: string | null;
                city: string;
                state: string;
                zipCode: string;
                country: string;
            };
            payment: {
                id: string;
                createdAt: Date;
                orderId: string;
                transactionId: string;
                provider: string;
                status: string;
                response: import("@prisma/client/runtime/library").JsonValue | null;
                currency: string;
                amount: import("@prisma/client/runtime/library").Decimal;
            };
            items: {
                id: string;
                price: import("@prisma/client/runtime/library").Decimal;
                productId: string;
                quantity: number;
                orderId: string;
                productName: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            idempotencyKey: string | null;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            trackingNumber: string | null;
            shippingProvider: string | null;
            isHighValue: boolean;
            isFraud: boolean;
            adminNotes: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    cancelOrder(orderId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        idempotencyKey: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        trackingNumber: string | null;
        shippingProvider: string | null;
        isHighValue: boolean;
        isFraud: boolean;
        adminNotes: string | null;
    }>;
}
