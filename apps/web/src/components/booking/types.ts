import type { Segment } from '../../lib/catalogue';

export type Draft = {
  districtId: number | null;
  districtName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  serviceable: boolean | null;
  makeId: number | null;
  makeName: string;
  modelId: number | null;
  modelName: string;
  variantId: number | null;
  variantName: string;
  segment: Segment | null;
  year: string;
  registrationNo: string;
  odometerKm: string;
  packageId: number | null;
  packageName: string;
};

export const initialDraft: Draft = {
  districtId: null,
  districtName: '',
  address: '',
  latitude: null,
  longitude: null,
  serviceable: null,
  makeId: null,
  makeName: '',
  modelId: null,
  modelName: '',
  variantId: null,
  variantName: '',
  segment: null,
  year: '',
  registrationNo: '',
  odometerKm: '',
  packageId: null,
  packageName: '',
};

export type StepProps = {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  serviceCode: string;
};