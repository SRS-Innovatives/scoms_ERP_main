import { useEffect, useState } from 'react';

/** `value`, but only after it has stopped changing for `delay` ms — so a search box sends one
 * request when the user pauses, not one per keystroke. Use the result as a react-query key:
 * each query string is its own cache entry, so a slow older response can never overwrite
 * the results for what was typed later. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
