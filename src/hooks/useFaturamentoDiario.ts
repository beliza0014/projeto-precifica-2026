import { useState, useEffect, useCallback } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { 
  DateRange, 
  currentMonthRange 
} from '@/utils/dateUtils';
import {
  DailyView,
  Granularity,
  AggregatedSeries,
  FaturamentoManualDia,
  buildDailyFromSales,
  buildDailyFromLegacyMonthly,
  mergeDailySources,
  aggregateSeries,
  getFaturamentoManualDiario,
  addManualFaturamento,
  FilterType
} from '@/utils/faturamentoUtils';

export type PresetType = 'currentMonth' | 'last3months' | 'custom';

export function useFaturamentoDiario() {
  const { faturamentos, salesData } = useFinancial();
  
  // Estado principal
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('currentMonth');
  const [customRange, setCustomRange] = useState<DateRange>(currentMonthRange());
  const [granularity, setGranularity] = useState<Granularity>('MONTH');
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  
  // Dados calculados
  const [dailyView, setDailyView] = useState<DailyView>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedSeries>({ series: [], total: 0 });
  const [manualData, setManualData] = useState<FaturamentoManualDia[]>([]);

  // Carregar dados manuais do localStorage
  useEffect(() => {
    const manual = getFaturamentoManualDiario();
    setManualData(manual);
  }, []);

  // Optimized daily view building with debounce
  const buildDailyView = useCallback(() => {
    const fromSales = buildDailyFromSales(salesData || []);
    const fromLegacy = buildDailyFromLegacyMonthly(faturamentos);
    const merged = mergeDailySources(fromSales, fromLegacy, manualData);
    setDailyView(merged);
  }, [salesData, faturamentos, manualData]);

  // Optimized rebuild with minimal delay
  useEffect(() => {
    const timer = setTimeout(() => {
      buildDailyView();
    }, 10);
    return () => clearTimeout(timer);
  }, [buildDailyView]);

  // Optimized aggregation calculation
  const calculateAggregation = useCallback(() => {
    const currentRange = getCurrentRange();
    const aggregated = aggregateSeries(dailyView, currentRange.start, currentRange.end, granularity, filterType, manualData);
    setAggregatedData(aggregated);
  }, [dailyView, selectedPreset, customRange, granularity, filterType, manualData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateAggregation();
    }, 5);
    return () => clearTimeout(timer);
  }, [calculateAggregation]);

  // Obter range atual baseado no preset
  const getCurrentRange = useCallback((): DateRange => {
    switch (selectedPreset) {
      case 'currentMonth':
        return currentMonthRange();
      case 'last3months':
        const endMonth = new Date();
        const startMonth = new Date();
        startMonth.setMonth(endMonth.getMonth() - 2);
        startMonth.setDate(1);
        return { 
          start: startMonth.toISOString().split('T')[0], 
          end: endMonth.toISOString().split('T')[0] 
        };
      case 'custom':
        return customRange;
      default:
        return currentMonthRange();
    }
  }, [selectedPreset, customRange]);

  // Atualizar preset
  const updatePreset = useCallback((preset: PresetType) => {
    setSelectedPreset(preset);
  }, []);

  // Optimized range update without artificial delay
  const updateCustomRange = useCallback(async (range: DateRange) => {
    setIsLoading(true);
    setCustomRange(range);
    setSelectedPreset('custom');
    
    // Minimal delay for smooth UX feedback
    await new Promise(resolve => setTimeout(resolve, 5));
    setIsLoading(false);
  }, []);

  // Atualizar granularidade
  const updateGranularity = useCallback((gran: Granularity) => {
    setGranularity(gran);
  }, []);

  // Atualizar filtro de tipo
  const updateFilterType = useCallback((type: FilterType) => {
    setFilterType(type);
  }, []);

  // Optimized manual entry addition
  const addManualEntry = useCallback(async (data: string, valor: number, isMonthly: boolean = false) => {
    setIsLoading(true);
    
    try {
      addManualFaturamento(data, valor, isMonthly);
      const updated = getFaturamentoManualDiario();
      setManualData(updated);
    } catch (error) {
      console.error('Erro ao adicionar faturamento manual:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Estado
    selectedPreset,
    customRange,
    granularity,
    isLoading,
    filterType,
    
    // Dados calculados
    dailyView,
    aggregatedData,
    currentRange: getCurrentRange(),
    
    // Ações
    updatePreset,
    updateCustomRange,
    updateGranularity,
    updateFilterType,
    addManualEntry,
    
    // Helper para forçar recálculo
    refreshData: buildDailyView
  };
}