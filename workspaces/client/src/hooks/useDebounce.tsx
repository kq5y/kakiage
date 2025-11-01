import { useEffect, useRef } from "react";

export function useDebounce(fn: (...rest: unknown[]) => unknown, ms = 300, deps: unknown[] = []) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fn();
    }, ms);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: deps are managed by the caller
  }, deps);
}
