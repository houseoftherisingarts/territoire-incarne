import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  rootMargin?: string;
  placeholder?: ReactNode;
  className?: string;
}

export const LazyMount = ({ children, rootMargin = "200px", placeholder = null, className }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : placeholder}
    </div>
  );
};
