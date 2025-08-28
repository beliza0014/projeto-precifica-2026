interface SaleItem {
  id: string;
  date: string;             // 'YYYY-MM-DD'
  variantId: string;
  quantity: number;
  unitPriceNet: number;
  status?: 'paid'|'completed'|'canceled'|'refunded';
}

export interface ProductAgg {
  [variantId: string]: { 
    units: number; 
    revenue: number 
  };
}

export type AllocationMethod = 'units' | 'revenue_real';

export interface FixedCostAllocationResult {
  cfuByProduct: Record<string, number>;
  totals: {
    totalUnits: number;
    totalRevenue: number;
    unmappedSales: number;
    validSalesCount: number;
  };
  warnings: string[];
  effectivePeriod: {
    startISO: string;
    endISO: string;
  };
}

/**
 * Agrega vendas por produto (variantId) dentro de um período
 */
export function aggregateSalesByProduct(
  sales: SaleItem[],
  startISO: string,         // inclusive
  endISO: string            // inclusive
): ProductAgg {
  const today = new Date().toISOString().split('T')[0];
  const result: ProductAgg = {};

  sales.forEach(sale => {
    // Filtros de validação
    if (sale.status === 'canceled' || sale.status === 'refunded') {
      return; // Ignora vendas canceladas/reembolsadas
    }

    if (sale.date < startISO || sale.date > endISO) {
      return; // Fora do período
    }

    if (sale.date > today) {
      return; // Ignora datas futuras
    }

    if (sale.quantity <= 0 || sale.unitPriceNet <= 0) {
      return; // Dados inválidos
    }

    // Agrega por variantId
    if (!result[sale.variantId]) {
      result[sale.variantId] = { units: 0, revenue: 0 };
    }

    result[sale.variantId].units += sale.quantity;
    result[sale.variantId].revenue += sale.quantity * sale.unitPriceNet;
  });

  return result;
}

/**
 * Calcula CFU por produto a partir do agregado e método selecionado
 */
export function computeCFUFromSales(
  agg: ProductAgg,
  totalFixedCostsMonthly: number,
  method: AllocationMethod,
  monthsCount: number,
  availableVariants: string[] = []
): FixedCostAllocationResult {
  const warnings: string[] = [];
  const cfuByProduct: Record<string, number> = {};
  
  // Calcular custo fixo total do período
  const totalFixedCostsPeriod = totalFixedCostsMonthly * monthsCount;

  // Calcular totais
  const totalUnits = Object.values(agg).reduce((sum, product) => sum + product.units, 0);
  const totalRevenue = Object.values(agg).reduce((sum, product) => sum + product.revenue, 0);
  const validSalesCount = Object.keys(agg).length;

  // Contar vendas não mapeadas
  const unmappedSales = Object.keys(agg).filter(variantId => 
    availableVariants.length > 0 && !availableVariants.includes(variantId)
  ).length;

  // Guardas principais
  if (totalUnits === 0) {
    warnings.push("Não há vendas no período — impossível calcular CFU.");
    // CFU = 0 para todos os produtos disponíveis
    availableVariants.forEach(variantId => {
      cfuByProduct[variantId] = 0;
    });
    
    return {
      cfuByProduct,
      totals: { totalUnits: 0, totalRevenue: 0, unmappedSales, validSalesCount },
      warnings,
      effectivePeriod: { startISO: '', endISO: '' }
    };
  }

  if (method === 'revenue_real' && totalRevenue === 0) {
    warnings.push("Método 'Por Valor Vendido' não pode ser aplicado: faturamento total é zero.");
    // CFU = 0 para todos
    availableVariants.forEach(variantId => {
      cfuByProduct[variantId] = 0;
    });
    
    return {
      cfuByProduct,
      totals: { totalUnits, totalRevenue: 0, unmappedSales, validSalesCount },
      warnings,
      effectivePeriod: { startISO: '', endISO: '' }
    };
  }

  // Calcular CFU por produto
  Object.keys(agg).forEach(variantId => {
    const productData = agg[variantId];
    
    if (productData.units === 0) {
      cfuByProduct[variantId] = 0;
      warnings.push(`Produto ${variantId}: sem vendas no período — CFU = 0.`);
      return;
    }

    if (method === 'units') {
      // Método por unidades (vendas reais)
      const shareUnits = productData.units / totalUnits;
      cfuByProduct[variantId] = (totalFixedCostsPeriod * shareUnits) / productData.units;
    } else if (method === 'revenue_real') {
      // Método por valor vendido (vendas reais)
      const shareRevenue = productData.revenue / totalRevenue;
      cfuByProduct[variantId] = (totalFixedCostsPeriod * shareRevenue) / productData.units;
    }
  });

  // Para produtos sem vendas no período, mas que existem no sistema
  availableVariants.forEach(variantId => {
    if (!cfuByProduct.hasOwnProperty(variantId)) {
      cfuByProduct[variantId] = 0;
    }
  });

  // Aviso sobre vendas não mapeadas
  if (unmappedSales > 0) {
    warnings.push(`${unmappedSales} produtos vendidos não estão mapeados no sistema.`);
  }

  return {
    cfuByProduct,
    totals: { totalUnits, totalRevenue, unmappedSales, validSalesCount },
    warnings,
    effectivePeriod: { startISO: '', endISO: '' }
  };
}

/**
 * Calcula período válido para rateio (máximo 12 meses)
 */
export function getValidAllocationPeriod(
  startDate: string,
  endDate: string
): { startISO: string; endISO: string; monthsCount: number; warnings: string[] } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const warnings: string[] = [];
  
  // Calcular diferença em meses
  const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + 
                     (end.getMonth() - start.getMonth()) + 1;
  
  let adjustedStart = start;
  let adjustedEnd = end;
  
  // Regra: máximo 12 meses
  if (monthsDiff > 12) {
    adjustedStart = new Date(end.getFullYear(), end.getMonth() - 11, 1);
    warnings.push("O rateio considera no máximo os últimos 12 meses. O período foi ajustado automaticamente.");
  }
  
  return {
    startISO: adjustedStart.toISOString().split('T')[0],
    endISO: adjustedEnd.toISOString().split('T')[0],
    monthsCount: Math.min(monthsDiff, 12),
    warnings
  };
}