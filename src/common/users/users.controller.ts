import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateAddressDto } from './dto/create-address.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    getProfile(@CurrentUser() user: any) {
        return this.usersService.findOne(user.id);
    }

    @Post('address')
    @ApiOperation({ summary: 'Add a new address' })
    addAddress(@CurrentUser() user: any, @Body() createAddressDto: CreateAddressDto) {
        return this.usersService.addAddress(user.id, createAddressDto);
    }

    @Get('address')
    @ApiOperation({ summary: 'Get all addresses for current user' })
    getAddresses(@CurrentUser() user: any) {
        return this.usersService.getAddresses(user.id);
    }
}
