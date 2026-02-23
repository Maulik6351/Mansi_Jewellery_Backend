import { PrismaService } from '../../db/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductCreateCategoryDto } from './dto/product-create-category.dto';
import { ProductUpdateCategoryDto } from './dto/product-update-category.dto';
import { Cache } from 'cache-manager';
import { AuditService } from '../admin/audit.service';
export declare class ProductsService {
    private prisma;
    private cacheManager;
    private auditService;
    constructor(prisma: PrismaService, cacheManager: Cache, auditService: AuditService);
    private sanitizeContent;
    private deleteFile;
    create(createProductDto: CreateProductDto, userId?: string): Promise<{
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
    findAll(query: {
        page?: number;
        limit?: number;
        category?: string;
        metalType?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        search?: string;
        allStatus?: boolean;
    }): Promise<any>;
    searchProducts(query: string): Promise<any>;
    findOne(id: string): Promise<any>;
    findBySlug(slug: string): Promise<any>;
    update(id: string, updateProductDto: UpdateProductDto, userId?: string): Promise<{
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
    updateStatus(id: string, isActive: boolean, userId?: string): Promise<{
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
    findRelated(id: string): Promise<any>;
    remove(id: string, userId?: string): Promise<{
        message: string;
    }>;
    deleteMedia(mediaId: string, userId?: string): Promise<{
        message: string;
    }>;
    uploadMedia(id: string, files: Array<Express.Multer.File>, userId?: string): Promise<({
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
    uploadCertificate(id: string, file: Express.Multer.File, certificateType: string, userId?: string): Promise<{
        id: string;
        productId: string;
        certificateUrl: string;
        certificateType: string;
    }>;
    findAllCategories(): Promise<unknown>;
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
