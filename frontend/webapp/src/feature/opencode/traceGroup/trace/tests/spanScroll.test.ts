import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollSpanIntoView } from '../spanScroll';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('scrollSpanIntoView', () => {
  it('does nothing when the target span is absent', () => {
    vi.spyOn(document, 'querySelector').mockReturnValue(null);

    expect(() => scrollSpanIntoView('missing')).not.toThrow();
  });

  it('scrolls a contained viewport only when the target is outside view', () => {
    const target = document.createElement('div');
    const viewport = document.createElement('div');
    const scrollTo = vi.fn();
    vi.spyOn(document, 'querySelector').mockReturnValue(target);
    vi.spyOn(target, 'closest').mockReturnValue(viewport);
    vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 300,
      left: 0,
      right: 100,
      width: 100,
      height: 200,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    });
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      top: 350,
      bottom: 390,
      left: 0,
      right: 50,
      width: 50,
      height: 40,
      x: 0,
      y: 350,
      toJSON: () => ({}),
    });
    Object.defineProperties(viewport, {
      scrollTop: { value: 20 },
      clientHeight: { value: 200 },
      scrollTo: { value: scrollTo },
    });

    scrollSpanIntoView('span-1');

    expect(scrollTo).toHaveBeenCalledWith({ top: 190, behavior: 'smooth' });
  });

  it('falls back to scrollIntoView when there is no scroll-area viewport', () => {
    const target = document.createElement('div');
    vi.spyOn(document, 'querySelector').mockReturnValue(target);
    vi.spyOn(target, 'closest').mockReturnValue(null);
    target.scrollIntoView = vi.fn();

    scrollSpanIntoView('span-1');

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });
});
