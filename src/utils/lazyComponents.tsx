import React, { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Enhanced lazy loading wrapper with loading states
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);

  const WrappedComponent = (props: React.ComponentProps<T>) => (
    <Suspense 
      fallback={
        fallback || (
          <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-[200px]" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full" />
              ))}
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        )
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );

  return WrappedComponent;
}

// Preload function for critical components
export function preloadComponent(importFn: () => Promise<any>) {
  const preload = () => importFn().catch(() => {});
  
  // Preload on idle or after a short delay
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preload, { timeout: 1000 });
    } else {
      setTimeout(preload, 100);
    }
  }
  
  return preload;
}

// Component-specific lazy loaders with optimized fallbacks
export const LazyIndicadores = createLazyComponent(
  () => import('@/pages/IndicadoresNew'),
  <div className="space-y-6 p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[160px]" />
      </div>
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <Skeleton key={i} className="h-[120px] w-full" />
      ))}
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-[120px] w-full" />
      ))}
    </div>
    <Skeleton className="h-[400px] w-full" />
  </div>
);

export const LazyReceitas = createLazyComponent(
  () => import('@/pages/Receitas'),
  <div className="space-y-6 p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-4 w-[250px]" />
      </div>
      <Skeleton className="h-10 w-[120px]" />
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-[120px] w-full" />
      ))}
    </div>
    <Skeleton className="h-[300px] w-full" />
  </div>
);

export const LazyVariacoes = createLazyComponent(
  () => import('@/pages/Variacoes'),
  <div className="space-y-6 p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-[120px] w-full" />
      ))}
    </div>
    <div className="w-full">
      <div className="grid w-full grid-cols-4 mb-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  </div>
);

export const LazyFaturamento = createLazyComponent(
  () => import('@/pages/Faturamento')
);

export const LazyInsumos = createLazyComponent(
  () => import('@/pages/Insumos')
);

export const LazyVendas = createLazyComponent(
  () => import('@/pages/Vendas')
);

export const LazyPrecificacao = createLazyComponent(
  () => import('@/pages/Precificacao')
);

export const LazyPromocoes = createLazyComponent(
  () => import('@/pages/Promocoes')
);

// Preload critical components
export const preloadIndicadores = preloadComponent(() => import('@/pages/IndicadoresNew'));
export const preloadReceitas = preloadComponent(() => import('@/pages/Receitas'));
export const preloadVariacoes = preloadComponent(() => import('@/pages/Variacoes'));