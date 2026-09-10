import { Injectable, OnModuleInit, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

interface JwtPayload {
  sub: string;
  role: string;
  owned_class_ids?: string[];
}

interface Tokens {
  access: string;
  refresh: string;
}

function setCookie(
  res: Response,
  name: string,
  value: string,
  maxAge: number,
) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN || '';
  (res as any).cookie(name, value, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain || undefined,
    maxAge,
  });
}

function clearCookie(res: Response, name: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN || '';
  (res as any).clearCookie(name, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain || undefined,
  });
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    // PrismaService sudah di-onModuleInit sendiri
  }

  private buildTokens(userId: string, role: string, ownedClassIds: string[]): Tokens {
    const accessPayload: JwtPayload = {
      sub: userId,
      role,
      owned_class_ids: ownedClassIds,
    };

    const refreshPayload = {
      sub: userId,
      role,
      type: 'refresh',
      owned_class_ids: ownedClassIds,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    return { access: accessToken, refresh: refreshToken };
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    setCookie(res, 'access_token', accessToken, 15 * 60 * 1000);
    setCookie(res, 'refresh_token', refreshToken, 7 * 24 * 60 * 60 * 1000);
  }

  private clearAllCookies(res: Response) {
    clearCookie(res, 'access_token');
    clearCookie(res, 'refresh_token');
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        classesWali: { select: { id: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const ownedClassIds = user.classesWali.map(c => c.id);
    const tokens = this.buildTokens(user.id, user.role, ownedClassIds);
    this.setCookies(res, tokens.access, tokens.refresh);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      owned_class_ids: ownedClassIds,
    };
  }

  async refreshTokenFromCookie(req: any, res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token tidak ditemukan di cookie');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid atau sudah expired');
    }

    if (!payload.sub || payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token tidak valid');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { classesWali: { select: { id: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Pengguna tidak ditemukan');
    }

    const ownedClassIds = user.classesWali.map(c => c.id);
    const tokens = this.buildTokens(user.id, user.role, ownedClassIds);
    this.setCookies(res, tokens.access, tokens.refresh);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      owned_class_ids: ownedClassIds,
    };
  }

  async logout(res: Response): Promise<void> {
    this.clearAllCookies(res);
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { classesWali: { select: { id: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Pengguna tidak ditemukan');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      owned_class_ids: user.classesWali.map(c => c.id),
    };
  }
}
