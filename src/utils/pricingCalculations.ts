/**
 * Sistema Unificado de Cálculos de Precificação
 * Fonte única da verdade para todos os cálculos financeiros
 * 
 * FÓRMULA BASE PADRONIZADA:
 * Preço = (CVU + CFU + Custos Variáveis + Taxas Fixas) / (1 - %Taxas - %Descontos - %Margem)
 * 
 * DEFINIÇÕES PADRONIZADAS:
 * - Margem = (Preço - Custo) / Preço
 * - Markup = Preço / Custo - 1 (como percentual)
 * 
 * ORDEM FIXA DE APLICAÇÃO:
 * 1. Preço-alvo calculado
 * 2. Aplicar descontos promocionais (%)
 * 3. Aplicar taxas percentuais (impostos, comissões, cartão)
 * 4. Somar taxas fixas (frete, delivery, etc.)
 * 
 * ARREDONDAMENTO CENTRAL:
 * - Preços: 2 casas decimais, múltiplos de R$ 0,10
 * - Percentuais: 1 casa decimal
 * 
 * VALIDAÇÕES MATEMÁTICAS:
 * - Denominador den = 1 - (%taxas + %descontos + %margem)
 * - Limite mínimo: den > 0,05 (5%)
 * - Aviso quando soma > 0,90 (90%)
 */

export interface CostComponents {
  cvu: number; // Custo Variável Unitário (insumos + perdas)
  cfu: number; // Custo Fixo Unitário
  variableCosts: number; // Custos variáveis adicionais
  fixedTaxes: number; // Taxas fixas (R$)
}

export interface TaxRates {
  taxes: number; // Impostos (%)
  commission: number; // Comissão app (%)
  cardFees: number; // Taxa cartão (%)
  discounts: number; // Descontos médios (%)
  delivery?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

export interface PricingInput {
  costs: CostComponents;
  taxRates: TaxRates;
  targetMargin: number; // Margem desejada (%)
  promotionDiscount?: number; // Desconto promocional (%)
}

export interface PricingResult {
  // Preços
  basePrice: number; // Preço base calculado
  finalPrice: number; // Preço final com descontos/taxas
  minimumPrice: number; // Preço mínimo (sem margem)
  
  // Margens e Markup
  realMargin: number; // Margem real (%)
  marginAbsolute: number; // Margem absoluta (R$)
  markup: number; // Markup multiplicador
  
  // Custos
  totalCost: number; // Custo total unitário
  totalTaxRates: number; // Soma total de taxas (%)
  
  // Análises
  isViable: boolean; // Se o produto é viável
  cmvPercentage: number; // CMV como % do preço
  profitPerUnit: number; // Lucro por unidade
  
