import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  FuelType,
  PrismaClient,
  ServiceCode,
  Transmission,
  VehicleSegment,
} from '../src/generated/prisma/client.ts';

const fromApiCwd = resolve(process.cwd(), '../../.env');
const fromRootCwd = resolve(process.cwd(), '.env');
config({ path: existsSync(fromApiCwd) ? fromApiCwd : fromRootCwd });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const SEGMENTS = [
  VehicleSegment.hatchback,
  VehicleSegment.sedan,
  VehicleSegment.suv,
  VehicleSegment.muv,
  VehicleSegment.luxury,
  VehicleSegment.ev,
] as const;

const SEGMENT_MULTIPLIER: Record<VehicleSegment, number> = {
  hatchback: 1,
  sedan: 1.15,
  suv: 1.35,
  muv: 1.3,
  luxury: 2,
  ev: 1.4,
};

function priceFor(basePaise: number, segment: VehicleSegment): number {
  return Math.round((basePaise * SEGMENT_MULTIPLIER[segment]) / 100) * 100;
}

async function seedDistricts() {
  const names = ['Coimbatore', 'Chennai', 'Madurai'] as const;
  for (const name of names) {
    await prisma.district.upsert({
      where: { name_state: { name, state: 'Tamil Nadu' } },
      update: { isActive: true },
      create: { name, state: 'Tamil Nadu', isActive: true },
    });
  }
}

async function seedServicesAndPackages() {
  const services = [
    {
      code: ServiceCode.PDI,
      name: 'Pre-Delivery Inspection',
      tagline: 'Confirm a brand-new car is actually new before you take delivery.',
      isBookable: true,
      isComingSoon: false,
      sortOrder: 1,
    },
    {
      code: ServiceCode.UCI,
      name: 'Used-Car Inspection',
      tagline: 'A 360° deep-dive before you buy a used car.',
      isBookable: true,
      isComingSoon: false,
      sortOrder: 2,
    },
    {
      code: ServiceCode.VSH,
      name: 'Vehicle Service History',
      tagline: 'Admin-entered service and odometer records for a used car.',
      isBookable: true,
      isComingSoon: false,
      sortOrder: 3,
    },
    {
      code: ServiceCode.SYC,
      name: 'Sell Your Car',
      tagline: 'Professional evaluation and a fair market offer.',
      isBookable: true,
      isComingSoon: false,
      sortOrder: 4,
    },
    {
      code: ServiceCode.BUC,
      name: 'Buy Used Car',
      tagline: 'Inspected used cars, coming soon.',
      isBookable: false,
      isComingSoon: true,
      sortOrder: 5,
    },
    {
      code: ServiceCode.B2B,
      name: 'B2B Inspection',
      tagline: 'Fleet and dealer inspections, coming soon.',
      isBookable: false,
      isComingSoon: true,
      sortOrder: 6,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { code: service.code },
      update: service,
      create: service,
    });
  }

  const packageSpecs: Record<
    'PDI' | 'UCI',
    { name: string; checkpointsCount: number; estDurationMin: number; inclusions: string[]; basePaise: number }[]
  > = {
    PDI: [
      {
        name: 'Basic',
        checkpointsCount: 80,
        estDurationMin: 45,
        inclusions: ['Exterior walkaround', 'VIN and odometer check', 'Basic functions'],
        basePaise: 99900,
      },
      {
        name: 'Standard',
        checkpointsCount: 140,
        estDurationMin: 75,
        inclusions: ['All Basic checks', 'Interior and electronics', 'Undercarriage photos'],
        basePaise: 149900,
      },
      {
        name: 'Premium',
        checkpointsCount: 200,
        estDurationMin: 110,
        inclusions: ['All Standard checks', 'Paint thickness sampling', 'Written delivery punch-list'],
        basePaise: 219900,
      },
    ],
    UCI: [
      {
        name: 'Basic',
        checkpointsCount: 120,
        estDurationMin: 60,
        inclusions: ['Body and cabin', 'Engine bay visual', 'Test-drive notes'],
        basePaise: 199900,
      },
      {
        name: 'Standard',
        checkpointsCount: 220,
        estDurationMin: 90,
        inclusions: ['All Basic checks', 'Undercarriage', 'OBD scan', 'Photo report'],
        basePaise: 299900,
      },
      {
        name: 'Premium',
        checkpointsCount: 320,
        estDurationMin: 130,
        inclusions: ['All Standard checks', 'Flood and accident flags', 'Negotiation guidance'],
        basePaise: 449900,
      },
    ],
  };

  for (const code of ['PDI', 'UCI'] as const) {
    const service = await prisma.service.findUniqueOrThrow({ where: { code } });
    for (const spec of packageSpecs[code]) {
      const existing = await prisma.package.findFirst({
        where: { serviceId: service.id, name: spec.name },
      });
      const pkg = existing
        ? await prisma.package.update({
            where: { id: existing.id },
            data: {
              checkpointsCount: spec.checkpointsCount,
              estDurationMin: spec.estDurationMin,
              inclusions: spec.inclusions,
              isActive: true,
            },
          })
        : await prisma.package.create({
            data: {
              serviceId: service.id,
              name: spec.name,
              checkpointsCount: spec.checkpointsCount,
              estDurationMin: spec.estDurationMin,
              inclusions: spec.inclusions,
              isActive: true,
            },
          });

      for (const segment of SEGMENTS) {
        await prisma.packagePrice.upsert({
          where: { packageId_segment: { packageId: pkg.id, segment } },
          update: {
            districtId: null,
            basePricePaise: priceFor(spec.basePaise, segment),
            travelFeePaise: 0,
            gstPercent: 18,
          },
          create: {
            packageId: pkg.id,
            segment,
            districtId: null,
            basePricePaise: priceFor(spec.basePaise, segment),
            travelFeePaise: 0,
            gstPercent: 18,
          },
        });
      }
    }
  }
}

