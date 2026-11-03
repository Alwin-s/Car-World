import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';

const fromApiCwd = resolve(process.cwd(), '../../.env');
const fromRootCwd = resolve(process.cwd(), '.env');
config({ path: existsSync(fromApiCwd) ? fromApiCwd : fromRootCwd });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new pg.Pool({ connectionString: databaseUrl });

const SEGMENTS = ['hatchback', 'sedan', 'suv', 'muv', 'luxury', 'ev'];
const SEGMENT_MULTIPLIER = {
  hatchback: 1,
  sedan: 1.15,
  suv: 1.35,
  muv: 1.3,
  luxury: 2,
  ev: 1.4,
};

function priceFor(basePaise, segment) {
  return Math.round((basePaise * SEGMENT_MULTIPLIER[segment]) / 100) * 100;
}

const services = [
  ['PDI', 'Pre-Delivery Inspection', 'Confirm a brand-new car is actually new before you take delivery.', true, false, 1],
  ['UCI', 'Used-Car Inspection', 'A 360° deep-dive before you buy a used car.', true, false, 2],
  ['VSH', 'Vehicle Service History', 'Admin-entered service and odometer records for a used car.', true, false, 3],
  ['SYC', 'Sell Your Car', 'Professional evaluation and a fair market offer.', true, false, 4],
  ['BUC', 'Buy Used Car', 'Inspected used cars, coming soon.', false, true, 5],
  ['B2B', 'B2B Inspection', 'Fleet and dealer inspections, coming soon.', false, true, 6],
];

const packageSpecs = {
  PDI: [
    { name: 'Basic', checkpoints: 80, minutes: 45, inclusions: ['Exterior walkaround', 'VIN and odometer check', 'Basic functions'], basePaise: 99900 },
    { name: 'Standard', checkpoints: 140, minutes: 75, inclusions: ['All Basic checks', 'Interior and electronics', 'Undercarriage photos'], basePaise: 149900 },
    { name: 'Premium', checkpoints: 200, minutes: 110, inclusions: ['All Standard checks', 'Paint thickness sampling', 'Written delivery punch-list'], basePaise: 219900 },
  ],
  UCI: [
    { name: 'Basic', checkpoints: 120, minutes: 60, inclusions: ['Body and cabin', 'Engine bay visual', 'Test-drive notes'], basePaise: 199900 },
    { name: 'Standard', checkpoints: 220, minutes: 90, inclusions: ['All Basic checks', 'Undercarriage', 'OBD scan', 'Photo report'], basePaise: 299900 },
    { name: 'Premium', checkpoints: 320, minutes: 130, inclusions: ['All Standard checks', 'Flood and accident flags', 'Negotiation guidance'], basePaise: 449900 },
  ],
};

