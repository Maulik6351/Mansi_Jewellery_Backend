import { PrismaService } from '../../db/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    logAction(data: {
        action: string;
        entityId?: string;
        entityType?: string;
        userId?: string;
        details?: any;
    }): Promise<void>;
}