const CATALOGUE: {
  make: string;
  models: { name: string; segment: VehicleSegment; variants: { name: string; fuel: FuelType; transmission: Transmission }[] }[];
}[] = [
  {
    make: 'Maruti Suzuki',
    models: [
      {
        name: 'Swift',
        segment: VehicleSegment.hatchback,
        variants: [
          { name: 'ZXi', fuel: FuelType.petrol, transmission: Transmission.manual },
          { name: 'ZXi AMT', fuel: FuelType.petrol, transmission: Transmission.amt },
        ],
      },
      {
        name: 'Baleno',
        segment: VehicleSegment.hatchback,
        variants: [{ name: 'Alpha', fuel: FuelType.petrol, transmission: Transmission.manual }],
      },
      {
        name: 'Brezza',
        segment: VehicleSegment.suv,
        variants: [{ name: 'ZXi+', fuel: FuelType.petrol, transmission: Transmission.automatic }],
      },
    ],
  },
  {
    make: 'Hyundai',
    models: [
      {
        name: 'i20',
        segment: VehicleSegment.hatchback,
        variants: [{ name: 'Asta', fuel: FuelType.petrol, transmission: Transmission.manual }],
      },
      {
        name: 'Venue',
        segment: VehicleSegment.suv,
        variants: [{ name: 'SX', fuel: FuelType.petrol, transmission: Transmission.manual }],
      },
      {
        name: 'Creta',
        segment: VehicleSegment.suv,
        variants: [
          { name: 'SX(O)', fuel: FuelType.petrol, transmission: Transmission.automatic },
          { name: 'SX Diesel', fuel: FuelType.diesel, transmission: Transmission.manual },
        ],
      },
    ],
  },
  {
    make: 'Tata',
    models: [
      {
        name: 'Punch',
        segment: VehicleSegment.suv,
        variants: [{ name: 'Creative', fuel: FuelType.petrol, transmission: Transmission.manual }],
      },
      {
        name: 'Nexon',
        segment: VehicleSegment.suv,
        variants: [
          { name: 'Fearless', fuel: FuelType.petrol, transmission: Transmission.manual },
          { name: 'Fearless+', fuel: FuelType.electric, transmission: Transmission.ev },
        ],
      },
      {
        name: 'Harrier',
        segment: VehicleSegment.suv,
        variants: [{ name: 'Fearless+', fuel: FuelType.diesel, transmission: Transmission.automatic }],
      },
    ],
  },
  {
    make: 'Mahindra',
    models: [
      {
        name: 'Thar',
        segment: VehicleSegment.suv,
        variants: [{ name: 'LX', fuel: FuelType.petrol, transmission: Transmission.manual }],
      },
      {
        name: 'XUV700',
        segment: VehicleSegment.suv,
        variants: [{ name: 'AX7', fuel: FuelType.petrol, transmission: Transmission.automatic }],
      },
      {
        name: 'Scorpio-N',
        segment: VehicleSegment.suv,
        variants: [{ name: 'Z8L', fuel: FuelType.diesel, transmission: Transmission.automatic }],
      },
    ],
  },
  {
    make: 'Kia',
    models: [
      {
        name: 'Sonet',
        segment: VehicleSegment.suv,
        variants: [{ name: 'HTX', fuel: FuelType.petrol, transmission: Transmission.manual }],
      },
      {
        name: 'Seltos',
        segment: VehicleSegment.suv,
        variants: [{ name: 'HTX+', fuel: FuelType.petrol, transmission: Transmission.automatic }],
      },
    ],
  },
  {
    make: 'Toyota',
    models: [
      {
        name: 'Glanza',
        segment: VehicleSegment.hatchback,
        variants: [{ name: 'V', fuel: FuelType.petrol, transmission: Transmission.manual }],
      },
      {
        name: 'Innova Hycross',
        segment: VehicleSegment.muv,
        variants: [{ name: 'ZX Hybrid', fuel: FuelType.hybrid, transmission: Transmission.cvt }],
      },
      {
        name: 'Fortuner',
        segment: VehicleSegment.suv,
        variants: [{ name: '4x4', fuel: FuelType.diesel, transmission: Transmission.automatic }],
      },
    ],
  },
  {
    make: 'Honda',
    models: [
      {
        name: 'City',
        segment: VehicleSegment.sedan,
        variants: [{ name: 'ZX', fuel: FuelType.petrol, transmission: Transmission.cvt }],
      },
      {
        name: 'Elevate',
        segment: VehicleSegment.suv,
        variants: [{ name: 'ZX', fuel: FuelType.petrol, transmission: Transmission.automatic }],
      },
    ],
  },
  {
    make: 'Volkswagen',
    models: [
      {
        name: 'Virtus',
        segment: VehicleSegment.sedan,
        variants: [{ name: 'Topline', fuel: FuelType.petrol, transmission: Transmission.automatic }],
      },
      {
        name: 'Taigun',
        segment: VehicleSegment.suv,
        variants: [{ name: 'Topline', fuel: FuelType.petrol, transmission: Transmission.automatic }],
      },
    ],
  },
  {
    make: 'Skoda',
    models: [
      {
        name: 'Slavia',
        segment: VehicleSegment.sedan,
        variants: [{ name: 'Style', fuel: FuelType.petrol, transmission: Transmission.automatic }],
      },
      {
        name: 'Kushaq',
        segment: VehicleSegment.suv,
        variants: [{ name: 'Style', fuel: FuelType.petrol, transmission: Transmission.automatic }],
      },
    ],
  },
  {
    make: 'MG',
    models: [
      {
        name: 'Hector',
        segment: VehicleSegment.suv,
        variants: [{ name: 'Sharp Pro', fuel: FuelType.petrol, transmission: Transmission.manual }],
      },
      {
        name: 'Windsor',
        segment: VehicleSegment.ev,
        variants: [{ name: 'Essence', fuel: FuelType.electric, transmission: Transmission.ev }],
      },
    ],
  },
];

