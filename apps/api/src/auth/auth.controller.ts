import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../zod.pipe';
import { AuthService } from './auth.service';
import {
  otpRequestSchema,
  otpVerifySchema,
  type OtpRequestDto,
  type OtpVerifyDto,
} from './auth.schemas';
import { AuthedRequest, JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  requestOtp(
    @Body(new ZodValidationPipe(otpRequestSchema)) body: OtpRequestDto,
  ) {
    return this.auth.requestOtp(body.phone);
  }

  @Post('otp/verify')
  verifyOtp(
    @Body(new ZodValidationPipe(otpVerifySchema)) body: OtpVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.verifyOtp(body.phone, body.code, req, res);
  }

  @Post('refresh')
  refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.refresh(req, res);
  }

  @Post('logout')
  logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.logout(req, res);
  }
}

@Controller()
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthedRequest) {
    return this.auth.getMe(req.userId);
  }
}