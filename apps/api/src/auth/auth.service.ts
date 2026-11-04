import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import { PrismaService } from '../prisma.service';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE = 'refresh_token';

type SessionUser = {
  id: string;
  phone: string;
  fullName: string;
  role: string;
};

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_SECRET is missing. Add JWT_SECRET="long-random-text" to the .env file in the project root.',
      );
    }
    this.jwtSecret = secret;
  }

  async requestOtp(phone: string) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.prisma.otpCode.updateMany({
      where: { phone, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash: sha256(code),
        purpose: 'login',
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    console.log(`[OTP] ${phone} ${code}`);
    return { ok: true };
  }

  async verifyOtp(phone: string, code: string, req: Request, res: Response) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException('Too many attempts');
    }

    const expected = Buffer.from(otp.codeHash);
    const actual = Buffer.from(sha256(code));
    const match =
      expected.length === actual.length && timingSafeEqual(expected, actual);

    if (!match) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid or expired code');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const user = await this.prisma.user.upsert({
      where: { phone },
      create: {
        phone,
        fullName: `User ${phone.slice(-4)}`,
        phoneVerifiedAt: new Date(),
      },
      update: { phoneVerifiedAt: new Date() },
    });

    if (!user.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    return this.startSession(user, req, res);
  }

  async refresh(req: Request, res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) {
      throw new UnauthorizedException();
    }

    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: sha256(raw) },
    });
    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.startSession(user, req, res);
  }

  async logout(req: Request, res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (raw) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: sha256(raw), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return { ok: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        fullName: true,
        email: true,
        role: true,
        preferredLang: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private async startSession(user: SessionUser, req: Request, res: Response) {
    const accessToken = sign(
      { sub: user.id, role: user.role },
      this.jwtSecret,
      { expiresIn: '15m' },
    );

    const refreshRaw = randomBytes(32).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshRaw),
        userAgent: req.headers['user-agent'] ?? null,
        ip: req.ip ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    res.cookie(REFRESH_COOKIE, refreshRaw, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: REFRESH_TTL_MS,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}