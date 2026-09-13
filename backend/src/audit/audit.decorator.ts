import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit:config';

export interface AuditConfig {
  resourceType: string;
  action?: string;
}

export const Audit = (config: AuditConfig) => SetMetadata(AUDIT_KEY, config);
