import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Enhanced useMemo with dependency stability checking
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList | undefined
): T {
  const prevDepsRef = useRef<React.DependencyList | undefined>();
  const memoRef = useRef<T>();
  
  const depsChanged = useMemo(() => {
    if (!prevDepsRef.current || !deps) return true;
    if (prevDepsRef.current.length !== deps.length) return true;
    
    return deps.some((dep, index) => {
      const prevDep = prevDepsRef.current![index];
      // Deep comparison for objects
      if (typeof dep === 'object' && dep !== null && prevDep !== null) {
        return JSON.stringify(dep) !== JSON.stringify(prevDep);
      }
      return dep !== prevDep;
    });
  }, deps);

  if (depsChanged || !memoRef.current) {
    memoRef.current = factory();
    prevDepsRef.current = deps;
  }

  return memoRef.current;
}

// Optimized useCallback with stable reference
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef<T>();
  const depsRef = useRef<React.DependencyList>();

  // Only update callback if dependencies actually changed
  const depsChanged = useMemo(() => {
    if (!depsRef.current) return true;
    if (depsRef.current.length !== deps.length) return true;
    return deps.some((dep, i) => dep !== depsRef.current![i]);
  }, deps);

  if (depsChanged) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return callbackRef.current as T;
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    const renderTime = now - lastRenderTimeRef.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🔄 ${componentName} rendered #${renderCountRef.current} (${renderTime}ms since last render)`);
    }
    
    lastRenderTimeRef.current = now;
  });

  return {
    renderCount: renderCountRef.current,
    logPerformance: useCallback(() => {
      if (process.env.NODE_ENV === 'development') {
        console.table({
          Component: componentName,
          'Render Count': renderCountRef.current,
          'Last Render': new Date(lastRenderTimeRef.current).toLocaleTimeString()
        });
      }
    }, [componentName])
  };
}

// Batched state updates hook
export function useBatchedUpdates<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const batchRef = useRef<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setBatchedValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const resolvedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(batchRef.current)
      : newValue;
    
    batchRef.current = resolvedValue;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Batch updates with requestAnimationFrame for optimal performance
    timeoutRef.current = setTimeout(() => {
      setValue(batchRef.current);
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, setBatchedValue] as const;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);
        
        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
}