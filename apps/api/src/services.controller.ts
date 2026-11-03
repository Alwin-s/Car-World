import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.service.findMany({
      select: {
        code: true,
        name: true,
        tagline: true,
        isComingSoon: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
