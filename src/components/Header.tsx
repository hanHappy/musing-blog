import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="border-b border-[var(--border-color)] bg-[var(--bg-primary)] py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Title */}
          <Link href="/" className="flex items-center gap-2">
            <h1 className="font-bold text-[var(--text-primary)]">
              musing
            </h1>
          </Link>

          {/* Navigation & Theme Toggle */}
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                Contact
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
