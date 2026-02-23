import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Get()
    getWishlist(@CurrentUser() user: any) {
        return this.wishlistService.getWishlist(user.id);
    }

    @Post('add')
    addToWishlist(@CurrentUser() user: any, @Body() dto: AddToWishlistDto) {
        return this.wishlistService.addToWishlist(user.id, dto.productId);
    }

    @Delete('remove/:productId')
    removeFromWishlist(@CurrentUser() user: any, @Param('productId') productId: string) {
        return this.wishlistService.removeFromWishlist(user.id, productId);
    }
}
