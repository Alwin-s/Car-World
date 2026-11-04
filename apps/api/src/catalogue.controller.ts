import {
    BadRequestException,
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Query,
  } from '@nestjs/common';
  import { z } from 'zod';
  import { PrismaService } from './prisma.service';
  
  const segmentSchema = z.enum([
    'hatchback',
    'sedan',
    'suv',
    'muv',
    'luxury',
    'ev',
  ]);
  const serviceCodeSchema = z.enum(['PDI', 'UCI', 'VSH', 'SYC', 'BUC', 'B2B']);
  
  const quoteQuerySchema = z.object({
    packageId: z.coerce.number().int().positive(),
    segment: segmentSchema,
  });
  
  const serviceabilitySchema = z.object({
    districtId: z.number().int().positive(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  });
  
  @Controller()
  export class CatalogueController {
    constructor(private readonly prisma: PrismaService) {}
  
    @Get('districts')
    districts() {
      return this.prisma.district.findMany({
        where: { isActive: true },
        select: { id: true, name: true, state: true },
        orderBy: { name: 'asc' },
      });
    }
  
    @Post('serviceability/check')
    async serviceability(@Body() body: unknown) {
      const parsed = serviceabilitySchema.safeParse(body);
      if (!parsed.success) {
        throw new BadRequestException('Invalid location details');
      }
      const district = await this.prisma.district.findUnique({
        where: { id: parsed.data.districtId },
        select: { id: true, name: true, isActive: true },
      });
      if (!district) {
        throw new NotFoundException('District not found');
      }
      return {
        serviceable: district.isActive,
        district: district.name,
        message: district.isActive
          ? 'Your location is serviceable.'
          : 'We do not serve this district yet.',
      };
    }
  
    @Get('services/:code/packages')
    async packages(@Param('code') code: string) {
      const parsed = serviceCodeSchema.safeParse(code.toUpperCase());
      if (!parsed.success) {
        throw new NotFoundException('Service not found');
      }
      const service = await this.prisma.service.findUnique({
        where: { code: parsed.data },
        select: {
          code: true,
          name: true,
          tagline: true,
          isBookable: true,
          isComingSoon: true,
          packages: {
            where: { isActive: true },
            orderBy: { id: 'asc' },
            select: {
              id: true,
              name: true,
              checkpointsCount: true,
              inclusions: true,
              estDurationMin: true,
              prices: {
                select: {
                  segment: true,
                  basePricePaise: true,
                  travelFeePaise: true,
                  gstPercent: true,
                },
              },
            },
          },
        },
      });
      if (!service) {
        throw new NotFoundException('Service not found');
      }
      return {
        ...service,
        packages: service.packages.map((pkg) => ({
          ...pkg,
          prices: pkg.prices.map((price) => ({
            ...price,
            gstPercent: Number(price.gstPercent),
          })),
        })),
      };
    }
  
    @Get('pricing/quote')
    async quote(@Query() query: Record<string, unknown>) {
      const parsed = quoteQuerySchema.safeParse(query);
      if (!parsed.success) {
        throw new BadRequestException('packageId and segment are required');
      }
      const { packageId, segment } = parsed.data;
  
      const price = await this.prisma.packagePrice.findUnique({
        where: { packageId_segment: { packageId, segment } },
        select: {
          basePricePaise: true,
          travelFeePaise: true,
          gstPercent: true,
          package: {
            select: {
              name: true,
              isActive: true,
              service: { select: { code: true, name: true } },
            },
          },
        },
      });
      if (!price || !price.package.isActive) {
        throw new NotFoundException('No price found for this package and car type');
      }
  
      const gstPercent = Number(price.gstPercent);
      const taxable = price.basePricePaise + price.travelFeePaise;
      const gstPaise = Math.round((taxable * gstPercent) / 100);
  
      return {
        packageId,
        packageName: price.package.name,
        serviceCode: price.package.service.code,
        serviceName: price.package.service.name,
        segment,
        basePricePaise: price.basePricePaise,
        travelFeePaise: price.travelFeePaise,
        gstPercent,
        gstPaise,
        totalPaise: taxable + gstPaise,
        currency: 'INR',
      };
    }
  
    @Get('vehicles/makes')
    makes() {
      return this.prisma.vehicleMake.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    }
  
    @Get('vehicles/makes/:makeId/models')
    models(@Param('makeId', ParseIntPipe) makeId: number) {
      return this.prisma.vehicleModel.findMany({
        where: { makeId },
        select: { id: true, name: true, segment: true },
        orderBy: { name: 'asc' },
      });
    }
  
    @Get('vehicles/models/:modelId/variants')
    variants(@Param('modelId', ParseIntPipe) modelId: number) {
      return this.prisma.vehicleVariant.findMany({
        where: { modelId },
        select: { id: true, name: true, fuel: true, transmission: true },
        orderBy: { name: 'asc' },
      });
    }
  }