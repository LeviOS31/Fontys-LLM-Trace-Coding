import { useEffect, useState, type RefObject } from 'react';

interface ScrollbarThumbProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export function ScrollbarThumb({ containerRef }: Readonly<ScrollbarThumbProps>) {
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight <= clientHeight) {
        setThumb(null);
        return;
      }
      const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 24);
      const maxThumbTop = clientHeight - thumbHeight;
      const scrollRatio = scrollTop / (scrollHeight - clientHeight);
      setThumb({ top: scrollRatio * maxThumbTop, height: thumbHeight });
    };

    update();
    el.addEventListener('scroll', update);

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    // Also watch children, since the list's content height changes as
    // versions are added/removed without the container itself resizing.
    Array.from(el.children).forEach((child) => resizeObserver.observe(child));

    return () => {
      el.removeEventListener('scroll', update);
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  if (!thumb) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: thumb.top,
        right: 2,
        width: 5,
        height: thumb.height,
        borderRadius: 3,
        backgroundColor: 'var(--gray-6)',
        pointerEvents: 'none',
        transition: 'top 0.05s linear',
      }}
    />
  );
}