  // Breakdown detalhado
  breakdown: {
    costs: CostComponents;
    taxes: TaxRates;
    appliedTaxes: {
      absolute: number; // Valor absoluto das taxas
      percentage: number; // % total das taxas
      warning?: string; // Aviso opcional para percentuais altos
    };
  };
}

/**
 * Arredondamento padronizado para preços (2 casas decimais, múltiplos de R$ 0,10)
 */
export function roundPrice(price: number): number {
  if (price <= 0 || !isFinite(price) || isNaN(price)) return 0;
  return Math.round(price * 10) / 10;
}

/**
 * Arredondamento para percentuais (1 casa decimal)
 */
export function roundPercentage(percentage: number): number {
  if (!isFinite(percentage) || isNaN(percentage)) return 0;
  return Math.round(percentage * 10) / 10;
}

// Import formatação centralizada
export { formatCurrency, formatPercentage, formatMarkup } from './format';

/**
 * Cálculo principal de precificação unificado
 */
export function calculatePricing(input: PricingInput): PricingResult {
  const { costs, taxRates, targetMargin, promotionDiscount = 0 } = input;
  
  // Validações de entrada
  if (costs.cvu < 0 || costs.cfu < 0 || costs.variableCosts < 0) {
    throw new Error('Custos não podem ser negativos');
  }
  
  if (targetMargin < 0 || targetMargin > 100) {
    throw new Error('Margem deve estar entre 0% e 100%');
  }
  
  // 1. Calcular custo total
  const totalCost = costs.cvu + costs.cfu + costs.variableCosts;
  
  if (totalCost <= 0) {
    throw new Error('Custo total deve ser maior que zero');
  }
  
  // 2. Calcular soma total de taxas percentuais
  const totalTaxRates = taxRates.taxes + taxRates.commission + taxRates.cardFees + taxRates.discounts;
  const totalPercentages = totalTaxRates + targetMargin;
  
  // 3. Verificar viabilidade matemática com limites padronizados
  const denominador = 1 - totalPercentages / 100;
  
  // Limite crítico: denominador deve ser > 5% para viabilidade
  if (denominador <= 0.05) {
    return {
      basePrice: 0,
      finalPrice: 0,
      minimumPrice: totalCost,
      realMargin: 0,
      marginAbsolute: -totalCost,
      markup: 0,
      totalCost,
      totalTaxRates,
      isViable: false,
      cmvPercentage: 100,
      profitPerUnit: -totalCost,
      breakdown: {
        costs,
        taxes: taxRates,
        appliedTaxes: { 
          absolute: 0, 
          percentage: totalPercentages,
          warning: totalPercentages > 90 ? 'AVISO: Percentuais muito altos (>90%). Revisar configuração.' : undefined
        }
      }
    };
  }
  
  // 4. Fórmula principal unificada: Preço = Custo / denominador
  const basePrice = totalCost / denominador;
  const roundedBasePrice = roundPrice(basePrice);
  
  // 5. Aplicar desconto promocional
  const priceAfterPromotion = roundedBasePrice * (1 - promotionDiscount / 100);
  
  // 6. Aplicar taxas fixas (ex: delivery)
  let finalPrice = priceAfterPromotion;
  let deliveryFixed = 0;
  
  if (taxRates.delivery) {
    if (taxRates.delivery.type === 'fixed') {
      deliveryFixed = taxRates.delivery.value;
      finalPrice += deliveryFixed;
    } else {
      finalPrice *= (1 + taxRates.delivery.value / 100);
    }
  }
  
  finalPrice = roundPrice(finalPrice);
  
  // 7. Calcular valores absolutos das taxas
  const taxesAbsolute = (totalTaxRates / 100) * roundedBasePrice;
  
  // 8. Calcular margem real
  const marginAbsolute = finalPrice - totalCost - taxesAbsolute - costs.fixedTaxes - deliveryFixed;
  const realMargin = finalPrice > 0 ? (marginAbsolute / finalPrice) * 100 : 0;
  
  // 9. Calcular outros indicadores
  const markup = totalCost > 0 ? finalPrice / totalCost : 0;
  const cmvPercentage = finalPrice > 0 ? (totalCost / finalPrice) * 100 : 0;
  const minimumPrice = totalCost / (1 - (totalTaxRates / 100));
  
  return {
    basePrice: roundPrice(roundedBasePrice),
    finalPrice: roundPrice(finalPrice),
    minimumPrice: roundPrice(minimumPrice),
    realMargin: roundPercentage(realMargin),
    marginAbsolute: roundPrice(marginAbsolute),
    markup: roundPercentage(markup * 100 - 100), // Markup como %
    totalCost: roundPrice(totalCost),
    totalTaxRates: roundPercentage(totalTaxRates),
    isViable: marginAbsolute > 0 && realMargin >= 0,
    cmvPercentage: roundPercentage(cmvPercentage),
    profitPerUnit: roundPrice(marginAbsolute),
      breakdown: {
        costs,
        taxes: taxRates,
        appliedTaxes: {
          absolute: roundPrice(taxesAbsolute),
          percentage: roundPercentage(totalPercentages),
          warning: totalPercentages > 90 ? 'AVISO: Percentuais muito altos (>90%). Revisar configuração.' : undefined
        }
      }
  };
}

/**
 * Cálculo de margem a partir de preço e custo
 */
export function calculateMargin(price: number, cost: number): number {
  if (price <= 0 || cost < 0) return 0;
  return ((price - cost) / price) * 100;
}

/**
 * Cálculo de markup a partir de preço e custo  
 */
export function calculateMarkup(price: number, cost: number): number {
  if (cost <= 0 || price < 0) return 0;
  return (price / cost - 1) * 100;
}

/**
 * Validação de cenários de teste
 */
export function validateScenario(scenario: 'A' | 'B', result: PricingResult): boolean {
  const tolerance = 0.01; // ± R$ 0,01
  
  if (scenario === 'A') {
    // Cenário A: custo=10 → markup=100% → preço=20 → -10% = 18 → +5% = 18,90 → +R$5 frete = 23,90
    const expected = 23.90;
    return Math.abs(result.finalPrice - expected) <= tolerance;
  } else {
    // Cenário B: custo=37,90, margem 40% → ≈63,17; com 17% taxas → ≈88,14
    const expected = 88.14;
    return Math.abs(result.finalPrice - expected) <= tolerance;
  }
}

/**
 * Log de debug para desenvolvimento
 */
export function debugCalculation(input: PricingInput, result: PricingResult): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group('🔍 Debug Cálculo de Precificação');
  console.log('📥 Input:', input);
  console.log('📤 Output:', result);
  console.log('💡 Fórmula aplicada: Preço = Custo / (1 - %Taxas - %Margem)');
  console.log(`🧮 Cálculo: ${result.totalCost} / (1 - ${result.breakdown.appliedTaxes.percentage}%) = ${result.basePrice}`);
  console.log(`✅ Viável: ${result.isViable ? 'Sim' : 'Não'}`);
  console.groupEnd();
}