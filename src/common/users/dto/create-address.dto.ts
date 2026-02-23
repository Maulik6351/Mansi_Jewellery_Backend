import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '+1234567890' })
    @IsString()
    phone: string;

    @ApiProperty({ example: '123 Main St' })
    @IsString()
    addressLine1: string;

    @ApiPropertyOptional({ example: 'Apt 4B' })
    @IsOptional()
    @IsString()
    addressLine2?: string;

    @ApiProperty({ example: 'New York' })
    @IsString()
    city: string;

    @ApiProperty({ example: 'NY' })
    @IsString()
    state: string;

    @ApiProperty({ example: '10001' })
    @IsString()
    zipCode: string;

    @ApiProperty({ example: 'US' })
    @IsString()
    country: string;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
