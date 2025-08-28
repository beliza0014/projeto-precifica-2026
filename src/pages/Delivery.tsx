import { useState, useEffect } from "react";
import { Truck, BarChart3, Calculator, Percent, TrendingUp, TrendingDown, DollarSign, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialCard } from "@/components/FinancialCard";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calcDelivery, DeliveryInputs, DeliveryCfg } from "@/utils/delivery/calc";
import { BaseCalculationToggle } from "@/components/DeliveryTransparencia/BaseCalculationToggle";
import { CalcTransparenciaSection } from "@/components/DeliveryTransparencia/CalcTransparenciaSection";
import { tooltipTexts } from "@/components/DeliveryTransparencia/TooltipTexts";
import { 
  getVariantForCustoFrete, 
  getVariantForCupons, 
  getVariantForImpactoLiquido,
  formatROI
} from "@/utils/delivery/deliveryHelpers";

interface DadosDelivery {
  faturamento: number;
  numeroPedidos: number;
  diasTrabalhados: number;
  ticketMedio: number;
  mixCurto: number; // Percentual de entregas curtas
  freteCurto: number;
  freteLongo: number;
  cupomTotal: number;
  // Configurações de custo
  custoPorPedidoProprio: number;
  custoPorPedidoTerceiro: number;
  usarLogisticaPropria: boolean;
  taxaFixaIfood: number;
  taxaVariavelIfood: number;
}

