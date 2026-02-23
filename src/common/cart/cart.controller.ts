import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
// Assuming JwtAuthGuard exists and puts user object in request
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    getCart(@Req() req: any) {
        return this.cartService.getCart(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('add')
    addItem(@Req() req: any, @Body() dto: AddToCartDto) {
        return this.cartService.addToCart(req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('item/:id')
    updateItem(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCartItemDto) {
        return this.cartService.updateCartItem(req.user.id, id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('item/:id')
    removeItem(@Req() req: any, @Param('id') id: string) {
        return this.cartService.removeCartItem(req.user.id, id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('clear')
    clearCart(@Req() req: any) {
        return this.cartService.clearCart(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('merge')
    mergeCart(@Req() req: any, @Body() body: { items: { productId: string, quantity: number }[] }) {
        return this.cartService.mergeGuestCart(req.user.id, body.items);
    }
}
