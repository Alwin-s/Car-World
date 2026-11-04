const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type Segment = 'hatchback' | 'sedan' | 'suv' | 'muv' | 'luxury' | 'ev';

export type District = { id: number; name: string; state: string };
export type Make = { id: number; name: string };
export type Model = { id: number; name: string; segment: Segment };
export type Variant = {
  id: number;
  name: string;
  fuel: string;
  transmission: string;
};
export type PackagePrice = {
  segment: Segment;
  basePricePaise: number;
  travelFeePaise: number;
  gstPercent: number;
};
export type PackageInfo = {
  id: number;
  name: string;
  checkpointsCount: number | null;
  inclusions: unknown;
  estDurationMin: number | null;
  prices: PackagePrice[];
};
export type ServicePackages = {
  code: string;
  name: string;
  tagline: string | null;
  isBookable: boolean;
  isComingSoon: boolean;
  packages: PackageInfo[];
};
export type Quote = {
  packageId: number;
  packageName: string;
  serviceCode: string;
  serviceName: string;
  segment: Segment;
  basePricePaise: number;
  travelFeePaise: number;
  gstPercent: number;
  gstPaise: number;
  totalPaise: number;
  currency: string;
};

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { message?: unknown };
      if (typeof data.message === 'string') message = data.message;
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export function getDistricts() {
  return getJson<District[]>('/districts');
}

export function checkServiceability(
  districtId: number,
  latitude: number,
  longitude: number,
) {
  return getJson<{ serviceable: boolean; district: string; message: string }>(
    '/serviceability/check',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ districtId, latitude, longitude }),
    },
  );
}

export function getServicePackages(code: string) {
  return getJson<ServicePackages>(`/services/${code}/packages`);
}

export function getQuote(packageId: number, segment: Segment) {
  return getJson<Quote>(`/pricing/quote?packageId=${packageId}&segment=${segment}`);
}

export function getMakes() {
  return getJson<Make[]>('/vehicles/makes');
}

export function getModels(makeId: number) {
  return getJson<Model[]>(`/vehicles/makes/${makeId}/models`);
}

export function getVariants(modelId: number) {
  return getJson<Variant[]>(`/vehicles/models/${modelId}/variants`);
}

export function formatPaise(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

const UPPER = ['suv', 'muv', 'ev', 'amt', 'cvt', 'dct', 'cng', 'lpg'];

export function titleCase(value: string) {
  if (UPPER.includes(value)) return value.toUpperCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}