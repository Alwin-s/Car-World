import type { Draft } from './types';

const REG = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/;

export function normaliseReg(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidReg(value: string) {
  return REG.test(value);
}

export function stepIsValid(step: number, d: Draft, serviceCode: string): boolean {
  if (step === 0) {
    return (
      d.districtId !== null &&
      d.address.trim().length >= 5 &&
      d.latitude !== null &&
      d.longitude !== null &&
      d.serviceable === true
    );
  }
  if (step === 1) {
    const needsDetails = serviceCode === 'UCI';
    const baseOk =
      d.makeId !== null &&
      d.modelId !== null &&
      d.variantId !== null &&
      d.year !== '';
    const regOk = d.registrationNo === '' ? !needsDetails : isValidReg(d.registrationNo);
    const kmOk = d.odometerKm === '' ? !needsDetails : Number(d.odometerKm) >= 0;
    return baseOk && regOk && kmOk;
  }
  if (step === 2) return d.packageId !== null;
  return false;
}