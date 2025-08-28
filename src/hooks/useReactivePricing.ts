import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { calculatePricing, type PricingInput, type PricingResult, debugCalculation } from '@/utils/pricingCalculations';

interface UseReactivePricingProps {
  initialInput?: Partial<PricingInput>;
  debounceMs?: number;
  onCalculationChange?: (result: PricingResult | null) => void;
}

interface UseReactivePricingReturn {
  // Estado atual
  input: PricingInput;
  result: PricingResult | null;
  isCalculating: boolean;
  error: string | null;
  
  // Ações
  updateInput: (updates: Partial<PricingInput>) => void;
  updateCosts: (costs: Partial<PricingInput['costs']>) => void;
  updateTaxRates: (taxRates: Partial<PricingInput['taxRates']>) => void;
  setTargetMargin: (margin: number) => void;
  setPromotionDiscount: (discount: number) => void;
  resetCalculation: () => void;
  
  // Helpers
  isValid: boolean;
  hasChanges: boolean;
}

const DEFAULT_INPUT: PricingInput = {
  costs: {
    cvu: 0,
    cfu: 0,
    variableCosts: 0,
    fixedTaxes: 0,
  },
  taxRates: {
    taxes: 0,
    commission: 0,
    cardFees: 0,
    discounts: 0,
  },
  targetMargin: 15,
  promotionDiscount: 0,
};

/**
 * Hook reativo para cálculos de precificação com debouncing controlado e cleanup
 */
export function useReactivePricing({
  initialInput = {},
  debounceMs = 300,
  onCalculationChange,
}: UseReactivePricingProps = {}): UseReactivePricingReturn {
  
  // Ref para controle de cleanup
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // Estado do input com valores iniciais
  const [input, setInput] = useState<PricingInput>(() => ({
    ...DEFAULT_INPUT,
    ...initialInput,
    costs: { ...DEFAULT_INPUT.costs, ...initialInput.costs },
    taxRates: { ...DEFAULT_INPUT.taxRates, ...initialInput.taxRates },
  }));
  
  const [result, setResult] = useState<PricingResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Memoizar se o input é válido
  const isValid = useMemo(() => {
    const { costs, taxRates, targetMargin } = input;
    return (
      costs.cvu >= 0 &&
      costs.cfu >= 0 &&
      costs.variableCosts >= 0 &&
      costs.fixedTaxes >= 0 &&
      taxRates.taxes >= 0 &&
      taxRates.commission >= 0 &&
      taxRates.cardFees >= 0 &&
      taxRates.discounts >= 0 &&
      targetMargin >= 0 &&
      targetMargin <= 100 &&
      (costs.cvu + costs.cfu + costs.variableCosts) > 0
    );
  }, [input]);
  
  // Função de cálculo com debounce e cleanup controlado
  const debouncedCalculate = useDebouncedCallback(
    useCallback(async (currentInput: PricingInput) => {
      if (!isValid) {
        setResult(null);
        setError('Input inválido ou incompleto');
        setIsCalculating(false);
        return;
      }
      
      setIsCalculating(true);
      setError(null);
      
      try {
        // Simular pequeno delay para UX sem bloquear thread
        await new Promise(resolve => setTimeout(resolve, 25));
        
        const calculatedResult = calculatePricing(currentInput);
        
        // Debug em desenvolvimento
        debugCalculation(currentInput, calculatedResult);
        
        setResult(calculatedResult);
        onCalculationChange?.(calculatedResult);
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro no cálculo';
        setError(errorMsg);
        setResult(null);
        onCalculationChange?.(null);
        
        console.warn('Erro no cálculo de precificação:', err);
      } finally {
        setIsCalculating(false);
        setHasChanges(false);
      }
    }, [isValid, onCalculationChange]),
    debounceMs
  );
  
  // Cleanup para prevenir vazamentos de memória
  useEffect(() => {
    cleanupRef.current = () => {
      debouncedCalculate.cancel();
    };
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [debouncedCalculate]);
  
  // Trigger automático quando input muda
  useEffect(() => {
    if (isValid) {
      debouncedCalculate(input);
    } else {
      setResult(null);
      setError('Input inválido ou incompleto');
      setIsCalculating(false);
    }
  }, [input, isValid, debouncedCalculate]);
  
  // Ações para atualizar input
  const updateInput = useCallback((updates: Partial<PricingInput>) => {
    setInput(prev => ({
      ...prev,
      ...updates,
      costs: { ...prev.costs, ...updates.costs },
      taxRates: { ...prev.taxRates, ...updates.taxRates },
    }));
    setHasChanges(true);
  }, []);
  
  const updateCosts = useCallback((costs: Partial<PricingInput['costs']>) => {
    setInput(prev => ({
      ...prev,
      costs: { ...prev.costs, ...costs },
    }));
    setHasChanges(true);
  }, []);
  
  const updateTaxRates = useCallback((taxRates: Partial<PricingInput['taxRates']>) => {
    setInput(prev => ({
      ...prev,
      taxRates: { ...prev.taxRates, ...taxRates },
    }));
    setHasChanges(true);
  }, []);
  
  const setTargetMargin = useCallback((margin: number) => {
    setInput(prev => ({ ...prev, targetMargin: Math.max(0, Math.min(100, margin)) }));
    setHasChanges(true);
  }, []);
  
  const setPromotionDiscount = useCallback((discount: number) => {
    setInput(prev => ({ ...prev, promotionDiscount: Math.max(0, Math.min(100, discount || 0)) }));
    setHasChanges(true);
  }, []);
  
  const resetCalculation = useCallback(() => {
    // Cancelar cálculos pendentes antes do reset
    debouncedCalculate.cancel();
    
    setInput(DEFAULT_INPUT);
    setResult(null);
    setError(null);
    setHasChanges(false);
    setIsCalculating(false);
  }, [debouncedCalculate]);
  
  return {
    input,
    result,
    isCalculating,
    error,
    updateInput,
    updateCosts,
    updateTaxRates,
    setTargetMargin,
    setPromotionDiscount,
    resetCalculation,
    isValid,
    hasChanges,
  };
}