import React, { useEffect, useRef, useState } from 'react';

type Variant = 'zoom-in' | 'zoom-out' | 'fade-up' | 'slide-left' | 'slide-right';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

// Reveals its children with a distinct entrance animation the first time they
// scroll into view — each section on the page can use a different variant so
// consecutive scrolls feel like a sequence of fresh moments, not repetition.
export default function ScrollReveal({ children, variant = 'zoom-in', className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    // threshold: 0 (not a percentage of the element's area — large sections like the
    // comparison table can be several viewport-heights tall on mobile, so a percentage
    // threshold could stay unmet for many scrolls, leaving content invisible) — trigger
    // the instant any pixel enters the viewport instead.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal scroll-reveal-${variant} ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
