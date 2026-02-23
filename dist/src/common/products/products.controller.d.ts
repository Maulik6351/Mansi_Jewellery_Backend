import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductCreateCategoryDto } from './dto/product-create-category.dto';
import { ProductUpdateCategoryDto } from './dto/product-update-category.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAllCategories(): Promise<unknown>;
    findAll(query: {
        page?: number;
        limit?: number;
        category?: string;
        metalType?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        search?: string;
        allStatus?: string;
    }): Promise<any>;
    filter(query: any): Promise<any>;
    search(query: string): Promise<any>;
    findBySlug(slug: string): Promise<any>;
    findRelated(id: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(createProductDto: CreateProductDto, user: any): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        sku: string;
        shortDescription: string | null;
        metalType: string | null;
        purity: string | null;
        weight: import("@prisma/client/runtime/library").Decimal | null;
        stockQuantity: number;
        categoryId: string;
        slug: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateStatus(id: string, isActive: boolean, user: any): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        sku: string;
        shortDescription: string | null;
        metalType: string | null;
        purity: string | null;
        weight: import("@prisma/client/runtime/library").Decimal | null;
        stockQuantity: number;
        categoryId: string;
        slug: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, updateProductDto: UpdateProductDto, user: any): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        sku: string;
        shortDescription: string | null;
        metalType: string | null;
        purity: string | null;
        weight: import("@prisma/client/runtime/library").Decimal | null;
        stockQuantity: number;
        categoryId: string;
        slug: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
    uploadMedia(id: string, files: Array<Express.Multer.File>, user: any): Promise<({
        id: string;
        productId: string;
        imageUrl: string;
        isPrimary: boolean;
        displayOrder: number;
    } | {
        id: string;
        productId: string;
        videoUrl: string;
    })[]>;
    uploadCertificate(id: string, file: Express.Multer.File, certificateType: string, user: any): Promise<{
        id: string;
        productId: string;
        certificateUrl: string;
        certificateType: string;
    }>;
    deleteMedia(mediaId: string, user: any): Promise<{
        message: string;
    }>;
    createCategory(createCategoryDto: ProductCreateCategoryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    updateCategory(id: string, updateCategoryDto: ProductUpdateCategoryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    deleteCategory(id: string): Promise<{
        message: string;
    }>;
}