async function seedVehicles() {
  for (const entry of CATALOGUE) {
    const make = await prisma.vehicleMake.upsert({
      where: { name: entry.make },
      update: {},
      create: { name: entry.make },
    });

    for (const modelSpec of entry.models) {
      const model = await prisma.vehicleModel.upsert({
        where: { makeId_name: { makeId: make.id, name: modelSpec.name } },
        update: { segment: modelSpec.segment },
        create: { makeId: make.id, name: modelSpec.name, segment: modelSpec.segment },
      });

      for (const variant of modelSpec.variants) {
        const existing = await prisma.vehicleVariant.findFirst({
          where: { modelId: model.id, name: variant.name },
        });
        if (!existing) {
          await prisma.vehicleVariant.create({
            data: {
              modelId: model.id,
              name: variant.name,
              fuel: variant.fuel,
              transmission: variant.transmission,
            },
          });
        }
      }
    }
  }
}

async function assertSeed() {
  const [districts, services, comingSoon, pdiPackages, uciPackages, prices, makes] =
    await Promise.all([
      prisma.district.count({ where: { isActive: true } }),
      prisma.service.count(),
      prisma.service.count({ where: { isComingSoon: true } }),
      prisma.package.count({ where: { service: { code: ServiceCode.PDI } } }),
      prisma.package.count({ where: { service: { code: ServiceCode.UCI } } }),
      prisma.packagePrice.count(),
      prisma.vehicleMake.count(),
    ]);

  if (districts < 3) throw new Error(`expected 3 active districts, got ${districts}`);
  if (services !== 6) throw new Error(`expected 6 services, got ${services}`);
  if (comingSoon !== 2) throw new Error(`expected 2 coming-soon services, got ${comingSoon}`);
  if (pdiPackages !== 3) throw new Error(`expected 3 PDI packages, got ${pdiPackages}`);
  if (uciPackages !== 3) throw new Error(`expected 3 UCI packages, got ${uciPackages}`);
  if (prices !== 36) throw new Error(`expected 36 package prices, got ${prices}`);
  if (makes !== 10) throw new Error(`expected 10 makes, got ${makes}`);
}

async function main() {
  await seedDistricts();
  await seedServicesAndPackages();
  await seedVehicles();
  await assertSeed();
  console.log('Seed complete: 3 districts, 6 services, PDI/UCI packages + prices, 10 makes.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
