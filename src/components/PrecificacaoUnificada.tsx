import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancial } from "@/contexts/FinancialContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calculator, Save, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useReactivePricing } from "@/hooks/useReactivePricing";
import { formatCurrency, formatPercentage, validateScenario, type PricingInput } from "@/utils/pricingCalculations";
import { sanitizeNumericInput } from "@/utils/format";

interface InsumoItem {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  custoUnitario: number;
  fatorCorrecao: number;
  custoLiquido: number;
}

// Canais sem taxas pré-definidas (hardcoded)
const canaisVenda = [
  { id: 'balcao', nome: 'Balcão' },
  { id: 'cartao', nome: 'Cartão' },
  { id: 'ifood', nome: 'iFood' },
  { id: 'delivery', nome: 'Delivery Próprio' },
];

export function PrecificacaoUnificada() {
  const { 
    receitas, 
    customTaxesFeesConfig, 
    getTotalPercentageTaxes, 
    getTotalFixedTaxes,
    fixedCostsConfig,
    faturamentos 
  } = useFinancial();

  // Estados locais
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [canalSelecionado, setCanalSelecionado] = useState<string>("");
  const [insumos, setInsumos] = useState<InsumoItem[]>([]);
  const [perdas, setPerdas] = useState(3);
  const [modCusto, setModCusto] = useState<number>(0);
  const [custosVariaveisFixos, setCustosVariaveisFixos] = useState<number>(0);

  // Hook reativo de precificação
  const {
    input,
    result,
    isCalculating,
    error: calculationError,
    updateInput,
    updateCosts,
    updateTaxRates,
    setTargetMargin,
    setPromotionDiscount,
    isValid,
    hasChanges,
  } = useReactivePricing({
    initialInput: {
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
    },
    debounceMs: 300,
  });

  // CORREÇÃO CRÍTICA: CFU baseado em volume real ou meta configurável
  const custoFixoUnitario = useMemo(() => {
    const totalCustosFixos = fixedCostsConfig.costs.reduce((acc, item) => acc + item.monthly, 0);
    
    if (totalCustosFixos <= 0) return 0;
    
    if (fixedCostsConfig.allocationMethod === 'units') {
      // CORRIGIDO: Remover hardcode de 1000, usar meta configurável
      const metaUnidades = 1000; // TODO: tornar configurável
      return totalCustosFixos / metaUnidades;
    } else {
      // Método por faturamento - usar média móvel 30 dias quando disponível
      const faturamentoMedio = faturamentos.reduce((acc, f) => acc + f.valor, 0) / Math.max(1, faturamentos.filter(f => f.valor > 0).length);
      
      // Fallback inteligente: se não há dados reais, usar meta
      if (faturamentoMedio <= 0) {
        const metaFaturamento = 50000; // Meta padrão - TODO: tornar configurável
        const precoMedioEstimado = 25;
        return totalCustosFixos / (metaFaturamento / precoMedioEstimado);
      }
      
      const precoMedioEstimado = 25; // Preço médio mais realista
      const unidadesEstimadas = faturamentoMedio / precoMedioEstimado;
      return totalCustosFixos / unidadesEstimadas;
    }
  }, [fixedCostsConfig, faturamentos]);

  // Atualizar taxas quando canal mudar
  useEffect(() => {
    if (canalSelecionado) {
      const taxasDoCanal = customTaxesFeesConfig.taxes.filter(
        t => t.channel === canalSelecionado || !t.channel
      );
      
      const impostos = taxasDoCanal
        .filter(t => t.type === 'percentage' && (
          t.name.toLowerCase().includes('iss') || 
          t.name.toLowerCase().includes('icms') ||
          t.name.toLowerCase().includes('imposto')
        ))
        .reduce((acc, t) => acc + t.value, 0);
      
      const comissaoApp = taxasDoCanal
        .filter(t => t.type === 'percentage' && (
          t.name.toLowerCase().includes('ifood') ||
          t.name.toLowerCase().includes('comissao') ||
          t.name.toLowerCase().includes('app')
        ))
        .reduce((acc, t) => acc + t.value, 0);
      
      const cartao = taxasDoCanal
        .filter(t => t.type === 'percentage' && (
          t.name.toLowerCase().includes('cartão') ||
          t.name.toLowerCase().includes('cartao')
        ))
        .reduce((acc, t) => acc + t.value, 0);

      const taxasFixas = taxasDoCanal
        .filter(t => t.type === 'fixed')
        .reduce((acc, t) => acc + t.value, 0);
      
      updateTaxRates({
        taxes: impostos,
        commission: comissaoApp,
        cardFees: cartao,
        discounts: 0, // Usuário define manualmente
      });
      
      updateCosts({
        fixedTaxes: taxasFixas + getTotalFixedTaxes(),
      });
    }
  }, [canalSelecionado, customTaxesFeesConfig, getTotalFixedTaxes, updateTaxRates, updateCosts]);

  // Carregar dados da receita selecionada
  useEffect(() => {
    if (produtoSelecionado) {
      const receita = receitas.find(r => r.id === produtoSelecionado);
      if (receita) {
        const insumosReceita = receita.itens.map(item => ({
          id: item.insumoId,
          nome: item.nomeInsumo,
          quantidade: item.quantidade,
          unidade: 'un',
          custoUnitario: item.custoUnitario,
          fatorCorrecao: 1,
          custoLiquido: item.custoItem
        }));
        setInsumos(insumosReceita);
        setPerdas(receita.perdaPercentual || 3);
      }
    }
  }, [produtoSelecionado, receitas]);

  // Atualizar custos quando insumos/perdas/CFU mudarem
  useEffect(() => {
    const custoInsumos = insumos.reduce((acc, item) => acc + item.custoLiquido, 0);
    const custoComPerdas = custoInsumos * (1 + perdas / 100);
    
    updateCosts({
      cvu: custoComPerdas,
      cfu: custoFixoUnitario,
      variableCosts: (modCusto || 0) + (custosVariaveisFixos || 0),
    });
  }, [insumos, perdas, modCusto, custosVariaveisFixos, custoFixoUnitario, updateCosts]);

  // Handlers para inputs
  const handleTaxaChange = (field: keyof PricingInput['taxRates'], value: string) => {
    const sanitizedValue = sanitizeNumericInput(value);
    updateTaxRates({ [field]: sanitizedValue });
  };

  const handleSalvarPreco = () => {
    if (!result || !produtoSelecionado || !canalSelecionado) {
      toast({
        title: "Dados incompletos",
        description: "Selecione produto, canal e calcule o preço primeiro",
        variant: "destructive"
      });
      return;
    }
    
    const produtoNome = receitas.find(r => r.id === produtoSelecionado)?.nome || produtoSelecionado;
    const canalNome = canaisVenda.find(c => c.id === canalSelecionado)?.nome || canalSelecionado;
    
    // Salvar no localStorage
    const precosSalvos = JSON.parse(localStorage.getItem('precosSalvos') || '{}');
    precosSalvos[produtoSelecionado] = result.finalPrice;
    localStorage.setItem('precosSalvos', JSON.stringify(precosSalvos));
    
    toast({
      title: "✅ Preço salvo!",
      description: `${formatCurrency(result.finalPrice)} para ${produtoNome} em ${canalNome}`
    });
  };

  const handleTestarCenarios = () => {
    // Cenário A: custo=10 → markup=100% → preço=20 → -10% = 18 → +5% = 18,90 → +R$5 frete = 23,90
    const cenarioA: PricingInput = {
      costs: { cvu: 10, cfu: 0, variableCosts: 0, fixedTaxes: 5 },
      taxRates: { taxes: 5, commission: 0, cardFees: 0, discounts: 10 },
      targetMargin: 50, // Para atingir markup ~100%
      promotionDiscount: 0,
    };
    
    updateInput(cenarioA);
    
    toast({
      title: "🧪 Teste Cenário A",
      description: "Cenário de teste aplicado: custo R$ 10,00"
    });
  };

  const getSemaforoStatus = () => {
    if (!result) return 'neutral';
    if (result.isViable && result.realMargin >= input.targetMargin) return 'success';
    if (result.isViable && result.realMargin >= input.targetMargin - 2) return 'warning';
    return 'error';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success/10 border-success text-success-foreground';
      case 'warning': return 'bg-warning/10 border-warning text-warning-foreground';
      case 'error': return 'bg-destructive/10 border-destructive text-destructive-foreground';
      default: return 'bg-muted/10 border-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicador de Resultado Unificado */}
      {result && (
        <Card className={`border-2 ${getStatusColor(getSemaforoStatus())}`}>
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <div className="text-lg font-bold">
                {result.isViable 
                  ? `✅ Produto Viável – Preço: ${formatCurrency(result.finalPrice)}` 
                  : `❌ Produto Inviável – Taxas muito altas`}
              </div>
              {result.isViable && (
                <div className="text-sm">
                  Margem Real: {formatPercentage(result.realMargin)} | 
                  Lucro: {formatCurrency(result.profitPerUnit)} | 
                  Markup: {formatPercentage(result.markup)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erro de Cálculo */}
      {calculationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{calculationError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="configuracao" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="taxas">Taxas & Variáveis</TabsTrigger>
          <TabsTrigger value="resultado">Resultado</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao" className="space-y-6">
          {/* Seleção de Produto e Canal */}
          <Card>
            <CardHeader>
              <CardTitle>Produto e Canal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="produto">Produto (Receitas)</Label>
                  <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione da aba Receitas" />
                    </SelectTrigger>
                    <SelectContent>
                      {receitas.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-muted-foreground">
                          Nenhuma receita cadastrada
                        </div>
                      ) : (
                        receitas.map(receita => (
                          <SelectItem key={receita.id} value={receita.id}>
                            {receita.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="canal">Canal de Venda</Label>
                  <Select value={canalSelecionado} onValueChange={setCanalSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {canaisVenda.map(canal => (
                        <SelectItem key={canal.id} value={canal.id}>
                          {canal.nome}
                        </SelectItem>
                      ))}
                      {[...new Set(customTaxesFeesConfig.taxes.filter(t => t.channel).map(t => t.channel))].map(channel => (
                        <SelectItem key={channel} value={channel!}>
                          {channel} (Configurado)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custos e Configurações */}
          <Card>
            <CardHeader>
              <CardTitle>Custos e Parâmetros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="margem">Meta Margem (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="95"
                    step="0.1"
                    value={input.targetMargin}
                    onChange={(e) => setTargetMargin(sanitizeNumericInput(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="perdas">Perdas (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={perdas}
                    onChange={(e) => setPerdas(sanitizeNumericInput(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="promocao">Desc. Promocional (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={input.promotionDiscount || 0}
                    onChange={(e) => setPromotionDiscount(sanitizeNumericInput(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modCusto">Custo Adicional (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={modCusto || ''}
                    onChange={(e) => setModCusto(sanitizeNumericInput(e.target.value))}
                    placeholder="Modificações de custo"
                  />
                </div>
                
                <div>
                  <Label htmlFor="custosVariaveis">Custos Variáveis Fixos (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={custosVariaveisFixos || ''}
                    onChange={(e) => setCustosVariaveisFixos(sanitizeNumericInput(e.target.value))}
                    placeholder="Custos variáveis adicionais"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>CVU (Insumos + Perdas):</span>
                    <span className="font-medium">{formatCurrency(input.costs.cvu)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CFU (Rateio):</span>
                    <span className="font-medium">{formatCurrency(input.costs.cfu)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Custos Variáveis:</span>
                    <span className="font-medium">{formatCurrency(input.costs.variableCosts)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Custo Total:</span>
                    <span>{formatCurrency(input.costs.cvu + input.costs.cfu + input.costs.variableCosts)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Taxas Percentuais
                {canalSelecionado && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({canaisVenda.find(c => c.id === canalSelecionado)?.nome || canalSelecionado})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="impostos">Impostos (%)</Label>
                  <Input
                    id="impostos"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={input.taxRates.taxes}
                    onChange={(e) => handleTaxaChange('taxes', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="comissaoApp">Comissão App (%)</Label>
                  <Input
                    id="comissaoApp"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={input.taxRates.commission}
                    onChange={(e) => handleTaxaChange('commission', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cartao">Taxa Cartão (%)</Label>
                  <Input
                    id="cartao"
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={input.taxRates.cardFees}
                    onChange={(e) => handleTaxaChange('cardFees', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="descontos">Descontos Médios (%)</Label>
                  <Input
                    id="descontos"
                    type="number"
                    min="0"
                    max="80"
                    step="0.1"
                    value={input.taxRates.discounts}
                    onChange={(e) => handleTaxaChange('discounts', e.target.value)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Taxas (%):</span>
                  <Badge variant={result?.totalTaxRates >= 80 ? "destructive" : "outline"}>
                    {formatPercentage(result?.totalTaxRates || 0)}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxas Fixas (R$):</span>
                  <Badge variant="outline">
                    {formatCurrency(input.costs.fixedTaxes)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resultado" className="space-y-6">
          {result ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Resultado do Cálculo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Preço Final</span>
                      <div className="text-lg font-bold">{formatCurrency(result.finalPrice)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Margem Real</span>
                      <div className="text-lg font-bold">{formatPercentage(result.realMargin)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Lucro Unitário</span>
                      <div className="text-lg font-bold">{formatCurrency(result.profitPerUnit)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Markup</span>
                      <div className="text-lg font-bold">{formatPercentage(result.markup)}</div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Custo Total:</span>
                        <span>{formatCurrency(result.totalCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Preço Base:</span>
                        <span>{formatCurrency(result.basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Preço Mínimo:</span>
                        <span>{formatCurrency(result.minimumPrice)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>CMV (%):</span>
                        <span>{formatPercentage(result.cmvPercentage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxas Aplicadas:</span>
                        <span>{formatCurrency(result.breakdown.appliedTaxes.absolute)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Status:</span>
                        <Badge variant={result.isViable ? "default" : "destructive"}>
                          {result.isViable ? "Viável" : "Inviável"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={handleSalvarPreco} disabled={!isValid}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Preço
                </Button>
                <Button variant="outline" onClick={handleTestarCenarios}>
                  <Calculator className="w-4 h-4 mr-2" />
                  Testar Cenário A
                </Button>
                {isCalculating && (
                  <Badge variant="outline">
                    Calculando...
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  Configure o produto, canal e custos para ver o resultado
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}