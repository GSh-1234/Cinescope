import { useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions {
  enabled?: boolean;
  rootMargin?: string;
  threshold?: number | number[];
  onIntersect: () => void;
}

/**
 * Custom hook to detect when an element enters the viewport.
 * Used for seamless infinite scrolling.
 */
export function useIntersectionObserver({
  enabled = true,
  rootMargin = '300px',
  threshold = 0.1,
  onIntersect,
}: UseIntersectionObserverOptions) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const element = targetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          onIntersect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, rootMargin, threshold, onIntersect]);

  return targetRef;
}

