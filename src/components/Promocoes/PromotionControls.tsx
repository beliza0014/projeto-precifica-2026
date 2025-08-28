import React from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Percent, Type } from "lucide-react";

interface PromotionControlsProps {
  isActive: boolean;
  discount: number;
  campaignName: string;
  onActiveChange: (active: boolean) => void;
  onDiscountChange: (discount: number) => void;
  onCampaignNameChange: (name: string) => void;
  maxDiscount: number;
}

export function PromotionControls({
  isActive,
  discount,
  campaignName,
  onActiveChange,
  onDiscountChange,
  onCampaignNameChange,
  maxDiscount
}: PromotionControlsProps) {
  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Configuração da Promoção
          {isActive && (
            <Badge variant="default" className="ml-auto bg-green-500 text-white">
              Ativa
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Ativar Promoção
          </Label>
          <Switch
            checked={isActive}
            onCheckedChange={onActiveChange}
          />
        </div>

        {isActive && (
          <>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Desconto (%)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={discount}
                  onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                  placeholder="Desconto em %"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              {maxDiscount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Máximo viável: <span className="font-semibold text-primary">{maxDiscount.toFixed(1)}%</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Nome da Campanha (opcional)
              </Label>
              <Input
                type="text"
                value={campaignName}
                onChange={(e) => onCampaignNameChange(e.target.value)}
                placeholder="Ex: Black Friday, Desconto de verão..."
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}