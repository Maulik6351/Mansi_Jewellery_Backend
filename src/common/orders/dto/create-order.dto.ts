import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ShippingDetailsDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    phone: string;

    @IsNotEmpty()
    @IsString()
    addressLine1: string;

    @IsOptional()
    @IsString()
    addressLine2?: string;

    @IsNotEmpty()
    @IsString()
    city: string;

    @IsNotEmpty()
    @IsString()
    state: string;

    @IsNotEmpty()
    @IsString()
    zipCode: string;

    @IsNotEmpty()
    @IsString()
    country: string;
}

export class PaymentDataDto {
    @IsNotEmpty()
    @IsString()
    transactionId: string;

    @IsNotEmpty()
    @IsString()
    provider: string; // 'stripe', 'paypal'

    @IsNotEmpty()
    @IsString()
    status: string; // 'succeeded'

    @IsOptional()
    @IsObject()
    response?: any;
}

export class CreateOrderDto {
    @IsOptional()
    @IsString()
    cartId?: string; // Optional if we infer from user

    @IsOptional()
    @IsString()
    idempotencyKey?: string;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => ShippingDetailsDto)
    shippingDetails: ShippingDetailsDto;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => PaymentDataDto)
    paymentData: PaymentDataDto;
}
