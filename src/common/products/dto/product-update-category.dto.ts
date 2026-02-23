import { PartialType } from '@nestjs/swagger';
import { ProductCreateCategoryDto } from './product-create-category.dto';

export class ProductUpdateCategoryDto extends PartialType(ProductCreateCategoryDto) { }
