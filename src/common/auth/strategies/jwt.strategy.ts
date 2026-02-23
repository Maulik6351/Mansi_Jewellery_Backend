import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../db/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: (req) => {
                let token = null;
                if (req && req.cookies) {
                    token = req.cookies['access_token'];
                }
                if (!token) {
                    token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
                }
                return token;
            },
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        // Try to find user first
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (user) {
            return {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
            };
        }

        // If not found, try admin
        const admin = await this.prisma.admin.findUnique({
            where: { id: payload.sub },
        });

        if (admin) {
            return {
                id: admin.id,
                email: admin.email,
                role: admin.role,
                fullName: admin.fullName,
            };
        }

        throw new UnauthorizedException();
    }
}
