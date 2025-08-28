import { useState, useEffect, useCallback, useMemo } from 'react';

interface ProgressiveLoadingConfig<T> {
  loadFunction: () => Promise<T> | T;
  dependencies?: any[];
  delay?: number;
  priority?: 'critical' | 'high' | 'normal' | 'low';
}

export function useProgressiveLoading<T>(
  configs: ProgressiveLoadingConfig<T>[]
) {
  const [loadedData, setLoadedData] = useState<(T | null)[]>(
    new Array(configs.length).fill(null)
  );
  const [loadingStates, setLoadingStates] = useState<boolean[]>(
    new Array(configs.length).fill(false)
  );
  const [isInitializing, setIsInitializing] = useState(true);

  // Memoize sorted configs to prevent unnecessary re-calculations
  const sortedConfigs = useMemo(() => 
    configs
      .map((config, index) => ({ ...config, originalIndex: index }))
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal'];
      }), [configs]);

  const loadData = useCallback(async (configIndex: number) => {
    const config = sortedConfigs[configIndex];
    const originalIndex = config.originalIndex;
    
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[originalIndex] = true;
      return newStates;
    });

    try {
      const data = await Promise.resolve(config.loadFunction());
      
      setLoadedData(prev => {
        const newData = [...prev];
        newData[originalIndex] = data;
        return newData;
      });
    } catch (error) {
      console.error(`Error loading data at index ${originalIndex}:`, error);
    } finally {
      setLoadingStates(prev => {
        const newStates = [...prev];
        newStates[originalIndex] = false;
        return newStates;
      });
    }
  }, [sortedConfigs]);

  useEffect(() => {
    const loadProgressively = async () => {
      // Load critical data first with immediate execution
      const criticalConfigs = sortedConfigs
        .map((config, index) => ({ config, index }))
        .filter(({ config }) => config.priority === 'critical');

      // Load critical data immediately in parallel
      await Promise.all(
        criticalConfigs.map(({ index }) => loadData(index))
      );

      // Mark as initialized after critical data
      setIsInitializing(false);

      // Load remaining data progressively with minimal delays
      const remainingConfigs = sortedConfigs
        .map((config, index) => ({ config, index }))
        .filter(({ config }) => config.priority !== 'critical');

      // Use requestIdleCallback for better performance if available
      const scheduleLoad = (callback: () => void, delay: number = 0) => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          window.requestIdleCallback(callback, { timeout: delay + 100 });
        } else {
          setTimeout(callback, delay);
        }
      };

      remainingConfigs.forEach(({ config, index }, i) => {
        const delay = Math.min(config.delay || 0, 50) + i * 25; // Max 50ms delay
        scheduleLoad(() => {
          loadData(index);
        }, delay);
      });
    };

    loadProgressively();
  }, [loadData, sortedConfigs]);

  return useMemo(() => ({
    data: loadedData,
    loading: loadingStates,
    isInitializing,
    isAnyLoading: loadingStates.some(Boolean),
    refetch: (index: number) => {
      const configIndex = sortedConfigs.findIndex(c => c.originalIndex === index);
      return configIndex >= 0 ? loadData(configIndex) : Promise.resolve();
    }
  }), [loadedData, loadingStates, isInitializing, sortedConfigs, loadData]);
}