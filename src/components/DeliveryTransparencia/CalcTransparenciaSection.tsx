import { Calculator, FileText, TrendingUp, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { DeliveryInputs, DeliveryCfg } from "@/utils/delivery/calc";

interface CalcTransparenciaSectionProps {
  inputs: DeliveryInputs;
  cfg: DeliveryCfg;
  resultados: any;
  incluiFrete: boolean;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}

export function CalcTransparenciaSection({ 
  inputs, 
  cfg, 
  resultados, 
  incluiFrete,
  formatCurrency,
  formatPercentage
}: CalcTransparenciaSectionProps) {
  if (!resultados || inputs.faturamento <= 0 || inputs.pedidos <= 0 || inputs.dias <= 0) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Transparência dos Cálculos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Preencha faturamento, pedidos e dias para ver os cálculos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const basePct = incluiFrete ? inputs.faturamento : inputs.faturamento + resultados.freteCobradoTotal;

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Transparência dos Cálculos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="fontes">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Fontes de Dados
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Dados Principais:</strong>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      <li>• Faturamento: {formatCurrency(inputs.faturamento)}</li>
                      <li>• Pedidos: {inputs.pedidos.toLocaleString()}</li>
                      <li>• Dias: {inputs.dias}</li>
                      <li>• Mix Curta: {inputs.mixCurtaPct}%</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Frete e Cupons:</strong>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      <li>• Frete Curto: {formatCurrency(inputs.freteCobradoCurto)}</li>
                      <li>• Frete Longo: {formatCurrency(inputs.freteCobradoLongo)}</li>
                      <li>• Total Cupons: {formatCurrency(inputs.totalCupons)}</li>
                    </ul>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <strong>Configuração Logística:</strong>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      <li>• Método: {cfg.own?.enabled ? 'Própria' : cfg.third?.enabled ? 'Terceirizada' : 'Nenhum'}</li>
                      <li>• Custo/Pedido: {formatCurrency(cfg.own?.enabled ? (cfg.own.costPerOrder || 0) : cfg.third?.enabled ? (cfg.third.costPerOrder || 0) : 0)}</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Taxas Adicionais:</strong>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      <li>• Taxa Mensal: {formatCurrency(cfg.ifood?.monthlyFee || 0)}</li>
                      <li>• Taxa/Pedido: {formatCurrency(cfg.ifood?.fixedFeePerOrder || 0)}</li>
                      <li>• Base %: {incluiFrete ? 'Inclui frete' : 'Exclui frete'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="formulas">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Fórmulas por Indicador
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 text-sm">
                <div className="space-y-2">
                  <div className="font-medium">qtdCurta = round(pedidos × mixCurta%)</div>
                  <div className="text-muted-foreground">
                    qtdCurta = round({inputs.pedidos} × {inputs.mixCurtaPct/100}) = <strong>{resultados.qtdCurta}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">qtdLonga = pedidos - qtdCurta</div>
                  <div className="text-muted-foreground">
                    qtdLonga = {inputs.pedidos} - {resultados.qtdCurta} = <strong>{resultados.qtdLonga}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">freteCobradoTotal = (qtdCurta × freteCurto) + (qtdLonga × freteLongo)</div>
                  <div className="text-muted-foreground">
                    freteCobradoTotal = ({resultados.qtdCurta} × {formatCurrency(inputs.freteCobradoCurto)}) + ({resultados.qtdLonga} × {formatCurrency(inputs.freteCobradoLongo)}) = <strong>{formatCurrency(resultados.freteCobradoTotal)}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">%FreteCobrado = (freteCobradoTotal ÷ base%) × 100</div>
                  <div className="text-muted-foreground">
                    %FreteCobrado = ({formatCurrency(resultados.freteCobradoTotal)} ÷ {formatCurrency(basePct)}) × 100 = <strong>{formatPercentage(resultados.pctFreteCobrado)}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">custoFreteTotal = (pedidos × custoPorPedido) + taxaMensal + (pedidos × taxaPorPedido)</div>
                  <div className="text-muted-foreground">
                    custoFreteTotal = ({inputs.pedidos} × {formatCurrency(cfg.own?.enabled ? (cfg.own.costPerOrder || 0) : cfg.third?.enabled ? (cfg.third.costPerOrder || 0) : 0)}) + {formatCurrency(cfg.ifood?.monthlyFee || 0)} + ({inputs.pedidos} × {formatCurrency(cfg.ifood?.fixedFeePerOrder || 0)}) = <strong>{formatCurrency(resultados.custoFreteTotal)}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">%CustoFrete = (custoFreteTotal ÷ base%) × 100</div>
                  <div className="text-muted-foreground">
                    %CustoFrete = ({formatCurrency(resultados.custoFreteTotal)} ÷ {formatCurrency(basePct)}) × 100 = <strong>{formatPercentage(resultados.pctCustoFrete)}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">%ImpactoLíquido = ((freteCobradoTotal - custoFreteTotal) ÷ base%) × 100</div>
                  <div className="text-muted-foreground">
                    %ImpactoLíquido = (({formatCurrency(resultados.freteCobradoTotal)} - {formatCurrency(resultados.custoFreteTotal)}) ÷ {formatCurrency(basePct)}) × 100 = <strong>{formatPercentage(resultados.pctImpactoLiquido)}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">%Cupons = (totalCupons ÷ base%) × 100</div>
                  <div className="text-muted-foreground">
                    %Cupons = ({formatCurrency(inputs.totalCupons)} ÷ {formatCurrency(basePct)}) × 100 = <strong>{formatPercentage(resultados.pctCupons)}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">ROI do Frete = ((freteCobradoTotal ÷ custoFreteTotal) - 1) × 100</div>
                  <div className="text-muted-foreground">
                    ROI do Frete = (({formatCurrency(resultados.freteCobradoTotal)} ÷ {formatCurrency(resultados.custoFreteTotal)}) - 1) × 100 = <strong>{resultados.custoFreteTotal > 0 ? formatPercentage(((resultados.freteCobradoTotal / resultados.custoFreteTotal) - 1) * 100) : '—'}</strong>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="passos">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Passo a Passo do Cálculo
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 text-sm">
                <div>
                  <strong>1. Distribuição de Entregas:</strong>
                  <ul className="mt-2 space-y-1 text-muted-foreground ml-4">
                    <li>• Entregas curtas: {resultados.qtdCurta} pedidos ({formatPercentage(inputs.mixCurtaPct)})</li>
                    <li>• Entregas longas: {resultados.qtdLonga} pedidos ({formatPercentage(100 - inputs.mixCurtaPct)})</li>
                  </ul>
                </div>

                <div>
                  <strong>2. Receita de Frete:</strong>
                  <ul className="mt-2 space-y-1 text-muted-foreground ml-4">
                    <li>• Curtas: {resultados.qtdCurta} × {formatCurrency(inputs.freteCobradoCurto)} = {formatCurrency(resultados.qtdCurta * inputs.freteCobradoCurto)}</li>
                    <li>• Longas: {resultados.qtdLonga} × {formatCurrency(inputs.freteCobradoLongo)} = {formatCurrency(resultados.qtdLonga * inputs.freteCobradoLongo)}</li>
                    <li>• <strong>Total: {formatCurrency(resultados.freteCobradoTotal)} ({formatPercentage(resultados.pctFreteCobrado)})</strong></li>
                  </ul>
                </div>

                <div>
                  <strong>3. Custo de Frete:</strong>
                  <ul className="mt-2 space-y-1 text-muted-foreground ml-4">
                    <li>• Logística: {inputs.pedidos} × {formatCurrency(cfg.own?.enabled ? (cfg.own.costPerOrder || 0) : cfg.third?.enabled ? (cfg.third.costPerOrder || 0) : 0)} = {formatCurrency(inputs.pedidos * (cfg.own?.enabled ? (cfg.own.costPerOrder || 0) : cfg.third?.enabled ? (cfg.third.costPerOrder || 0) : 0))}</li>
                    <li>• Taxa mensal: {formatCurrency(cfg.ifood?.monthlyFee || 0)}</li>
                    <li>• Taxa variável: {inputs.pedidos} × {formatCurrency(cfg.ifood?.fixedFeePerOrder || 0)} = {formatCurrency(inputs.pedidos * (cfg.ifood?.fixedFeePerOrder || 0))}</li>
                    <li>• <strong>Total: {formatCurrency(resultados.custoFreteTotal)} ({formatPercentage(resultados.pctCustoFrete)})</strong></li>
                  </ul>
                </div>

                <div>
                  <strong>4. Impacto Líquido:</strong>
                  <ul className="mt-2 space-y-1 text-muted-foreground ml-4">
                    <li>• Receita: {formatCurrency(resultados.freteCobradoTotal)}</li>
                    <li>• Custo: -{formatCurrency(resultados.custoFreteTotal)}</li>
                    <li>• <strong>Líquido: {formatCurrency(resultados.impactoFreteLiquido)} ({formatPercentage(resultados.pctImpactoLiquido)})</strong></li>
                  </ul>
                </div>

                <div>
                  <strong>5. Indicadores Operacionais:</strong>
                  <ul className="mt-2 space-y-1 text-muted-foreground ml-4">
                    <li>• Ticket médio: {formatCurrency(inputs.faturamento)} ÷ {inputs.pedidos} = {formatCurrency(resultados.ticketMedio)}</li>
                    <li>• Pedidos/dia: {inputs.pedidos} ÷ {inputs.dias} = {resultados.pedidosDia.toFixed(1)}</li>
                    <li>• Faturamento/dia: {formatCurrency(inputs.faturamento)} ÷ {inputs.dias} = {formatCurrency(resultados.faturamentoDia)}</li>
                  </ul>
                </div>

                <div>
                  <strong>6. Métricas Avançadas:</strong>
                  <ul className="mt-2 space-y-1 text-muted-foreground ml-4">
                    <li>• ROI do Frete: {resultados.custoFreteTotal > 0 ? formatPercentage(((resultados.freteCobradoTotal / resultados.custoFreteTotal) - 1) * 100) : '—'}</li>
                    <li>• Custo Total (Frete + Cupons): {formatPercentage(resultados.pctCustoFrete + resultados.pctCupons)}</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="observacoes">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Observações e Premissas
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Cálculos:</strong>
                  <ul className="mt-2 space-y-1 text-muted-foreground ml-4">
                    <li>• qtdCurta = round(pedidos × mix%), qtdLonga = pedidos - qtdCurta</li>
                    <li>• Percentuais usam 1 casa decimal</li>
                    <li>• Base de cálculo: {incluiFrete ? 'faturamento (inclui frete cobrado)' : 'faturamento + frete cobrado total'}</li>
                  </ul>
                </div>

                <div>
                  <strong>Configurações:</strong>
                  <ul className="mt-2 space-y-1 text-muted-foreground ml-4">
                    <li>• Se nenhum método de logística estiver ativo → custoPorPedido = 0</li>
                    <li>• ROI exibe "—" quando custoFreteTotal = 0</li>
                    <li>• Simulação "entrega grátis" zera apenas receita de frete (custos permanecem)</li>
                  </ul>
                </div>

                <div>
                  <strong>Thresholds de Cores:</strong>
                  <ul className="mt-2 space-y-1 text-muted-foreground ml-4">
                    <li>• % Custo Frete: Verde ≤8%, Azul 8-12%, Laranja 12-15%, Vermelho {'>'}15%</li>
                    <li>• % Cupons: Verde ≤5%, Azul 5-8%, Laranja 8-12%, Vermelho {'>'}12%</li>
                    <li>• % Impacto Líquido: Verde se {'>'}0%, Vermelho se ≤0%</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}