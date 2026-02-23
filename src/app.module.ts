import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { PrismaModule } from './db/prisma.module';
import { AuthModule } from './common/auth/auth.module';
import { ProductsModule } from './common/products/products.module';
import { CategoriesModule } from './common/categories/categories.module';
import { UsersModule } from './common/users/users.module';
import { AdminModule } from './common/admin/admin.module';
import { WishlistModule } from './common/wishlist/wishlist.module';
import { CartModule } from './common/cart/cart.module';
import { OrdersModule } from './common/orders/orders.module';
import * as redisStore from 'cache-manager-redis-store';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PrismaModule,
        CacheModule.register({
            isGlobal: true,
            store: redisStore,
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            ttl: 600, // 10 minutes cache
        }),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100, // 100 requests per minute
        }]),
        AuthModule,
        ProductsModule,
        CategoriesModule,
        UsersModule,
        AdminModule,
        WishlistModule,
        CartModule,
        OrdersModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: CacheInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
