import { Calculator } from "lucide-react";
import { PrecificacaoUnificada } from "@/components/PrecificacaoUnificada";

export default function Precificacao() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Precificação</h1>
          <p className="text-muted-foreground">
            Calcule markup ideal por canal com ficha técnica e simulações integradas
          </p>
        </div>
        <Calculator className="h-8 w-8 text-primary" />
      </div>

      <PrecificacaoUnificada />
    </div>
  );
}