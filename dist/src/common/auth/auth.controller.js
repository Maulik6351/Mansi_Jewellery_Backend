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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_1 = require("@nestjs/jwt");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
let AuthController = class AuthController {
    constructor(authService, jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }
    async register(registerDto, res) {
        const result = await this.authService.register(registerDto);
        this.setCookies(res, result.accessToken, result.refreshToken);
        return { user: result.user };
    }
    async login(loginDto, res) {
        const result = await this.authService.login(loginDto);
        this.setCookies(res, result.accessToken, result.refreshToken);
        return { user: result.user };
    }
    async adminLogin(loginDto, res) {
        const result = await this.authService.adminLogin(loginDto);
        this.setCookies(res, result.accessToken, result.refreshToken);
        return { admin: result.admin };
    }
    async refresh(req, res) {
        const refreshToken = req.cookies['refresh_token'];
        if (!refreshToken)
            throw new common_1.UnauthorizedException('Refresh token missing');
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
            const result = await this.authService.refreshTokens(payload.sub, refreshToken, payload.role);
            this.setCookies(res, result.accessToken, result.refreshToken);
            return { success: true };
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(user, res) {
        if (user) {
            await this.authService.logout(user.id, user.role);
        }
        const isProduction = process.env.NODE_ENV === 'production';
        const isDevTunnel = process.env.ADMIN_PANEL_URL?.includes('devtunnels.ms') || process.env.USER_PANEL_URL?.includes('devtunnels.ms');
        const isSecure = isProduction || isDevTunnel;
        const sameSite = isProduction || isDevTunnel ? 'none' : 'lax';
        const cookieOptions = {
            httpOnly: true,
            secure: isSecure,
            sameSite: sameSite,
            path: '/',
        };
        res.clearCookie('access_token', cookieOptions);
        res.clearCookie('refresh_token', cookieOptions);
        return { success: true };
    }
    async getProfile(user) {
        return user;
    }
    setCookies(res, accessToken, refreshToken) {
        const isProduction = process.env.NODE_ENV === 'production';
        const isDevTunnel = process.env.ADMIN_PANEL_URL?.includes('devtunnels.ms') || process.env.USER_PANEL_URL?.includes('devtunnels.ms');
        const isSecure = isProduction || isDevTunnel;
        const sameSite = isProduction || isDevTunnel ? 'none' : 'lax';
        console.log(`Setting Cookies: isProduction=${isProduction}, isDevTunnel=${isDevTunnel}, Secure=${isSecure}, SameSite=${sameSite}`);
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: sameSite,
            maxAge: 15 * 60 * 1000,
            path: '/',
        });
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: sameSite,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'User login' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('admin/login'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin login' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh tokens' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Logout' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        jwt_1.JwtService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map