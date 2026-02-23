import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductCreateCategoryDto } from './dto/product-create-category.dto';
import { ProductUpdateCategoryDto } from './dto/product-update-category.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuditService } from '../admin/audit.service';
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private auditService: AuditService
    ) { }

    private sanitizeContent(content: string): string {
        return sanitizeHtml(content, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                'img': ['src', 'alt']
            }
        });
    }

    private async deleteFile(fileUrl: string) {
        if (!fileUrl) return;
        try {
            const filename = fileUrl.split('/').pop();
            if (filename) {
                const filePath = path.join(process.cwd(), 'uploads', filename);
                await fs.unlink(filePath);
            }
        } catch (error) {
            console.error(`Failed to delete file ${fileUrl}:`, error);
        }
    }

    async create(createProductDto: CreateProductDto, userId?: string) {
        const slug = createProductDto.name
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');

        if (createProductDto.description) {
            createProductDto.description = this.sanitizeContent(createProductDto.description);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { price, ...productData } = createProductDto;

        const product = await this.prisma.product.create({
            data: {
                ...productData,
                slug,
                weight: createProductDto.weight?.toString(),
                basePrice: createProductDto.price.toString(),
            },
            include: {
                category: true,
            },
        });

        await this.auditService.logAction({
            action: 'CREATE_PRODUCT',
            entityId: product.id,
            entityType: 'PRODUCT',
            userId,
            details: { name: product.name, sku: product.sku }
        });

        // Invalidate lists (since we can't easily clear all lists, we rely on short TTL for lists)
        // We could potentially store list keys in a set, but for now we'll stick to short list TTL.
        return product;
    }

    async findAll(query: {
        page?: number;
        limit?: number;
        category?: string;
        metalType?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        search?: string;
        allStatus?: boolean;
    }) {
        // Cache Key Generation
        const cacheKey = `products:list:${JSON.stringify(query)}`;
        const cachedResult: any = await this.cacheManager.get(cacheKey);

        if (cachedResult) {
            return cachedResult;
        }

        const {
            page = 1,
            limit = 10,
            category,
            metalType,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            search,
            allStatus = false,
        } = query;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (!allStatus) {
            where.isActive = true;
        }

        if (category) where.categoryId = category;
        if (metalType) where.metalType = metalType;

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } },
                { metalType: { contains: search } },
                { sku: { contains: search } },
            ];
        }

        if (minPrice || maxPrice) {
            where.basePrice = {
                gte: minPrice ? minPrice.toString() : undefined,
                lte: maxPrice ? maxPrice.toString() : undefined,
            };
        }

        // --- SORTING LOGIC ---
        let orderBy: any = { createdAt: 'desc' }; // Default: Newest

        if (sortBy === 'price_asc') {
            orderBy = { basePrice: 'asc' };
        } else if (sortBy === 'price_desc') {
            orderBy = { basePrice: 'desc' };
        } else if (sortBy === 'newest') {
            orderBy = { createdAt: 'desc' };
        } else if (sortBy) {
            orderBy = { [sortBy]: 'desc' };
        }

        const [items, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: true,
                    images: { where: { isPrimary: true } }, // Optimized for collection grid
                },
                orderBy,
            }),
            this.prisma.product.count({ where }),
        ]);

        const result = {
            items,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };

        // Cache for 60 seconds (short duration for lists to reflect new products relatively quickly)
        await this.cacheManager.set(cacheKey, result, 60000);

        return result;
    }

    async searchProducts(query: string) {
        if (!query) return [];

        const cacheKey = `products:search:${query}`;
        const cachedResult: any = await this.cacheManager.get(cacheKey);

        if (cachedResult) {
            return cachedResult;
        }

        const result = await this.prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: query } },
                    { description: { contains: query } },
                    { metalType: { contains: query } },
                    { sku: { contains: query } },
                    { category: { name: { contains: query } } }
                ]
            },
            take: 10,
            include: {
                category: true,
                images: { where: { isPrimary: true } }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        await this.cacheManager.set(cacheKey, result, 120000); // 2 minutes

        return result;
    }

    async findOne(id: string) {
        const cacheKey = `products:id:${id}`;
        const cachedResult: any = await this.cacheManager.get(cacheKey);

        if (cachedResult) {
            return cachedResult;
        }

        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                images: true,
                videos: true,
                certificates: true,
            },
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        await this.cacheManager.set(cacheKey, product, 3600000); // 1 hour

        return product;
    }

    async findBySlug(slug: string) {
        const cacheKey = `products:slug:${slug}`;
        const cachedResult: any = await this.cacheManager.get(cacheKey);

        if (cachedResult) {
            return cachedResult;
        }

        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: {
                category: true,
                images: true,
                videos: true,
                certificates: true,
            },
        });

        if (!product) {
            throw new NotFoundException(`Product with slug ${slug} not found`);
        }

        await this.cacheManager.set(cacheKey, product, 3600000); // 1 hour

        return product;
    }

    async update(id: string, updateProductDto: UpdateProductDto, userId?: string) {
        // We find one first, to invalidate properly if needed, although we are invalidating by ID.
        const product = await this.findOne(id);

        if (updateProductDto.description) {
            updateProductDto.description = this.sanitizeContent(updateProductDto.description);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { price, ...updateData } = updateProductDto;

        const updatedProduct = await this.prisma.product.update({
            where: { id },
            data: {
                ...updateData,
                weight: updateProductDto.weight?.toString(),
                basePrice: updateProductDto.price
                    ? updateProductDto.price.toString()
                    : undefined,
            },
            include: {
                category: true,
            },
        });

        // Invalidate Cache
        await this.cacheManager.del(`products:id:${id}`);
        await this.cacheManager.del(`products:slug:${product.slug}`); // Invalidate old slug if changed?
        if (updatedProduct.slug !== product.slug) {
            await this.cacheManager.del(`products:slug:${updatedProduct.slug}`);
        }

        await this.auditService.logAction({
            action: 'UPDATE_PRODUCT',
            entityId: id,
            entityType: 'PRODUCT',
            userId,
            details: { changedFields: Object.keys(updateProductDto) }
        });

        return updatedProduct;
    }

    async updateStatus(id: string, isActive: boolean, userId?: string) {
        const product = await this.findOne(id);
        const updated = await this.prisma.product.update({
            where: { id },
            data: { isActive },
        });

        await this.cacheManager.del(`products:id:${id}`);
        await this.cacheManager.del(`products:slug:${product.slug}`);

        await this.auditService.logAction({
            action: 'UPDATE_PRODUCT_STATUS',
            entityId: id,
            entityType: 'PRODUCT',
            userId,
            details: { isActive }
        });

        return updated;
    }

    async findRelated(id: string) {
        const product = await this.findOne(id);
        // We could cache related products too
        const cacheKey = `products:related:${id}`;
        const cachedResult: any = await this.cacheManager.get(cacheKey);

        if (cachedResult) return cachedResult;

        const related = await this.prisma.product.findMany({
            where: {
                categoryId: product.categoryId,
                id: { not: id },
                isActive: true,
            },
            take: 4,
            include: {
                images: { where: { isPrimary: true } },
            },
        });

        await this.cacheManager.set(cacheKey, related, 3600000); // 1 hour

        return related;
    }

    async remove(id: string, userId?: string) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { images: true, videos: true, certificates: true }
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // Delete all associated files
        const cleanupPromises = [
            ...product.images.map(img => this.deleteFile(img.imageUrl)),
            ...product.videos.map(vid => this.deleteFile(vid.videoUrl)),
            ...product.certificates.map(cert => this.deleteFile(cert.certificateUrl)),
        ];
        await Promise.allSettled(cleanupPromises);

        await this.prisma.product.delete({
            where: { id },
        });

        await this.cacheManager.del(`products:id:${id}`);
        await this.cacheManager.del(`products:slug:${product.slug}`);

        await this.auditService.logAction({
            action: 'DELETE_PRODUCT',
            entityId: id,
            entityType: 'PRODUCT',
            userId,
            details: { name: product.name }
        });

        return { message: 'Product deleted' };
    }

    async deleteMedia(mediaId: string, userId?: string) {
        // Try finding image first
        const image = await this.prisma.productImage.findUnique({ where: { id: mediaId } });
        if (image) {
            await this.deleteFile(image.imageUrl);
            await this.prisma.productImage.delete({ where: { id: mediaId } });
            await this.cacheManager.del(`products:id:${image.productId}`);
        } else {
            // Try video
            const video = await this.prisma.productVideo.findUnique({ where: { id: mediaId } });
            if (video) {
                await this.deleteFile(video.videoUrl);
                await this.prisma.productVideo.delete({ where: { id: mediaId } });
                await this.cacheManager.del(`products:id:${video.productId}`);
            } else {
                return; // Or throw not found, but idempotent is safer
            }
        }

        await this.auditService.logAction({
            action: 'DELETE_MEDIA',
            entityId: mediaId,
            entityType: 'MEDIA',
            userId,
            details: {}
        });

        return { message: 'Media deleted' };
    }

    async uploadMedia(id: string, files: Array<Express.Multer.File>, userId?: string) {
        const product = await this.findOne(id);
        const mediaPromises = files.map((file, index) => {
            const isVideo = file.mimetype.startsWith('video/');
            const url = `/uploads/${file.filename}`;

            if (isVideo) {
                return this.prisma.productVideo.create({
                    data: {
                        productId: id,
                        videoUrl: url,
                    },
                });
            } else {
                return this.prisma.productImage.create({
                    data: {
                        productId: id,
                        imageUrl: url,
                        isPrimary: index === 0 && (product as any).images.length === 0,
                        displayOrder: (product as any).images.length + index,
                    },
                });
            }
        });

        const results = await Promise.all(mediaPromises);

        // Invalidate Product Cache
        await this.cacheManager.del(`products:id:${id}`);
        await this.cacheManager.del(`products:slug:${product.slug}`);

        await this.auditService.logAction({
            action: 'UPLOAD_MEDIA',
            entityId: id,
            entityType: 'PRODUCT',
            userId,
            details: { count: files.length, files: files.map(f => f.filename) }
        });

        return results;
    }

    async uploadCertificate(id: string, file: Express.Multer.File, certificateType: string, userId?: string) {
        await this.findOne(id);
        const url = `/uploads/${file.filename}`;

        const cert = await this.prisma.productCertificate.create({
            data: {
                productId: id,
                certificateUrl: url,
                certificateType: certificateType || 'GIA',
            },
        });

        // Invalidate Product
        // Invalidate Product Cache
        await this.cacheManager.del(`products:id:${id}`);
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (product) await this.cacheManager.del(`products:slug:${product.slug}`);

        await this.auditService.logAction({
            action: 'UPLOAD_CERTIFICATE',
            entityId: id,
            entityType: 'PRODUCT',
            userId,
            details: { type: certificateType }
        });

        return cert;
    }

    async findAllCategories() {
        const cacheKey = 'products:categories';
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) return cached;

        const categories = await this.prisma.category.findMany({
            orderBy: { name: 'asc' }
        });

        await this.cacheManager.set(cacheKey, categories, 3600000); // 1 hour
        return categories;
    }

    async createCategory(createCategoryDto: ProductCreateCategoryDto) {
        const category = await this.prisma.category.create({
            data: {
                name: createCategoryDto.name,
                description: createCategoryDto.description,
            },
        });

        await this.cacheManager.del('products:categories');

        return category;
    }

    async updateCategory(id: string, updateCategoryDto: ProductUpdateCategoryDto) {
        const category = await this.prisma.category.update({
            where: { id },
            data: {
                ...updateCategoryDto,
            },
        });

        await this.cacheManager.del('products:categories');

        return category;
    }

    async deleteCategory(id: string) {
        // Check if category has products
        const productsCount = await this.prisma.product.count({
            where: { categoryId: id },
        });

        if (productsCount > 0) {
            throw new BadRequestException(`Cannot delete category with ${productsCount} associated products.`);
        }

        await this.prisma.category.delete({
            where: { id },
        });

        await this.cacheManager.del('products:categories');

        return { message: 'Category deleted successfully' };
    }
}
