/**
 * Cenários de teste padronizados para validação dos cálculos
 * Fonte única para QA e testes automatizados
 */

import { calculatePricing, type PricingInput, type PricingResult } from './pricingCalculations';

/**
 * Cenário A: custo=10 → markup=100% → preço=20 → -10% = 18 → +5% = 18,90 → +R$5 frete = 23,90
 */
export const SCENARIO_A: PricingInput = {
  costs: {
    cvu: 8,       // CVU base
    cfu: 2,       // CFU 
    variableCosts: 0,
    fixedTaxes: 5 // R$ 5 de frete
  },
  taxRates: {
    taxes: 5,       // 5% impostos
    commission: 0,
    cardFees: 0,
    discounts: 10   // 10% desconto
  },
  targetMargin: 50, // 50% para atingir markup ~100%
  promotionDiscount: 0
};

/**
 * Cenário B: custo=37,90, margem 40% → ≈63,17 (sem taxas); com 17% total → ≈88,14
 */
export const SCENARIO_B: PricingInput = {
  costs: {
    cvu: 30,      // CVU principal
    cfu: 5,       // CFU
    variableCosts: 2.90, // Variáveis
    fixedTaxes: 0
  },
  taxRates: {
    taxes: 5,     // 5% impostos
    commission: 12, // 12% comissão (ex: iFood)
    cardFees: 0,
    discounts: 0
  },
  targetMargin: 40, // 40% margem desejada
  promotionDiscount: 0
};

/**
 * Tolerância para validação (± R$ 0,01)
 */
export const VALIDATION_TOLERANCE = 0.01;

/**
 * Executar cenário de teste e validar resultado
 */
export function runTestScenario(
  scenario: 'A' | 'B', 
  input?: Partial<PricingInput>
): { 
  result: PricingResult; 
  expected: number; 
  isValid: boolean; 
  deviation: number 
} {
  const baseInput = scenario === 'A' ? SCENARIO_A : SCENARIO_B;
  const finalInput = input ? { ...baseInput, ...input } : baseInput;
  
  const result = calculatePricing(finalInput);
  
  // Valores esperados conforme especificação
  const expected = scenario === 'A' ? 23.90 : 88.14;
  const deviation = Math.abs(result.finalPrice - expected);
  const isValid = deviation <= VALIDATION_TOLERANCE;
  
  return {
    result,
    expected,
    isValid,
    deviation
  };
}

/**
 * Executar todos os cenários de teste
 */
export function runAllTestScenarios(): {
  scenarioA: ReturnType<typeof runTestScenario>;
  scenarioB: ReturnType<typeof runTestScenario>;
  allValid: boolean;
} {
  const scenarioA = runTestScenario('A');
  const scenarioB = runTestScenario('B');
  
  return {
    scenarioA,
    scenarioB,
    allValid: scenarioA.isValid && scenarioB.isValid
  };
}

/**
 * Log de resultados dos testes para debug
 */
export function logTestResults(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const results = runAllTestScenarios();
  
  console.group('🧪 Resultados dos Cenários de Teste');
  
  console.log('📊 Cenário A:', {
    esperado: 23.90,
    calculado: results.scenarioA.result.finalPrice,
    desvio: results.scenarioA.deviation,
    válido: results.scenarioA.isValid ? '✅' : '❌'
  });
  
  console.log('📊 Cenário B:', {
    esperado: 88.14,
    calculado: results.scenarioB.result.finalPrice,
    desvio: results.scenarioB.deviation,
    válido: results.scenarioB.isValid ? '✅' : '❌'
  });
  
  console.log('🎯 Status Geral:', results.allValid ? '✅ PASSOU' : '❌ FALHOU');
  
  console.groupEnd();
}