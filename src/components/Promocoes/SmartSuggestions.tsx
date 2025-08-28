import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle, TrendingUp, Calculator } from "lucide-react";

interface SmartSuggestionsProps {
  maxDiscount: number;
  suggestedPrice: number | null;
  currentDiscount: number;
  isViable: boolean;
  minMargin: number;
}

export function SmartSuggestions({
  maxDiscount,
  suggestedPrice,
  currentDiscount,
  isViable,
  minMargin
}: SmartSuggestionsProps) {
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Sugestões Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isViable && (
          <Alert className="border-destructive/50 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuração inviável!</strong> O desconto atual de {formatPercentage(currentDiscount / 100)} 
              torna a operação inviável. Reduza o desconto ou ajuste o preço de lista.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">Desconto Máximo Viável</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Para manter uma margem mínima de {formatPercentage(minMargin)}:
            </p>
            {maxDiscount > 0 ? (
              <Badge variant="default" className="text-lg bg-green-500 text-white">
                {formatPercentage(maxDiscount / 100)}
              </Badge>
            ) : (
              <Badge variant="destructive">
                Sem espaço para desconto
              </Badge>
            )}
          </div>

          {suggestedPrice && (
            <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-accent" />
                <span className="font-semibold text-accent">Preço de Lista Sugerido</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Para manter a margem desejada com o desconto atual:
              </p>
              <Badge variant="outline" className="text-lg">
                {formatCurrency(suggestedPrice)}
              </Badge>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Dica:</strong> Margens acima de 25% são consideradas ótimas</p>
            <p>⚠️ <strong>Atenção:</strong> Margens abaixo de 5% são consideradas arriscadas</p>
            <p>📊 <strong>Lembrete:</strong> Considere também fatores como volume de vendas e sazonalidade</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}