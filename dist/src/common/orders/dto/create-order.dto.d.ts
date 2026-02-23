export declare class ShippingDetailsDto {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}
export declare class PaymentDataDto {
    transactionId: string;
    provider: string;
    status: string;
    response?: any;
}
export declare class CreateOrderDto {
    cartId?: string;
    idempotencyKey?: string;
    shippingDetails: ShippingDetailsDto;
    paymentData: PaymentDataDto;
}
