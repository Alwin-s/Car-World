import { ServiceCards } from '../components/ServiceCards';

export function Services() {
  return (
    <main className="px-6 py-16">
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
        <ServiceCards />
      </div>
    </main>
  );
}
