import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class WishlistService {
    constructor(private prisma: PrismaService) { }

    async getWishlist(userId: string) {
        return this.prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    include: {
                        images: {
                            where: { isPrimary: true },
                            take: 1
                        },
                        category: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async addToWishlist(userId: string, productId: string) {
        // Check if product exists
        const product = await this.prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Check if already in wishlist
        const existing = await this.prisma.wishlist.findUnique({
            where: {
                userId_productId: { userId, productId }
            }
        });

        if (existing) {
            throw new ConflictException('Product already in wishlist');
        }

        return this.prisma.wishlist.create({
            data: {
                userId,
                productId
            },
            include: {
                product: {
                    include: {
                        images: {
                            where: { isPrimary: true },
                            take: 1
                        },
                        category: true
                    }
                }
            }
        });
    }

    async removeFromWishlist(userId: string, productId: string) {
        const item = await this.prisma.wishlist.findUnique({
            where: {
                userId_productId: { userId, productId }
            }
        });

        if (!item) {
            throw new NotFoundException('Product not found in wishlist');
        }

        return this.prisma.wishlist.delete({
            where: {
                userId_productId: { userId, productId }
            }
        });
    }
}
