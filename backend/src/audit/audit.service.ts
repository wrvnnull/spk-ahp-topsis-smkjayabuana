import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InputJsonValue } from '@prisma/client/runtime/library';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async createAuditLog(data: {
    userId: string;
    userName: string;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    details?: Record<string, unknown> | null;
    ipAddress?: string | null;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          user_id: data.userId,
          user_name: data.userName,
          action: data.action,
          resource_type: data.resourceType,
          resource_id: data.resourceId ?? null,
          details: data.details ? (data.details as InputJsonValue) : undefined,
          ip_address: data.ipAddress ?? null,
        },
      });
    } catch (err) {
      // Audit gagal tidak boleh menggagalkan request utama
      console.error('[AuditService] Gagal mencatat audit log:', err);
    }
  }
}