const catalogue = [
  ['Maruti Suzuki', [
    ['Swift', 'hatchback', [['ZXi', 'petrol', 'manual'], ['ZXi AMT', 'petrol', 'amt']]],
    ['Baleno', 'hatchback', [['Alpha', 'petrol', 'manual']]],
    ['Brezza', 'suv', [['ZXi+', 'petrol', 'automatic']]],
  ]],
  ['Hyundai', [
    ['i20', 'hatchback', [['Asta', 'petrol', 'manual']]],
    ['Venue', 'suv', [['SX', 'petrol', 'manual']]],
    ['Creta', 'suv', [['SX(O)', 'petrol', 'automatic'], ['SX Diesel', 'diesel', 'manual']]],
  ]],
  ['Tata', [
    ['Punch', 'suv', [['Creative', 'petrol', 'manual']]],
    ['Nexon', 'suv', [['Fearless', 'petrol', 'manual'], ['Fearless+', 'electric', 'ev']]],
    ['Harrier', 'suv', [['Fearless+', 'diesel', 'automatic']]],
  ]],
  ['Mahindra', [
    ['Thar', 'suv', [['LX', 'petrol', 'manual']]],
    ['XUV700', 'suv', [['AX7', 'petrol', 'automatic']]],
    ['Scorpio-N', 'suv', [['Z8L', 'diesel', 'automatic']]],
  ]],
  ['Kia', [
    ['Sonet', 'suv', [['HTX', 'petrol', 'manual']]],
    ['Seltos', 'suv', [['HTX+', 'petrol', 'automatic']]],
  ]],
  ['Toyota', [
    ['Glanza', 'hatchback', [['V', 'petrol', 'manual']]],
    ['Innova Hycross', 'muv', [['ZX Hybrid', 'hybrid', 'cvt']]],
    ['Fortuner', 'suv', [['4x4', 'diesel', 'automatic']]],
  ]],
  ['Honda', [
    ['City', 'sedan', [['ZX', 'petrol', 'cvt']]],
    ['Elevate', 'suv', [['ZX', 'petrol', 'automatic']]],
  ]],
  ['Volkswagen', [
    ['Virtus', 'sedan', [['Topline', 'petrol', 'automatic']]],
    ['Taigun', 'suv', [['Topline', 'petrol', 'automatic']]],
  ]],
  ['Skoda', [
    ['Slavia', 'sedan', [['Style', 'petrol', 'automatic']]],
    ['Kushaq', 'suv', [['Style', 'petrol', 'automatic']]],
  ]],
  ['MG', [
    ['Hector', 'suv', [['Sharp Pro', 'petrol', 'manual']]],
    ['Windsor', 'ev', [['Essence', 'electric', 'ev']]],
  ]],
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const name of ['Coimbatore', 'Chennai', 'Madurai']) {
      await client.query(
        `INSERT INTO districts (name, state, is_active)
         VALUES ($1, 'Tamil Nadu', true)
         ON CONFLICT (name, state) DO UPDATE SET is_active = true`,
        [name],
      );
    }

    for (const [code, name, tagline, bookable, comingSoon, sortOrder] of services) {
      await client.query(
        `INSERT INTO services (code, name, tagline, is_bookable, is_coming_soon, sort_order)
         VALUES ($1::service_code, $2, $3, $4, $5, $6)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           tagline = EXCLUDED.tagline,
           is_bookable = EXCLUDED.is_bookable,
           is_coming_soon = EXCLUDED.is_coming_soon,
           sort_order = EXCLUDED.sort_order`,
        [code, name, tagline, bookable, comingSoon, sortOrder],
      );
    }

    for (const code of ['PDI', 'UCI']) {
      const { rows: [service] } = await client.query(
        'SELECT id FROM services WHERE code = $1::service_code',
        [code],
      );
      for (const spec of packageSpecs[code]) {
        const { rows: existing } = await client.query(
          'SELECT id FROM packages WHERE service_id = $1 AND name = $2',
          [service.id, spec.name],
        );
        let packageId = existing[0]?.id;
        if (packageId) {
          await client.query(
            `UPDATE packages SET checkpoints_count = $2, est_duration_min = $3, inclusions = $4::jsonb, is_active = true
             WHERE id = $1`,
            [packageId, spec.checkpoints, spec.minutes, JSON.stringify(spec.inclusions)],
          );
        } else {
          const inserted = await client.query(
            `INSERT INTO packages (service_id, name, checkpoints_count, inclusions, est_duration_min, is_active)
             VALUES ($1, $2, $3, $4::jsonb, $5, true)
             RETURNING id`,
            [service.id, spec.name, spec.checkpoints, JSON.stringify(spec.inclusions), spec.minutes],
          );
          packageId = inserted.rows[0].id;
        }

        for (const segment of SEGMENTS) {
          await client.query(
            `INSERT INTO package_prices (package_id, segment, district_id, base_price_paise, travel_fee_paise, gst_percent)
             VALUES ($1, $2::vehicle_segment, NULL, $3, 0, 18.00)
             ON CONFLICT (package_id, segment) DO UPDATE SET
               district_id = NULL,
               base_price_paise = EXCLUDED.base_price_paise,
               travel_fee_paise = 0,
               gst_percent = 18.00`,
            [packageId, segment, priceFor(spec.basePaise, segment)],
          );
        }
      }
    }

    for (const [makeName, models] of catalogue) {
      const { rows: [make] } = await client.query(
        `INSERT INTO vehicle_makes (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [makeName],
      );
      for (const [modelName, segment, variants] of models) {
        const { rows: [model] } = await client.query(
          `INSERT INTO vehicle_models (make_id, name, segment)
           VALUES ($1, $2, $3::vehicle_segment)
           ON CONFLICT (make_id, name) DO UPDATE SET segment = EXCLUDED.segment
           RETURNING id`,
          [make.id, modelName, segment],
        );
        for (const [variantName, fuel, transmission] of variants) {
          const { rows: existing } = await client.query(
            'SELECT id FROM vehicle_variants WHERE model_id = $1 AND name = $2',
            [model.id, variantName],
          );
          if (existing.length === 0) {
            await client.query(
              `INSERT INTO vehicle_variants (model_id, name, fuel, transmission)
               VALUES ($1, $2, $3::fuel_type, $4::transmission)`,
              [model.id, variantName, fuel, transmission],
            );
          }
        }
      }
    }

    const checks = await client.query(`
      SELECT
        (SELECT count(*) FROM districts WHERE is_active) AS districts,
        (SELECT count(*) FROM services) AS services,
        (SELECT count(*) FROM services WHERE is_coming_soon) AS coming_soon,
        (SELECT count(*) FROM packages p JOIN services s ON s.id = p.service_id WHERE s.code = 'PDI') AS pdi_packages,
        (SELECT count(*) FROM packages p JOIN services s ON s.id = p.service_id WHERE s.code = 'UCI') AS uci_packages,
        (SELECT count(*) FROM package_prices) AS prices,
        (SELECT count(*) FROM vehicle_makes) AS makes
    `);
    const row = checks.rows[0];
    const expected = { districts: 3, services: 6, coming_soon: 2, pdi_packages: 3, uci_packages: 3, prices: 36, makes: 10 };
    for (const [key, value] of Object.entries(expected)) {
      const actual = Number(row[key]);
      if (actual !== value) {
        throw new Error(`seed check failed: ${key} expected ${value}, got ${actual}`);
      }
    }

    await client.query('COMMIT');
    console.log('Seed complete: 3 districts, 6 services, PDI/UCI packages + prices, 10 makes.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
