import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // Limit 3 checkouts per minute per user/IP
    async createOrder(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
        const userId = req.user.id;
        return this.ordersService.createOrder(userId, createOrderDto);
    }

    @Get()
    async getMyOrders(@Req() req: any) {
        const userId = req.user.id;
        return this.ordersService.getAllOrders(userId);
    }

    @Get(':id')
    async getOrderDetails(@Req() req: any, @Param('id') id: string) {
        const userId = req.user.id;
        return this.ordersService.getOrderById(id, userId);
    }

    // Admin Endpoints
    // TODO: Add RolesGuard
    @Get('admin/all')
    // @UseGuards(RolesGuard)
    // @Roles(Role.ADMIN)
    async getAllOrdersAdmin(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
        @Query('search') search?: string
    ) {
        return this.ordersService.getAllOrdersAdmin({ page, limit, status, search });
    }

    @Post('admin/:id/status') // Using POST or PATCH
    async updateOrderStatus(
        @Param('id') id: string,
        @Body() body: { status: any, trackingNumber?: string, shippingProvider?: string, adminNotes?: string }
    ) {
        return this.ordersService.updateStatus(id, body.status, {
            trackingNumber: body.trackingNumber,
            shippingProvider: body.shippingProvider,
            adminNotes: body.adminNotes
        });
    }

    @Post(':id/cancel')
    async cancelOrder(@Req() req: any, @Param('id') id: string) {
        const userId = req.user.id;
        return this.ordersService.cancelOrder(id, userId);
    }
}
