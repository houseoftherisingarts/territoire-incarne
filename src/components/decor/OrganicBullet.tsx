const shapes = [
  <circle key="0" cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />,
  <path key="1" d="M2 10 Q 10 2 18 10 Q 10 18 2 10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />,
  <rect key="2" x="5" y="5" width="10" height="10" transform="rotate(45 10 10)" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />,
  <path key="3" d="M10 2 L 18 18 L 2 18 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />,
];

export const OrganicBullet = ({ index }: { index: number }) => (
  <svg viewBox="0 0 20 20" className="w-6 h-6 text-rust/70 dark:text-stone-300" aria-hidden="true">
    {shapes[index % shapes.length]}
  </svg>
);
