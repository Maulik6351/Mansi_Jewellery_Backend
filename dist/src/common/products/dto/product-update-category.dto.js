"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductUpdateCategoryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const product_create_category_dto_1 = require("./product-create-category.dto");
class ProductUpdateCategoryDto extends (0, swagger_1.PartialType)(product_create_category_dto_1.ProductCreateCategoryDto) {
}
exports.ProductUpdateCategoryDto = ProductUpdateCategoryDto;
//# sourceMappingURL=product-update-category.dto.js.map