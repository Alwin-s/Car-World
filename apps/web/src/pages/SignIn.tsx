import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const inputClass =
  'w-full rounded-lg border border-primary/20 bg-white px-4 py-3 text-base outline-none focus:border-primary';
const buttonClass =
  'w-full rounded-full bg-accent px-4 py-3 text-sm font-medium text-ink disabled:opacity-50';

export function SignIn() {
  const { user, loading, requestOtp, verifyOtp } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [digits, setDigits] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const phone = `+91${digits}`;

  async function handlePhone(event: FormEvent) {
    event.preventDefault();
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestOtp(phone);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code');
    } finally {
      setBusy(false);
    }
  }

  async function handleCode(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(phone, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify the code');
      setBusy(false);
    }
  }

  async function handleResend() {
    setBusy(true);
    setError(null);
    try {
      await requestOtp(phone);
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-md">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Sign In
        </h1>
        <p className="mt-3 text-base text-primary/80">
          {step === 'phone'
            ? 'Enter your mobile number and we will send you a code.'
            : `Enter the 6-digit code sent to +91 ${digits}.`}
        </p>

        <div className="mt-8 rounded-card bg-white p-6 shadow-sm">
          {step === 'phone' ? (
            <form onSubmit={handlePhone} className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Mobile number
                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-primary/20 bg-surface px-3 py-3 text-base">
                    +91
                  </span>
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={digits}
                    onChange={(e) =>
                      setDigits(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder="98765 43210"
                    autoFocus
                  />
                </div>
              </label>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button className={buttonClass} disabled={busy}>
                {busy ? 'Sending…' : 'Send code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCode} className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                6-digit code
                <input
                  className={`${inputClass} tracking-[0.5em]`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="······"
                  autoFocus
                />
              </label>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button className={buttonClass} disabled={busy}>
                {busy ? 'Verifying…' : 'Verify and sign in'}
              </button>
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  className="text-primary/70 underline"
                  onClick={() => {
                    setStep('phone');
                    setCode('');
                    setError(null);
                  }}
                >
                  Change number
                </button>
                <button
                  type="button"
                  className="text-primary/70 underline disabled:opacity-50"
                  onClick={handleResend}
                  disabled={busy}
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}