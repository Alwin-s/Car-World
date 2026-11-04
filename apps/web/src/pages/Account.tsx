import { useEffect, useState } from 'react';
import { getMe } from '../lib/api';

type Me = Awaited<ReturnType<typeof getMe>>;

export function Account() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then(setMe)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Could not load account'),
      );
  }, []);

  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          My account
        </h1>
        {error && <p className="mt-6 text-danger">{error}</p>}
        {!me && !error && <p className="mt-6 text-primary/70">Loading…</p>}
        {me && (
          <dl className="mt-8 grid max-w-md gap-4 rounded-card bg-white p-6 shadow-sm">
            <div>
              <dt className="text-sm text-primary/60">Name</dt>
              <dd className="font-medium">{me.fullName}</dd>
            </div>
            <div>
              <dt className="text-sm text-primary/60">Phone</dt>
              <dd className="font-medium">{me.phone}</dd>
            </div>
          </dl>
        )}
      </div>
    </main>
  );
}