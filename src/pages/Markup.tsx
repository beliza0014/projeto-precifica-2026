import React, { useState, useEffect, useCallback } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatPercentage, sanitizeNumericInput } from '@/utils/format';

// Helper function to calculate total fixed costs percentage
const calculateFixedCostsPercentage = (fixedCosts: any[], mediaFaturamento: number): number => {
  if (mediaFaturamento === 0) return 0;
  const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.monthly, 0);
  return (totalFixedCosts / mediaFaturamento) * 100;
};

// Helper function to calculate total variable costs percentage
const calculateVariableCostsPercentage = (customTaxes: any[]): number => {
  return customTaxes
    .filter(tax => tax.active && tax.type === 'percentage')
    .reduce((sum, tax) => sum + tax.value, 0);
};

/**
 * CORREÇÃO CRÍTICA: Cálculo de lucro aproximado baseado em markup aplicado ao custo
 * Fórmula correta: Lucro = (Markup - 1) × Custo Total Estimado
 * Onde Custo Total = Custos Fixos + Custos Variáveis estimados
 */
const calculateCorrectProfit = (
  markup: number, 
  fixedCosts: number, 
  variableCostsPercentage: number, 
  averageRevenue: number
): number => {
  if (markup <= 1 || averageRevenue <= 0) return 0;
  
  // Estimar custo total baseado na receita média
  const estimatedVariableCosts = averageRevenue * (variableCostsPercentage / 100);
  const totalEstimatedCosts = fixedCosts + estimatedVariableCosts;
  
  // Lucro = (Markup - 1) × Custo Total
  return (markup - 1) * totalEstimatedCosts;
};

