import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import { PrismaService } from '../prisma.service';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

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

    const accessToken = sign(
      { sub: user.id, role: user.role },
      this.config.get<string>('JWT_SECRET') ?? 'carworld-dev-jwt-secret',
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

    res.cookie('refresh_token', refreshRaw, {
      httpOnly: true,
      sameSite: 'lax',
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
}
