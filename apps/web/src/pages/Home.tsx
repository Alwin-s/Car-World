import { useEffect, useState } from 'react';

type Service = {
  code: string;
  name: string;
  tagline: string | null;
  isComingSoon: boolean;
  sortOrder: number;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/services`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load services (${response.status})`);
        }
        return (await response.json()) as Service[];
      })
      .then((data) => {
        setServices(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Could not load services');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-svh bg-surface px-6 py-16 text-primary">
      <div className="mx-auto max-w-6xl">
        <p className="font-heading text-sm font-semibold tracking-wide text-accent">
          CarWorld
        </p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
          Our services
        </h1>
        <p className="mt-3 max-w-2xl text-base text-primary/80">
          Inspection, history, and selling support — with coming-soon offerings
          clearly marked.
        </p>

        {loading && <p className="mt-10 text-primary/70">Loading services…</p>}
        {error && <p className="mt-10 text-danger">{error}</p>}

        {!loading && !error && (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li
                key={service.code}
                className={`rounded-card bg-white p-6 shadow-sm ${
                  service.isComingSoon ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-heading text-xl font-semibold">
                    {service.name}
                  </h2>
                  {service.isComingSoon && (
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-ink">
                      Coming soon
                    </span>
                  )}
                </div>
                {service.tagline && (
                  <p className="mt-3 text-sm leading-relaxed text-primary/75">
                    {service.tagline}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
