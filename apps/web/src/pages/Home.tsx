import { Link } from 'react-router-dom';
import { ServiceCards } from '../components/ServiceCards';

export function Home() {
  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <p className="font-heading text-sm font-semibold tracking-wide text-accent">
          CarWorld
        </p>
        <h1 className="mt-3 max-w-3xl font-heading text-4xl font-semibold tracking-tight">
          Inspect, verify, and sell with confidence
        </h1>
        <p className="mt-3 max-w-2xl text-base text-primary/80">
          Inspection, history, and selling support — with coming-soon offerings
          clearly marked.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/contact"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink"
          >
            Book Inspection
          </Link>
          <Link
            to="/services"
            className="rounded-full border border-primary/20 px-5 py-2.5 text-sm font-medium text-primary"
          >
            View Services
          </Link>
        </div>
        <ServiceCards />
      </div>
    </main>
  );
}
