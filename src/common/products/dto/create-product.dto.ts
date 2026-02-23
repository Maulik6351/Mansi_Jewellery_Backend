import { IsString, IsOptional, IsNumber, IsUUID, Min, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({ example: 'Diamond Ring' })
    @IsString()
    @IsNotEmpty({ message: 'Product name is required' })
    @MaxLength(100, { message: 'Product name cannot exceed 100 characters' })
    name: string;

    @ApiProperty({ example: 'Beautiful 24K gold diamond ring', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
    description?: string;

    @ApiProperty({ example: 999.99 })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a valid number with up to 2 decimal places' })
    @Min(0, { message: 'Price cannot be negative' })
    price: number;

    @ApiProperty({ example: 'DR-001' })
    @IsString()
    @IsNotEmpty({ message: 'SKU is required' })
    @MaxLength(50, { message: 'SKU cannot exceed 50 characters' })
    sku: string;

    @ApiProperty({ example: 'Elegance in every moment', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Short description cannot exceed 100 characters' })
    shortDescription?: string;

    @ApiProperty({ example: 'Gold', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(191, { message: 'Metal type cannot exceed 191 characters' })
    metalType?: string;

    @ApiProperty({ example: '24K', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(191, { message: 'Purity cannot exceed 191 characters' })
    purity?: string;

    @ApiProperty({ example: 5.5, required: false })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 3 })
    weight?: number;

    @ApiProperty({ example: 10, required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    stockQuantity?: number;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ example: 'uuid-of-category' })
    @IsUUID('4', { message: 'Invalid category selection' })
    categoryId: string;
}
