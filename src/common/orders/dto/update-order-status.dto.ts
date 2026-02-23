
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
    @ApiProperty({ enum: OrderStatus })
    @IsNotEmpty()
    @IsEnum(OrderStatus)
    status: OrderStatus;
}
