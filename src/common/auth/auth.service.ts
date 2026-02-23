import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../db/prisma.service';
import { HashUtil } from '../../utils/hash.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    private readonly MAX_LOGIN_ATTEMPTS = 5;
    private readonly LOCK_TIME = 30 * 60 * 1000; // 30 minutes

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const passwordHash = await HashUtil.hash(registerDto.password);

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

    async login(loginDto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        await this.checkLock(user.lockUntil);

        const isPasswordValid = await HashUtil.compare(
            loginDto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            await this.handleFailedAttempt(user.id, user.loginAttempts, 'user');
            throw new UnauthorizedException('Invalid credentials');
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

    async adminLogin(loginDto: LoginDto) {
        console.log('Admin login attempt:', loginDto.email);

        const admin = await this.prisma.admin.findUnique({
            where: { email: loginDto.email },
        });

        if (!admin) {
            console.log('Admin login failed: Admin user not found');
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!admin.isActive) {
            console.log('Admin login failed: Admin account inactive');
            throw new UnauthorizedException('Account is inactive');
        }

        await this.checkLock(admin.lockUntil);

        const isPasswordValid = await HashUtil.compare(
            loginDto.password,
            admin.passwordHash,
        );

        if (!isPasswordValid) {
            console.log('Admin login failed: Invalid password');
            await this.handleFailedAttempt(admin.id, admin.loginAttempts, 'admin');
            throw new UnauthorizedException('Invalid credentials');
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

    async logout(userId: string, role: string) {
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
            await this.prisma.admin.update({
                where: { id: userId },
                data: { refreshTokenHash: null },
            });
        } else {
            await this.prisma.user.update({
                where: { id: userId },
                data: { refreshTokenHash: null },
            });
        }
    }

    async refreshTokens(userId: string, refreshToken: string, role: string) {
        let user;
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
            user = await this.prisma.admin.findUnique({ where: { id: userId } });
        } else {
            user = await this.prisma.user.findUnique({ where: { id: userId } });
        }

        if (!user || !user.refreshTokenHash) {
            throw new ForbiddenException('Access Denied');
        }

        const refreshTokenMatches = await HashUtil.compare(
            refreshToken,
            user.refreshTokenHash,
        );

        if (!refreshTokenMatches) {
            throw new ForbiddenException('Access Denied');
        }

        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken, (role === 'ADMIN' || role === 'SUPER_ADMIN') ? 'admin' : 'user');

        return tokens;
    }

    private async updateRefreshToken(userId: string, refreshToken: string, entity: 'user' | 'admin') {
        const hash = await HashUtil.hash(refreshToken);
        if (entity === 'admin') {
            await this.prisma.admin.update({
                where: { id: userId },
                data: { refreshTokenHash: hash },
            });
        } else {
            await this.prisma.user.update({
                where: { id: userId },
                data: { refreshTokenHash: hash },
            });
        }
    }

    private async getTokens(userId: string, email: string, role: string) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                { sub: userId, email, role },
                {
                    secret: this.configService.get('JWT_SECRET'),
                    expiresIn: '15m',
                },
            ),
            this.jwtService.signAsync(
                { sub: userId, email, role },
                {
                    secret: this.configService.get('JWT_REFRESH_SECRET'),
                    expiresIn: '7d',
                },
            ),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    private async handleFailedAttempt(userId: string, currentAttempts: number, entity: 'user' | 'admin') {
        const attempts = currentAttempts + 1;
        let data: any = { loginAttempts: attempts };

        if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
            data.lockUntil = new Date(Date.now() + this.LOCK_TIME);
        }

        if (entity === 'admin') {
            await this.prisma.admin.update({ where: { id: userId }, data });
        } else {
            await this.prisma.user.update({ where: { id: userId }, data });
        }
    }

    private async resetAttempts(userId: string, entity: 'user' | 'admin') {
        const data = { loginAttempts: 0, lockUntil: null };
        if (entity === 'admin') {
            await this.prisma.admin.update({ where: { id: userId }, data });
        } else {
            await this.prisma.user.update({ where: { id: userId }, data });
        }
    }

    private async checkLock(lockUntil: Date | null) {
        if (lockUntil && lockUntil > new Date()) {
            throw new UnauthorizedException('Account is temporarily locked. Please try again later.');
        }
    }
}

