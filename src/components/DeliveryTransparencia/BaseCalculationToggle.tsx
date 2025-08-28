import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InteractiveTooltip } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface BaseCalculationToggleProps {
  incluiFrete: boolean;
  onToggle: (value: boolean) => void;
}

export function BaseCalculationToggle({ incluiFrete, onToggle }: BaseCalculationToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2">
        <Label htmlFor="incluiFrete" className="font-medium">
          O faturamento informado inclui frete cobrado?
        </Label>
        <InteractiveTooltip
          content={
            <div className="space-y-2">
              <p className="text-sm">
                Aqui você informa se o valor de faturamento que digitou já inclui o frete cobrado dos clientes.
              </p>
              <p className="text-sm">
                <strong>Se marcar sim:</strong> o faturamento vai ser considerado como: Produto + Frete.
              </p>
              <p className="text-sm">
                <strong>Se marcar não:</strong> o faturamento vai ser considerado apenas como: Produto (sem frete).
              </p>
              <p className="text-xs text-muted-foreground">
                Essa escolha é importante porque muda como o sistema calcula os percentuais de frete e cupons sobre o faturamento.
              </p>
            </div>
          }
          side="bottom"
          className="max-w-sm"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
        </InteractiveTooltip>
      </div>
      
      <div className="flex items-center gap-3">
        <span className={`text-sm ${!incluiFrete ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
          Não
        </span>
        <Switch
          id="incluiFrete"
          checked={incluiFrete}
          onCheckedChange={onToggle}
        />
        <span className={`text-sm ${incluiFrete ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
          Sim
        </span>
      </div>
    </div>
  );
}