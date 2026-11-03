import { useEffect, useState } from 'react';

type Service = {
  code: string;
  name: string;
  tagline: string | null;
  isComingSoon: boolean;
  sortOrder: number;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function ServiceCards() {
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

  if (loading) return <p className="mt-10 text-primary/70">Loading services…</p>;
  if (error) return <p className="mt-10 text-danger">{error}</p>;

  return (
    <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <li
          key={service.code}
          className={`rounded-card bg-white p-6 shadow-sm ${
            service.isComingSoon ? 'opacity-70' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold">{service.name}</h2>
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
  );
}
