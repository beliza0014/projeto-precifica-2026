import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ResultadoCalculo {
  mkup: number;
  precoSugerido: number;
  margemContribuicaoAbs: number;
  margemContribuicaoPct: number;
  cmvPct: number;
  custoTotal: number;
  somaPercentuais: number;
}

interface SimuladorSectionProps {
  resultado: ResultadoCalculo;
  custoTotal: number;
  metaMargem: number;
}

export function SimuladorSection({ resultado, custoTotal, metaMargem }: SimuladorSectionProps) {
  const [variacaoImpostos, setVariacaoImpostos] = useState<number>(0);
  const [variacaoComissao, setVariacaoComissao] = useState<number>(0);
  const [variacaoCartao, setVariacaoCartao] = useState<number>(0);
  const [variacaoDescontos, setVariacaoDescontos] = useState<number>(0);
  const [variacaoMargem, setVariacaoMargem] = useState<number>(0);
  const [variacaoInsumos, setVariacaoInsumos] = useState<number>(0);

  const calcularSimulacao = () => {
    // Aplicar variações
    const custoSimulado = custoTotal * (1 + variacaoInsumos / 100);
    const margemSimulada = metaMargem + variacaoMargem;
    
    // Use zero base values - no hardcoded defaults
    const impostosBase = 0;
    const comissaoBase = 0;
    const cartaoBase = 0;
    const descontosBase = 0;
    
    const impostosSimulado = impostosBase + variacaoImpostos;
    const comissaoSimulada = comissaoBase + variacaoComissao;
    const cartaoSimulado = cartaoBase + variacaoCartao;
    const descontosSimulado = descontosBase + variacaoDescontos;
    
    const somaPercentuaisSimulada = (impostosSimulado + comissaoSimulada + cartaoSimulado + descontosSimulado + margemSimulada) / 100;
    
    if (somaPercentuaisSimulada >= 1) {
      return null;
    }
    
    const mkupSimulado = 1 / (1 - somaPercentuaisSimulada);
    const precoSimulado = custoSimulado * mkupSimulado;
    const precoArredondado = Math.round(precoSimulado * 10) / 10;
    
    const margemAbsSimulada = precoArredondado - custoSimulado - (somaPercentuaisSimulada - margemSimulada / 100) * precoArredondado;
    const margemPctSimulada = (margemAbsSimulada / precoArredondado) * 100;
    
    return {
      precoSimulado: precoArredondado,
      margemAbsSimulada,
      margemPctSimulada,
      mkupSimulado,
      diferencaPreco: precoArredondado - resultado.precoSugerido,
      diferencaMargem: margemPctSimulada - resultado.margemContribuicaoPct
    };
  };

  const simulacao = calcularSimulacao();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  const formatDifference = (value: number, isPercentage = false) => {
    const formatted = isPercentage ? formatPercentage(value) : formatCurrency(value);
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${formatted}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador "E se...?"</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Impostos: {variacaoImpostos > 0 ? '+' : ''}{variacaoImpostos}pp</Label>
            <Slider
              value={[variacaoImpostos]}
              onValueChange={(value) => setVariacaoImpostos(value[0])}
              min={-5}
              max={10}
              step={0.1}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Comissão App: {variacaoComissao > 0 ? '+' : ''}{variacaoComissao}pp</Label>
            <Slider
              value={[variacaoComissao]}
              onValueChange={(value) => setVariacaoComissao(value[0])}
              min={-10}
              max={15}
              step={0.1}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Taxa Cartão: {variacaoCartao > 0 ? '+' : ''}{variacaoCartao}pp</Label>
            <Slider
              value={[variacaoCartao]}
              onValueChange={(value) => setVariacaoCartao(value[0])}
              min={-2}
              max={5}
              step={0.1}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Descontos: {variacaoDescontos > 0 ? '+' : ''}{variacaoDescontos}pp</Label>
            <Slider
              value={[variacaoDescontos]}
              onValueChange={(value) => setVariacaoDescontos(value[0])}
              min={-5}
              max={20}
              step={0.1}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Meta Margem: {variacaoMargem > 0 ? '+' : ''}{variacaoMargem}pp</Label>
            <Slider
              value={[variacaoMargem]}
              onValueChange={(value) => setVariacaoMargem(value[0])}
              min={-10}
              max={20}
              step={0.1}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Custo Insumos: {variacaoInsumos > 0 ? '+' : ''}{variacaoInsumos}%</Label>
            <Slider
              value={[variacaoInsumos]}
              onValueChange={(value) => setVariacaoInsumos(value[0])}
              min={-20}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
        
        {simulacao && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium">Resultado Simulado</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Preço:</span>
                <div className="font-medium">
                  {formatCurrency(simulacao.precoSimulado)}
                  <Badge variant="outline" className="ml-2 text-xs">
                    {formatDifference(simulacao.diferencaPreco)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Margem:</span>
                <div className="font-medium">
                  {formatPercentage(simulacao.margemPctSimulada)}
                  <Badge variant="outline" className="ml-2 text-xs">
                    {formatDifference(simulacao.diferencaMargem, true)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">MKUP:</span>
                <div className="font-medium">{simulacao.mkupSimulado.toFixed(4)}</div>
              </div>
              
              <div>
                <span className="text-muted-foreground">MC$:</span>
                <div className="font-medium">{formatCurrency(simulacao.margemAbsSimulada)}</div>
              </div>
            </div>
          </div>
        )}
        
        {!simulacao && (
          <div className="border-t pt-4">
            <p className="text-sm text-destructive">
              ⚠️ Soma de percentuais ≥ 100%. Ajuste os valores para ver a simulação.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}