import { Controller, Post, Body, Get, UseGuards, Res, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private jwtService: JwtService,
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.register(registerDto);
        this.setCookies(res, result.accessToken, result.refreshToken);
        return { user: result.user };
    }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(loginDto);
        this.setCookies(res, result.accessToken, result.refreshToken);
        return { user: result.user };
    }

    @Post('admin/login')
    @ApiOperation({ summary: 'Admin login' })
    async adminLogin(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.adminLogin(loginDto);
        this.setCookies(res, result.accessToken, result.refreshToken);
        return { admin: result.admin };
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh tokens' })
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies['refresh_token'];
        if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

        try {
            // Manually verify the refresh token since we don't have access token for JwtAuthGuard
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });

            const result = await this.authService.refreshTokens(payload.sub, refreshToken, payload.role);
            this.setCookies(res, result.accessToken, result.refreshToken);
            return { success: true };
        } catch (e) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Logout' })
    async logout(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
        if (user) {
            await this.authService.logout(user.id, user.role);
        }

        // Clear cookies with the same options as they were set
        const isProduction = process.env.NODE_ENV === 'production';
        const isDevTunnel = process.env.ADMIN_PANEL_URL?.includes('devtunnels.ms') || process.env.USER_PANEL_URL?.includes('devtunnels.ms');
        const isSecure = isProduction || isDevTunnel;
        const sameSite: boolean | 'none' | 'lax' | 'strict' = isProduction || isDevTunnel ? 'none' : 'lax';

        const cookieOptions = {
            httpOnly: true,
            secure: isSecure,
            sameSite: sameSite,
            path: '/', // Critical: must match the path used when setting the cookie
        };

        res.clearCookie('access_token', cookieOptions);
        res.clearCookie('refresh_token', cookieOptions);

        return { success: true };
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@CurrentUser() user: any) {
        return user;
    }

    private setCookies(res: Response, accessToken: string, refreshToken: string) {
        const isProduction = process.env.NODE_ENV === 'production';
        const isDevTunnel = process.env.ADMIN_PANEL_URL?.includes('devtunnels.ms') || process.env.USER_PANEL_URL?.includes('devtunnels.ms');

        // Force secure if production or devtunnel (HTTPS required for SameSite=None)
        const isSecure = isProduction || isDevTunnel;
        // Use None for cross-site (required for devtunnels subdomains), otherwise Lax
        const sameSite = isProduction || isDevTunnel ? 'none' : 'lax';

        console.log(`Setting Cookies: isProduction=${isProduction}, isDevTunnel=${isDevTunnel}, Secure=${isSecure}, SameSite=${sameSite}`);

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: sameSite,
            maxAge: 15 * 60 * 1000, // 15m
            path: '/', // Explicitly set path to ensure it's available everywhere
        });
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: sameSite,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
            path: '/', // Explicitly set path
        });
    }
}

