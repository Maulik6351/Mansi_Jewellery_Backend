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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../db/prisma.service");
const hash_util_1 = require("../../utils/hash.util");
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCK_TIME = 30 * 60 * 1000;
    }
    async register(registerDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const passwordHash = await hash_util_1.HashUtil.hash(registerDto.password);
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                passwordHash,
                fullName: registerDto.fullName,
            },
        });
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken, 'user');
        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
            ...tokens,
        };
    }
    async login(loginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.checkLock(user.lockUntil);
        const isPasswordValid = await hash_util_1.HashUtil.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            await this.handleFailedAttempt(user.id, user.loginAttempts, 'user');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.resetAttempts(user.id, 'user');
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken, 'user');
        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
            ...tokens,
        };
    }
    async adminLogin(loginDto) {
        console.log('Admin login attempt:', loginDto.email);
        const admin = await this.prisma.admin.findUnique({
            where: { email: loginDto.email },
        });
        if (!admin) {
            console.log('Admin login failed: Admin user not found');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!admin.isActive) {
            console.log('Admin login failed: Admin account inactive');
            throw new common_1.UnauthorizedException('Account is inactive');
        }
        await this.checkLock(admin.lockUntil);
        const isPasswordValid = await hash_util_1.HashUtil.compare(loginDto.password, admin.passwordHash);
        if (!isPasswordValid) {
            console.log('Admin login failed: Invalid password');
            await this.handleFailedAttempt(admin.id, admin.loginAttempts, 'admin');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.resetAttempts(admin.id, 'admin');
        const tokens = await this.getTokens(admin.id, admin.email, admin.role);
        await this.updateRefreshToken(admin.id, tokens.refreshToken, 'admin');
        console.log('Admin login successful:', admin.email);
        return {
            admin: {
                id: admin.id,
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role,
            },
            ...tokens,
        };
    }
    async logout(userId, role) {
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
            await this.prisma.admin.update({
                where: { id: userId },
                data: { refreshTokenHash: null },
            });
        }
        else {
            await this.prisma.user.update({
                where: { id: userId },
                data: { refreshTokenHash: null },
            });
        }
    }
    async refreshTokens(userId, refreshToken, role) {
        let user;
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
            user = await this.prisma.admin.findUnique({ where: { id: userId } });
        }
        else {
            user = await this.prisma.user.findUnique({ where: { id: userId } });
        }
        if (!user || !user.refreshTokenHash) {
            throw new common_1.ForbiddenException('Access Denied');
        }
        const refreshTokenMatches = await hash_util_1.HashUtil.compare(refreshToken, user.refreshTokenHash);
        if (!refreshTokenMatches) {
            throw new common_1.ForbiddenException('Access Denied');
        }
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken, (role === 'ADMIN' || role === 'SUPER_ADMIN') ? 'admin' : 'user');
        return tokens;
    }
    async updateRefreshToken(userId, refreshToken, entity) {
        const hash = await hash_util_1.HashUtil.hash(refreshToken);
        if (entity === 'admin') {
            await this.prisma.admin.update({
                where: { id: userId },
                data: { refreshTokenHash: hash },
            });
        }
        else {
            await this.prisma.user.update({
                where: { id: userId },
                data: { refreshTokenHash: hash },
            });
        }
    }
    async getTokens(userId, email, role) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync({ sub: userId, email, role }, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: '15m',
            }),
            this.jwtService.signAsync({ sub: userId, email, role }, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            }),
        ]);
        return {
            accessToken,
            refreshToken,
        };
    }
    async handleFailedAttempt(userId, currentAttempts, entity) {
        const attempts = currentAttempts + 1;
        let data = { loginAttempts: attempts };
        if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
            data.lockUntil = new Date(Date.now() + this.LOCK_TIME);
        }
        if (entity === 'admin') {
            await this.prisma.admin.update({ where: { id: userId }, data });
        }
        else {
            await this.prisma.user.update({ where: { id: userId }, data });
        }
    }
    async resetAttempts(userId, entity) {
        const data = { loginAttempts: 0, lockUntil: null };
        if (entity === 'admin') {
            await this.prisma.admin.update({ where: { id: userId }, data });
        }
        else {
            await this.prisma.user.update({ where: { id: userId }, data });
        }
    }
    async checkLock(lockUntil) {
        if (lockUntil && lockUntil > new Date()) {
            throw new common_1.UnauthorizedException('Account is temporarily locked. Please try again later.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map