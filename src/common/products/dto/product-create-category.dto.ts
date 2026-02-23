import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductCreateCategoryDto {
    @ApiProperty({ example: 'Rings', description: 'Name of the category' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Beautiful rings', description: 'Description of the category', required: false })
    @IsString()
    @IsOptional()
    description?: string;
}
