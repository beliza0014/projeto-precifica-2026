import React, { useState, useMemo } from "react";
import { Tag, Calculator, Save } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatPercentage } from "@/utils/format";
import {
  ProductVariantChannelSelector,
  PromotionControls,
  BeforeAfterComparison,
  SmartSuggestions
} from "@/components/Promocoes";

type ChannelId = 'balcao' | 'cartao' | 'ifood' | 'delivery';

export default function Promocoes() {
  const {
    receitas,
    variacoesConfig,
    revenue,
    selectCVuBase,
    selectCFu,
    selectVariableCost,
    selectFees,
    selectMargin,
    promotions,
    setPromotions,
    savePromotions
  } = useFinancial();

  // State para seleções
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("base");
  const [selectedChannel, setSelectedChannel] = useState<ChannelId>("balcao");
  
  // State para controles de promoção
  const [isPromotionActive, setIsPromotionActive] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);
  const [campaignName, setCampaignName] = useState<string>("");

  // Load existing promotion data when selection changes
  React.useEffect(() => {
    if (selectedProduct && selectedChannel) {
      const existingPromo = promotions[selectedProduct]?.[selectedChannel];
      if (existingPromo) {
        setIsPromotionActive(existingPromo.active);
        setDiscount(existingPromo.d * 100); // Convert from decimal to percentage
        setCampaignName(existingPromo.campaignName || "");
      } else {
        setIsPromotionActive(false);
        setDiscount(0);
        setCampaignName("");
      }
    }
  }, [selectedProduct, selectedChannel, promotions]);

  // Obter preço de referência
  const getPrecoReferencia = (productId: string, variantId: string, channelId: ChannelId): number => {
    // Primeiro: tentar revenue currentPrice
    const revenuePrice = revenue[productId]?.[channelId]?.currentPrice;
    if (revenuePrice && revenuePrice > 0) {
      return revenuePrice;
    }
    
    // Fallback: calcular preço ideal usando seletores
    const CVU = selectCVuBase(productId);
    const CFU = selectCFu(productId);
    const VarF = selectVariableCost(productId, channelId);
    const { t, F_extra } = selectFees(channelId);
    const m = selectMargin(productId);
    
    const CUSTO_TOTAL_UNIT = CVU + CFU + VarF + F_extra;
    const denominator = 1 - t - m;
    
    return denominator > 0 ? CUSTO_TOTAL_UNIT / denominator : 0;
  };

  // Cálculos principais usando useMemo para performance
  const calculations = useMemo(() => {
    if (!selectedProduct || !selectedChannel) {
      return {
        before: { price: 0, margin: 0, unitProfit: 0, isViable: false },
        after: { price: 0, margin: 0, unitProfit: 0, isViable: false },
        maxDiscount: 0,
        suggestedPrice: null,
        precoRef: 0
      };
    }

    // Obter dados base
    const CVU = selectCVuBase(selectedProduct);
    const CFU = selectCFu(selectedProduct);
    const VarF = selectVariableCost(selectedProduct, selectedChannel);
    const { t, F_extra } = selectFees(selectedChannel);
    const m = selectMargin(selectedProduct);
    const d = isPromotionActive ? discount / 100 : 0; // Convert percentage to decimal
    const precoRef = getPrecoReferencia(selectedProduct, selectedVariant, selectedChannel);
    
    const CUSTO_TOTAL_UNIT = CVU + CFU + VarF + F_extra;

    // Cenário A - Sem promoção (antes)
    const precoAntes = precoRef;
    const taxaPercentualAntes = precoAntes * t;
    const lucroUnitAntes = precoAntes - (CUSTO_TOTAL_UNIT + taxaPercentualAntes);
    const margemAntes = precoAntes > 0 ? lucroUnitAntes / precoAntes : 0;
    const viavelAntes = precoAntes > 0 && margemAntes >= 0;

    // Cenário B - Com promoção (depois)
    const precoPromo = precoRef * (1 - d);
    const taxaPercentualPromo = precoPromo * t;
    const lucroUnitPromo = precoPromo - (CUSTO_TOTAL_UNIT + taxaPercentualPromo);
    const margemPromo = precoPromo > 0 ? lucroUnitPromo / precoPromo : 0;
    const viavelPromo = precoPromo > 0 && margemPromo >= 0;

    // Desconto máximo viável (mantendo margem mínima de 5%)
    const mMin = 0.05;
    const dMax = Math.max(0, Math.min(1, 1 - t - mMin - (CUSTO_TOTAL_UNIT / precoRef)));

    // Preço de lista sugerido para manter margem desejada com desconto atual
    const denominatorSugerido = 1 - t - d - m;
    const precoListaSugerido = denominatorSugerido > 0 ? CUSTO_TOTAL_UNIT / denominatorSugerido : null;

    return {
      before: {
        price: precoAntes,
        margin: margemAntes,
        unitProfit: lucroUnitAntes,
        isViable: viavelAntes
      },
      after: {
        price: precoPromo,
        margin: margemPromo,
        unitProfit: lucroUnitPromo,
        isViable: viavelPromo
      },
      maxDiscount: dMax * 100, // Convert to percentage
      suggestedPrice: precoListaSugerido,
      precoRef
    };
  }, [
    selectedProduct,
    selectedVariant,
    selectedChannel,
    isPromotionActive,
    discount,
    selectCVuBase,
    selectCFu,
    selectVariableCost,
    selectFees,
    selectMargin,
    revenue
  ]);

  const handleSavePromotion = async () => {
    if (!selectedProduct || !selectedChannel) {
      toast({
        title: "Erro",
        description: "Selecione um produto e canal primeiro.",
        variant: "destructive"
      });
      return;
    }

    const updatedPromotions = { ...promotions };
    
    if (!updatedPromotions[selectedProduct]) {
      updatedPromotions[selectedProduct] = {};
    }

    updatedPromotions[selectedProduct][selectedChannel] = {
      d: isPromotionActive ? discount / 100 : 0, // Store as decimal
      active: isPromotionActive,
      campaignName: campaignName.trim() || undefined
    };

    setPromotions(updatedPromotions);
    await savePromotions(updatedPromotions);
  };

  const isDataComplete = selectedProduct && selectedChannel;
  const hasPromotion = isPromotionActive && discount > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promoções</h1>
          <p className="text-muted-foreground">
            Simulador integrado de ofertas e impacto na margem
          </p>
        </div>
        {isDataComplete && (
          <Button onClick={handleSavePromotion} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Promoção
          </Button>
        )}
      </div>

      {/* Seletor de Produto/Variação/Canal */}
      <ProductVariantChannelSelector
        selectedProduct={selectedProduct}
        selectedVariant={selectedVariant}
        selectedChannel={selectedChannel}
        onProductChange={(productId) => {
          setSelectedProduct(productId);
          setSelectedVariant("base"); // Reset to base variant when product changes
        }}
        onVariantChange={(variantId) => setSelectedVariant(variantId || "base")}
        onChannelChange={(channelId) => setSelectedChannel(channelId as ChannelId)}
      />

      {isDataComplete && (
        <>
          {/* Controles de Promoção */}
          <PromotionControls
            isActive={isPromotionActive}
            discount={discount}
            campaignName={campaignName}
            onActiveChange={setIsPromotionActive}
            onDiscountChange={setDiscount}
            onCampaignNameChange={setCampaignName}
            maxDiscount={calculations.maxDiscount}
          />

          {/* Comparação Antes vs Depois */}
          <BeforeAfterComparison
            before={calculations.before}
            after={calculations.after}
            hasPromotion={hasPromotion}
          />

          {/* Sugestões Inteligentes */}
          <SmartSuggestions
            maxDiscount={calculations.maxDiscount}
            suggestedPrice={calculations.suggestedPrice}
            currentDiscount={discount}
            isViable={calculations.after.isViable}
            minMargin={0.05} // 5%
          />

          {/* Informações de Debug/Contexto */}
          <div className="text-xs text-muted-foreground p-4 bg-muted/50 rounded-lg">
            <p><strong>Preço de referência:</strong> R$ {calculations.precoRef.toFixed(2)}</p>
            <p><strong>CVU:</strong> R$ {selectCVuBase(selectedProduct).toFixed(2)} | 
               <strong> CFU:</strong> R$ {selectCFu(selectedProduct).toFixed(2)} | 
               <strong> Var. Cost:</strong> R$ {selectVariableCost(selectedProduct, selectedChannel).toFixed(2)}</p>
            <p><strong>Taxas do canal:</strong> {(selectFees(selectedChannel).t * 100).toFixed(1)}% + 
               R$ {selectFees(selectedChannel).F_extra.toFixed(2)}</p>
            <p><strong>Margem desejada:</strong> {(selectMargin(selectedProduct) * 100).toFixed(1)}%</p>
          </div>
        </>
      )}

      {!isDataComplete && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Selecione um produto e canal
          </h3>
          <p className="text-sm text-muted-foreground">
            Escolha um produto e canal para começar a simular promoções
          </p>
        </div>
      )}
    </div>
  );
}