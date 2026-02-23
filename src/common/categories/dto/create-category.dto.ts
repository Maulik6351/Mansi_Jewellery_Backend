import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Rings' })
    @IsString()
    @IsNotEmpty({ message: 'Category name is required' })
    @MaxLength(50, { message: 'Category name cannot exceed 50 characters' })
    name: string;

    @ApiProperty({ example: 'Beautiful collection of rings', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
    description?: string;
}
