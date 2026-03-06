export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border-color)] bg-[var(--bg-primary)] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} Musing. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
