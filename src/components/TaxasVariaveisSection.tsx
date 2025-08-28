import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface TaxasCanal {
  impostos: number;
  comissaoApp: number;
  cartao: number;
  descontos: number;
  entregaTipo: 'percentual' | 'fixo';
  entregaValor: number;
}

interface TaxasVariaveisSectionProps {
  taxas: TaxasCanal;
  setTaxas: (taxas: TaxasCanal) => void;
  canalNome: string;
}

export function TaxasVariaveisSection({ taxas, setTaxas, canalNome }: TaxasVariaveisSectionProps) {
  const atualizarTaxa = (campo: keyof TaxasCanal, valor: any) => {
    setTaxas({ ...taxas, [campo]: valor });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const somaPercentuais = taxas.impostos + taxas.comissaoApp + taxas.cartao + taxas.descontos;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Taxas & Variáveis
          {canalNome && <span className="text-sm font-normal text-muted-foreground ml-2">({canalNome})</span>}
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
              max="100"
              step="0.1"
              value={taxas.impostos}
              onChange={(e) => atualizarTaxa('impostos', Number(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor="comissaoApp">Comissão App (%)</Label>
            <Input
              id="comissaoApp"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxas.comissaoApp}
              onChange={(e) => atualizarTaxa('comissaoApp', Number(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor="cartao">Cartão (%)</Label>
            <Input
              id="cartao"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxas.cartao}
              onChange={(e) => atualizarTaxa('cartao', Number(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor="descontos">Descontos Médios (%)</Label>
            <Input
              id="descontos"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxas.descontos}
              onChange={(e) => atualizarTaxa('descontos', Number(e.target.value))}
            />
          </div>
        </div>
        
        <Separator />
        
        <div>
          <Label>Entrega</Label>
          <div className="space-y-3 mt-2">
            <Select
              value={taxas.entregaTipo}
              onValueChange={(value: 'percentual' | 'fixo') => atualizarTaxa('entregaTipo', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentual">% da Venda</SelectItem>
                <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              min="0"
              step="0.01"
              value={taxas.entregaValor}
              onChange={(e) => atualizarTaxa('entregaValor', Number(e.target.value))}
              placeholder={taxas.entregaTipo === 'percentual' ? "%" : "R$"}
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Impostos:</span>
            <span>{formatPercentage(taxas.impostos)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Comissão App:</span>
            <span>{formatPercentage(taxas.comissaoApp)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Cartão:</span>
            <span>{formatPercentage(taxas.cartao)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Descontos:</span>
            <span>{formatPercentage(taxas.descontos)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Entrega:</span>
            <span>
              {taxas.entregaTipo === 'percentual' 
                ? formatPercentage(taxas.entregaValor)
                : formatCurrency(taxas.entregaValor)
              }
            </span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-medium">
            <span>Total Variáveis:</span>
            <span className={somaPercentuais >= 90 ? "text-destructive" : ""}>
              {formatPercentage(somaPercentuais)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}