export default function Delivery() {
  const [dados, setDados] = useState<DadosDelivery>({
    faturamento: 0,
    numeroPedidos: 0,
    diasTrabalhados: 0,
    ticketMedio: 0,
    mixCurto: 0,
    freteCurto: 0,
    freteLongo: 0,
    cupomTotal: 0,
    custoPorPedidoProprio: 0,
    custoPorPedidoTerceiro: 0,
    usarLogisticaPropria: false,
    taxaFixaIfood: 0,
    taxaVariavelIfood: 0
  });

  const [resultados, setResultados] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [simulandoGratis, setSimulandoGratis] = useState(false);
  const [incluiFrete, setIncluiFrete] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const calcularResultados = (entregarGratis = false) => {
    setLoading(true);
    
    setTimeout(() => {
      const inputs: DeliveryInputs = {
        faturamento: dados.faturamento,
        pedidos: dados.numeroPedidos,
        dias: dados.diasTrabalhados,
        mixCurtaPct: dados.mixCurto,
        freteCobradoCurto: entregarGratis ? 0 : dados.freteCurto,
        freteCobradoLongo: entregarGratis ? 0 : dados.freteLongo,
        totalCupons: dados.cupomTotal
      };

      const cfg: DeliveryCfg = {
        own: dados.usarLogisticaPropria ? { enabled: true, costPerOrder: dados.custoPorPedidoProprio } : { enabled: false, costPerOrder: 0 },
        third: !dados.usarLogisticaPropria ? { enabled: true, costPerOrder: dados.custoPorPedidoTerceiro } : { enabled: false, costPerOrder: 0 },
        ifood: { monthlyFee: dados.taxaFixaIfood, fixedFeePerOrder: dados.taxaVariavelIfood }
      };

      const resultado = calcDelivery(inputs, cfg, incluiFrete);
      
      if ('error' in resultado) {
        console.error(resultado.error);
        setResultados(null);
      } else {
        setResultados(resultado);
      }
      
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    calcularResultados();
  }, [incluiFrete]);

  const handleInputChange = (field: keyof DadosDelivery, value: string | boolean) => {
    if (typeof value === 'boolean') {
      setDados(prev => ({
        ...prev,
        [field]: value
      }));
      return;
    }

    const numValue = parseFloat(value) || 0;
    setDados(prev => ({
      ...prev,
      [field]: numValue
    }));
    
    // Auto-calculate ticket médio if faturamento or pedidos change
    if (field === 'faturamento' || field === 'numeroPedidos') {
      const novoFaturamento = field === 'faturamento' ? numValue : dados.faturamento;
      const novosPedidos = field === 'numeroPedidos' ? numValue : dados.numeroPedidos;
      
      if (novosPedidos > 0) {
        setDados(prev => ({
          ...prev,
          [field]: numValue,
          ticketMedio: novoFaturamento / novosPedidos
        }));
      }
    }
  };

  const simularEntregaGratis = () => {
    setSimulandoGratis(true);
    calcularResultados(true);
    setTimeout(() => setSimulandoGratis(false), 2000);
  };

  const createTooltipCard = (children: React.ReactNode, tooltipText: string) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">
          {children}
          <HelpCircle className="absolute top-2 right-2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="whitespace-pre-line text-sm">{tooltipText}</div>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Delivery</h1>
            <p className="text-muted-foreground">
              Análise de receita vs custo de frete e impacto líquido
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={simularEntregaGratis} 
              variant="outline" 
              className="gap-2" 
              disabled={loading || simulandoGratis}
            >
              <Truck className="h-4 w-4" />
              {simulandoGratis ? "Simulando..." : "Simular Grátis"}
            </Button>
            <Button onClick={() => calcularResultados()} className="gap-2" disabled={loading}>
              <Calculator className="h-4 w-4" />
              {loading ? "Calculando..." : "Recalcular"}
            </Button>
          </div>
        </div>

        {/* Toggle de Base de Cálculo */}
        <BaseCalculationToggle 
          incluiFrete={incluiFrete}
          onToggle={setIncluiFrete}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Dados */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dados do Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="faturamento">Faturamento (R$)</Label>
                  <Input
                    id="faturamento"
                    type="number"
                    step="0.01"
                    value={dados.faturamento}
                    onChange={(e) => handleInputChange('faturamento', e.target.value)}
                    placeholder="25.000,00"
                  />
                </div>
                <div>
                  <Label htmlFor="numeroPedidos">Número de Pedidos</Label>
                  <Input
                    id="numeroPedidos"
                    type="number"
                    value={dados.numeroPedidos}
                    onChange={(e) => handleInputChange('numeroPedidos', e.target.value)}
                    placeholder="547"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="diasTrabalhados">Dias Trabalhados</Label>
                  <Input
                    id="diasTrabalhados"
                    type="number"
                    value={dados.diasTrabalhados}
                    onChange={(e) => handleInputChange('diasTrabalhados', e.target.value)}
                    placeholder="26"
                  />
                </div>
                <div>
                  <Label htmlFor="ticketMedio">Ticket Médio (R$)</Label>
                  <Input
                    id="ticketMedio"
                    type="number"
                    step="0.01"
                    value={dados.ticketMedio}
                    onChange={(e) => handleInputChange('ticketMedio', e.target.value)}
                    placeholder="45,70"
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="mixCurto">Mix Entrega Curta (%)</Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      Percentual de pedidos com entrega de curta distância
                    </TooltipContent>
                  </Tooltip>
                  <Input
                    id="mixCurto"
                    type="number"
                    min="0"
                    max="100"
                    value={dados.mixCurto}
                    onChange={(e) => handleInputChange('mixCurto', e.target.value)}
                    placeholder="70"
                  />
                </div>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="freteCurto">Frete Curto Cobrado (R$)</Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      Valor de frete cobrado do cliente para entregas curtas
                    </TooltipContent>
                  </Tooltip>
                  <Input
                    id="freteCurto"
                    type="number"
                    step="0.01"
                    value={dados.freteCurto}
                    onChange={(e) => handleInputChange('freteCurto', e.target.value)}
                    placeholder="3,50"
                  />
                </div>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="freteLongo">Frete Longo Cobrado (R$)</Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      Valor de frete cobrado do cliente para entregas longas
                    </TooltipContent>
                  </Tooltip>
                  <Input
                    id="freteLongo"
                    type="number"
                    step="0.01"
                    value={dados.freteLongo}
                    onChange={(e) => handleInputChange('freteLongo', e.target.value)}
                    placeholder="6,00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cupomTotal">Total em Cupons (R$)</Label>
                <Input
                  id="cupomTotal"
                  type="number"
                  step="0.01"
                  value={dados.cupomTotal}
                  onChange={(e) => handleInputChange('cupomTotal', e.target.value)}
                  placeholder="1.200,00"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Configuração de Custos</h4>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="logisticaPropria"
                    checked={dados.usarLogisticaPropria}
                    onChange={(e) => handleInputChange('usarLogisticaPropria', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="logisticaPropria">Usar logística própria</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="custoProprio">Custo Próprio/Pedido (R$)</Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        Custo real por pedido usando logística própria (combustível, manutenção, salário)
                      </TooltipContent>
                    </Tooltip>
                    <Input
                      id="custoProprio"
                      type="number"
                      step="0.01"
                      value={dados.custoPorPedidoProprio}
                      onChange={(e) => handleInputChange('custoPorPedidoProprio', e.target.value)}
                      placeholder="2,50"
                      disabled={!dados.usarLogisticaPropria}
                    />
                  </div>
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="custoTerceiro">Custo Terceiro/Pedido (R$)</Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        Custo por pedido usando serviços terceirizados (ex: iFood, Uber Eats)
                      </TooltipContent>
                    </Tooltip>
                    <Input
                      id="custoTerceiro"
                      type="number"
                      step="0.01"
                      value={dados.custoPorPedidoTerceiro}
                      onChange={(e) => handleInputChange('custoPorPedidoTerceiro', e.target.value)}
                      placeholder="4,00"
                      disabled={dados.usarLogisticaPropria}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxaFixa">Taxa Fixa Mensal (R$)</Label>
                    <Input
                      id="taxaFixa"
                      type="number"
                      step="0.01"
                      value={dados.taxaFixaIfood}
                      onChange={(e) => handleInputChange('taxaFixaIfood', e.target.value)}
                      placeholder="150,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxaVariavel">Taxa Variável/Pedido (R$)</Label>
                    <Input
                      id="taxaVariavel"
                      type="number"
                      step="0.01"
                      value={dados.taxaVariavelIfood}
                      onChange={(e) => handleInputChange('taxaVariavelIfood', e.target.value)}
                      placeholder="0,50"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultados Principais */}
          <div className="space-y-6">
            {/* Cards principais - Análise de frete */}
            <div className="grid grid-cols-3 gap-4">
              {createTooltipCard(
                <FinancialCard
                  title="% Frete Cobrado"
                  value={resultados ? formatPercentage(resultados.pctFreteCobrado) : "0%"}
                  subtitle={resultados ? formatCurrency(resultados.freteCobradoTotal) : formatCurrency(0)}
                  icon={<DollarSign className="h-5 w-5" />}
                  variant="default"
                  loading={loading}
                />,
                tooltipTexts.freteCobrado
              )}

              {createTooltipCard(
                <FinancialCard
                  title="% Custo de Frete"
                  value={resultados ? formatPercentage(resultados.pctCustoFrete) : "0%"}
                  subtitle={resultados ? formatCurrency(resultados.custoFreteTotal) : formatCurrency(0)}
                  icon={<Truck className="h-5 w-5" />}
                  variant={resultados ? getVariantForCustoFrete(resultados.pctCustoFrete) : "default"}
                  loading={loading}
                />,
                tooltipTexts.custoFrete
              )}

              {createTooltipCard(
                <FinancialCard
                  title="% Impacto Líquido do Frete"
                  value={resultados ? formatPercentage(resultados.pctImpactoLiquido) : "0%"}
                  subtitle={resultados ? formatCurrency(resultados.impactoFreteLiquido) : formatCurrency(0)}
                  icon={resultados && resultados.pctImpactoLiquido >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  variant={resultados ? getVariantForImpactoLiquido(resultados.pctImpactoLiquido) : "default"}
                  loading={loading}
                />,
                tooltipTexts.impactoLiquido
              )}
            </div>

            {/* Cards secundários */}
            <div className="grid grid-cols-4 gap-4">
              {createTooltipCard(
                <FinancialCard
                  title="% Cupons"
                  value={resultados ? formatPercentage(resultados.pctCupons) : "0%"}
                  subtitle={formatCurrency(dados.cupomTotal)}
                  icon={<Percent className="h-5 w-5" />}
                  variant={resultados ? getVariantForCupons(resultados.pctCupons) : "default"}
                  loading={loading}
                />,
                tooltipTexts.cupons
              )}

              {createTooltipCard(
                <FinancialCard
                  title="Ticket Médio"
                  value={resultados ? formatCurrency(resultados.ticketMedio) : formatCurrency(0)}
                  subtitle="Por pedido"
                  variant="default"
                  loading={loading}
                />,
                tooltipTexts.ticketMedio
              )}

              {createTooltipCard(
                <FinancialCard
                  title="Pedidos/dia"
                  value={resultados ? resultados.pedidosDia.toFixed(1) : "0"}
                  subtitle="Média diária"
                  variant="default"
                  loading={loading}
                />,
                tooltipTexts.pedidosDia
              )}

              {createTooltipCard(
                <FinancialCard
                  title="Faturamento/dia"
                  value={resultados ? formatCurrency(resultados.faturamentoDia) : formatCurrency(0)}
                  subtitle="Média diária"
                  variant="default"
                  loading={loading}
                />,
                tooltipTexts.faturamentoDia
              )}
            </div>

            {resultados && (
              <Card className="financial-card">
                <CardHeader>
                  <CardTitle>Distribuição de Entregas e Detalhamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Distribuição</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Entregas Curtas:</span>
                        <div className="text-right">
                          <div className="font-medium">{resultados.qtdCurta} pedidos</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(resultados.qtdCurta * dados.freteCurto)} receita
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Entregas Longas:</span>
                        <div className="text-right">
                          <div className="font-medium">{resultados.qtdLonga} pedidos</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(resultados.qtdLonga * dados.freteLongo)} receita
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Resumo Financeiro</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Receita Frete:</span>
                        <span className="font-medium metric-positive">
                          {formatCurrency(resultados.freteCobradoTotal)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Custo Frete:</span>
                        <span className="font-medium metric-negative">
                          -{formatCurrency(resultados.custoFreteTotal)}
                        </span>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center font-medium">
                        <span>Resultado Líquido:</span>
                        <span className={resultados.impactoFreteLiquido >= 0 ? "metric-positive" : "metric-negative"}>
                          {formatCurrency(resultados.impactoFreteLiquido)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Análise Comparativa */}
        {resultados && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Análise de Cenários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Impacto atual vs entrega grátis:
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Impacto atual:</span>
                      <span className={resultados.impactoFreteLiquido >= 0 ? "metric-positive" : "metric-negative"}>
                        {formatCurrency(resultados.impactoFreteLiquido)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Se fosse grátis:</span>
                      <span className="metric-negative">
                        -{formatCurrency(resultados.custoFreteTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diferença:</span>
                      <span className="metric-negative">
                        -{formatCurrency(resultados.freteCobradoTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground">Insight:</div>
                    <div className="text-sm">
                      Para entrega grátis, seria necessário aumentar preços em{" "}
                      <span className="font-medium">
                        {formatPercentage((resultados.freteCobradoTotal) / dados.faturamento * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Métricas de Eficiência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Margem Líquida Frete:</span>
                    <span className={resultados.pctImpactoLiquido >= 0 ? "metric-positive" : "metric-negative"}>
                      {formatPercentage(resultados.pctImpactoLiquido)}
                    </span>
                  </div>

                  {createTooltipCard(
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Custo Total (Frete + Cupons):</span>
                      <span className="metric-negative">
                        {formatPercentage(resultados.pctCustoFrete + resultados.pctCupons)}
                      </span>
                    </div>,
                    tooltipTexts.custoTotal
                  )}

                  {createTooltipCard(
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ROI do Frete:</span>
                      <span className="font-medium">
                        {formatROI(resultados.freteCobradoTotal, resultados.custoFreteTotal)}
                      </span>
                    </div>,
                    tooltipTexts.roiFrete
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Produtividade:</span>
                    <span className="font-medium">
                      {formatCurrency(resultados.faturamentoDia)} /dia
                    </span>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>💡 ROI ideal do frete: 150-200%</div>
                    <div>📊 Custo total ideal: &lt; 10% do faturamento</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seção de Transparência dos Cálculos */}
        <CalcTransparenciaSection 
          inputs={{
            faturamento: dados.faturamento,
            pedidos: dados.numeroPedidos,
            dias: dados.diasTrabalhados,
            mixCurtaPct: dados.mixCurto,
            freteCobradoCurto: dados.freteCurto,
            freteCobradoLongo: dados.freteLongo,
            totalCupons: dados.cupomTotal
          }}
          cfg={{
            own: dados.usarLogisticaPropria ? { enabled: true, costPerOrder: dados.custoPorPedidoProprio } : { enabled: false, costPerOrder: 0 },
            third: !dados.usarLogisticaPropria ? { enabled: true, costPerOrder: dados.custoPorPedidoTerceiro } : { enabled: false, costPerOrder: 0 },
            ifood: { monthlyFee: dados.taxaFixaIfood, fixedFeePerOrder: dados.taxaVariavelIfood }
          }}
          resultados={resultados}
          incluiFrete={incluiFrete}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
        />
      </div>
    </TooltipProvider>
  );
}