import React from "react";
import { InteractiveTooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Info, Settings, Star } from "lucide-react";

export function TooltipDemo() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Sistema de Tooltips Interativo</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Demonstração de tooltips responsivos que funcionam perfeitamente em desktop (hover) e mobile (tap).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tooltip simples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Tooltip Simples
              <InteractiveTooltip
                content="Este é um tooltip simples que funciona em todas as plataformas"
                side="top"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
              </InteractiveTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Passe o mouse ou toque no ícone para ver o tooltip.
            </p>
          </CardContent>
        </Card>

        {/* Tooltip com conteúdo rico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Conteúdo Rico
              <InteractiveTooltip
                content={
                  <div className="space-y-2">
                    <div className="font-semibold">Informações Detalhadas</div>
                    <div className="text-sm space-y-1">
                      <div>• Funciona em desktop e mobile</div>
                      <div>• Auto-hide em 3 segundos no mobile</div>
                      <div>• Posicionamento inteligente</div>
                      <div>• Totalmente acessível</div>
                    </div>
                  </div>
                }
                side="bottom"
                className="max-w-xs"
              >
                <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
              </InteractiveTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tooltip com múltiplas informações formatadas.
            </p>
          </CardContent>
        </Card>

        {/* Tooltip em botão */}
        <Card>
          <CardHeader>
            <CardTitle>Tooltip em Botão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InteractiveTooltip
              content="Clique para acessar as configurações avançadas do sistema"
              side="right"
              autoHideDuration={4000}
            >
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </InteractiveTooltip>
          </CardContent>
        </Card>

        {/* Tooltip com delay customizado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Delay Customizado
              <InteractiveTooltip
                content="Este tooltip tem um delay de 800ms no desktop"
                side="left"
                delayDuration={800}
              >
                <Star className="h-4 w-4 text-yellow-500 cursor-help" />
              </InteractiveTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Delay maior para evitar tooltips acidentais.
            </p>
          </CardContent>
        </Card>

        {/* Múltiplos tooltips */}
        <Card>
          <CardHeader>
            <CardTitle>Múltiplos Tooltips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 justify-center">
              <InteractiveTooltip content="Tooltip à esquerda" side="left">
                <Button size="sm" variant="outline">←</Button>
              </InteractiveTooltip>
              
              <InteractiveTooltip content="Tooltip acima" side="top">
                <Button size="sm" variant="outline">↑</Button>
              </InteractiveTooltip>
              
              <InteractiveTooltip content="Tooltip abaixo" side="bottom">
                <Button size="sm" variant="outline">↓</Button>
              </InteractiveTooltip>
              
              <InteractiveTooltip content="Tooltip à direita" side="right">
                <Button size="sm" variant="outline">→</Button>
              </InteractiveTooltip>
            </div>
          </CardContent>
        </Card>

        {/* Tooltip com auto-hide personalizado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Auto-hide 5s
              <InteractiveTooltip
                content="Este tooltip permanece aberto por 5 segundos no mobile antes de fechar automaticamente"
                side="top"
                autoHideDuration={5000}
              >
                <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-help transition-colors" />
              </InteractiveTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Timeout personalizado para leitura de conteúdo longo.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de instruções */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Desktop (Mouse):</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Passe o mouse sobre os elementos</li>
                <li>• Tooltip aparece após delay configurado</li>
                <li>• Remove o mouse para esconder</li>
                <li>• Suporte completo a teclado (Esc)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Mobile (Touch):</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Toque no elemento para mostrar</li>
                <li>• Toque fora para esconder</li>
                <li>• Auto-hide após timeout configurado</li>
                <li>• Posicionamento otimizado para tela menor</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}