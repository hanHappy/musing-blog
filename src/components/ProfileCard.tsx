export default function ProfileCard() {
  return (
    <div className="card">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)]">
          <span className="text-2xl font-bold text-white">M</span>
        </div>
        <h3 className="mb-2 text-base font-semibold text-[var(--text-primary)]">
          Musing
        </h3>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          A space for contemplation, exploration, and sharing thoughts on
          technology and ideas.
        </p>
      </div>
    </div>
  );
}
