import React from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingOptimizerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showPartialContent?: boolean;
}

export function LoadingOptimizer({
  children,
  fallback,
  showPartialContent = true
}: LoadingOptimizerProps) {
  const { isInitializing } = useFinancial();

  if (isInitializing && !showPartialContent) {
    return (
      <div className="space-y-6 animate-fade-in">
        {fallback || (
          <>
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="financial-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={isInitializing ? 'opacity-75 transition-opacity duration-300' : ''}>
      {children}
    </div>
  );
}