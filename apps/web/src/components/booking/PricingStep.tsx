import { useEffect, useState } from 'react';
import {
  formatPaise,
  getServicePackages,
  type ServicePackages,
} from '../../lib/catalogue';
import type { StepProps } from './types';

function listInclusions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function PricingStep({ draft, update, serviceCode }: StepProps) {
  const [data, setData] = useState<ServicePackages | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getServicePackages(serviceCode)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Could not load packages');
      });
    return () => {
      cancelled = true;
    };
  }, [serviceCode]);

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Choose your package</h2>
        <p className="mt-1 text-sm text-primary/70">
          Prices are for your car type and exclude GST.
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {!data && !error && <p className="text-primary/70">Loading packages…</p>}
      {data && data.packages.length === 0 && (
        <p className="text-primary/70">No packages are available right now.</p>
      )}

      <div className="grid gap-4">
        {data?.packages.map((pkg) => {
          const price = pkg.prices.find((p) => p.segment === draft.segment);
          const selected = draft.packageId === pkg.id;
          const inclusions = listInclusions(pkg.inclusions);
          return (
            <button
              key={pkg.id}
              type="button"
              disabled={!price}
              aria-pressed={selected}
              onClick={() => update({ packageId: pkg.id, packageName: pkg.name })}
              className={`rounded-card border p-5 text-left transition disabled:opacity-50 ${
                selected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'border-primary/15 bg-white hover:border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-lg font-semibold">{pkg.name}</h3>
                  <p className="mt-1 text-sm text-primary/70">
                    {pkg.checkpointsCount ? `${pkg.checkpointsCount} checkpoints` : ''}
                    {pkg.checkpointsCount && pkg.estDurationMin ? ' · ' : ''}
                    {pkg.estDurationMin ? `about ${pkg.estDurationMin} min` : ''}
                  </p>
                </div>
                <div className="text-right">
                  {price ? (
                    <>
                      <p className="font-heading text-xl font-semibold">
                        {formatPaise(price.basePricePaise)}
                      </p>
                      <p className="text-xs text-primary/60">+ GST</p>
                    </>
                  ) : (
                    <p className="text-sm text-danger">Not available for this car</p>
                  )}
                </div>
              </div>
              {inclusions.length > 0 && (
                <ul className="mt-3 grid gap-1 text-sm text-primary/80">
                  {inclusions.slice(0, 6).map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}