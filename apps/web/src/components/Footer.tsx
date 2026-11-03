export function Footer() {
  return (
    <footer className="mt-auto border-t border-primary/10 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-primary/70">
        © {new Date().getFullYear()} CarWorld. All rights reserved.
      </div>
    </footer>
  );
}
