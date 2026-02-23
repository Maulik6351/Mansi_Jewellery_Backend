import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async logAction(data: {
        action: string;
        entityId?: string;
        entityType?: string;
        userId?: string;
        details?: any;
    }) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    action: data.action,
                    entityId: data.entityId,
                    entityType: data.entityType,
                    userId: data.userId,
                    details: data.details ? JSON.stringify(data.details) : undefined,
                },
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // We don't want to fail the main request if audit logging fails, mostly
        }
    }
}
