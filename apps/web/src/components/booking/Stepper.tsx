export function Stepper({ steps, current }: { steps: string[]; current: number }) {
    return (
      <ol className="flex items-center gap-2 overflow-x-auto">
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
          const circle = active
            ? 'bg-primary text-white'
            : done
              ? 'bg-accent text-ink'
              : 'bg-primary/10 text-primary/60';
          return (
            <li
              key={label}
              className="flex items-center gap-2"
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${circle}`}
              >
                {done ? '✓' : index + 1}
              </span>
              <span
                className={`hidden text-sm sm:inline ${active ? 'font-medium' : 'text-primary/60'}`}
              >
                {label}
              </span>
              {index < steps.length - 1 && (
                <span className="h-px w-4 bg-primary/20 sm:w-8" />
              )}
            </li>
          );
        })}
      </ol>
    );
  }