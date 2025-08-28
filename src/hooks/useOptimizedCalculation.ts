import { useCallback, useRef, useMemo, useState, useEffect } from 'react';

interface UseOptimizedCalculationOptions {
  debounceMs?: number;
  enableDebounce?: boolean;
}

export function useOptimizedCalculation<T extends any[], R>(
  calculationFn: (...args: T) => R,
  dependencies: T,
  options: UseOptimizedCalculationOptions = {}
) {
  const { debounceMs = 50, enableDebounce = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastResultRef = useRef<R>();
  const lastDepsRef = useRef<T>();
  const [isCalculating, setIsCalculating] = useState(false);

  // Optimized dependency comparison using shallow equality
  const depsChanged = useMemo(() => {
    if (!lastDepsRef.current) return true;
    if (dependencies.length !== lastDepsRef.current.length) return true;
    
    return dependencies.some((dep, i) => {
      const lastDep = lastDepsRef.current![i];
      // Optimized comparison for common types
      if (typeof dep === 'object' && dep !== null && lastDep !== null) {
        return JSON.stringify(dep) !== JSON.stringify(lastDep);
      }
      return dep !== lastDep;
    });
  }, [dependencies]);

  const calculate = useCallback(() => {
    setIsCalculating(true);
    try {
      const result = calculationFn(...dependencies);
      lastResultRef.current = result;
      lastDepsRef.current = [...dependencies] as T;
      return result;
    } finally {
      setIsCalculating(false);
    }
  }, [calculationFn, ...dependencies]);

  const optimizedResult = useMemo(() => {
    if (!depsChanged && lastResultRef.current !== undefined) {
      return lastResultRef.current;
    }

    if (!enableDebounce) {
      return calculate();
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced calculation
    timeoutRef.current = setTimeout(() => {
      calculate();
    }, debounceMs);

    // Return last known result while debouncing
    return lastResultRef.current;
  }, [depsChanged, calculate, enableDebounce, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { result: optimizedResult, isCalculating };
}

// Enhanced debounced hook with better performance
export function useDebounced<T>(
  value: T,
  delay: number = 100
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [debouncedValue, setDebouncedValue] = useState(value);
  const lastValueRef = useRef(value);

  useEffect(() => {
    // Only update if value actually changed
    if (lastValueRef.current === value) return;
    
    lastValueRef.current = value;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// New hook for memoized calculations
export function useMemoizedCalculation<T>(
  calculationFn: () => T,
  dependencies: React.DependencyList
): T {
  return useMemo(calculationFn, dependencies);
}
