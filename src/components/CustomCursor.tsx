import React, { useEffect, useRef } from 'react';

/**
 * Site-wide animated circular cursor: an inner dot that tracks the mouse instantly,
 * and an outer ring that trails smoothly behind it, enlarging over clickable elements.
 * Desktop/mouse only — never activates on touch devices, and the real cursor stays
 * untouched until we confirm a fine pointer is actually present.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) {
      return; // touch device — leave native behavior alone
    }

    document.body.classList.add('custom-cursor-active');

    const handleMove = (e: MouseEvent) => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isTypeable = target.closest('input, textarea, select, [contenteditable="true"]');
      const interactive = target.closest('a, button, [role="button"], .cursor-pointer');
      dotRef.current?.classList.toggle('cursor-hidden', !!isTypeable);
      ringRef.current?.classList.toggle('cursor-hidden', !!isTypeable);
      ringRef.current?.classList.toggle('cursor-ring-active', !!interactive && !isTypeable);
    };

    const handleDown = () => ringRef.current?.classList.add('cursor-ring-click');
    const handleUp = () => ringRef.current?.classList.remove('cursor-ring-click');

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseover', handleOver);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);

    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleOver);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  );
}
