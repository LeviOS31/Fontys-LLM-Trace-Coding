export function scrollSpanIntoView(spanId: string) {
  const target = document.querySelector(`[data-span-id="${spanId}"]`) as HTMLElement | null;
  if (!target) return;

  const viewport = target.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;
  if (!viewport) {
    // No contained scroll area found — fall back, but this should be rare now.
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const viewportRect = viewport.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const isFullyVisible =
    targetRect.top >= viewportRect.top && targetRect.bottom <= viewportRect.bottom;
  if (isFullyVisible) return;

  viewport.scrollTo({
    top:
      viewport.scrollTop +
      (targetRect.top - viewportRect.top) -
      viewport.clientHeight / 2 +
      targetRect.height / 2,
    behavior: 'smooth',
  });
}
