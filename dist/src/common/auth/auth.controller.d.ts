import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    private jwtService;
    constructor(authService: AuthService, jwtService: JwtService);
    register(registerDto: RegisterDto, res: Response): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    login(loginDto: LoginDto, res: Response): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    adminLogin(loginDto: LoginDto, res: Response): Promise<{
        admin: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    refresh(req: Request, res: Response): Promise<{
        success: boolean;
    }>;
    logout(user: any, res: Response): Promise<{
        success: boolean;
    }>;
    getProfile(user: any): Promise<any>;
    private setCookies;
}
