"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../db/prisma.service");
const fs = require("fs/promises");
const path = require("path");
const cache_manager_1 = require("@nestjs/cache-manager");
const audit_service_1 = require("../admin/audit.service");
const sanitizeHtml = require("sanitize-html");
let ProductsService = class ProductsService {
    constructor(prisma, cacheManager, auditService) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
        this.auditService = auditService;
    }
    sanitizeContent(content) {
        return sanitizeHtml(content, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                'img': ['src', 'alt']
            }
        });
    }
    async deleteFile(fileUrl) {
        if (!fileUrl)
            return;
        try {
            const filename = fileUrl.split('/').pop();
            if (filename) {
                const filePath = path.join(process.cwd(), 'uploads', filename);
                await fs.unlink(filePath);
            }
        }
        catch (error) {
            console.error(`Failed to delete file ${fileUrl}:`, error);
        }
    }
    async create(createProductDto, userId) {
        const slug = createProductDto.name
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
        if (createProductDto.description) {
            createProductDto.description = this.sanitizeContent(createProductDto.description);
        }
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
        return product;
    }
    async findAll(query) {
        const cacheKey = `products:list:${JSON.stringify(query)}`;
        const cachedResult = await this.cacheManager.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        const { page = 1, limit = 10, category, metalType, minPrice, maxPrice, sortBy = 'createdAt', search, allStatus = false, } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (!allStatus) {
            where.isActive = true;
        }
        if (category)
            where.categoryId = category;
        if (metalType)
            where.metalType = metalType;
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
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'price_asc') {
            orderBy = { basePrice: 'asc' };
        }
        else if (sortBy === 'price_desc') {
            orderBy = { basePrice: 'desc' };
        }
        else if (sortBy === 'newest') {
            orderBy = { createdAt: 'desc' };
        }
        else if (sortBy) {
            orderBy = { [sortBy]: 'desc' };
        }
        const [items, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: true,
                    images: { where: { isPrimary: true } },
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
        await this.cacheManager.set(cacheKey, result, 60000);
        return result;
    }
    async searchProducts(query) {
        if (!query)
            return [];
        const cacheKey = `products:search:${query}`;
        const cachedResult = await this.cacheManager.get(cacheKey);
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
        await this.cacheManager.set(cacheKey, result, 120000);
        return result;
    }
    async findOne(id) {
        const cacheKey = `products:id:${id}`;
        const cachedResult = await this.cacheManager.get(cacheKey);
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
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        await this.cacheManager.set(cacheKey, product, 3600000);
        return product;
    }
    async findBySlug(slug) {
        const cacheKey = `products:slug:${slug}`;
        const cachedResult = await this.cacheManager.get(cacheKey);
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
            throw new common_1.NotFoundException(`Product with slug ${slug} not found`);
        }
        await this.cacheManager.set(cacheKey, product, 3600000);
        return product;
    }
    async update(id, updateProductDto, userId) {
        const product = await this.findOne(id);
        if (updateProductDto.description) {
            updateProductDto.description = this.sanitizeContent(updateProductDto.description);
        }
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
        await this.cacheManager.del(`products:id:${id}`);
        await this.cacheManager.del(`products:slug:${product.slug}`);
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
    async updateStatus(id, isActive, userId) {
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
    async findRelated(id) {
        const product = await this.findOne(id);
        const cacheKey = `products:related:${id}`;
        const cachedResult = await this.cacheManager.get(cacheKey);
        if (cachedResult)
            return cachedResult;
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
        await this.cacheManager.set(cacheKey, related, 3600000);
        return related;
    }
    async remove(id, userId) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { images: true, videos: true, certificates: true }
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
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
    async deleteMedia(mediaId, userId) {
        const image = await this.prisma.productImage.findUnique({ where: { id: mediaId } });
        if (image) {
            await this.deleteFile(image.imageUrl);
            await this.prisma.productImage.delete({ where: { id: mediaId } });
            await this.cacheManager.del(`products:id:${image.productId}`);
        }
        else {
            const video = await this.prisma.productVideo.findUnique({ where: { id: mediaId } });
            if (video) {
                await this.deleteFile(video.videoUrl);
                await this.prisma.productVideo.delete({ where: { id: mediaId } });
                await this.cacheManager.del(`products:id:${video.productId}`);
            }
            else {
                return;
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
    async uploadMedia(id, files, userId) {
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
            }
            else {
                return this.prisma.productImage.create({
                    data: {
                        productId: id,
                        imageUrl: url,
                        isPrimary: index === 0 && product.images.length === 0,
                        displayOrder: product.images.length + index,
                    },
                });
            }
        });
        const results = await Promise.all(mediaPromises);
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
    async uploadCertificate(id, file, certificateType, userId) {
        await this.findOne(id);
        const url = `/uploads/${file.filename}`;
        const cert = await this.prisma.productCertificate.create({
            data: {
                productId: id,
                certificateUrl: url,
                certificateType: certificateType || 'GIA',
            },
        });
        await this.cacheManager.del(`products:id:${id}`);
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (product)
            await this.cacheManager.del(`products:slug:${product.slug}`);
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
        if (cached)
            return cached;
        const categories = await this.prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        await this.cacheManager.set(cacheKey, categories, 3600000);
        return categories;
    }
    async createCategory(createCategoryDto) {
        const category = await this.prisma.category.create({
            data: {
                name: createCategoryDto.name,
                description: createCategoryDto.description,
            },
        });
        await this.cacheManager.del('products:categories');
        return category;
    }
    async updateCategory(id, updateCategoryDto) {
        const category = await this.prisma.category.update({
            where: { id },
            data: {
                ...updateCategoryDto,
            },
        });
        await this.cacheManager.del('products:categories');
        return category;
    }
    async deleteCategory(id) {
        const productsCount = await this.prisma.product.count({
            where: { categoryId: id },
        });
        if (productsCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete category with ${productsCount} associated products.`);
        }
        await this.prisma.category.delete({
            where: { id },
        });
        await this.cacheManager.del('products:categories');
        return { message: 'Category deleted successfully' };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, audit_service_1.AuditService])
], ProductsService);
//# sourceMappingURL=products.service.js.map