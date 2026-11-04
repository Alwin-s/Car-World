import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CarStep } from '../components/booking/CarStep';
import { LocationStep } from '../components/booking/LocationStep';
import { PricingStep } from '../components/booking/PricingStep';
import { Stepper } from '../components/booking/Stepper';
import { Summary } from '../components/booking/Summary';
import { initialDraft, type Draft } from '../components/booking/types';
import { stepIsValid } from '../components/booking/validate';
import { getQuote, type Quote } from '../lib/catalogue';

const STEPS = ['Location', 'Car details', 'Pricing', 'Your info', 'Date & time', 'Payment'];

const SERVICES: Record<string, string> = {
  PDI: 'Pre-Delivery Inspection',
  UCI: 'Used-Car Inspection',
};

export function Book() {
  const { serviceCode = '' } = useParams();
  const code = serviceCode.toUpperCase();
  const serviceName = SERVICES[code];

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const update = useCallback((patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const { packageId, segment } = draft;

  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (packageId === null || segment === null) return;
    let cancelled = false;
    getQuote(packageId, segment)
      .then((result) => {
        if (!cancelled) setQuote(result);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setQuoteError(err instanceof Error ? err.message : 'Could not get the price');
      });
    return () => {
      cancelled = true;
    };
  }, [packageId, segment]);

  if (!serviceName) {
    return (
      <main className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-heading text-3xl font-semibold">
            This service cannot be booked yet
          </h1>
          <Link to="/services" className="mt-4 inline-block text-primary underline">
            Back to services
          </Link>
        </div>
      </main>
    );
  }

  const canContinue = stepIsValid(step, draft, code);

  function goTo(next: number) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const stepProps = { draft, update, serviceCode: code };

  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <p className="font-heading text-sm font-semibold tracking-wide text-accent">
          {serviceName}
        </p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
          Book your inspection
        </h1>
        <p className="mt-2 text-primary/70">
          Fill in the details to schedule your inspection.
        </p>

        <div className="mt-8">
          <Stepper steps={STEPS} current={step} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <section className="rounded-card bg-white p-6 shadow-sm">
            {step === 0 && <LocationStep {...stepProps} />}
            {step === 1 && <CarStep {...stepProps} />}
            {step === 2 && <PricingStep {...stepProps} />}
            {step >= 3 && (
              <div className="py-8">
                <h2 className="font-heading text-2xl font-semibold">
                  {STEPS[step]}
                </h2>
                <p className="mt-2 text-primary/70">
                  Your details, date and time, and payment come in the next part of
                  the build.
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                disabled={step === 0}
                className="rounded-full border border-primary/20 px-5 py-2.5 text-sm font-medium text-primary disabled:opacity-40"
              >
                Back
              </button>
              {step < 3 && (
                <button
                  type="button"
                  onClick={() => goTo(step + 1)}
                  disabled={!canContinue}
                  className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-ink disabled:opacity-50"
                >
                  Continue
                </button>
              )}
            </div>
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Summary
              serviceName={serviceName}
              draft={draft}
              quote={quote}
              quoteError={quoteError}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}