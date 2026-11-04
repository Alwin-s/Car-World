import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const links = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
  { to: '/about', label: 'About' },
];

export function Navbar() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="border-b border-primary/10 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="font-heading text-lg font-semibold text-primary">
          CarWorld
        </Link>
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `text-sm ${isActive ? 'font-medium text-primary' : 'text-primary/70 hover:text-primary'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {loading ? null : user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/account"
                className="text-sm font-medium text-primary hover:underline"
              >
                {user.fullName || user.phone}
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-full border border-primary/20 px-4 py-2 text-sm font-medium text-primary"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/signin"
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}