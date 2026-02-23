import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { PrismaModule } from '../../db/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [WishlistController],
    providers: [WishlistService],
    exports: [WishlistService],
})
export class WishlistModule { }
