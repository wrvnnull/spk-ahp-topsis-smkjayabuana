import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { MeResponseDto } from './dto/me.dto';
import { Request } from 'express';
import { Audit } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    ownedClassIds: string[];
  };
}

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Audit({ resourceType: 'auth' })
  @UseInterceptors(AuditInterceptor)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true })
    res: Response,
  ) {
    const user = await this.authService.login(loginDto.email, loginDto.password, res);
    return user;
  }

  @Post('refresh')
  @Audit({ resourceType: 'auth' })
  @UseInterceptors(AuditInterceptor)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.refreshTokenFromCookie(req, res);
    return user;
  }

  @Post('logout')
  @Audit({ resourceType: 'auth' })
  @UseInterceptors(AuditInterceptor)
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logout(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthenticatedRequest): Promise<MeResponseDto> {
    const user = req.user;
    if (!user || !user.userId) {
      throw new UnauthorizedException('Tidak terautentikasi');
    }
    return this.authService.getCurrentUser(user.userId);
  }
}
