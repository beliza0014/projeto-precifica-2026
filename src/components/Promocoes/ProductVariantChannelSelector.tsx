import React from "react";
import { useFinancial } from "@/contexts/FinancialContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowRight, Store } from "lucide-react";

interface ProductVariantChannelSelectorProps {
  selectedProduct: string;
  selectedVariant: string;
  selectedChannel: string;
  onProductChange: (productId: string) => void;
  onVariantChange: (variantId: string) => void;
  onChannelChange: (channelId: string) => void;
}

export function ProductVariantChannelSelector({
  selectedProduct,
  selectedVariant,
  selectedChannel,
  onProductChange,
  onVariantChange,
  onChannelChange
}: ProductVariantChannelSelectorProps) {
  const { receitas, variacoesConfig, revenue } = useFinancial();

  const channels = [
    { id: 'balcao', name: 'Balcão' },
    { id: 'cartao', name: 'Cartão' },
    { id: 'ifood', name: 'iFood' },
    { id: 'delivery', name: 'Delivery' }
  ];

  const variants = variacoesConfig.variacoes.filter(v => v.produtoBaseId === selectedProduct);
  const hasVariants = variants.length > 0;

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Seleção de Produto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produto *
            </Label>
            <Select value={selectedProduct} onValueChange={onProductChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {receitas.map((receita) => (
                  <SelectItem key={receita.id} value={receita.id}>
                    {receita.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasVariants && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Variação
              </Label>
              <Select 
                value={selectedVariant} 
                onValueChange={onVariantChange}
                disabled={!selectedProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma variação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Produto base</SelectItem>
                  {variants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Canal *
            </Label>
            <Select value={selectedChannel} onValueChange={onChannelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um canal" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedProduct && (
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Produto:</strong> {receitas.find(r => r.id === selectedProduct)?.nome || 'N/A'}
              {selectedVariant && selectedVariant !== "base" && (
                <>
                  {" • "}
                  <strong>Variação:</strong> {variants.find(v => v.id === selectedVariant)?.nome || 'N/A'}
                </>
              )}
              {selectedVariant === "base" && hasVariants && (
                <>
                  {" • "}
                  <strong>Variação:</strong> Produto base
                </>
              )}
              {" • "}
              <strong>Canal:</strong> {channels.find(c => c.id === selectedChannel)?.name || 'N/A'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}