import { formatPaise, titleCase, type Quote } from '../../lib/catalogue';
import type { Draft } from './types';

type Props = {
  serviceName: string;
  draft: Draft;
  quote: Quote | null;
  quoteError: string | null;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-primary/50">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value || '—'}</dd>
    </div>
  );
}

export function Summary({ serviceName, draft, quote, quoteError }: Props) {
  const car = [draft.makeName, draft.modelName, draft.variantName]
    .filter(Boolean)
    .join(' ');
  const where = [draft.districtName, draft.address].filter(Boolean).join(' · ');

  return (
    <div className="rounded-card bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold">Booking summary</h2>
      <dl className="mt-4 grid gap-4">
        <Row label="Service" value={serviceName} />
        <Row label="Location" value={where} />
        <Row
          label="Car"
          value={[car, draft.year].filter(Boolean).join(' · ')}
        />
        <Row
          label="Car type"
          value={draft.segment ? titleCase(draft.segment) : ''}
        />
        <Row label="Registration" value={draft.registrationNo} />
        <Row label="Package" value={draft.packageName} />
      </dl>

      {draft.packageId !== null && (
        <div className="mt-6 border-t border-primary/10 pt-4 text-sm">
          {quoteError && <p className="text-danger">{quoteError}</p>}
          {!quote && !quoteError && (
            <p className="text-primary/70">Calculating price…</p>
          )}
          {quote && (
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span>Inspection</span>
                <span>{formatPaise(quote.basePricePaise)}</span>
              </div>
              {quote.travelFeePaise > 0 && (
                <div className="flex justify-between">
                  <span>Travel fee</span>
                  <span>{formatPaise(quote.travelFeePaise)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST ({quote.gstPercent}%)</span>
                <span>{formatPaise(quote.gstPaise)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-primary/10 pt-3 font-heading text-lg font-semibold">
                <span>Total</span>
                <span>{formatPaise(quote.totalPaise)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}