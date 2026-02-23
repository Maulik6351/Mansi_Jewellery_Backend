import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductCreateCategoryDto } from './dto/product-create-category.dto';
import { ProductUpdateCategoryDto } from './dto/product-update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get('categories')
    @ApiOperation({ summary: 'Get all categories' })
    findAllCategories() {
        return this.productsService.findAllCategories();
    }

    @Get()
    @ApiOperation({ summary: 'Get all products (Paginated)' })
    findAll(@Query() query: {
        page?: number;
        limit?: number;
        category?: string;
        metalType?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        search?: string;
        allStatus?: string;
    }) {
        return this.productsService.findAll({
            ...query,
            page: query.page ? +query.page : undefined,
            limit: query.limit ? +query.limit : undefined,
            minPrice: query.minPrice ? +query.minPrice : undefined,
            maxPrice: query.maxPrice ? +query.maxPrice : undefined,
            allStatus: query.allStatus === 'true',
        });
    }

    @Get('filter')
    @ApiOperation({ summary: 'Filter products by criteria' })
    filter(@Query() query: any) {
        return this.productsService.findAll(query);
    }

    @Get('search')
    @ApiOperation({ summary: 'Search products by query' })
    search(@Query('q') query: string) {
        return this.productsService.searchProducts(query);
    }

    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get a product by slug' })
    findBySlug(@Param('slug') slug: string) {
        return this.productsService.findBySlug(slug);
    }

    @Get('related/:id')
    @ApiOperation({ summary: 'Get related products' })
    findRelated(@Param('id') id: string) {
        return this.productsService.findRelated(id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a product by ID' })
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    // --- ADMIN APIS ---

    @Post('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new product (Admin only)' })
    create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: any) {
        return this.productsService.create(createProductDto, user?.id);
    }

    @Patch('admin/status/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle product status (Admin only)' })
    updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean, @CurrentUser() user: any) {
        return this.productsService.updateStatus(id, isActive, user?.id);
    }

    @Patch('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a product (Admin only)' })
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @CurrentUser() user: any) {
        return this.productsService.update(id, updateProductDto, user?.id);
    }

    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a product (Admin only)' })
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.productsService.remove(id, user?.id);
    }

    @Post('admin/upload-media/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @UseInterceptors(FilesInterceptor('files'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Upload product images/videos (Admin only)' })
    uploadMedia(
        @Param('id') id: string,
        @UploadedFiles(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB max
                ],
            }),
        ) files: Array<Express.Multer.File>,
        @CurrentUser() user: any,
    ) {
        const allowedMimeTypes = /^(image|video)\//;
        for (const file of files) {
            if (!allowedMimeTypes.test(file.mimetype)) {
                throw new BadRequestException(`File type ${file.mimetype} is not allowed. Only images and videos are accepted.`);
            }
        }
        return this.productsService.uploadMedia(id, files, user?.id);
    }

    @Post('admin/upload-certificate/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @UseInterceptors(FileInterceptor('file'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Upload product certificate (Admin only)' })
    uploadCertificate(
        @Param('id') id: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB max
                ],
            }),
        ) file: Express.Multer.File,
        @Body('certificateType') certificateType: string,
        @CurrentUser() user: any,
    ) {
        const allowedMimeTypes = /^(application\/pdf|image\/)/;
        if (!allowedMimeTypes.test(file.mimetype)) {
            throw new BadRequestException(`File type ${file.mimetype} is not allowed. Only PDF and images are accepted.`);
        }
        return this.productsService.uploadCertificate(id, file, certificateType, user?.id);
    }

    @Delete('admin/media/:mediaId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete product media (Admin only)' })
    deleteMedia(@Param('mediaId') mediaId: string, @CurrentUser() user: any) {
        return this.productsService.deleteMedia(mediaId, user?.id);
    }

    @Post('admin/categories')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new category (Admin only)' })
    createCategory(@Body() createCategoryDto: ProductCreateCategoryDto) {
        return this.productsService.createCategory(createCategoryDto);
    }

    @Patch('admin/categories/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a category (Admin only)' })
    updateCategory(@Param('id') id: string, @Body() updateCategoryDto: ProductUpdateCategoryDto) {
        return this.productsService.updateCategory(id, updateCategoryDto);
    }

    @Delete('admin/categories/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a category (Admin only)' })
    deleteCategory(@Param('id') id: string) {
        return this.productsService.deleteCategory(id);
    }
}