export default function Markup() {
  const { 
    markupConfig, 
    setMarkupConfig, 
    saveMarkupConfig,
    mediaFaturamento,
    fixedCostsConfig,
    customTaxesFeesConfig
  } = useFinancial();
  const { toast } = useToast();
  const [lucroEstipuladoPct, setLucroEstipuladoPct] = useState<number>(markupConfig.defaultM * 100);
  const [inputValue, setInputValue] = useState<string>((markupConfig.defaultM * 100).toFixed(2).replace('.', ','));
  const [markup, setMarkup] = useState<number>(0);
  const [lucroAproximado, setLucroAproximado] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Sync local state with context when markupConfig changes
  useEffect(() => {
    const newValue = markupConfig.defaultM * 100;
    setLucroEstipuladoPct(newValue);
    setInputValue(newValue.toFixed(2).replace('.', ','));
  }, [markupConfig.defaultM]);

  const calculateMarkup = useCallback(() => {
    const custosFixosPct = calculateFixedCostsPercentage(fixedCostsConfig.costs, mediaFaturamento);
    const custosVariaveisPct = calculateVariableCostsPercentage(customTaxesFeesConfig.taxes);
    const S = custosVariaveisPct + custosFixosPct + lucroEstipuladoPct;
    
    if (S >= 100) {
      setMarkup(0);
      setLucroAproximado(0);
      setHasError(true);
      setErrorMessage('Soma dos percentuais ≥ 100%. Ajuste os valores para calcular o markup.');
      return;
    }
    
    setHasError(false);
    setErrorMessage('');
    
    // Cálculo do markup: 1 / (1 - S/100)
    const calculatedMarkup = 1 / (1 - S/100);
    setMarkup(calculatedMarkup);
    
    // CORREÇÃO: Cálculo correto do lucro aproximado baseado em markup
    const totalFixedCosts = fixedCostsConfig.costs.reduce((sum, cost) => sum + cost.monthly, 0);
    const lucroAprox = calculateCorrectProfit(
      calculatedMarkup, 
      totalFixedCosts, 
      custosVariaveisPct, 
      mediaFaturamento
    );
    setLucroAproximado(lucroAprox);
  }, [lucroEstipuladoPct, mediaFaturamento, fixedCostsConfig.costs, customTaxesFeesConfig.taxes]);

  useEffect(() => {
    calculateMarkup();
  }, [calculateMarkup]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove tudo que não for número ou vírgula
    value = value.replace(/[^\d,]/g, '');
    
    // Permite apenas uma vírgula
    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Limita a 2 casas decimais após a vírgula
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + ',' + parts[1].substring(0, 2);
    }
    
    setInputValue(value);
    
    // Usar função de sanitização padronizada
    const numericValue = sanitizeNumericInput(value);
    
    // Validação: entre 0 e 99.99%
    if (numericValue >= 0 && numericValue < 100) {
      setLucroEstipuladoPct(numericValue);
      // Update context immediately
      setMarkupConfig({ ...markupConfig, defaultM: numericValue / 100 });
    }
  };

  const handleInputBlur = () => {
    // Formata o valor quando perde o foco
    const formatted = lucroEstipuladoPct.toFixed(2).replace('.', ',');
    setInputValue(formatted);
    
    // Save to localStorage
    saveMarkupConfig({ ...markupConfig, defaultM: lucroEstipuladoPct / 100 });
    toast({
      title: "Markup salvo!",
      description: "Configuração salva com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Markup Ideal</h1>
      </div>
      
      <p className="text-muted-foreground">
        Calcule o markup ideal baseado nos custos fixos, variáveis e lucro desejado.
      </p>

      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cálculo de Markup</CardTitle>
          <CardDescription>
            Fórmula: Markup = 1 / (1 - % Total) | Lucro = (Markup - 1) × Custo Total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Markup */}
            <div className="grid gap-2">
              <Label>Markup (multiplicador)</Label>
              <div className={`p-3 border rounded-md font-mono text-lg ${
                hasError ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-muted'
              }`}>
                {markup > 0 ? `${markup.toFixed(2).replace('.', ',')}x` : '0,00x'}
              </div>
            </div>

            {/* Lucro Estipulado */}
            <div className="grid gap-2">
              <Label htmlFor="lucro-estipulado">Lucro Estipulado (%)</Label>
              <Input
                id="lucro-estipulado"
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="Digite o valor"
                className="font-mono"
              />
            </div>

            {/* Custos Fixos - Somente leitura */}
            <div className="grid gap-2">
              <Label>Custos Fixos (%)</Label>
              <div className="p-3 border rounded-md bg-muted font-mono">
                {formatPercentage(calculateFixedCostsPercentage(fixedCostsConfig.costs, mediaFaturamento))}
              </div>
              <p className="text-sm text-muted-foreground">
                {mediaFaturamento > 0 ? 'Valor calculado baseado nos custos fixos e faturamento médio' : 'Configure o faturamento médio para ver o percentual'}
              </p>
            </div>

            {/* Custos Variáveis - Somente leitura */}
            <div className="grid gap-2">
              <Label>Custos Variáveis (%)</Label>
              <div className="p-3 border rounded-md bg-muted font-mono">
                {formatPercentage(calculateVariableCostsPercentage(customTaxesFeesConfig.taxes))}
              </div>
              <p className="text-sm text-muted-foreground">
                Valor calculado baseado nas taxas e impostos percentuais configurados
              </p>
            </div>

            {/* Lucro Aproximado - CORRIGIDO */}
            <div className="grid gap-2">
              <Label>Lucro Aproximado (R$)</Label>
              <div className="p-3 border rounded-md bg-muted font-mono text-lg font-semibold text-green-600">
                {formatCurrency(lucroAproximado)}
              </div>
              <p className="text-sm text-muted-foreground">
                Calculado corretamente: (Markup - 1) × Custo Total Estimado
              </p>
              {markup > 1 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  <span>Base: Custos fixos + variáveis estimados sobre faturamento médio</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Percentuais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatPercentage(lucroEstipuladoPct)}
              </div>
              <div className="text-sm text-muted-foreground">Lucro</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {formatPercentage(calculateFixedCostsPercentage(fixedCostsConfig.costs, mediaFaturamento))}
              </div>
              <div className="text-sm text-muted-foreground">Fixos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {formatPercentage(calculateVariableCostsPercentage(customTaxesFeesConfig.taxes))}
              </div>
              <div className="text-sm text-muted-foreground">Variáveis</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                hasError ? 'text-destructive' : 'text-green-600'
              }`}>
                {formatPercentage(lucroEstipuladoPct + calculateFixedCostsPercentage(fixedCostsConfig.costs, mediaFaturamento) + calculateVariableCostsPercentage(customTaxesFeesConfig.taxes))}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}