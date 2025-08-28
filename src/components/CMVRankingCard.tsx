import React, { useState } from "react";
import { TrendingDown, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TopProduct } from "@/hooks/useIndicatorsData";

interface CMVRankingCardProps {
  title: string;
  products: TopProduct[];
  type: "best" | "worst";
  getCOGSClassification: (cogs: number) => {
    status: string;
    variant: "success" | "default" | "warning" | "destructive";
    className: string;
  };
}

export function CMVRankingCard({ title, products, type, getCOGSClassification }: CMVRankingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const icon = type === "best" ? TrendingDown : TrendingUp;
  const iconColor = type === "best" ? "text-success" : "text-destructive";
  const gradientColor = type === "best" ? "from-success/5" : "from-destructive/5";

  const displayedProducts = isExpanded ? products : products.slice(0, 5);

  const IconComponent = icon;

  return (
    <Card className={`financial-card-elevated overflow-hidden bg-gradient-to-br ${gradientColor} to-card/90 border-2 border-primary/10`}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
        <CardTitle className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-primary/10 ${iconColor}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {title}
            </span>
            <div className="text-sm font-normal text-muted-foreground mt-1">
              {type === "best" ? "Menor CMV unitário" : "Maior CMV unitário"}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {products.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] bg-gradient-to-br from-muted/20 to-transparent rounded-xl border border-dashed border-border/30">
            <div className="text-center">
              <IconComponent className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground font-medium">Nenhum produto para análise</p>
              <p className="text-muted-foreground/70 text-sm mt-1">Adicione variações ou vendas</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedProducts.map((product) => {
              const cogsPct = parseFloat(product.cogsPct);
              const classification = getCOGSClassification(cogsPct);
              
              return (
                <div key={`${product.rank}-${product.name}`} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-transparent border border-border/30 hover:border-primary/30 transition-all duration-200">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">#{product.rank}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{product.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Preço: R$ {product.price}</span>
                      <span>Qtd: {product.revenueShare}%</span>
                    </div>
                  </div>
                  
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">R$ {product.cogs}</p>
                      <p className="text-xs text-muted-foreground">CMV unit.</p>
                    </div>
                    <Badge className={classification.className}>
                      {product.cogsPct}%
                    </Badge>
                  </div>
                </div>
              );
            })}
            
            {products.length > 5 && (
              <div className="pt-4 border-t border-border/30">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Ver todos ({products.length} produtos)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}