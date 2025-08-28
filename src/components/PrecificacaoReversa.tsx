import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TaxasCanal {
  impostos: number;
  comissaoApp: number;
  cartao: number;
  descontos: number;
  entregaTipo: 'percentual' | 'fixo';
  entregaValor: number;
}

interface PrecificacaoReversaProps {
  custoTotal: number;
  taxas: TaxasCanal;
  metaMargem: number;
}

export function PrecificacaoReversa({ custoTotal, taxas, metaMargem }: PrecificacaoReversaProps) {
  const [precoMercado, setPrecoMercado] = useState<number>(0);

  const resultadoReverso = useMemo(() => {
    if (precoMercado <= 0 || custoTotal <= 0) return null;

    const entregaFixa = taxas.entregaTipo === 'fixo' ? taxas.entregaValor : 0;
    const entregaPercentual = taxas.entregaTipo === 'percentual' ? taxas.entregaValor / 100 : 0;
    
    const percentuaisSobreVenda = (taxas.impostos + taxas.comissaoApp + taxas.cartao + taxas.descontos) / 100 + entregaPercentual;
    
    const margemContribuicaoAbs = precoMercado - custoTotal - (percentuaisSobreVenda * precoMercado) - entregaFixa;
    const margemContribuicaoPct = (margemContribuicaoAbs / precoMercado) * 100;
    
    // Custo máximo para manter a meta de margem
    const custoMaximo = precoMercado * (1 - (percentuaisSobreVenda + metaMargem / 100)) - entregaFixa;
    
    // Verificar se é viável
    const isViavel = margemContribuicaoPct >= metaMargem;
    const diferenciaCusto = custoMaximo - custoTotal;
    
    return {
      margemContribuicaoAbs,
      margemContribuicaoPct,
      custoMaximo,
      isViavel,
      diferenciaCusto,
      cmvPct: (custoTotal / precoMercado) * 100
    };
  }, [precoMercado, custoTotal, taxas, metaMargem]);

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

  const getStatusBadge = () => {
    if (!resultadoReverso) return null;
    
    if (resultadoReverso.isViavel) {
      return <Badge variant="default" className="bg-green-500">Viável</Badge>;
    } else {
      return <Badge variant="destructive">Inviável</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Precificação Reversa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="precoMercado">Preço de Mercado (P*)</Label>
          <Input
            id="precoMercado"
            type="number"
            min="0"
            step="0.01"
            value={precoMercado || ''}
            onChange={(e) => setPrecoMercado(Number(e.target.value))}
            placeholder="Digite o preço praticado no mercado"
          />
        </div>

        {resultadoReverso && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              {getStatusBadge()}
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">MC* (Abs):</span>
                <span className={`font-medium ${resultadoReverso.margemContribuicaoAbs > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(resultadoReverso.margemContribuicaoAbs)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">MC* (%):</span>
                <span className={`font-medium ${resultadoReverso.margemContribuicaoPct > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(resultadoReverso.margemContribuicaoPct)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">CMV*:</span>
                <span className="font-medium">
                  {formatPercentage(resultadoReverso.cmvPct)}
                </span>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Para atingir meta de {formatPercentage(metaMargem)}:</h4>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Custo máximo (Cmax):</span>
                <span className="font-medium">
                  {formatCurrency(resultadoReverso.custoMaximo)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Custo atual:</span>
                <span className="font-medium">
                  {formatCurrency(custoTotal)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Diferença:</span>
                <span className={`font-medium ${resultadoReverso.diferenciaCusto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {resultadoReverso.diferenciaCusto >= 0 ? '+' : ''}{formatCurrency(resultadoReverso.diferenciaCusto)}
                </span>
              </div>
            </div>
            
            {!resultadoReverso.isViavel && (
              <div className="p-3 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive">
                  ⚠️ O preço de mercado não permite atingir a meta de margem. 
                  É necessário reduzir custos em {formatCurrency(Math.abs(resultadoReverso.diferenciaCusto))} 
                  ou aceitar uma margem menor.
                </p>
              </div>
            )}
            
            {resultadoReverso.isViavel && resultadoReverso.diferenciaCusto > 0 && (
              <div className="p-3 bg-green-100 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ O preço permite atingir a meta com folga de {formatCurrency(resultadoReverso.diferenciaCusto)} no custo.
                </p>
              </div>
            )}
          </div>
        )}
        
        {!resultadoReverso && precoMercado === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Digite um preço de mercado para ver a análise reversa</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}