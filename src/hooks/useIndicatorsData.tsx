import { useMemo } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';

export interface IndicatorFilters {
  startDate: string;
  endDate: string;
  channel?: string;
  categoryId?: string;
  branchId?: string;
}

export interface IndicatorRow {
  variantId: string;
  name: string;
  unitCost: number;
  price: number;
  quantity: number;
  categoryId?: string;
}

export interface TopProduct {
  rank: number;
  name: string;
  cogs: string;
  price: string;
  cogsPct: string;
  revenueShare: string;
  impact: number;
}

export interface TimeSeriesData {
  period: string;
  cogs: number;
  revenue: number;
  margin: number;
}

export interface IndicatorTotals {
  totalRevenue: number;
  totalCOGS: number;
  weightedCOGS: number;
  grossMargin: number;
  totalItems: number;
  ignoredItems: number;
  isValidPeriod: boolean;
  monthsCount: number;
  warnings: string[];
}

export function useIndicatorsData(filters: IndicatorFilters) {
  const { 
    salesData, 
    variacoesConfig, 
    selectPrice, 
    isInitializing,
    faturamentos 
  } = useFinancial();

  // Helper function to get months from date range with validation
  const getValidatedDateRange = useMemo(() => {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    
    // Calculate months difference
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth()) + 1;
    
    let adjustedStartDate = startDate;
    let adjustedEndDate = endDate;
    let warnings: string[] = [];
    
    // Rule 1: Maximum 12 months
    if (monthsDiff > 12) {
      // Adjust to last 12 months from end date
      adjustedStartDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);
      warnings.push("O cálculo do CMV considera no máximo os últimos 12 meses. O período foi ajustado automaticamente.");
    }
    
    return { 
      startDate: adjustedStartDate, 
      endDate: adjustedEndDate, 
      monthsCount: Math.min(monthsDiff, 12),
      warnings 
    };
  }, [filters.startDate, filters.endDate]);

  // Get monthly revenue data from faturamentos for the validated period
  const monthlyRevenueData = useMemo(() => {
    const { startDate, endDate } = getValidatedDateRange;
    const monthsWithRevenue: Array<{ month: string; revenue: number }> = [];
    
    // Extract months in range with actual revenue data
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const faturamento = faturamentos.find(f => f.mes === monthKey);
      
      if (faturamento && faturamento.valor > 0) {
        monthsWithRevenue.push({
          month: monthKey,
          revenue: faturamento.valor
        });
      }
    }
    
    return monthsWithRevenue;
  }, [faturamentos, getValidatedDateRange]);

  // Get variant costs from variacoesConfig
  const variantCosts = useMemo(() => {
    return variacoesConfig.variacoes.map(variant => ({
      variantId: variant.id,
      name: variant.nome,
      unitCost: variant.unitCost,
      categoryId: undefined // Future: add category support
    }));
  }, [variacoesConfig.variacoes]);

  // Get pricing data (fallback for simulation)
  const pricingData = useMemo(() => {
    return variacoesConfig.variacoes.map(variant => {
      const pricing = selectPrice(variant.id, 'balcao'); // Use balcao as default channel
      return {
        variantId: variant.id,
        appliedPrice: pricing.price
      };
    });
  }, [variacoesConfig.variacoes, selectPrice]);

  // Apply filters to sales data
  const filteredSales = useMemo(() => {
    return salesData.filter(sale => {
      // Status filter - exclude canceled and refunded
      if (sale.status === 'canceled' || sale.status === 'refunded') {
        return false;
      }

      // Date filter
      if (sale.date < filters.startDate || sale.date > filters.endDate) {
        return false;
      }

      // Channel filter
      if (filters.channel && filters.channel !== 'all' && sale.channel !== filters.channel) {
        return false;
      }

      // Branch filter (future)
      if (filters.branchId && sale.branchId !== filters.branchId) {
        return false;
      }

      return true;
    });
  }, [salesData, filters]);

  // Build indicator rows (join sales with costs and prices)
  const indicatorRows = useMemo((): IndicatorRow[] => {
    const costMap = new Map(variantCosts.map(c => [c.variantId, c.unitCost]));
    const priceMap = new Map(pricingData.map(p => [p.variantId, p.appliedPrice]));

    // If we have sales data, use actual sales
    if (filteredSales.length > 0) {
      return filteredSales
        .map(sale => ({
          variantId: sale.variantId,
          name: variantCosts.find(c => c.variantId === sale.variantId)?.name || 'Produto não encontrado',
          unitCost: costMap.get(sale.variantId) ?? 0,
          price: sale.unitPriceNet, // Use actual sale price
          quantity: sale.quantity,
          categoryId: undefined // Future: get from variant
        }))
        .filter(row => row.quantity > 0 && row.price > 0 && row.unitCost >= 0);
    }

    // Fallback to simulation data (no sales)
    return variantCosts
      .map(cost => ({
        variantId: cost.variantId,
        name: cost.name,
        unitCost: cost.unitCost,
        price: priceMap.get(cost.variantId) ?? 0,
        quantity: 1, // Default quantity for simulation
        categoryId: cost.categoryId
      }))
      .filter(row => row.price > 0 && row.unitCost >= 0);
  }, [variantCosts, pricingData, filteredSales]);

  // Calculate totals with new CMV logic
  const totals = useMemo((): IndicatorTotals => {
    const { monthsCount, warnings: periodWarnings } = getValidatedDateRange;
    const monthlyRevCount = monthlyRevenueData.length;
    let warnings: string[] = [...periodWarnings];
    let isValidPeriod = true;
    let weightedCOGS = 0;
    let grossMargin = 0;
    let totalRevenue = 0;
    let totalCOGS = 0;

    // Rule 2: Minimum 3 months validation
    if (monthlyRevCount === 0) {
      warnings.push("Não há dados de faturamento suficientes para calcular o CMV% neste intervalo.");
      isValidPeriod = false;
    } else if (monthlyRevCount === 1) {
      warnings.push("Para um cálculo realista, o CMV% considera no mínimo 3 meses de faturamento. Complete os meses em falta para visualizar os indicadores.");
      isValidPeriod = false;
    } else if (monthlyRevCount === 2) {
      warnings.push("O cálculo com menos de 3 meses pode não refletir a realidade do negócio.");
      isValidPeriod = true; // Calculate but with warning
    } else {
      isValidPeriod = true;
    }

    // Calculate CMV if valid period
    if (isValidPeriod && monthlyRevCount >= 2) {
      // Use faturamento mensal as revenue source
      totalRevenue = monthlyRevenueData.reduce((sum, month) => sum + month.revenue, 0);
      
      // Calculate COGS from indicatorRows (sales or simulation data)
      totalCOGS = indicatorRows.reduce((sum, row) => sum + (row.unitCost * row.quantity), 0);
      
      if (totalRevenue > 0) {
        weightedCOGS = (totalCOGS / totalRevenue) * 100;
        grossMargin = 100 - weightedCOGS;
      }
    }

    return {
      totalRevenue,
      totalCOGS,
      weightedCOGS,
      grossMargin,
      totalItems: indicatorRows.length,
      ignoredItems: 0,
      isValidPeriod,
      monthsCount: monthlyRevCount,
      warnings
    };
  }, [indicatorRows, getValidatedDateRange, monthlyRevenueData]);

  // Calculate top 5 products by cost impact
  const top5Products = useMemo((): TopProduct[] => {
    return [...indicatorRows]
      .sort((a, b) => (b.unitCost * b.quantity) - (a.unitCost * a.quantity))
      .slice(0, 5)
      .map((row, index) => ({
        rank: index + 1,
        name: row.name,
        cogs: row.unitCost.toFixed(2),
        price: row.price.toFixed(2),
        cogsPct: ((row.unitCost / row.price) * 100).toFixed(1),
        revenueShare: totals.totalRevenue > 0 
          ? ((row.price * row.quantity) / totals.totalRevenue * 100).toFixed(1)
          : "0.0",
        impact: row.unitCost * row.quantity
      }));
  }, [indicatorRows, totals.totalRevenue]);

  // Calculate best CMVs (lowest unit cost)
  const bestCMVs = useMemo((): TopProduct[] => {
    return [...indicatorRows]
      .filter(row => row.price > 0 && row.unitCost >= 0)
      .sort((a, b) => {
        // Primary sort: unit cost ascending (lowest first)
        const costDiff = a.unitCost - b.unitCost;
        if (costDiff !== 0) return costDiff;
        
        // Secondary sort: quantity descending (higher quantity first)
        const quantityDiff = b.quantity - a.quantity;
        if (quantityDiff !== 0) return quantityDiff;
        
        // Tertiary sort: alphabetical
        return a.name.localeCompare(b.name);
      })
      .map((row, index) => ({
        rank: index + 1,
        name: row.name,
        cogs: row.unitCost.toFixed(2),
        price: row.price.toFixed(2),
        cogsPct: ((row.unitCost / row.price) * 100).toFixed(1),
        revenueShare: totals.totalRevenue > 0 
          ? ((row.price * row.quantity) / totals.totalRevenue * 100).toFixed(1)
          : "0.0",
        impact: row.unitCost * row.quantity
      }));
  }, [indicatorRows, totals.totalRevenue]);

  // Calculate worst CMVs (highest unit cost)
  const worstCMVs = useMemo((): TopProduct[] => {
    return [...indicatorRows]
      .filter(row => row.price > 0 && row.unitCost >= 0)
      .sort((a, b) => {
        // Primary sort: unit cost descending (highest first)
        const costDiff = b.unitCost - a.unitCost;
        if (costDiff !== 0) return costDiff;
        
        // Secondary sort: quantity descending (higher quantity first)
        const quantityDiff = b.quantity - a.quantity;
        if (quantityDiff !== 0) return quantityDiff;
        
        // Tertiary sort: alphabetical
        return a.name.localeCompare(b.name);
      })
      .map((row, index) => ({
        rank: index + 1,
        name: row.name,
        cogs: row.unitCost.toFixed(2),
        price: row.price.toFixed(2),
        cogsPct: ((row.unitCost / row.price) * 100).toFixed(1),
        revenueShare: totals.totalRevenue > 0 
          ? ((row.price * row.quantity) / totals.totalRevenue * 100).toFixed(1)
          : "0.0",
        impact: row.unitCost * row.quantity
      }));
  }, [indicatorRows, totals.totalRevenue]);

  // Calculate time series data (group by period)
  const timeSeriesData = useMemo((): TimeSeriesData[] => {
    if (filteredSales.length === 0) {
      return [];
    }

    // Group sales by month
    const monthlyData = new Map<string, { revenue: number; cogs: number }>();
    const costMap = new Map(variantCosts.map(c => [c.variantId, c.unitCost]));

    filteredSales.forEach(sale => {
      const month = sale.date.substring(0, 7); // YYYY-MM
      const revenue = sale.quantity * sale.unitPriceNet;
      const cogs = sale.quantity * (costMap.get(sale.variantId) ?? 0);

      const existing = monthlyData.get(month) || { revenue: 0, cogs: 0 };
      monthlyData.set(month, {
        revenue: existing.revenue + revenue,
        cogs: existing.cogs + cogs
      });
    });

    // Convert to array and calculate percentages
    return Array.from(monthlyData.entries())
      .map(([period, data]) => ({
        period: new Date(period + '-01').toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: '2-digit' 
        }),
        cogs: data.revenue > 0 ? (data.cogs / data.revenue) * 100 : 0,
        revenue: data.revenue,
        margin: data.revenue > 0 ? 100 - ((data.cogs / data.revenue) * 100) : 0
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredSales, variantCosts]);

  // Classification helpers
  const getCOGSClassification = (cogs: number) => {
    if (cogs <= 25) return { 
      status: "Ótimo", 
      variant: "success" as const,
      className: "bg-green-500/15 text-green-500"
    };
    if (cogs <= 30) return { 
      status: "Bom", 
      variant: "default" as const,
      className: "bg-blue-500/15 text-blue-500"
    };
    if (cogs <= 35) return { 
      status: "Razoável", 
      variant: "warning" as const,
      className: "bg-orange-500/15 text-orange-500"
    };
    return { 
      status: "Ruim", 
      variant: "destructive" as const,
      className: "bg-red-500/15 text-red-500"
    };
  };

  const getMarginClassification = (margin: number) => {
    if (margin > 75) return { 
      status: "Ótimo", 
      variant: "success" as const,
      className: "bg-green-500/15 text-green-500"
    };
    if (margin >= 65) return { 
      status: "Bom", 
      variant: "default" as const,
      className: "bg-blue-500/15 text-blue-500"
    };
    if (margin >= 55) return { 
      status: "Razoável", 
      variant: "warning" as const,
      className: "bg-orange-500/15 text-orange-500"
    };
    return { 
      status: "Ruim", 
      variant: "destructive" as const,
      className: "bg-red-500/15 text-red-500"
    };
  };

  return {
    indicatorRows,
    totals,
    top5Products,
    bestCMVs,
    worstCMVs,
    timeSeriesData,
    getCOGSClassification,
    getMarginClassification,
    isLoading: isInitializing,
    hasSalesData: filteredSales.length > 0,
    hasAnyData: indicatorRows.length > 0
  };
}