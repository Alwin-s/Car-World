import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new HttpException(
        { status: 'error', database: 'error' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
