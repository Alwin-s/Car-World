import { useEffect, useState } from 'react';
import {
  getMakes,
  getModels,
  getVariants,
  titleCase,
  type Make,
  type Model,
  type Variant,
} from '../../lib/catalogue';
import { inputClass, labelClass } from './styles';
import type { StepProps } from './types';
import { isValidReg, normaliseReg } from './validate';

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: THIS_YEAR + 1 - 2000 + 1 },
  (_, index) => THIS_YEAR + 1 - index,
);

export function CarStep({ draft, update, serviceCode }: StepProps) {
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const required = serviceCode === 'UCI';

  useEffect(() => {
    getMakes()
      .then(setMakes)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Could not load car makes'),
      );
  }, []);

  useEffect(() => {
    if (draft.makeId === null) {
      setModels([]);
      return;
    }
    let cancelled = false;
    getModels(draft.makeId)
      .then((result) => {
        if (!cancelled) setModels(result);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Could not load models');
      });
    return () => {
      cancelled = true;
    };
  }, [draft.makeId]);

  useEffect(() => {
    if (draft.modelId === null) {
      setVariants([]);
      return;
    }
    let cancelled = false;
    getVariants(draft.modelId)
      .then((result) => {
        if (!cancelled) setVariants(result);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Could not load variants');
      });
    return () => {
      cancelled = true;
    };
  }, [draft.modelId]);

  function handleMake(value: string) {
    const make = makes.find((m) => m.id === Number(value));
    update({
      makeId: make?.id ?? null,
      makeName: make?.name ?? '',
      modelId: null,
      modelName: '',
      variantId: null,
      variantName: '',
      segment: null,
    });
  }

  function handleModel(value: string) {
    const model = models.find((m) => m.id === Number(value));
    update({
      modelId: model?.id ?? null,
      modelName: model?.name ?? '',
      segment: model?.segment ?? null,
      variantId: null,
      variantName: '',
    });
  }

  function handleVariant(value: string) {
    const variant = variants.find((v) => v.id === Number(value));
    update({ variantId: variant?.id ?? null, variantName: variant?.name ?? '' });
  }

  const regInvalid = draft.registrationNo !== '' && !isValidReg(draft.registrationNo);

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Car details</h2>
        <p className="mt-1 text-sm text-primary/70">
          Tell us which car we will be inspecting.
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Make
          <select
            className={inputClass}
            value={draft.makeId ?? ''}
            onChange={(e) => handleMake(e.target.value)}
          >
            <option value="">Select make</option>
            {makes.map((make) => (
              <option key={make.id} value={make.id}>
                {make.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Model
          <select
            className={inputClass}
            value={draft.modelId ?? ''}
            onChange={(e) => handleModel(e.target.value)}
            disabled={draft.makeId === null}
          >
            <option value="">Select model</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          Variant
          <select
            className={inputClass}
            value={draft.variantId ?? ''}
            onChange={(e) => handleVariant(e.target.value)}
            disabled={draft.modelId === null}
          >
            <option value="">Select variant</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name} ({titleCase(variant.fuel)},{' '}
                {titleCase(variant.transmission)})
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Year of manufacture
          <select
            className={inputClass}
            value={draft.year}
            onChange={(e) => update({ year: e.target.value })}
          >
            <option value="">Select year</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Kilometres driven{required ? '' : ' (optional)'}
          <input
            className={inputClass}
            inputMode="numeric"
            value={draft.odometerKm}
            onChange={(e) =>
              update({ odometerKm: e.target.value.replace(/\D/g, '').slice(0, 7) })
            }
            placeholder="e.g. 42000"
          />
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          Registration number{required ? '' : ' (optional for new cars)'}
          <input
            className={inputClass}
            value={draft.registrationNo}
            onChange={(e) => update({ registrationNo: normaliseReg(e.target.value) })}
            maxLength={12}
            placeholder="TN37AB1234"
          />
          {regInvalid && (
            <span className="text-sm font-normal text-danger">
              Use the format TN37AB1234.
            </span>
          )}
        </label>
      </div>
    </div>
  );
}