import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AUDIT_KEY, AuditConfig } from './audit.decorator';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  private getHttpMethod(context: ExecutionContext): string {
    return context.switchToHttp().getRequest().method;
  }

  private getEndpoint(context: ExecutionContext): string {
    const req = context.switchToHttp().getRequest();
    return req.originalUrl || req.url || '';
  }

  private getIpAddress(context: ExecutionContext): string | undefined {
    const req = context.switchToHttp().getRequest();
    return req.ip || req.socket?.remoteAddress || undefined;
  }

  private getUserId(context: ExecutionContext): string | undefined {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (user && typeof user === 'object' && 'userId' in user) {
      return (user as any).userId as string;
    }
    return undefined;
  }

  private getUserName(context: ExecutionContext): string {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (user && typeof user === 'object' && 'name' in user) {
      return (user as any).name as string;
    }
    return 'Unknown';
  }

  private getResourceIdFromResponse(response: any): string | undefined {
    if (!response || typeof response !== 'object') return undefined;

    // Handle string message responses (DELETE operations)
    if (typeof response === 'string') return undefined;

    // Handle object responses - try common ID fields
    if ('id' in response && typeof response.id === 'string') {
      return response.id;
    }

    // Handle { message: string } responses (no ID needed)
    if ('message' in response && typeof response.message === 'string') {
      return undefined;
    }

    return undefined;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const auditConfig = this.reflector.get<AuditConfig>(
      AUDIT_KEY,
      handler,
    );

    // Skip jika tidak ada decorator @Audit
    if (!auditConfig) {
      return next.handle();
    }

    const httpMethod = this.getHttpMethod(context);
    const endpoint = this.getEndpoint(context);
    const ipAddress = this.getIpAddress(context);
    const userId = this.getUserId(context);
    const userName = this.getUserName(context);

    // Jika tidak ada user (misal untuk login yang belum autentikasi),
    // skip audit atau catat dengan user "Unknown"
    const effectiveUserId = userId || 'SYSTEM';
    const effectiveUserName = userId ? userName : 'System';

    // Tentukan action: normalisasi HTTP method ke operation
    let action: string;
    switch (httpMethod) {
      case 'POST':
        action = 'CREATE';
        break;
      case 'PATCH':
        action = 'UPDATE';
        break;
      case 'DELETE':
        action = 'DELETE';
        break;
      default:
        action = httpMethod.toUpperCase();
    }

    return next.handle().pipe(
      tap((response) => {
        const resourceId = this.getResourceIdFromResponse(response);

        this.auditService.createAuditLog({
          userId: effectiveUserId,
          userName: effectiveUserName,
          action,
          resourceType: auditConfig.resourceType,
          resourceId,
          details: {
            http_method: httpMethod,
            endpoint,
          },
          ipAddress,
        });
      }),
      catchError((error) => {
        // ERROR: hanya catat ke console, jangan audit sukses untuk request gagal
        console.error('[AuditInterceptor] Request gagal:', error.message);
        return throwError(() => error);
      }),
    );
  }
}
