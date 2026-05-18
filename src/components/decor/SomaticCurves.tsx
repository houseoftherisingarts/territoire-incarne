export const SomaticCurves = ({ className }: { className?: string }) => (
  <svg
    className={`absolute inset-0 w-full h-full pointer-events-none ${className ?? ""}`}
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path d="M0 50 C 30 20, 70 80, 100 50" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.4" vectorEffect="non-scaling-stroke" />
    <path d="M0 60 C 40 30, 60 90, 100 60" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.3" vectorEffect="non-scaling-stroke" />
    <path d="M0 40 C 20 60, 80 20, 100 40" fill="none" stroke="currentColor" strokeWidth="0.1" opacity="0.2" vectorEffect="non-scaling-stroke" />
  </svg>
);
