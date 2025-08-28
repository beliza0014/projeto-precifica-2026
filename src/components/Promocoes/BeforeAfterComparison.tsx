import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ComparisonData {
  price: number;
  margin: number;
  unitProfit: number;
  isViable: boolean;
}

interface BeforeAfterComparisonProps {
  before: ComparisonData;
  after: ComparisonData;
  hasPromotion: boolean;
}

export function BeforeAfterComparison({
  before,
  after,
  hasPromotion
}: BeforeAfterComparisonProps) {
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  const getVariabilityIcon = (beforeVal: number, afterVal: number) => {
    if (!hasPromotion) return <Minus className="h-4 w-4" />;
    if (afterVal > beforeVal) return <TrendingUp className="h-4 w-4 text-success" />;
    if (afterVal < beforeVal) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4" />;
  };

  const getViabilityBadge = (isViable: boolean, margin: number) => {
    if (!isViable) return <Badge variant="destructive">Inviável</Badge>;
    if (margin >= 0.25) return <Badge variant="default" className="bg-green-500 text-white">Ótimo</Badge>;
    if (margin >= 0.15) return <Badge variant="default">Bom</Badge>;
    if (margin >= 0.05) return <Badge variant="outline" className="border-orange-500 text-orange-600">Razoável</Badge>;
    return <Badge variant="destructive">Ruim</Badge>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Antes */}
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Antes da Promoção
            {getViabilityBadge(before.isViable, before.margin)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Preço</span>
              <span className="font-semibold text-lg">
                {formatCurrency(before.price)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Margem</span>
              <span className="font-semibold">
                {formatPercentage(before.margin)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Lucro Unitário</span>
              <span className="font-semibold">
                {formatCurrency(before.unitProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Depois */}
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              {hasPromotion ? "Com Promoção" : "Sem Promoção"}
            </span>
            {getViabilityBadge(after.isViable, after.margin)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                Preço
                {getVariabilityIcon(before.price, after.price)}
              </span>
              <span className="font-semibold text-lg">
                {formatCurrency(after.price)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                Margem
                {getVariabilityIcon(before.margin, after.margin)}
              </span>
              <span className="font-semibold">
                {formatPercentage(after.margin)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                Lucro Unitário
                {getVariabilityIcon(before.unitProfit, after.unitProfit)}
              </span>
              <span className="font-semibold">
                {formatCurrency(after.unitProfit)}
              </span>
            </div>
          </div>

          {hasPromotion && (
            <div className="pt-2 border-t border-border">
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  <strong>Diferença no preço:</strong>{" "}
                  <span className={after.price < before.price ? "text-destructive" : "text-success"}>
                    {formatCurrency(after.price - before.price)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  <strong>Diferença na margem:</strong>{" "}
                  <span className={after.margin < before.margin ? "text-destructive" : "text-success"}>
                    {formatPercentage(after.margin - before.margin)}
                  </span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}