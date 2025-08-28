import { useState } from "react";
import { ShoppingCart, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialCard } from "@/components/FinancialCard";

export default function PlanoIfood() {
  const [taxaMarketplace, setTaxaMarketplace] = useState<number>();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plano iFood</h1>
          <p className="text-muted-foreground">
            Configure a taxa do marketplace
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FinancialCard
          title="Taxa Atual"
          value={taxaMarketplace ? `${taxaMarketplace.toFixed(1)}%` : "Não configurado"}
          subtitle="Taxa do marketplace"
          icon={<ShoppingCart className="h-5 w-5" />}
          variant={taxaMarketplace && taxaMarketplace > 20 ? "destructive" : "warning"}
        />

        <Card className="financial-card">
          <CardHeader>
            <CardTitle>Configurar Taxa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="taxa">Taxa Marketplace (%)</Label>
              <Input
                id="taxa"
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={taxaMarketplace || ''}
                onChange={(e) => setTaxaMarketplace(parseFloat(e.target.value) || undefined)}
                placeholder="Ex: 18.9"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Valor entre 0% e 30%
              </p>
            </div>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}