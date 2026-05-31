'use client';

import { useState, useEffect } from 'react';

/**
 * SSR-safe media query hook.
 * Returns `false` on first server render, then hydrates to the actual value on mount.
 * 
 * @param query - CSS media query string, e.g. "(max-width: 767px)"
 * @param fallback - Value during SSR (default: false)
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  const [matches, setMatches] = useState(fallback);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
